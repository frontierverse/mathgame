"use client";

import { useEffect, useRef } from "react";
import type P5 from "p5";

type P5Sketch = P5 & {
  setup?: () => void;
  draw?: () => void;
};

type Point = { x: number; y: number };

type ThemeColors = {
  foreground: string;
  muted: string;
  border: string;
  panel: string;
};

type DivisorPizzaP5Props = {
  sliceCount: number;
  people: number | null;
  replayKey: number;
};

const ANIMATION_MS = 900;
const PIZZA_FILL = "#f6ca6b";
const PIZZA_CRUST = "#a8642e";
const PIZZA_TOPPING = "#d95b57";
const REMAINDER_FILL = "#d95b67";
const GROUP_COLORS = ["#ef9a65", "#72b9c4", "#9a84d4", "#e4b653", "#e8849c", "#71b989"];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function lerp(first: number, second: number, amount: number) {
  return first + (second - first) * amount;
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value.length > 0 ? value : fallback;
  };

  return {
    foreground: read("--foreground", "#443b50"),
    muted: read("--muted", "#95899a"),
    border: read("--border", "#ded3ed"),
    panel: read("--control-background", "#fffefa"),
  };
}

function getGroupCenters(width: number, height: number, people: number): Point[] {
  const columns = people <= 3 ? people : 3;
  const rows = Math.ceil(people / columns);
  const left = width * (columns === 1 ? 0.5 : 0.2);
  const right = width * (columns === 1 ? 0.5 : 0.8);
  const top = height * (rows === 1 ? 0.7 : 0.61);
  const bottom = height * 0.87;

  return Array.from({ length: people }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const itemsInRow = Math.min(columns, people - row * columns);
    const rowLeft = itemsInRow === 1 ? width * 0.5 : left;
    const rowRight = itemsInRow === 1 ? width * 0.5 : right;

    return {
      x: itemsInRow === 1
        ? width * 0.5
        : rowLeft + ((rowRight - rowLeft) * column) / (itemsInRow - 1),
      y: rows === 1 ? top : lerp(top, bottom, row),
    };
  });
}

function getPieceRadius(width: number, height: number) {
  return Math.min(34, width * 0.085, height * 0.11);
}

function sourceLayout(width: number, height: number, compact: boolean, pieceRadius: number) {
  return {
    center: {
      x: compact ? width * 0.22 : width * 0.5,
      y: compact ? height * 0.27 : height * 0.42,
    },
    radius: pieceRadius,
  };
}

function pizzaSlicePoints(
  center: Point,
  radius: number,
  sliceCount: number,
  sliceIndex: number,
  angleOffset: number,
  p: P5Sketch,
) {
  if (sliceCount === 1) {
    p.ellipse(center.x, center.y, radius * 2, radius * 2);
    return;
  }

  const sliceAngle = (Math.PI * 2) / sliceCount;
  const gap = Math.min(0.07, sliceAngle * 0.12);
  const start = angleOffset + sliceIndex * sliceAngle + gap;
  const end = angleOffset + (sliceIndex + 1) * sliceAngle - gap;
  const steps = Math.max(4, Math.ceil((end - start) / 0.15));

  p.beginShape();
  p.vertex(center.x, center.y);
  for (let step = 0; step <= steps; step += 1) {
    const angle = lerp(start, end, step / steps);
    p.vertex(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  }
  p.endShape(p.CLOSE);
}

function pointOnCircle(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function drawPizzaSlice(
  p: P5Sketch,
  center: Point,
  radius: number,
  sliceCount: number,
  sliceIndex: number,
  angleOffset: number,
  fillColor: string | ReturnType<P5Sketch["color"]>,
  showToppings: boolean,
) {
  p.push();
  if (typeof fillColor === "string") p.fill(fillColor);
  else p.fill(fillColor);
  p.stroke(PIZZA_CRUST);
  p.strokeWeight(Math.max(1.2, radius * 0.035));
  pizzaSlicePoints(center, radius, sliceCount, sliceIndex, angleOffset, p);

  if (showToppings && sliceCount <= 12 && sliceCount > 1) {
    const sliceAngle = (Math.PI * 2) / sliceCount;
    const toppingAngle = angleOffset + (sliceIndex + 0.5) * sliceAngle;
    const firstTopping = pointOnCircle(center, radius * 0.56, toppingAngle);
    const secondTopping = pointOnCircle(center, radius * 0.76, toppingAngle + (sliceIndex % 2 === 0 ? 0.16 : -0.14));
    p.noStroke();
    p.fill(PIZZA_TOPPING);
    p.ellipse(firstTopping.x, firstTopping.y, Math.max(4, radius * 0.13), Math.max(4, radius * 0.13));
    p.ellipse(secondTopping.x, secondTopping.y, Math.max(3, radius * 0.1), Math.max(3, radius * 0.1));
  }
  p.pop();
}

export default function DivisorPizzaP5({ sliceCount, people, replayKey }: DivisorPizzaP5Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    let instance: P5 | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let themeObserver: MutationObserver | null = null;

    import("p5").then(({ default: P5Ctor }) => {
      if (cancelled || !container) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let colors = readThemeColors();
      let phaseStartedAt = 0;
      let stageWidth = Math.max(1, container.clientWidth);
      let stageHeight = Math.max(1, container.clientHeight);

      const sketch = (p: P5Sketch) => {
        function source(compact: boolean) {
          return sourceLayout(stageWidth, stageHeight, compact, getPieceRadius(stageWidth, stageHeight));
        }

        function drawFormula(targetPeople: number | null) {
          if (targetPeople === null) {
            p.push();
            p.noStroke();
            p.fill(colors.foreground);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.min(26, stageWidth * 0.075));
            p.text(String(sliceCount), stageWidth / 2, 27);
            p.pop();
            return;
          }

          const quotient = Math.floor(sliceCount / targetPeople);
          const remainder = sliceCount % targetPeople;
          const result = `${sliceCount} ÷ ${targetPeople} = ${quotient} 나머지 ${remainder}`;

          p.push();
          p.noStroke();
          p.fill(colors.foreground);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(Math.min(26, stageWidth * 0.075));
          p.text(result, stageWidth / 2, 27);
          p.fill(remainder === 0 ? "#4a9b68" : REMAINDER_FILL);
          p.textSize(Math.min(22, stageWidth * 0.065));
          p.text(remainder === 0 ? "✓" : "×", stageWidth * 0.9, 27);
          p.pop();
        }

        function drawSourceGhost(compact: boolean, opacity: number) {
          const layout = source(compact);
          const context = p.drawingContext as CanvasRenderingContext2D;
          p.push();
          context.globalAlpha = opacity;
          p.noFill();
          p.stroke(colors.border);
          p.strokeWeight(2);
          p.ellipse(layout.center.x, layout.center.y, layout.radius * 2, layout.radius * 2);
          for (let index = 0; index < sliceCount; index += 1) {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / sliceCount;
            p.line(
              layout.center.x,
              layout.center.y,
              layout.center.x + Math.cos(angle) * layout.radius,
              layout.center.y + Math.sin(angle) * layout.radius,
            );
          }
          context.globalAlpha = 1;
          p.pop();
        }

        function groupPiecePosition(center: Point, index: number, count: number, radius: number): Point {
          const columns = Math.min(3, Math.max(1, count));
          const rows = Math.ceil(count / columns);
          const row = Math.floor(index / columns);
          const column = index % columns;
          const itemsInRow = Math.min(columns, count - row * columns);
          const spacingX = radius * 1.28;
          const spacingY = radius * 1.18;

          return {
            x: center.x + (column - (itemsInRow - 1) / 2) * spacingX,
            y: center.y + (row - (rows - 1) / 2) * spacingY,
          };
        }

        function drawGroupTargets(targetPeople: number) {
          const centers = getGroupCenters(stageWidth, stageHeight, targetPeople);
          const groupSize = Math.floor(sliceCount / targetPeople);
          const remainder = sliceCount % targetPeople;
          const radius = getPieceRadius(stageWidth, stageHeight);
          const columns = Math.min(3, Math.max(1, groupSize));
          const rows = Math.ceil(groupSize / columns);
          const boxWidth = Math.max(66, columns * radius * 1.28 + radius * 0.9);
          const boxHeight = Math.max(62, rows * radius * 1.18 + radius * 0.85);

          centers.forEach((center, index) => {
            p.push();
            p.rectMode(p.CENTER);
            p.fill(colors.panel);
            p.stroke(GROUP_COLORS[index % GROUP_COLORS.length]);
            p.strokeWeight(2.5);
            p.rect(center.x, center.y, boxWidth, boxHeight, 18);

            p.noStroke();
            p.fill(GROUP_COLORS[index % GROUP_COLORS.length]);
            p.ellipse(center.x, center.y - boxHeight / 2 - 15, 21, 21);
            p.fill("#ffffff");
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(11);
            p.text(String(index + 1), center.x, center.y - boxHeight / 2 - 15);
            p.pop();
          });

          if (remainder > 0) {
            const leftover = { x: stageWidth * 0.82, y: stageHeight * 0.28 };
            p.push();
            p.rectMode(p.CENTER);
            p.fill(colors.panel);
            p.stroke(REMAINDER_FILL);
            p.strokeWeight(2);
            p.rect(leftover.x, leftover.y, Math.max(54, radius * 1.8), Math.max(46, radius * 1.4), 14);
            p.noStroke();
            p.fill(REMAINDER_FILL);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(12);
            p.text(`+${remainder}`, leftover.x, leftover.y - radius * 0.72);
            p.pop();
          }

          return { centers, radius, groupSize, remainder, boxHeight };
        }

        function destinationFor(
          index: number,
          targetPeople: number,
          centers: Point[],
          radius: number,
          groupSize: number,
          remainder: number,
        ) {
          const shared = groupSize * targetPeople;
          if (index >= shared) {
            const remainderIndex = index - shared;
            const leftover = { x: stageWidth * 0.82, y: stageHeight * 0.28 };
            return {
              center: groupPiecePosition(leftover, remainderIndex, remainder, radius),
              fill: REMAINDER_FILL,
            };
          }

          const groupIndex = Math.floor(index / groupSize);
          return {
            center: groupPiecePosition(centers[groupIndex], index % groupSize, groupSize, radius),
            fill: GROUP_COLORS[groupIndex % GROUP_COLORS.length],
          };
        }

        function drawSlice(
          index: number,
          targetPeople: number,
          progress: number,
          centers: Point[],
          radius: number,
          groupSize: number,
          remainder: number,
        ) {
          const sourceState = source(true);
          const target = destinationFor(index, targetPeople, centers, radius, groupSize, remainder);
          const center = {
            x: lerp(sourceState.center.x, target.center.x, progress),
            y: lerp(sourceState.center.y, target.center.y, progress),
          };
          const fill = p.lerpColor(p.color(PIZZA_FILL), p.color(target.fill), progress);

          drawPizzaSlice(p, center, sourceState.radius, sliceCount, index, -Math.PI / 2, fill, sliceCount <= 12);
        }

        p.setup = () => {
          p.createCanvas(stageWidth, stageHeight).parent(container);
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.textFont("monospace");
          p.rectMode(p.CENTER);
          phaseStartedAt = p.millis();
          if (reducedMotion) p.noLoop();
        };

        p.draw = () => {
          p.clear();

          if (people === null) {
            const original = source(false);
            drawFormula(null);
            for (let index = 0; index < sliceCount; index += 1) {
              drawPizzaSlice(p, original.center, original.radius, sliceCount, index, -Math.PI / 2, PIZZA_FILL, sliceCount <= 12);
            }
            return;
          }

          const now = p.millis();
          const progress = reducedMotion ? 1 : easeInOutCubic(clamp01((now - phaseStartedAt) / ANIMATION_MS));
          const target = drawGroupTargets(people);
          drawFormula(people);
          drawSourceGhost(true, 0.45 * (1 - progress));

          for (let index = 0; index < sliceCount; index += 1) {
            drawSlice(index, people, progress, target.centers, target.radius, target.groupSize, target.remainder);
          }

        };
      };

      instance = new P5Ctor(sketch, container);

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !instance) return;
        stageWidth = Math.max(1, Math.round(entry.contentRect.width));
        stageHeight = Math.max(1, Math.round(entry.contentRect.height));
        instance.resizeCanvas(stageWidth, stageHeight);
        if (reducedMotion) instance.redraw();
      });
      resizeObserver.observe(container);

      themeObserver = new MutationObserver(() => {
        colors = readThemeColors();
        if (reducedMotion) instance?.redraw();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }).catch((error: unknown) => {
      console.error("피자 애니메이션을 불러오지 못했습니다.", error);
    });

    return () => {
      cancelled = true;
      themeObserver?.disconnect();
      resizeObserver?.disconnect();
      instance?.remove();
    };
  }, [people, replayKey, sliceCount]);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
