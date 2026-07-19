"use client";

import { MINERALS } from "./mineralData";
import { getQuizForIndex, MAX_SOLVES, quizTextForIndex } from "./quizData";
import { mineralForCount, mineralForStage } from "./quizProgress";
import QuizQuestionText from "./QuizQuestionText";
import StudentBlob from "./StudentBlob";

type QuizDetailProps = {
  name: string;
  quizIndex: number;
  counts: number[];
  color: string;
  onSolve: () => void;
  onUndo: () => void;
};

export default function QuizDetail({
  name,
  quizIndex,
  counts,
  color,
  onSolve,
  onUndo,
}: QuizDetailProps) {
  const quiz = getQuizForIndex(quizIndex);
  const solveCount = counts[quizIndex] ?? 0;
  const currentMineral = mineralForCount(solveCount);
  const maxed = solveCount >= MAX_SOLVES;
  const nextMineral = mineralForStage(solveCount);

  return (
    <div className="min-w-0">
      <p className="pr-10 text-[11px] font-bold tracking-[0.16em] text-[#8f78c9]">
        {name} · QUIZ {quizIndex + 1}
      </p>
      {quiz ? (
        <p className="mt-1 pr-10 text-xs font-bold text-[#8a7f95]">
          {quiz.gradeLabel} · {quiz.semesterLabel} · {quiz.unitTitle} · {quiz.subunitTitle}
        </p>
      ) : null}
      <div className="mt-5 flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <QuizQuestionText
          text={quizTextForIndex(quizIndex)}
          className="min-w-0 flex-1 text-xl font-bold leading-relaxed text-[#463c56] 2xl:text-2xl"
        />
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
              renderMode="thumbnail"
              thumbnailMotion
              className="h-16 w-16"
            />
          </button>
        ) : (
          <span className="flex h-20 w-20 shrink-0 self-end rounded-full border border-[#e7dcf3] bg-[#f7f2ff]" />
        )}
      </div>

      <div
        className="mt-8 flex items-center justify-center gap-2"
        aria-label={`풀이 ${solveCount} / ${MAX_SOLVES}`}
      >
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
              renderMode="thumbnail"
              thumbnailMotion
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
    </div>
  );
}
