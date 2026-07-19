"use client";

import { useCallback, useEffect, useState } from "react";

import QuizDetail from "./QuizDetail";
import type { QuizMineralStage } from "./quizData";
import { unlockedQuizCount } from "./quizProgress";

type QuizModalProps = {
  name: string;
  quizIndex: number;
  counts: number[];
  color: string;
  onAward: (stage: QuizMineralStage) => void;
  onUndo: () => void;
  onNavigate: (quizIndex: number) => void;
  onClose: () => void;
};

export default function QuizModal({
  name,
  quizIndex,
  counts,
  color,
  onAward,
  onUndo,
  onNavigate,
  onClose,
}: QuizModalProps) {
  const [entered, setEntered] = useState(false);

  const requestClose = useCallback(() => {
    setEntered(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate(Math.max(0, quizIndex - 1));
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate(Math.min(unlockedQuizCount(counts) - 1, quizIndex + 1));
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [counts, onNavigate, quizIndex, requestClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} ${quizIndex + 1}번 퀴즈`}
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={requestClose}
        className="absolute inset-0 bg-[#2b2438]/45 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: entered ? 1 : 0 }}
      />

      <div
        className="relative w-full max-w-lg rounded-[2rem] border border-[#ece1f4] bg-[#fffdf8] p-6 shadow-[0_30px_80px_rgba(66,46,90,0.28)] transition-all duration-300 sm:p-7"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0) scale(1)" : "translateY(24px) scale(0.94)",
        }}
      >
        <button
          type="button"
          onClick={requestClose}
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
      </div>
    </div>
  );
}
