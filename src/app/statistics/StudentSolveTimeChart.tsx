"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

import type { QuizStatisticsRecord } from "./quizStatistics";

type StudentSolveTimeChartProps = {
  records: readonly QuizStatisticsRecord[];
};

type Aggregate = {
  legacyCount: number;
  measuredCount: number;
  recordCount: number;
  totalDurationMs: number;
};

type ChartPoint = {
  averageSeconds: number;
  legacyCount: number;
  measuredCount: number;
  quizIndex: number;
  recordCount: number;
  x: number;
  y: number;
};

type StudentSeries = {
  color: string;
  displayName: string;
  points: readonly (ChartPoint | null)[];
  shapeIndex: number;
  studentName: string;
};

const CHART_HEIGHT = 360;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 298;
const PLOT_LEFT = 66;
const PLOT_RIGHT = 24;
const MIN_PLOT_WIDTH = 720;
const QUIZ_GAP = 64;

const SERIES_COLORS = [
  "var(--statistics-series-1)",
  "var(--statistics-series-2)",
  "var(--statistics-series-3)",
  "var(--statistics-series-4)",
  "var(--statistics-series-5)",
  "var(--statistics-series-6)",
  "var(--statistics-series-7)",
  "var(--statistics-series-8)",
] as const;

function getDisplayName(name: string) {
  return name.slice(1).trim() || name;
}

function getNiceStep(maximum: number) {
  if (maximum <= 0) return 1;

  const roughStep = maximum / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const factor =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  return factor * magnitude;
}

function formatAxisSeconds(value: number, step: number) {
  if (step >= 1) return String(Math.round(value));
  if (step >= 0.1) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatAverageSeconds(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function buildLinePath(points: readonly (ChartPoint | null)[]) {
  let path = "";
  let hasOpenSegment = false;

  points.forEach((point) => {
    if (!point) {
      hasOpenSegment = false;
      return;
    }

    path += `${path ? " " : ""}${hasOpenSegment ? "L" : "M"} ${point.x} ${point.y}`;
    hasOpenSegment = true;
  });

  return path;
}

function PointMark({
  legacy = false,
  shapeIndex,
  title,
  x,
  y,
}: {
  legacy?: boolean;
  shapeIndex: number;
  title?: string;
  x: number;
  y: number;
}) {
  const shape = shapeIndex % SERIES_COLORS.length;
  const fill = "var(--surface)";

  return (
    <g transform={`translate(${x} ${y})`}>
      {title ? <title>{title}</title> : null}
      {legacy ? (
        <circle
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="2 2"
          opacity="0.85"
        />
      ) : null}
      {shape === 0 ? (
        <circle r="4.5" fill={fill} stroke="currentColor" strokeWidth="2.25" />
      ) : shape === 1 ? (
        <rect
          x="-4.25"
          y="-4.25"
          width="8.5"
          height="8.5"
          rx="0.75"
          fill={fill}
          stroke="currentColor"
          strokeWidth="2.25"
        />
      ) : shape === 2 ? (
        <path
          d="M 0 -5 L 5 0 L 0 5 L -5 0 Z"
          fill={fill}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
      ) : shape === 3 ? (
        <path
          d="M 0 -5 L 5 4 L -5 4 Z"
          fill={fill}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
      ) : shape === 4 ? (
        <path
          d="M -5 -5 L 5 5 M 5 -5 L -5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : shape === 5 ? (
        <path
          d="M 0 -5 L 0 5 M -5 0 L 5 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : shape === 6 ? (
        <path
          d="M -4.5 -2.6 L 0 -5.2 L 4.5 -2.6 L 4.5 2.6 L 0 5.2 L -4.5 2.6 Z"
          fill={fill}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M -5 -4 L 5 -4 L 0 5 Z"
          fill={fill}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

export default function StudentSolveTimeChart({
  records,
}: StudentSolveTimeChartProps) {
  const [activeQuizPositionState, setActiveQuizPositionState] = useState<
    number | null
  >(null);
  const aggregatesByStudent = new Map<string, Map<number, Aggregate>>();
  const quizIndexSet = new Set<number>();

  records.forEach((record) => {
    if (
      !Number.isInteger(record.quizIndex) ||
      !Number.isFinite(record.durationMs) ||
      record.durationMs < 0
    ) {
      return;
    }

    quizIndexSet.add(record.quizIndex);
    const studentAggregates =
      aggregatesByStudent.get(record.studentName) ?? new Map<number, Aggregate>();
    const aggregate = studentAggregates.get(record.quizIndex) ?? {
      legacyCount: 0,
      measuredCount: 0,
      recordCount: 0,
      totalDurationMs: 0,
    };
    aggregate.recordCount += 1;
    aggregate.totalDurationMs += record.durationMs;
    if (record.timingSource === "legacy") aggregate.legacyCount += 1;
    else aggregate.measuredCount += 1;
    studentAggregates.set(record.quizIndex, aggregate);
    aggregatesByStudent.set(record.studentName, studentAggregates);
  });

  const quizIndices = Array.from(quizIndexSet).sort((a, b) => a - b);
  const studentNames = Array.from(aggregatesByStudent.keys()).sort((a, b) =>
    getDisplayName(a).localeCompare(getDisplayName(b), "ko"),
  );

  if (quizIndices.length === 0 || studentNames.length === 0) return null;

  const averages = Array.from(aggregatesByStudent.values()).flatMap((byQuiz) =>
    Array.from(byQuiz.values(), ({ recordCount, totalDurationMs }) =>
      totalDurationMs / recordCount / 1000,
    ),
  );
  const maximumSeconds = Math.max(...averages);
  const yStep = getNiceStep(maximumSeconds);
  const yMaximum = Math.max(yStep, Math.ceil(maximumSeconds / yStep) * yStep);
  const yTickCount = Math.round(yMaximum / yStep);
  const yTicks = Array.from(
    { length: yTickCount + 1 },
    (_, index) => index * yStep,
  );

  const plotWidth = Math.max(
    MIN_PLOT_WIDTH,
    (quizIndices.length - 1) * QUIZ_GAP,
  );
  const chartWidth = PLOT_LEFT + plotWidth + PLOT_RIGHT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const xForPosition = (position: number) =>
    quizIndices.length === 1
      ? PLOT_LEFT + plotWidth / 2
      : PLOT_LEFT + (position / (quizIndices.length - 1)) * plotWidth;
  const yForSeconds = (seconds: number) =>
    PLOT_BOTTOM - (seconds / yMaximum) * plotHeight;

  const series: readonly StudentSeries[] = studentNames.map(
    (studentName, studentIndex) => {
      const byQuiz = aggregatesByStudent.get(studentName);
      const points = quizIndices.map((quizIndex, quizPosition) => {
        const aggregate = byQuiz?.get(quizIndex);
        if (!aggregate) return null;

        const averageSeconds =
          aggregate.totalDurationMs / aggregate.recordCount / 1000;
        return {
          averageSeconds,
          legacyCount: aggregate.legacyCount,
          measuredCount: aggregate.measuredCount,
          quizIndex,
          recordCount: aggregate.recordCount,
          x: xForPosition(quizPosition),
          y: yForSeconds(averageSeconds),
        };
      });

      return {
        color: SERIES_COLORS[studentIndex % SERIES_COLORS.length],
        displayName: getDisplayName(studentName),
        points,
        shapeIndex: studentIndex % SERIES_COLORS.length,
        studentName,
      };
    },
  );

  const activeQuizPosition =
    activeQuizPositionState !== null &&
    activeQuizPositionState < quizIndices.length
      ? activeQuizPositionState
      : null;
  const activeQuizIndex =
    activeQuizPosition === null ? null : quizIndices[activeQuizPosition];
  const activeX =
    activeQuizPosition === null ? null : xForPosition(activeQuizPosition);

  const selectQuizFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    const x = (event.clientX - bounds.left) * (chartWidth / bounds.width);
    const y = (event.clientY - bounds.top) * (CHART_HEIGHT / bounds.height);

    if (
      x < PLOT_LEFT ||
      x > chartWidth - PLOT_RIGHT ||
      y < PLOT_TOP ||
      y > PLOT_BOTTOM
    ) {
      setActiveQuizPositionState(null);
      return;
    }

    const closestPosition = quizIndices.reduce(
      (closest, _quizIndex, position) =>
        Math.abs(xForPosition(position) - x) <
        Math.abs(xForPosition(closest) - x)
          ? position
          : closest,
      0,
    );
    setActiveQuizPositionState((current) =>
      current === closestPosition ? current : closestPosition,
    );
  };

  const handleChartKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    let nextPosition: number | null = null;

    if (event.key === "ArrowLeft") {
      nextPosition = Math.max(
        0,
        (activeQuizPosition ?? quizIndices.length) - 1,
      );
    } else if (event.key === "ArrowRight") {
      nextPosition = Math.min(
        quizIndices.length - 1,
        (activeQuizPosition ?? -1) + 1,
      );
    } else if (event.key === "Home") {
      nextPosition = 0;
    } else if (event.key === "End") {
      nextPosition = quizIndices.length - 1;
    }

    if (nextPosition !== null) {
      event.preventDefault();
      setActiveQuizPositionState(nextPosition);
    }
  };

  return (
    <figure className="mt-8" aria-labelledby="student-time-chart-heading">
      <figcaption id="student-time-chart-heading" className="text-lg font-black">
        풀이 시간 비교
      </figcaption>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="학생 범례">
        {series.map((student) => (
          <span
            key={student.studentName}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]"
          >
            <svg
              aria-hidden="true"
              viewBox="-7 -7 14 14"
              width="16"
              height="16"
              className="shrink-0"
              style={{ color: student.color }}
            >
              <PointMark shapeIndex={student.shapeIndex} x={0} y={0} />
            </svg>
            {student.displayName}
          </span>
        ))}
        <span className="text-xs font-bold text-[var(--muted)]">
          점선 = 미측정(0초)
        </span>
      </div>

      <div className="mt-3 overflow-x-auto pb-2">
        <svg
          role="application"
          aria-label="학생별 퀴즈 평균 풀이 시간 선 그래프"
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
          width={chartWidth}
          height={CHART_HEIGHT}
          tabIndex={0}
          className="block max-w-none cursor-crosshair focus:outline-none"
          onBlur={() => setActiveQuizPositionState(null)}
          onFocus={() =>
            setActiveQuizPositionState((current) => current ?? 0)
          }
          onKeyDown={handleChartKeyDown}
          onPointerDown={selectQuizFromPointer}
          onPointerLeave={() => setActiveQuizPositionState(null)}
          onPointerMove={selectQuizFromPointer}
        >
          <title>학생별 퀴즈 평균 풀이 시간</title>
          <desc>
            가로축은 퀴즈 번호이고 세로축은 반복 풀이를 포함한 학생별 평균
            시간(초)입니다.
          </desc>

          <rect
            x={PLOT_LEFT}
            y={PLOT_TOP}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
          />

          {quizIndices.map((quizIndex, position) => {
            const x = xForPosition(position);
            return (
              <g key={quizIndex}>
                <line
                  x1={x}
                  y1={PLOT_TOP}
                  x2={x}
                  y2={PLOT_BOTTOM}
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity="0.55"
                />
                <text
                  x={x}
                  y={PLOT_BOTTOM + 20}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="11"
                  fontWeight="700"
                >
                  {quizIndex + 1}
                </text>
              </g>
            );
          })}

          {yTicks.map((value) => {
            const y = yForSeconds(value);
            return (
              <g key={value}>
                <line
                  x1={PLOT_LEFT}
                  y1={y}
                  x2={chartWidth - PLOT_RIGHT}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={PLOT_LEFT - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="11"
                  fontWeight="700"
                >
                  {formatAxisSeconds(value, yStep)}
                </text>
              </g>
            );
          })}

          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP}
            x2={PLOT_LEFT}
            y2={PLOT_BOTTOM}
            stroke="var(--foreground)"
            strokeWidth="1.25"
          />
          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={chartWidth - PLOT_RIGHT}
            y2={PLOT_BOTTOM}
            stroke="var(--foreground)"
            strokeWidth="1.25"
          />

          <text
            x={PLOT_LEFT + plotWidth / 2}
            y={CHART_HEIGHT - 8}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="12"
            fontWeight="700"
          >
            퀴즈 번호
          </text>
          <text
            x="15"
            y={PLOT_TOP + plotHeight / 2}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="12"
            fontWeight="700"
            transform={`rotate(-90 15 ${PLOT_TOP + plotHeight / 2})`}
          >
            평균(초)
          </text>

          {activeX !== null ? (
            <line
              x1={activeX}
              y1={PLOT_TOP}
              x2={activeX}
              y2={PLOT_BOTTOM}
              stroke="var(--foreground)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.75"
              pointerEvents="none"
            />
          ) : null}

          {series.map((student) => (
            <g key={student.studentName} style={{ color: student.color }}>
              <path
                d={buildLinePath(student.points)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {student.points.map((point) =>
                point ? (
                  <PointMark
                    key={point.quizIndex}
                    legacy={point.legacyCount === point.recordCount}
                    shapeIndex={student.shapeIndex}
                    x={point.x}
                    y={point.y}
                    title={
                      point.measuredCount === 0
                        ? `${student.displayName}: ${point.quizIndex + 1}번, 0초 · 미측정`
                        : `${student.displayName}: ${point.quizIndex + 1}번, 평균 ${formatAverageSeconds(point.averageSeconds)}초, 측정 ${point.measuredCount}회`
                    }
                  />
                ) : null,
              )}
            </g>
          ))}

          {activeQuizPosition !== null
            ? series.map((student) => {
                const point = student.points[activeQuizPosition];
                if (!point) return null;

                return (
                  <circle
                    key={student.studentName}
                    cx={point.x}
                    cy={point.y}
                    r="9"
                    fill="none"
                    stroke={student.color}
                    strokeWidth="1.75"
                    pointerEvents="none"
                  />
                );
              })
            : null}
        </svg>
      </div>

      {activeQuizPosition === null || activeQuizIndex === null ? (
        <p className="text-xs font-bold text-[var(--muted)]">
          선 위에 올려 보기
        </p>
      ) : (
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)]"
          aria-live="polite"
        >
          <strong className="mr-1 text-sm">{activeQuizIndex + 1}번</strong>
          {series.map((student) => {
            const point = student.points[activeQuizPosition];
            const time =
              point === null
                ? "—"
                : point.measuredCount === 0
                  ? "0초"
                  : `${formatAverageSeconds(point.averageSeconds)}초`;

            return (
              <span
                key={student.studentName}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: student.color }}
                />
                {student.displayName} {time}
              </span>
            );
          })}
        </div>
      )}
    </figure>
  );
}
