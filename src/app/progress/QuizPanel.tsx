"use client";

import { useEffect, useState } from "react";

import QuizDetail from "./QuizDetail";
import type { QuizMineralStage } from "./quizData";
import { unlockedQuizCount } from "./quizProgress";

type QuizPanelProps = {
  name: string;
  quizIndex: number;
  counts: number[];
  diamondCountLimit?: number;
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
        onNavigate(Math.max(0, quizIndex - 1));
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate(
          Math.min(unlockedQuizCount(counts, diamondCountLimit) - 1, quizIndex + 1),
        );
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [counts, diamondCountLimit, onClose, onNavigate, quizIndex]);

  return (
    <aside
      className="relative min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-[#ece1f4] bg-[#fffdf8] p-6 shadow-[0_12px_30px_rgba(111,92,74,0.1)] transition-all duration-300 sm:p-7"
      aria-label={`${name} ${quizIndex + 1}번 퀴즈`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#8a7f95] transition hover:bg-[#f1ecfb] hover:text-[#5f5470]"
      >
        ✕
      </button>

      <QuizDetail
        name={name}
        quizIndex={quizIndex}
        counts={counts}
        color={color}
        onAward={onAward}
        onUndo={onUndo}
      />
    </aside>
  );
}
