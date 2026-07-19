"use client";

import { useEffect, useState } from "react";

import QuizDetail from "./QuizDetail";
import QuizFlipCard from "./QuizFlipCard";
import type { QuizMineralStage } from "./quizData";
import { unlockedQuizCount } from "./quizProgress";

type QuizPanelProps = {
  name: string;
  quizIndex: number;
  counts: number[];
  diamondCountLimit?: number;
  navigationQuizIndexes?: readonly number[];
  color: string;
  onAward: (stage: QuizMineralStage) => void;
  onUndo: () => void;
  onNavigate: (quizIndex: number) => void;
  onClose: () => void;
};

export default function QuizPanel({
  name,
  quizIndex,
  counts,
  diamondCountLimit,
  navigationQuizIndexes,
  color,
  onAward,
  onUndo,
  onNavigate,
  onClose,
}: QuizPanelProps) {
  const [entered, setEntered] = useState(false);

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
      ariaLabel={`${name} ${quizIndex + 1}번 퀴즈`}
      quizIndex={quizIndex}
      entered={entered}
      faceClassName="min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-[#ece1f4] bg-[#fffdf8] p-6 shadow-[0_12px_30px_rgba(111,92,74,0.1)] sm:p-7"
    >
      <QuizDetail
        name={name}
        quizIndex={quizIndex}
        counts={counts}
        color={color}
        onAward={onAward}
        onUndo={onUndo}
      />
    </QuizFlipCard>
  );
}
