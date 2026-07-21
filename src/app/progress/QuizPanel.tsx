"use client";

import { useEffect, useState } from "react";

import QuizCountdown from "./QuizCountdown";
import QuizDetail from "./QuizDetail";
import QuizFlipCard from "./QuizFlipCard";
import type { QuizMineralStage } from "./quizData";
import { unlockedQuizCount } from "./quizProgress";

type QuizPanelProps = {
  id?: string;
  ariaLabel?: string;
  name: string;
  quizIndex: number;
  questionText?: string;
  answerText?: string | null;
  counts: number[];
  diamondCountLimit?: number;
  navigationQuizIndexes?: readonly number[];
  timeLimitSeconds?: number;
  startedAtPerformanceMs?: number;
  onTimeUp?: () => void;
  onAward: (stage: QuizMineralStage) => void;
  onUndo?: () => void;
  onNavigate?: (quizIndex: number) => void;
  onClose: () => void;
};

export default function QuizPanel({
  id,
  ariaLabel,
  name,
  quizIndex,
  questionText,
  answerText,
  counts,
  diamondCountLimit,
  navigationQuizIndexes,
  timeLimitSeconds,
  startedAtPerformanceMs,
  onTimeUp,
  onAward,
  onUndo,
  onNavigate,
  onClose,
}: QuizPanelProps) {
  const [entered, setEntered] = useState(false);
  const showTimer =
    timeLimitSeconds !== undefined && startedAtPerformanceMs !== undefined;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (!onNavigate) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (navigationQuizIndexes) {
          const position = navigationQuizIndexes.indexOf(quizIndex);
          onNavigate(navigationQuizIndexes[Math.max(0, position - 1)] ?? quizIndex);
        } else {
          onNavigate(Math.max(0, quizIndex - 1));
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (navigationQuizIndexes) {
          const position = navigationQuizIndexes.indexOf(quizIndex);
          onNavigate(
            navigationQuizIndexes[
              Math.min(navigationQuizIndexes.length - 1, position + 1)
            ] ?? quizIndex,
          );
        } else {
          onNavigate(
            Math.min(unlockedQuizCount(counts, diamondCountLimit) - 1, quizIndex + 1),
          );
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [counts, diamondCountLimit, navigationQuizIndexes, onClose, onNavigate, quizIndex]);

  return (
    <QuizFlipCard
      key={`${name}-${quizIndex}`}
      id={id}
      ariaLabel={ariaLabel ?? `${name} ${quizIndex + 1}번 퀴즈`}
      quizIndex={quizIndex}
      answerText={answerText}
      entered={entered}
      cornerAccessory={
        showTimer ? (
          <QuizCountdown
            durationSeconds={timeLimitSeconds}
            startedAtPerformanceMs={startedAtPerformanceMs}
            onExpire={onTimeUp}
          />
        ) : undefined
      }
      faceClassName="min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-[var(--control-border-active)] bg-[var(--surface)] p-6 shadow-[0_16px_40px_rgba(73,53,96,0.16)] sm:p-7"
    >
      <div
        className="min-w-0 pr-10"
        role="status"
        aria-live="polite"
      >
        <p
          className={`${showTimer ? "pr-20" : ""} text-[11px] font-black tracking-[0.16em] text-[var(--lesson-accent)]`}
        >
          QUIZ {quizIndex + 1}
        </p>
        <h2
          className={`${showTimer ? "mt-4" : "mt-1"} truncate text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]`}
        >
          {name}
        </h2>
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <QuizDetail
          name={name}
          quizIndex={quizIndex}
          questionText={questionText}
          counts={counts}
          onAward={onAward}
          onUndo={onUndo}
          showIdentity={false}
        />
      </div>
    </QuizFlipCard>
  );
}
