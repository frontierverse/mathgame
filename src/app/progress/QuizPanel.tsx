"use client";

import { useEffect, useState } from "react";

import { MINERALS } from "./mineralData";
import { MAX_SOLVES, QUIZZES } from "./quizData";
import { mineralForCount, mineralForStage, unlockedQuizCount } from "./quizProgress";
import StudentBlob from "./StudentBlob";

type QuizPanelProps = {
  name: string;
  quizIndex: number;
  counts: number[];
  color: string;
  onSolve: () => void;
  onUndo: () => void;
  onNavigate: (quizIndex: number) => void;
  onClose: () => void;
};

export default function QuizPanel({
  name,
  quizIndex,
  counts,
  color,
  onSolve,
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
        onNavigate(Math.min(unlockedQuizCount(counts) - 1, quizIndex + 1));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [counts, onClose, onNavigate, quizIndex]);

  const solveCount = counts[quizIndex] ?? 0;
  const currentMineral = mineralForCount(solveCount);
  const maxed = solveCount >= MAX_SOLVES;
  const nextMineral = mineralForStage(solveCount);

  return (
    <aside
      className="relative min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-[#ece1f4] bg-[#fffdf8] p-6 shadow-[0_12px_30px_rgba(111,92,74,0.1)] transition-all duration-300 sm:p-7 lg:sticky lg:top-4"
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

      <p className="pr-10 text-[11px] font-bold tracking-[0.16em] text-[#8f78c9]">
        {name} · QUIZ {quizIndex + 1}
      </p>
      <div className="mt-5 flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <p className="min-w-0 flex-1 break-words text-xl font-bold leading-relaxed text-[#463c56] 2xl:text-2xl">
          {QUIZZES[quizIndex]}
        </p>
        {currentMineral ? (
          <button
            type="button"
            onClick={onUndo}
            className="flex h-20 w-20 shrink-0 self-end items-center justify-center rounded-full border border-[#e7dcf3] bg-[#f7f2ff] transition hover:-translate-y-0.5 hover:border-[#cbb9e3] hover:shadow-[0_8px_20px_rgba(120,96,190,0.18)]"
            aria-label={`${MINERALS[currentMineral].label} 한 단계 취소`}
            title="클릭하면 한 단계 취소"
          >
            <StudentBlob
              variant={currentMineral}
              color={color}
              seed={quizIndex}
              className="h-16 w-16"
            />
          </button>
        ) : (
          <span className="flex h-20 w-20 shrink-0 self-end rounded-full border border-[#e7dcf3] bg-[#f7f2ff]" />
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2" aria-label={`풀이 ${solveCount} / ${MAX_SOLVES}`}>
        {Array.from({ length: MAX_SOLVES }, (_, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index < solveCount ? "bg-[#9b84d9]" : "bg-[#e3d9c8]"
            }`}
          />
        ))}
      </div>

      <div className="mt-4">
        {maxed ? (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-[#eef9f0] px-4 py-3 text-center text-sm font-bold text-[#3f8a5b]">
            <StudentBlob
              variant={mineralForStage(MAX_SOLVES - 1)}
              color={color}
              seed={quizIndex}
              className="h-8 w-8"
            />
            최고 단계 · {MINERALS[mineralForStage(MAX_SOLVES - 1)].label} 완성!
          </div>
        ) : (
          <button
            type="button"
            onClick={onSolve}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9b84d9] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(120,96,190,0.24)] transition hover:-translate-y-0.5 hover:bg-[#8a72cb] active:translate-y-0"
          >
            <span className="text-base">✓</span>
            {solveCount === 0
              ? `맞았어요 · ${MINERALS[nextMineral].label} 획득!`
              : `또 맞았어요 · ${MINERALS[nextMineral].label}(으)로 진화!`}
          </button>
        )}
      </div>
    </aside>
  );
}
