"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import styles from "./DivisorsConcept2D.module.css";

const STEP_GAP = 10;
const FACTOR_GAP = 6;

type FactorPair = {
  rows: number;
  columns: number;
};

type DivisorsConcept2DProps = {
  value: number;
  variant?: "array" | "tree";
};

function getFactorPairs(value: number): FactorPair[] {
  const pairs: FactorPair[] = [];

  for (let divisor = 1; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) {
      pairs.push({ rows: divisor, columns: value / divisor });
    }
  }

  return pairs;
}

function getDivisors(pairs: FactorPair[]) {
  return [...new Set(pairs.flatMap(({ rows, columns }) => [rows, columns]))].sort(
    (first, second) => first - second,
  );
}

function getBlockMetrics(
  rows: number,
  columns: number,
  value: number,
  viewBoxWidth: number,
  arrayCenterY: number,
  arrayMaxWidth: number,
  arrayMaxHeight: number,
) {
  const gap = value > 48 ? 2.5 : value > 30 ? 4 : value > 18 ? 5.5 : 7;
  const blockSize = Math.min(
    40,
    (arrayMaxWidth - (columns - 1) * gap) / columns,
    (arrayMaxHeight - (rows - 1) * gap) / rows,
  );
  const width = columns * blockSize + (columns - 1) * gap;
  const height = rows * blockSize + (rows - 1) * gap;

  return {
    blockSize,
    gap,
    width,
    height,
    startX: (viewBoxWidth - width) / 2,
    startY: arrayCenterY - height / 2,
  };
}

function subscribeToReducedMotion(onChange: () => void) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", onChange);
  return () => motionQuery.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeToCompactLayout(onChange: () => void) {
  const compactQuery = window.matchMedia("(max-width: 640px)");
  compactQuery.addEventListener("change", onChange);
  return () => compactQuery.removeEventListener("change", onChange);
}

function getCompactLayoutSnapshot() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function DivisorArray2D({ value }: { value: number }) {
  const pairs = getFactorPairs(value);
  const divisors = getDivisors(pairs);
  const pairCount = pairs.length;
  const [animatedPairIndex, setAnimatedPairIndex] = useState(0);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
  const compactLayout = useSyncExternalStore(
    subscribeToCompactLayout,
    getCompactLayoutSnapshot,
    () => false,
  );

  useEffect(() => {
    if (prefersReducedMotion || pairCount <= 1) return;

    const timers = Array.from({ length: pairCount - 1 }, (_, index) =>
      window.setTimeout(() => setAnimatedPairIndex(index + 1), (index + 1) * 1700),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [pairCount, prefersReducedMotion]);

  const pairIndex = prefersReducedMotion ? pairCount - 1 : animatedPairIndex;
  const pair = pairs[pairIndex];
  const viewBoxWidth = compactLayout ? 360 : 720;
  const viewBoxHeight = compactLayout ? 525 : 450;
  const arrayCenterY = compactLayout ? 282 : 220;
  const metrics = getBlockMetrics(
    pair.rows,
    pair.columns,
    value,
    viewBoxWidth,
    arrayCenterY,
    compactLayout ? 290 : 560,
    compactLayout ? 160 : 170,
  );
  const positions = Array.from({ length: value }, (_, index) => ({
    x: metrics.startX + (index % pair.columns) * (metrics.blockSize + metrics.gap),
    y:
      metrics.startY +
      Math.floor(index / pair.columns) * (metrics.blockSize + metrics.gap),
  }));

  const visitedDivisors = new Set(
    pairs
      .slice(0, pairIndex + 1)
      .flatMap(({ rows, columns }) => [rows, columns]),
  );
  const stepColumns = compactLayout && pairCount > 1 ? 2 : pairCount;
  const stepAreaWidth = compactLayout ? 320 : 620;
  const stepWidth = Math.min(
    compactLayout ? 155 : 140,
    (stepAreaWidth - STEP_GAP * (stepColumns - 1)) / stepColumns,
  );
  const getStepPosition = (index: number) => {
    const row = Math.floor(index / stepColumns);
    const column = index % stepColumns;
    const itemsInRow = Math.min(stepColumns, pairCount - row * stepColumns);
    const rowWidth = stepWidth * itemsInRow + STEP_GAP * (itemsInRow - 1);

    return {
      x: (viewBoxWidth - rowWidth) / 2 + column * (stepWidth + STEP_GAP) + stepWidth / 2,
      y: compactLayout ? 32 + row * 50 : 42,
    };
  };
  const factorColumns =
    compactLayout && divisors.length > 8 ? Math.ceil(divisors.length / 2) : divisors.length;
  const factorAreaWidth = compactLayout ? 310 : 620;
  const factorWidth = Math.min(
    42,
    (factorAreaWidth - FACTOR_GAP * (factorColumns - 1)) / factorColumns,
  );
  const factorRows = Math.ceil(divisors.length / factorColumns);
  const getFactorPosition = (index: number) => {
    const row = Math.floor(index / factorColumns);
    const column = index % factorColumns;
    const itemsInRow = Math.min(factorColumns, divisors.length - row * factorColumns);
    const rowWidth = factorWidth * itemsInRow + FACTOR_GAP * (itemsInRow - 1);

    return {
      x: (viewBoxWidth - rowWidth) / 2 + column * (factorWidth + FACTOR_GAP) + factorWidth / 2,
      y: compactLayout ? (factorRows > 1 ? 455 + row * 42 : 480) : 412,
    };
  };

  return (
    <div className={styles.scene} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          {pairs.map((step, index) => {
            const stepPosition = getStepPosition(index);
            const active = index === pairIndex;
            const visited = index <= pairIndex;

            return (
              <g
                key={`${step.rows}-${step.columns}`}
                className={
                  active
                    ? styles.stepActive
                    : visited
                      ? styles.step
                      : styles.stepFuture
                }
                transform={`translate(${stepPosition.x} ${stepPosition.y})`}
              >
                <rect
                  x={-stepWidth / 2}
                  y="-22"
                  width={stepWidth}
                  height="44"
                  rx="22"
                />
                <text
                  className={visited ? styles.stepTextVisited : styles.stepText}
                  fontSize={compactLayout ? 18 : pairCount >= 6 ? 17 : pairCount >= 5 ? 19 : 22}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {step.rows}×{step.columns}={value}
                </text>
              </g>
            );
          })}
        </g>

        {positions.map((position, index) => (
          <rect
            key={index}
            className={styles.block}
            x="0"
            y="0"
            rx={Math.min(6, metrics.blockSize / 5)}
            vectorEffect="non-scaling-stroke"
            style={{
              width: metrics.blockSize,
              height: metrics.blockSize,
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          />
        ))}

        <g key={`dimensions-${pairIndex}`} className={styles.dimension}>
          <line
            className={styles.columnLine}
            x1={metrics.startX}
            y1={metrics.startY - 14}
            x2={metrics.startX + metrics.width}
            y2={metrics.startY - 14}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className={styles.columnLine}
            x1={metrics.startX}
            y1={metrics.startY - 20}
            x2={metrics.startX}
            y2={metrics.startY - 8}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className={styles.columnLine}
            x1={metrics.startX + metrics.width}
            y1={metrics.startY - 20}
            x2={metrics.startX + metrics.width}
            y2={metrics.startY - 8}
            vectorEffect="non-scaling-stroke"
          />
          <text
            className={styles.columnCount}
            x={viewBoxWidth / 2}
            y={metrics.startY - 26}
            textAnchor="middle"
          >
            {pair.columns}
          </text>

          <line
            className={styles.rowLine}
            x1={metrics.startX - 14}
            y1={metrics.startY}
            x2={metrics.startX - 14}
            y2={metrics.startY + metrics.height}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className={styles.rowLine}
            x1={metrics.startX - 20}
            y1={metrics.startY}
            x2={metrics.startX - 8}
            y2={metrics.startY}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className={styles.rowLine}
            x1={metrics.startX - 20}
            y1={metrics.startY + metrics.height}
            x2={metrics.startX - 8}
            y2={metrics.startY + metrics.height}
            vectorEffect="non-scaling-stroke"
          />
          <text
            className={styles.rowCount}
            x={metrics.startX - 31}
            y={arrayCenterY + 7}
            textAnchor="middle"
          >
            {pair.rows}
          </text>
        </g>

        <text
          key={`equation-${pairIndex}`}
          className={styles.equation}
          x={viewBoxWidth / 2}
          y={compactLayout ? 412 : 360}
          textAnchor="middle"
        >
          <tspan className={styles.rowNumber}>{pair.rows}</tspan>
          <tspan> × </tspan>
          <tspan className={styles.columnNumber}>{pair.columns}</tspan>
          <tspan> = {value}</tspan>
        </text>

        <g>
          {divisors.map((divisor, index) => {
            const visible = visitedDivisors.has(divisor);
            const factorPosition = getFactorPosition(index);

            return (
              <g
                key={divisor}
                className={visible ? styles.factorVisible : styles.factorFuture}
                transform={`translate(${factorPosition.x} ${factorPosition.y})`}
              >
                <circle r={Math.min(18, factorWidth / 2)} />
                <text textAnchor="middle" dominantBaseline="central">
                  {divisor}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function DivisorTree2D({ value }: { value: number }) {
  const pairs = getFactorPairs(value);
  const pairCount = pairs.length;
  const [activePairIndex, setActivePairIndex] = useState(0);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
  const compactLayout = useSyncExternalStore(
    subscribeToCompactLayout,
    getCompactLayoutSnapshot,
    () => false,
  );

  useEffect(() => {
    if (prefersReducedMotion || pairCount <= 1) return;

    const timers = Array.from({ length: pairCount - 1 }, (_, index) =>
      window.setTimeout(
        () => setActivePairIndex(index + 1),
        (index + 1) * 1700,
      ),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [pairCount, prefersReducedMotion]);

  const activeIndex = prefersReducedMotion ? pairCount - 1 : activePairIndex;
  const viewBoxWidth = compactLayout ? 360 : 720;
  const viewBoxHeight = compactLayout ? 550 : 480;
  const centerX = viewBoxWidth / 2;
  const rootY = compactLayout ? 58 : 64;
  const rowStartY = compactLayout ? 145 : 142;
  const rowGap = Math.min(
    compactLayout ? 54 : 48,
    (viewBoxHeight - rowStartY - (compactLayout ? 125 : 110)) /
      Math.max(pairCount - 1, 1),
  );
  const rowY = (index: number) => rowStartY + index * rowGap;
  const pairOffset = compactLayout ? 66 : 76;
  const nodeRadius = compactLayout ? 19 : 24;
  const equationY = compactLayout ? 500 : 430;
  const lastVisibleY = rowY(activeIndex);

  return (
    <div className={styles.scene} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          className={styles.treeConnector}
          x1={centerX}
          y1={rootY + nodeRadius}
          x2={centerX}
          y2={lastVisibleY}
        />

        <g className={styles.treeRoot} transform={`translate(${centerX} ${rootY})`}>
          <circle r={nodeRadius + 2} />
          <text textAnchor="middle" dominantBaseline="central">
            {value}
          </text>
        </g>

        {pairs.map((pair, index) => {
          const visible = index <= activeIndex;
          const active = index === activeIndex;
          const y = rowY(index);
          const leftX = centerX - pairOffset;
          const rightX = centerX + pairOffset;

          return (
            <g
              key={`${pair.rows}-${pair.columns}`}
              className={visible ? (active ? styles.treePairActive : styles.treePair) : styles.treePairFuture}
            >
              <line className={styles.treeBranch} x1={centerX} y1={y} x2={leftX} y2={y} />
              <line className={styles.treeBranch} x1={centerX} y1={y} x2={rightX} y2={y} />
              <circle className={styles.treeNodeLeft} cx={leftX} cy={y} r={nodeRadius} />
              <circle className={styles.treeNodeRight} cx={rightX} cy={y} r={nodeRadius} />
              <text className={styles.treeNumber} x={leftX} y={y} textAnchor="middle" dominantBaseline="central">
                {pair.rows}
              </text>
              <text className={styles.treeNumber} x={rightX} y={y} textAnchor="middle" dominantBaseline="central">
                {pair.columns}
              </text>
              <text className={styles.treeMultiply} x={centerX} y={y} textAnchor="middle" dominantBaseline="central">
                ×
              </text>
            </g>
          );
        })}

        <text
          key={`tree-equation-${activeIndex}`}
          className={styles.treeEquation}
          x={centerX}
          y={equationY}
          textAnchor="middle"
        >
          {pairs[activeIndex].rows} × {pairs[activeIndex].columns} = {value}
        </text>
      </svg>
    </div>
  );
}

export default function DivisorsConcept2D({
  value,
  variant = "tree",
}: DivisorsConcept2DProps) {
  return variant === "array" ? (
    <DivisorArray2D value={value} />
  ) : (
    <DivisorTree2D value={value} />
  );
}
