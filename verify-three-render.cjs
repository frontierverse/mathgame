const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const outDir = path.join(process.cwd(), ".next", "render-checks");
fs.mkdirSync(outDir, { recursive: true });

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function sampleCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
      return { ok: false, reason: "canvas not found" };
    }

    const rect = canvas.getBoundingClientRect();
    const offscreen = document.createElement("canvas");
    const width = 72;
    const height = 48;
    offscreen.width = width;
    offscreen.height = height;
    const context = offscreen.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return { ok: false, reason: "2d context unavailable" };
    }

    context.drawImage(canvas, 0, 0, width, height);
    const data = context.getImageData(0, 0, width, height).data;
    const background = [255, 247, 234];
    let checksum = 0;
    let varied = 0;
    const unique = new Set();

    for (let index = 0; index < data.length; index += 16) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      checksum = (checksum + red * 3 + green * 5 + blue * 7 + alpha * 11 + index) % 1000000007;
      unique.add(`${red >> 4},${green >> 4},${blue >> 4},${alpha >> 4}`);

      const distance =
        Math.abs(red - background[0]) + Math.abs(green - background[1]) + Math.abs(blue - background[2]);

      if (alpha > 0 && distance > 35) {
        varied += 1;
      }
    }

    return {
      ok: true,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      backingStore: {
        width: canvas.width,
        height: canvas.height,
      },
      checksum,
      varied,
      unique: unique.size,
    };
  });
}

async function checkViewport(browser, viewport) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const errors = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();

      if (!text.includes("/_next/webpack-hmr")) {
        errors.push(text);
      }
    }
  });

  await page.goto("http://127.0.0.1:3000", { waitUntil: "load" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(8000);

  const before = await sampleCanvas(page);
  await page.screenshot({ path: path.join(outDir, `${viewport.name}.png`), fullPage: true });
  await page.waitForTimeout(900);
  const afterMotion = await sampleCanvas(page);

  await page.keyboard.press("3");
  await page.keyboard.press("+");
  await page.keyboard.press("3");
  await page.waitForTimeout(300);
  const afterInput = await sampleCanvas(page);
  await page.screenshot({ path: path.join(outDir, `${viewport.name}-input.png`), fullPage: true });

  await page.close();

  if (errors.length > 0) {
    throw new Error(`${viewport.name}: browser errors: ${errors.join(" | ")}`);
  }

  for (const [label, result] of [
    ["before", before],
    ["afterMotion", afterMotion],
    ["afterInput", afterInput],
  ]) {
    if (!result.ok) {
      throw new Error(`${viewport.name}: ${label} sample failed: ${result.reason}`);
    }

    if (result.rect.width < viewport.width * 0.98 || result.rect.height < viewport.height * 0.98) {
      throw new Error(
        `${viewport.name}: canvas is not full screen (${JSON.stringify(result.rect)} vs ${viewport.width}x${viewport.height})`,
      );
    }

    if (result.varied < 120 || result.unique < 16) {
      throw new Error(`${viewport.name}: canvas sample looks blank (${label})`);
    }
  }

  if (before.checksum === afterMotion.checksum) {
    throw new Error(`${viewport.name}: canvas did not animate between samples`);
  }

  if (afterMotion.checksum === afterInput.checksum) {
    throw new Error(`${viewport.name}: keyboard interaction did not change the canvas`);
  }

  return {
    name: viewport.name,
    before,
    afterMotion,
    afterInput,
    screenshots: [`${viewport.name}.png`, `${viewport.name}-input.png`],
  };
}

(async () => {
  const browser = await launchBrowser();
  const results = [];

  try {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      results.push(await checkViewport(browser, viewport));
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ outDir, results }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
