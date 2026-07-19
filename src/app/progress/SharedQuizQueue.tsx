"use client";

import { memo } from "react";

import { MAX_SOLVES } from "./quizData";
import type { QuizProgress } from "./quizProgress";

const RAINBOW_RING = `conic-gradient(
  #ff375f 0deg,
  #ff9f0a 50deg,
  #ffd60a 90deg,
  #30d158 150deg,
  #64d2ff 205deg,
  #0a84ff 250deg,
  #5e5ce6 295deg,
  #bf5af2 330deg,
  #ff375f 360deg
)`;

function rainbowGaugeBackground(progressDegrees: number) {
  const degrees = Math.max(0, Math.min(360, progressDegrees));
  if (degrees === 0) return "var(--border)";
  if (degrees === 360) return RAINBOW_RING;

  return `conic-gradient(
    transparent 0deg,
    transparent ${degrees}deg,
    var(--border) ${degrees}deg,
    var(--border) 360deg
  ), ${RAINBOW_RING}`;
}

type SharedQuizQueueProps = {
  quizOrder: readonly number[];
  participantNames: readonly string[];
  progress: QuizProgress;
  pendingQuizIndexes: ReadonlySet<number>;
  selectedQuizIndex: number | null;
  isReady: boolean;
  announcement: string;
  onOpenQuiz: (quizIndex: number) => void;
};

function SharedQuizQueue({
  quizOrder,
  participantNames,
  progress,
  pendingQuizIndexes,
  selectedQuizIndex,
  isReady,
  announcement,
  onOpenQuiz,
}: SharedQuizQueueProps) {
  const totalTarget = participantNames.length * MAX_SOLVES;

  return (
    <section
      className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5"
      aria-label="공용 랜덤 퀴즈"
      aria-busy={!isReady}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--foreground)]">
            랜덤 퀴즈
          </h2>
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">클릭 → 추첨</p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--control-border)] bg-[var(--control-background)] px-3 py-1.5 text-xs font-black tabular-nums text-[var(--control-foreground)]">
          {participantNames.length}명
        </span>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <ol className="mt-5 grid grid-cols-4 gap-2.5 sm:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-10">
        {quizOrder.map((quizIndex) => {
          const solveCount = participantNames.reduce(
            (sum, studentName) =>
              sum + Math.min(MAX_SOLVES, progress[studentName]?.[quizIndex] ?? 0),
            0,
          );
          const complete = totalTarget > 0 && solveCount >= totalTarget;
          const pending = pendingQuizIndexes.has(quizIndex);
          const selected = selectedQuizIndex === quizIndex;
          const disabled = !isReady || participantNames.length === 0 || complete;
          const progressDegrees =
            totalTarget === 0 ? 0 : Math.round((solveCount / totalTarget) * 360);

          return (
            <li key={quizIndex} className="flex justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onOpenQuiz(quizIndex)}
                aria-expanded={selected}
                aria-controls="random-quiz-panel"
                aria-label={`${quizIndex + 1}번 퀴즈 · ${
                  complete
                    ? "모든 학생 완료"
                    : pending
                      ? "학생 배정 유지"
                      : "클릭하면 학생 추첨"
                } · 공동 진행 ${solveCount}/${totalTarget}`}
                className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full p-[3px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] focus-visible:ring-offset-2 sm:h-[72px] sm:w-[72px] ${
                  disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-0.5"
                } ${selected ? "ring-2 ring-[var(--lesson-accent)] ring-offset-2" : ""}`}
                style={{
                  background: rainbowGaugeBackground(progressDegrees),
                }}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-full w-full items-center justify-center rounded-full border text-lg font-black tabular-nums shadow-sm ${
                    selected
                      ? "border-[var(--control-border-active)] bg-[var(--control-background-active)] text-[var(--control-foreground)]"
                      : "border-[var(--control-border)] bg-[var(--surface)] text-[var(--foreground)]"
                  }`}
                >
                  {complete ? "✓" : quizIndex + 1}
                </span>
                {pending && !complete ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface-raised)] bg-[var(--lesson-accent)] shadow-sm"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default memo(SharedQuizQueue);
