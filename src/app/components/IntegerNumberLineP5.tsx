"use client";

import { useEffect, useRef } from "react";
import type P5 from "p5";

type P5Sketch = P5 & {
  draw?: () => void;
  setup?: () => void;
};

type HighlightedValue = {
  color: string;
  value: number;
};

type NumberLineJump = {
  color: string;
  from: number;
  label: string;
  level?: number;
  to: number;
};

type SpecialValue = HighlightedValue & {
  label: string;
};

type ThemeColors = {
  border: string;
  foreground: string;
  muted: string;
  panel: string;
  positive: string;
  negative: string;
  zero: string;
};

type IntegerNumberLineP5Props = {
  highlightedValues?: readonly HighlightedValue[];
  jumps?: readonly NumberLineJump[];
  maximum: number;
  minimum: number;
  specialValues?: readonly SpecialValue[];
};

const MARKER_MS = 520;
const JUMP_MS = 820;
const JUMP_GAP_MS = 240;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value.length > 0 ? value : fallback;
  };

  return {
    border: read("--control-border", "#c8d2db"),
    foreground: read("--foreground", "#263746"),
    muted: read("--muted", "#788894"),
    panel: read("--control-background", "#ffffff"),
    positive: read("--statistics-series-2", "#2388d8"),
    negative: read("--statistics-series-3", "#df5b68"),
    zero: read("--statistics-series-5", "#e8b84a"),
  };
}

export default function IntegerNumberLineP5({
  highlightedValues = [],
  jumps = [],
  maximum,
  minimum,
  specialValues = [],
}: IntegerNumberLineP5Props) {
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
      let stageWidth = Math.max(1, container.clientWidth);
      let stageHeight = Math.max(1, container.clientHeight);
      let phaseStartedAt = 0;
      const jumpCycle = jumps.length * (JUMP_MS + JUMP_GAP_MS);
      const cycleMs = Math.max(3000, MARKER_MS + jumpCycle + 1100);

      const sketch = (p: P5Sketch) => {
        function xForValue(value: number) {
          const left = stageWidth * 0.08;
          const right = stageWidth * 0.92;
          return left + ((value - minimum) / (maximum - minimum)) * (right - left);
        }

        function drawArrow(x: number, y: number, direction: number, color: string) {
          p.push();
          p.noStroke();
          p.fill(color);
          if (direction >= 0) p.triangle(x - 7, y - 5, x - 7, y + 5, x + 4, y);
          else p.triangle(x + 7, y - 5, x + 7, y + 5, x - 4, y);
          p.pop();
        }

        function drawJump(jump: NumberLineJump, index: number, lineY: number, elapsed: number) {
          const startAt = MARKER_MS + index * (JUMP_MS + JUMP_GAP_MS);
          const rawProgress = reducedMotion ? 1 : clamp01((elapsed - startAt) / JUMP_MS);
          if (rawProgress <= 0) return;

          const fromX = xForValue(jump.from);
          const toX = xForValue(jump.to);
          const arcY = lineY - 34 - (jump.level ?? 0) * 21;
          const eased = easeInOutCubic(rawProgress);
          const samples = Math.max(2, Math.ceil(eased * 22));

          p.push();
          p.noFill();
          p.stroke(jump.color);
          p.strokeWeight(4);
          p.beginShape();
          for (let sample = 0; sample <= samples; sample += 1) {
            const progress = (eased * sample) / samples;
            const x = p.bezierPoint(fromX, fromX, toX, toX, progress);
            const y = p.bezierPoint(lineY - 4, arcY, arcY, lineY - 4, progress);
            p.vertex(x, y);
          }
          p.endShape();
          p.pop();

          const markerX = p.bezierPoint(fromX, fromX, toX, toX, eased);
          const markerY = p.bezierPoint(lineY - 4, arcY, arcY, lineY - 4, eased);
          p.push();
          p.noStroke();
          p.fill(jump.color);
          p.ellipse(markerX, markerY, 15, 15);
          p.fill(colors.panel);
          p.ellipse(markerX, markerY, 5, 5);
          p.pop();

          if (rawProgress >= 1) drawArrow(toX, lineY - 10, Math.sign(jump.to - jump.from), jump.color);

          p.push();
          p.noStroke();
          p.fill(jump.color);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(Math.min(15, stageWidth * 0.045));
          p.text(jump.label, (fromX + toX) / 2, arcY - 10);
          p.pop();
        }

        function drawNumberLine(elapsed: number) {
          const lineY = stageHeight * 0.6;
          const values = Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
          const zeroInRange = minimum <= 0 && maximum >= 0;
          const zeroX = zeroInRange ? xForValue(0) : null;
          const labelSize = Math.min(15, Math.max(10, stageWidth / (values.length + 3) * 0.38));
          const context = p.drawingContext as CanvasRenderingContext2D;

          p.push();
          p.noStroke();
          p.fill(colors.negative);
          context.globalAlpha = 0.1;
          if (zeroX !== null) p.rect(stageWidth * 0.05, lineY - 8, zeroX - stageWidth * 0.05, 16, 8);
          p.fill(colors.positive);
          if (zeroX !== null) p.rect(zeroX, lineY - 8, stageWidth * 0.9 - zeroX, 16, 8);
          context.globalAlpha = 1;
          p.pop();

          p.push();
          p.stroke(colors.border);
          p.strokeWeight(3);
          p.line(stageWidth * 0.06, lineY, stageWidth * 0.94, lineY);
          p.pop();
          drawArrow(stageWidth * 0.06, lineY, -1, colors.muted);
          drawArrow(stageWidth * 0.94, lineY, 1, colors.muted);

          jumps.forEach((jump, index) => drawJump(jump, index, lineY, elapsed));

          values.forEach((value, index) => {
            const x = xForValue(value);
            const highlight = highlightedValues.find((item) => item.value === value);
            const markerColor = value === 0 ? colors.zero : highlight?.color;
            const reveal = reducedMotion ? 1 : clamp01((elapsed - index * 55) / 360);

            p.push();
            p.stroke(colors.foreground);
            p.strokeWeight(1.5);
            p.line(x, lineY - 8, x, lineY + 8);
            if (markerColor && reveal > 0) {
              p.noStroke();
              p.fill(markerColor);
              context.globalAlpha = 0.18 * reveal;
              p.ellipse(x, lineY, 31 * reveal, 31 * reveal);
              context.globalAlpha = 1;
              p.fill(markerColor);
              p.ellipse(x, lineY, 14, 14);
            }
            p.noStroke();
            p.fill(markerColor ?? colors.foreground);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(labelSize);
            p.text(signed(value), x, lineY + 31);
            p.pop();
          });

          specialValues.forEach((item, index) => {
            const x = xForValue(item.value);
            const reveal = reducedMotion ? 1 : clamp01((elapsed - 360 - index * 180) / 420);
            p.push();
            p.stroke(item.color);
            p.strokeWeight(2.5);
            p.fill(colors.panel);
            p.ellipse(x, lineY, 19 * reveal, 19 * reveal);
            p.noStroke();
            p.fill(item.color);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.min(12, stageWidth * 0.035));
            p.text(item.label, x, lineY - 23);
            p.pop();
          });
        }

        p.setup = () => {
          p.createCanvas(stageWidth, stageHeight).parent(container);
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          p.textFont("monospace");
          phaseStartedAt = p.millis();
          if (reducedMotion) p.noLoop();
        };

        p.draw = () => {
          p.clear();
          const elapsed = reducedMotion ? cycleMs : (p.millis() - phaseStartedAt) % cycleMs;
          drawNumberLine(elapsed);
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
      console.error("수직선 애니메이션을 불러오지 못했습니다.", error);
    });

    return () => {
      cancelled = true;
      themeObserver?.disconnect();
      resizeObserver?.disconnect();
      instance?.remove();
    };
  }, [highlightedValues, jumps, maximum, minimum, specialValues]);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
