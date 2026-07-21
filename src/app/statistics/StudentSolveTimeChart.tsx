import type { QuizSolveAttempt } from "../data/quizAttempts";

type StudentSolveTimeChartProps = {
  attempts: readonly QuizSolveAttempt[];
};

type Aggregate = {
  count: number;
  totalDurationMs: number;
};

type ChartPoint = {
  attemptCount: number;
  averageSeconds: number;
  quizIndex: number;
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
const QUIZ_GAP = 72;

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
  return points
    .filter((point): point is ChartPoint => point !== null)
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function PointMark({
  shapeIndex,
  title,
  x,
  y,
}: {
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
  attempts,
}: StudentSolveTimeChartProps) {
  const aggregatesByStudent = new Map<string, Map<number, Aggregate>>();
  const quizIndexSet = new Set<number>();

  attempts.forEach((attempt) => {
    if (
      !Number.isInteger(attempt.quizIndex) ||
      !Number.isFinite(attempt.durationMs) ||
      attempt.durationMs < 0
    ) {
      return;
    }

    quizIndexSet.add(attempt.quizIndex);
    const studentAggregates =
      aggregatesByStudent.get(attempt.studentName) ?? new Map<number, Aggregate>();
    const aggregate = studentAggregates.get(attempt.quizIndex) ?? {
      count: 0,
      totalDurationMs: 0,
    };
    aggregate.count += 1;
    aggregate.totalDurationMs += attempt.durationMs;
    studentAggregates.set(attempt.quizIndex, aggregate);
    aggregatesByStudent.set(attempt.studentName, studentAggregates);
  });

  const quizIndices = Array.from(quizIndexSet).sort((a, b) => a - b);
  const studentNames = Array.from(aggregatesByStudent.keys()).sort((a, b) =>
    getDisplayName(a).localeCompare(getDisplayName(b), "ko"),
  );

  if (quizIndices.length === 0 || studentNames.length === 0) return null;

  const averages = Array.from(aggregatesByStudent.values()).flatMap((byQuiz) =>
    Array.from(byQuiz.values(), ({ count, totalDurationMs }) =>
      totalDurationMs / count / 1000,
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

        const averageSeconds = aggregate.totalDurationMs / aggregate.count / 1000;
        return {
          attemptCount: aggregate.count,
          averageSeconds,
          quizIndex,
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
      </div>

      <div className="mt-3 overflow-x-auto pb-2">
        <svg
          role="img"
          aria-label="학생별 퀴즈 평균 풀이 시간 선 그래프"
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
          width={chartWidth}
          height={CHART_HEIGHT}
          className="block max-w-none"
        >
          <title>학생별 퀴즈 평균 풀이 시간</title>
          <desc>
            가로축은 퀴즈 번호이고 세로축은 반복 풀이를 포함한 학생별 평균
            시간(초)입니다.
          </desc>

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
                    shapeIndex={student.shapeIndex}
                    x={point.x}
                    y={point.y}
                    title={`${student.displayName}: ${point.quizIndex + 1}번, 평균 ${formatAverageSeconds(point.averageSeconds)}초, ${point.attemptCount}회`}
                  />
                ) : null,
              )}
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
