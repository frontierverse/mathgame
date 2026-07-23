"use client";

import { useEffect, useRef } from "react";
import type P5 from "p5";

type P5Sketch = P5 & {
  setup?: () => void;
  draw?: () => void;
  mousePressed?: () => void;
};

type FactorPair = { rows: number; cols: number };

type Point = { x: number; y: number };

type Transition = {
  fromPositions: Point[];
  toPositions: Point[];
  fromMetrics: BlockMetrics;
  toMetrics: BlockMetrics;
  startMs: number;
};

type ThumbRect = { x: number; y: number; w: number; h: number; index: number };

type ThemeColors = {
  rowColor: string;
  colColor: string;
  foreground: string;
  muted: string;
};

const TRANSITION_MS = 650;
const DWELL_MS = 1700;
const POP_DURATION_MS = 420;
const BLOCK_FILL = "#9b84d9";
const BLOCK_STROKE = "#6d559e";
const ACTIVE_ACCENT = "#8068c5";

type PrimeFactorArrayP5Props = {
  value: number;
  replayKey: number;
};

function getFactorPairs(value: number): FactorPair[] {
  const pairs: FactorPair[] = [];
  for (let divisor = 1; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) pairs.push({ rows: divisor, cols: value / divisor });
  }
  return pairs;
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(x: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = x - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const raw = styles.getPropertyValue(name).trim();
    return raw.length > 0 ? raw : fallback;
  };
  const isLight = document.documentElement.classList.contains("theme-light");

  return {
    rowColor: isLight ? "#287c89" : "#53aebb",
    colColor: isLight ? "#6d559e" : "#9b84d9",
    foreground: read("--foreground", "#443b50"),
    muted: read("--muted", "#95899a"),
  };
}

type StageLayout = {
  thumbAreaBottom: number;
  mainLeft: number;
  mainTop: number;
  mainWidth: number;
  mainHeight: number;
  equationY: number;
};

function computeStageLayout(width: number, height: number): StageLayout {
  const thumbAreaBottom = Math.min(84, height * 0.22);
  const topLabelH = 38;
  const bottomH = 58;
  const leftLabelW = 38;

  const mainTop = thumbAreaBottom + topLabelH;
  const mainBottom = height - bottomH;

  return {
    thumbAreaBottom,
    mainLeft: leftLabelW,
    mainTop,
    mainWidth: Math.max(40, width - leftLabelW * 2),
    mainHeight: Math.max(40, mainBottom - mainTop),
    equationY: height - bottomH / 2,
  };
}

type BlockMetrics = { blockSize: number; gap: number; gridWidth: number; gridHeight: number; startX: number; startY: number };

function computeBlockMetrics(pair: FactorPair, value: number, stage: StageLayout): BlockMetrics {
  const gap = value > 40 ? 3 : value > 24 ? 5 : value > 12 ? 7 : 9;
  const blockSize = Math.max(
    4,
    Math.min(
      46,
      (stage.mainWidth - (pair.cols - 1) * gap) / pair.cols,
      (stage.mainHeight - (pair.rows - 1) * gap) / pair.rows,
    ),
  );
  const gridWidth = pair.cols * blockSize + (pair.cols - 1) * gap;
  const gridHeight = pair.rows * blockSize + (pair.rows - 1) * gap;

  return {
    blockSize,
    gap,
    gridWidth,
    gridHeight,
    startX: stage.mainLeft + (stage.mainWidth - gridWidth) / 2,
    startY: stage.mainTop + (stage.mainHeight - gridHeight) / 2,
  };
}

function blockPosition(metrics: BlockMetrics, pair: FactorPair, index: number): Point {
  const col = index % pair.cols;
  const row = Math.floor(index / pair.cols);
  return {
    x: metrics.startX + col * (metrics.blockSize + metrics.gap) + metrics.blockSize / 2,
    y: metrics.startY + row * (metrics.blockSize + metrics.gap) + metrics.blockSize / 2,
  };
}

export default function PrimeFactorArrayP5({ value, replayKey }: PrimeFactorArrayP5Props) {
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

      const pairs = getFactorPairs(value);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let colors = readThemeColors();
      let stage = computeStageLayout(
        Math.max(1, container.clientWidth),
        Math.max(1, container.clientHeight),
      );
      let activePairIndex = reducedMotion ? pairs.length - 1 : 0;
      const initialMetrics = computeBlockMetrics(pairs[activePairIndex], value, stage);
      const initialPositions = Array.from({ length: value }, (_, i) =>
        blockPosition(initialMetrics, pairs[activePairIndex], i),
      );
      let transition: Transition = {
        fromPositions: initialPositions,
        toPositions: initialPositions,
        fromMetrics: initialMetrics,
        toMetrics: initialMetrics,
        startMs: 0,
      };
      let thumbRects: ThumbRect[] = [];

      const sketch = (p: P5Sketch) => {
        function currentFrame(nowMs: number): { positions: Point[]; metrics: BlockMetrics } {
          const t = reducedMotion
            ? 1
            : clamp01((nowMs - transition.startMs) / TRANSITION_MS);
          const eased = easeInOutCubic(t);
          const positions = transition.toPositions.map((to, i) => {
            const from = transition.fromPositions[i] ?? to;
            return { x: lerp(from.x, to.x, eased), y: lerp(from.y, to.y, eased) };
          });
          const { fromMetrics: fm, toMetrics: tm } = transition;
          const metrics: BlockMetrics = {
            blockSize: lerp(fm.blockSize, tm.blockSize, eased),
            gap: tm.gap,
            gridWidth: lerp(fm.gridWidth, tm.gridWidth, eased),
            gridHeight: lerp(fm.gridHeight, tm.gridHeight, eased),
            startX: lerp(fm.startX, tm.startX, eased),
            startY: lerp(fm.startY, tm.startY, eased),
          };
          return { positions, metrics };
        }

        function switchToPair(newIndex: number, nowMs: number) {
          const { positions: fromPositions, metrics: fromMetrics } = currentFrame(nowMs);
          const newMetrics = computeBlockMetrics(pairs[newIndex], value, stage);
          const toPositions = Array.from({ length: value }, (_, i) =>
            blockPosition(newMetrics, pairs[newIndex], i),
          );

          transition = {
            fromPositions,
            toPositions,
            fromMetrics,
            toMetrics: newMetrics,
            startMs: nowMs,
          };
          activePairIndex = newIndex;
        }

        function drawBrackets(pair: FactorPair, metrics: BlockMetrics) {
          p.push();
          p.stroke(colors.colColor);
          p.strokeWeight(2.5);
          p.line(metrics.startX, metrics.startY - 14, metrics.startX + metrics.gridWidth, metrics.startY - 14);
          p.line(metrics.startX, metrics.startY - 20, metrics.startX, metrics.startY - 8);
          p.line(
            metrics.startX + metrics.gridWidth,
            metrics.startY - 20,
            metrics.startX + metrics.gridWidth,
            metrics.startY - 8,
          );
          p.noStroke();
          p.fill(colors.colColor);
          p.textSize(22);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.text(String(pair.cols), metrics.startX + metrics.gridWidth / 2, metrics.startY - 24);

          p.stroke(colors.rowColor);
          p.strokeWeight(2.5);
          p.line(metrics.startX - 14, metrics.startY, metrics.startX - 14, metrics.startY + metrics.gridHeight);
          p.line(metrics.startX - 20, metrics.startY, metrics.startX - 8, metrics.startY);
          p.line(
            metrics.startX - 20,
            metrics.startY + metrics.gridHeight,
            metrics.startX - 8,
            metrics.startY + metrics.gridHeight,
          );
          p.noStroke();
          p.fill(colors.rowColor);
          p.textAlign(p.RIGHT, p.CENTER);
          p.text(String(pair.rows), metrics.startX - 24, metrics.startY + metrics.gridHeight / 2);
          p.pop();
        }

        function drawEquation(pair: FactorPair) {
          p.push();
          p.noStroke();
          p.fill(colors.foreground);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(30);
          p.text(
            `${pair.rows} × ${pair.cols} = ${value}`,
            stage.mainLeft + stage.mainWidth / 2,
            stage.equationY,
          );
          p.pop();
        }

        function drawThumbnails(nowMs: number) {
          if (pairs.length === 0) return;
          const count = pairs.length;
          const boxSize = Math.min(56, stage.mainWidth / Math.max(count, 1) - 10);
          const gap = 14;
          const totalWidth = count * boxSize + (count - 1) * gap;
          const startX = (p.width - totalWidth) / 2;
          const centerY = stage.thumbAreaBottom / 2 + 6;

          thumbRects = [];

          for (let i = 0; i < count; i += 1) {
            const pair = pairs[i];
            const boxX = startX + i * (boxSize + gap);
            thumbRects.push({ x: boxX, y: centerY - boxSize / 2, w: boxSize, h: boxSize, index: i });

            const active = i === activePairIndex;
            const popT = reducedMotion ? 1 : clamp01((nowMs - i * 90 - 60) / 320);
            if (popT <= 0) continue;
            const scale = Math.max(0, easeOutBack(popT)) * (active ? 1.12 : 1);

            const aspectScale = Math.min(
              (boxSize - 10) / pair.cols,
              (boxSize - 10) / pair.rows,
            );
            const w = pair.cols * aspectScale;
            const h = pair.rows * aspectScale;

            p.push();
            p.translate(boxX + boxSize / 2, centerY);
            p.scale(scale);

            if (active) {
              const ctx = p.drawingContext as CanvasRenderingContext2D;
              ctx.shadowColor = ACTIVE_ACCENT;
              ctx.shadowBlur = 12;
              p.noFill();
              p.stroke(ACTIVE_ACCENT);
              p.strokeWeight(2.5);
              p.rect(-boxSize / 2 - 4, -boxSize / 2 - 4, boxSize + 8, boxSize + 8, 10);
              ctx.shadowBlur = 0;
            }

            p.noStroke();
            p.fill(BLOCK_FILL);
            p.rect(-w / 2, -h / 2, w, h, 3);
            p.stroke(BLOCK_STROKE);
            p.strokeWeight(1.2);
            p.noFill();
            p.rect(-w / 2, -h / 2, w, h, 3);
            p.pop();

            p.noStroke();
            p.fill(active ? colors.foreground : colors.muted);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);
            p.text(`${pair.rows}×${pair.cols}`, boxX + boxSize / 2, centerY + boxSize / 2 + 6);
          }
        }

        p.setup = () => {
          p.createCanvas(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight)).parent(
            container,
          );
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.textFont("monospace");
          p.rectMode(p.CORNER);
          if (reducedMotion) p.noLoop();
        };

        p.draw = () => {
          p.clear();
          const nowMs = p.millis();

          if (
            !reducedMotion &&
            pairs.length > 1 &&
            nowMs - transition.startMs >= DWELL_MS &&
            activePairIndex < pairs.length - 1
          ) {
            switchToPair(activePairIndex + 1, nowMs);
          }

          const { positions, metrics } = currentFrame(nowMs);
          const pair = pairs[activePairIndex];
          const size = metrics.blockSize;

          const popT = reducedMotion ? 1 : clamp01(nowMs / POP_DURATION_MS);
          const popScale = Math.max(0, easeOutBack(popT));

          p.noStroke();
          for (let i = 0; i < value; i += 1) {
            const pos = positions[i];
            p.push();
            p.translate(pos.x, pos.y);
            p.scale(popScale);
            const half = size / 2;
            p.fill(BLOCK_FILL);
            p.rect(-half, -half, size, size, Math.min(6, size / 5));
            p.stroke(BLOCK_STROKE);
            p.strokeWeight(1.4);
            p.noFill();
            p.rect(-half, -half, size, size, Math.min(6, size / 5));
            p.pop();
          }

          drawBrackets(pair, metrics);
          drawEquation(pair);
          drawThumbnails(nowMs);
        };

        p.mousePressed = () => {
          const mx = p.mouseX;
          const my = p.mouseY;
          for (const rect of thumbRects) {
            if (mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y - 20 && my <= rect.y + rect.h + 24) {
              if (rect.index !== activePairIndex) switchToPair(rect.index, p.millis());
              return;
            }
          }
        };
      };

      instance = new P5Ctor(sketch, container);

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !instance) return;
        const width = Math.max(1, Math.round(entry.contentRect.width));
        const height = Math.max(1, Math.round(entry.contentRect.height));
        instance.resizeCanvas(width, height);
        stage = computeStageLayout(width, height);

        const newMetrics = computeBlockMetrics(pairs[activePairIndex], value, stage);
        const newPositions = Array.from({ length: value }, (_, i) =>
          blockPosition(newMetrics, pairs[activePairIndex], i),
        );
        transition = {
          fromPositions: newPositions,
          toPositions: newPositions,
          fromMetrics: newMetrics,
          toMetrics: newMetrics,
          startMs: transition.startMs,
        };

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
    });

    return () => {
      cancelled = true;
      themeObserver?.disconnect();
      resizeObserver?.disconnect();
      instance?.remove();
    };
  }, [value, replayKey]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
