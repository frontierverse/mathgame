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
  first: string;
  second: string;
  common: string;
  least: string;
};

type MultiplesLcmP5Props = {
  firstValue: number;
  secondValue: number;
  leastCommonMultiple: number;
  replayKey: number;
};

const COMMON_STOP_COUNT = 3;
const MIN_TRAVEL_MS = 5200;
const MAX_TRAVEL_MS = 10000;
const TRAVEL_PORTION = 0.78;

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
    first: read("--statistics-series-2", "#4c9fb0"),
    second: read("--statistics-series-3", "#d66f6f"),
    common: read("--statistics-series-1", "#b5742b"),
    least: read("--statistics-series-5", "#b5742b"),
  };
}

function pointOnPath(points: Point[], progress: number) {
  const segmentCount = points.length - 1;
  const scaledProgress = clamp01(progress) * segmentCount;
  const segment = Math.min(segmentCount - 1, Math.floor(scaledProgress));
  const segmentProgress = easeInOutCubic(scaledProgress - segment);
  const start = points[segment];
  const end = points[segment + 1];

  return {
    x: lerp(start.x, end.x, segmentProgress),
    y: lerp(start.y, end.y, segmentProgress),
  };
}

function visibleStopIndices(stopCount: number, stageWidth: number) {
  const maxLabels = stageWidth >= 720 ? 24 : stageWidth >= 500 ? 16 : 16;
  if (stopCount <= maxLabels) return new Set(Array.from({ length: stopCount }, (_, index) => index + 1));

  return new Set([
    1,
    Math.ceil(stopCount * 0.2),
    Math.ceil(stopCount * 0.4),
    Math.ceil(stopCount * 0.6),
    Math.ceil(stopCount * 0.8),
    stopCount - 1,
  ]);
}

export default function MultiplesLcmP5({
  firstValue,
  secondValue,
  leastCommonMultiple,
  replayKey,
}: MultiplesLcmP5Props) {
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
      const displayLimit = leastCommonMultiple * COMMON_STOP_COUNT;
      const maxStepCount = Math.max(displayLimit / firstValue, displayLimit / secondValue);
      const travelDuration = Math.min(MAX_TRAVEL_MS, Math.max(MIN_TRAVEL_MS, maxStepCount * 270));
      const cycleDuration = travelDuration / TRAVEL_PORTION;

      const sketch = (p: P5Sketch) => {
        function getLanePoints(interval: number, laneY: number) {
          const steps = displayLimit / interval;
          const start = { x: stageWidth * 0.08, y: stageHeight * 0.5 };
          const common = { x: stageWidth * 0.92, y: stageHeight * 0.5 };
          const path = [start];

          for (let index = 1; index < steps; index += 1) {
            const value = interval * index;
            path.push({
              x: lerp(start.x, common.x, index / steps),
              y: value % leastCommonMultiple === 0 ? stageHeight * 0.5 : laneY,
            });
          }

          path.push(common);
          return path;
        }

        function drawPath(points: Point[], color: string) {
          p.push();
          p.noFill();
          p.stroke(color);
          p.strokeWeight(2);
          for (let index = 0; index < points.length - 1; index += 1) {
            p.line(points[index].x, points[index].y, points[index + 1].x, points[index + 1].y);
          }
          p.pop();
        }

        function drawRoute(
          points: Point[],
          interval: number,
          color: string,
          isUpperLane: boolean,
          progress: number,
        ) {
          const steps = points.length - 1;
          const activeStop = Math.floor(progress * steps + 0.001);
          const labels = visibleStopIndices(steps, stageWidth);
          const labelOffset = isUpperLane ? -20 : 22;
          const multiplierOffset = isUpperLane ? -11 : 11;

          drawPath(points, color);

          for (let index = 1; index < points.length - 1; index += 1) {
            const value = interval * index;
            if (value % leastCommonMultiple === 0) continue;
            const lit = index <= activeStop;
            p.push();
            p.stroke(color);
            p.strokeWeight(2);
            p.fill(lit ? color : colors.panel);
            p.ellipse(points[index].x, points[index].y, 13, 13);
            if (labels.has(index)) {
              p.noStroke();
              p.fill(colors.foreground);
              p.textAlign(p.CENTER, p.CENTER);
              p.textSize(Math.min(13, stageWidth * 0.038));
              p.text(String(value), points[index].x, points[index].y + labelOffset);
              p.fill(colors.muted);
              p.textSize(Math.min(10, stageWidth * 0.03));
              p.text(`×${index}`, points[index].x, points[index].y + labelOffset + multiplierOffset);
            }
            p.pop();
          }

          const marker = pointOnPath(points, progress);
          p.push();
          p.noStroke();
          p.fill(color);
          p.ellipse(marker.x, marker.y, 20, 20);
          p.fill(colors.panel);
          p.ellipse(marker.x, marker.y, 7, 7);
          p.pop();
        }

        function drawStartPoint() {
          const start = { x: stageWidth * 0.08, y: stageHeight * 0.5 };
          p.push();
          p.fill(colors.panel);
          p.stroke(colors.border);
          p.strokeWeight(2);
          p.ellipse(start.x, start.y, 22, 22);
          p.noStroke();
          p.fill(colors.foreground);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(Math.min(13, stageWidth * 0.04));
          p.text("0", start.x, start.y);
          p.pop();
        }

        function drawRouteValue(value: number, color: string, laneY: number) {
          p.push();
          p.noStroke();
          p.fill(color);
          p.ellipse(stageWidth * 0.025, laneY, 10, 10);
          p.fill(colors.foreground);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(Math.min(17, stageWidth * 0.05));
          p.text(String(value), stageWidth * 0.025, laneY - 18);
          p.pop();
        }

        function drawCommonPoints(progress: number) {
          const startX = stageWidth * 0.08;
          const endX = stageWidth * 0.92;

          for (let index = 1; index <= COMMON_STOP_COUNT; index += 1) {
            const value = leastCommonMultiple * index;
            const isLeastCommonMultiple = index === 1;
            const pointColor = isLeastCommonMultiple ? colors.least : colors.common;
            const arrived = progress >= value / displayLimit;
            const pulse = arrived && !reducedMotion ? 1 + Math.sin((p.millis() + index * 180) / 150) * 0.07 : 1;
            const common = {
              x: lerp(startX, endX, value / displayLimit),
              y: stageHeight * 0.5,
            };
            const size = (isLeastCommonMultiple ? 44 : 34) * pulse;

            p.push();
            p.fill(arrived ? colors.common : colors.panel);
            p.stroke(pointColor);
            p.strokeWeight(isLeastCommonMultiple ? 4 : 3);
            if (isLeastCommonMultiple) p.fill(arrived ? pointColor : colors.panel);
            p.ellipse(common.x, common.y, size, size);
            if (isLeastCommonMultiple) {
              p.noFill();
              p.stroke(pointColor);
              p.strokeWeight(1.5);
              p.ellipse(common.x, common.y, size + 12, size + 12);
            }
            p.noStroke();
            p.fill(arrived ? colors.panel : colors.foreground);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(Math.min(15, stageWidth * 0.045));
            p.text(String(value), common.x, common.y);
            p.textSize(Math.min(10, stageWidth * 0.03));
            p.fill(colors.first);
            p.text(`×${value / firstValue}`, common.x, common.y - (isLeastCommonMultiple ? 30 : 25));
            p.fill(colors.second);
            p.text(`×${value / secondValue}`, common.x, common.y + (isLeastCommonMultiple ? 30 : 25));
            if (isLeastCommonMultiple) {
              p.fill(pointColor);
              p.textSize(Math.min(12, stageWidth * 0.035));
              p.text("최소공배수", common.x, common.y - 53);
            }
            p.pop();
          }
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

          const animationProgress = reducedMotion
            ? 1
            : clamp01(((p.millis() - phaseStartedAt) % cycleDuration) / travelDuration);
          const firstLaneY = stageHeight * 0.25;
          const secondLaneY = stageHeight * 0.75;
          const firstPath = getLanePoints(firstValue, firstLaneY);
          const secondPath = getLanePoints(secondValue, secondLaneY);

          drawRouteValue(firstValue, colors.first, firstLaneY);
          drawRouteValue(secondValue, colors.second, secondLaneY);
          drawStartPoint();
          drawRoute(firstPath, firstValue, colors.first, true, animationProgress);
          drawRoute(secondPath, secondValue, colors.second, false, animationProgress);
          drawCommonPoints(animationProgress);
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
      console.error("배수 애니메이션을 불러오지 못했습니다.", error);
    });

    return () => {
      cancelled = true;
      themeObserver?.disconnect();
      resizeObserver?.disconnect();
      instance?.remove();
    };
  }, [firstValue, secondValue, leastCommonMultiple, replayKey]);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
