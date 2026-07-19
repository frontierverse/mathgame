"use client";

import type { CSSProperties } from "react";

import { MINERALS, type BlobVariant } from "./mineralData";
import {
  getQuizForIndex,
  MAX_SOLVES,
  quizTextForIndex,
  type QuizMineralStage,
} from "./quizData";
import { mineralForCount, mineralForStage } from "./quizProgress";
import MineralObject from "./MineralObject";
import QuizQuestionText from "./QuizQuestionText";

type RewardMineral = Exclude<BlobVariant, "diamond">;

type RewardOption = {
  variant: RewardMineral;
  stage: QuizMineralStage;
  statusSymbol?: "×" | "✓";
  ariaLabel: string;
};

const REWARD_BUTTON_STYLES: Record<RewardMineral, CSSProperties> = {
  rock: {
    backgroundColor: "#f5f1eb",
    borderColor: "#d8d0c7",
    color: "#625b54",
  },
  crystal: {
    backgroundColor: "#f5effd",
    borderColor: "#d8cbea",
    color: "#6b568c",
  },
  ruby: {
    backgroundColor: "#fff0f3",
    borderColor: "#efc0cb",
    color: "#9e3f55",
  },
};

function rewardOptionsForStage(solveCount: number): RewardOption[] {
  if (solveCount === 0) {
    return [
      {
        variant: "rock",
        stage: 1,
        statusSymbol: "×",
        ariaLabel: "틀림, 돌 획득, 다음 차례에 다시 풀기",
      },
      {
        variant: "ruby",
        stage: 3,
        statusSymbol: "✓",
        ariaLabel: "정답, 루비 바로 획득, 퀴즈 완료",
      },
    ];
  }

  if (solveCount === 1) {
    return [
      {
        variant: "crystal",
        stage: 2,
        ariaLabel: "수정 획득, 다음 차례에 한 번 더 풀기",
      },
    ];
  }

  if (solveCount === 2) {
    return [
      {
        variant: "ruby",
        stage: 3,
        ariaLabel: "루비 획득, 퀴즈 완료",
      },
    ];
  }

  return [];
}

type QuizDetailProps = {
  name: string;
  quizIndex: number;
  questionText?: string;
  counts: number[];
  onAward: (stage: QuizMineralStage) => void;
  onUndo?: () => void;
  showIdentity?: boolean;
};

export default function QuizDetail({
  name,
  quizIndex,
  questionText,
  counts,
  onAward,
  onUndo,
  showIdentity = true,
}: QuizDetailProps) {
  const quiz = getQuizForIndex(quizIndex);
  const solveCount = counts[quizIndex] ?? 0;
  const currentMineral = mineralForCount(solveCount);
  const maxed = solveCount >= MAX_SOLVES;
  const rewardOptions = rewardOptionsForStage(solveCount);

  return (
    <div className="min-w-0">
      {showIdentity ? (
        <>
          <p className="pr-10 text-[11px] font-bold tracking-[0.16em] text-[#8f78c9]">
            {name} · QUIZ {quizIndex + 1}
          </p>
          {quiz ? (
            <p className="mt-1 pr-10 text-xs font-bold text-[#8a7f95]">
              {quiz.gradeLabel} · {quiz.semesterLabel} · {quiz.unitTitle} · {quiz.subunitTitle}
            </p>
          ) : null}
        </>
      ) : quiz ? (
        <p className="pr-10 text-[11px] font-bold text-[#8a7f95]">
          {quiz.unitTitle} · {quiz.subunitTitle}
        </p>
      ) : null}
      <div className="mt-5 flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <QuizQuestionText
          text={questionText ?? quizTextForIndex(quizIndex)}
          className="min-w-0 flex-1 text-xl font-bold leading-relaxed text-[#463c56] 2xl:text-2xl"
        />
        {currentMineral && onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="flex h-20 w-20 shrink-0 self-end items-center justify-center rounded-full border border-[#e7dcf3] bg-[#f7f2ff] transition hover:-translate-y-0.5 hover:border-[#cbb9e3] hover:shadow-[0_8px_20px_rgba(120,96,190,0.18)]"
            aria-label={`${MINERALS[currentMineral].label} 한 단계 취소`}
            title="클릭하면 한 단계 취소"
          >
            <MineralObject
              variant={currentMineral}
              className="h-16 w-16"
            />
          </button>
        ) : currentMineral ? (
          <span
            className="flex h-20 w-20 shrink-0 self-end items-center justify-center rounded-full border border-[#e7dcf3] bg-[#f7f2ff]"
            aria-label={MINERALS[currentMineral].label}
          >
            <MineralObject
              variant={currentMineral}
              className="h-16 w-16"
            />
          </span>
        ) : null}
      </div>

      <div
        className="mt-8 flex items-center justify-center gap-2"
        aria-label={`광물 단계 ${solveCount} / ${MAX_SOLVES}`}
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
            <MineralObject
              variant={mineralForStage(MAX_SOLVES - 1)}
              className="h-8 w-8"
            />
            최고 단계 · {MINERALS[mineralForStage(MAX_SOLVES - 1)].label} 완성!
          </div>
        ) : (
          <div
            className={`grid gap-3 ${rewardOptions.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {rewardOptions.map(({ variant, stage, statusSymbol, ariaLabel }) => (
              <button
                key={variant}
                type="button"
                onClick={() => onAward(stage)}
                aria-label={ariaLabel}
                style={REWARD_BUTTON_STYLES[variant]}
                className={`relative flex min-h-28 items-center justify-center gap-3 rounded-2xl border px-4 py-4 font-black shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f78c9] focus-visible:ring-offset-2 ${
                  rewardOptions.length === 2 ? "flex-col" : "flex-row"
                }`}
              >
                {statusSymbol ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-base shadow-sm"
                  >
                    {statusSymbol}
                  </span>
                ) : null}
                <MineralObject
                  variant={variant}
                  className="h-16 w-16 shrink-0"
                />
                <span className="text-sm">{MINERALS[variant].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
