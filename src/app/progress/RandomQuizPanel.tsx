"use client";

import { useEffect, useState } from "react";

import QuizDetail from "./QuizDetail";
import type { QuizMineralStage } from "./quizData";

type RandomQuizPanelProps = {
  studentName: string;
  studentColor: string;
  quizIndex: number;
  counts: number[];
  onAward: (stage: QuizMineralStage) => void;
  onClose: () => void;
};

export default function RandomQuizPanel({
  studentName,
  studentColor,
  quizIndex,
  counts,
  onAward,
  onClose,
}: RandomQuizPanelProps) {
  const [entered, setEntered] = useState(false);
  const givenName = studentName.slice(1).trim() || studentName;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      id="random-quiz-panel"
      className="relative min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-[var(--control-border-active)] bg-[var(--surface)] p-6 shadow-[0_16px_40px_rgba(73,53,96,0.16)] transition-all duration-300 sm:p-7"
      aria-label={`${givenName} ${quizIndex + 1}번 랜덤 퀴즈`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[var(--muted)] transition hover:bg-[var(--control-background)] hover:text-[var(--foreground)]"
      >
        ✕
      </button>

      <div className="flex items-center gap-4 pr-10" role="status" aria-live="polite">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-black/5 text-2xl font-black text-[#443b50] shadow-sm"
          style={{ backgroundColor: studentColor }}
        >
          {givenName[0]}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.16em] text-[var(--lesson-accent)]">
            QUIZ {quizIndex + 1}
          </p>
          <h2 className="mt-1 truncate text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]">
            {givenName}
          </h2>
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <QuizDetail
          name={givenName}
          quizIndex={quizIndex}
          counts={counts}
          color={studentColor}
          onAward={onAward}
          showIdentity={false}
        />
      </div>
    </aside>
  );
}
