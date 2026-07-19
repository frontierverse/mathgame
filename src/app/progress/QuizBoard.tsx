"use client";

import { memo } from "react";

import DiamondRewardButton from "./DiamondRewardButton";
import { MINERALS } from "./mineralData";
import {
  EARNABLE_MINERALS,
  getMineralInventory,
  getRubyCountForDiamondBatch,
  MAX_DIAMOND_COUNT,
  mineralForCount,
  RUBIES_PER_DIAMOND,
  unlockedQuizCount,
} from "./quizProgress";
import StudentBlob from "./StudentBlob";

type QuizBoardProps = {
  studentName: string;
  studentAge: number | null;
  studentIndex: number;
  studentColor: string;
  counts: number[];
  onOpenQuiz: (studentIndex: number, quizIndex: number) => void;
  onOpenDiamond: (studentIndex: number, diamondIndex: number) => void;
  selectedQuizIndex: number | null;
  diamondCountLimit?: number;
  compact?: boolean;
};

type QuizBoardItem =
  | { type: "quiz"; quizIndex: number }
  | { type: "diamond"; diamondIndex: number };

function QuizBoard({
  studentName,
  studentAge,
  studentIndex,
  studentColor,
  counts,
  onOpenQuiz,
  onOpenDiamond,
  selectedQuizIndex,
  diamondCountLimit,
  compact = false,
}: QuizBoardProps) {
  const { totals: mineralCounts, diamondGroups, consumedRubyQuizIndexes } =
    getMineralInventory(counts, diamondCountLimit);
  const unlockedCount = unlockedQuizCount(counts, diamondCountLimit);
  const waitingForTeam =
    diamondCountLimit !== undefined &&
    diamondCountLimit < MAX_DIAMOND_COUNT &&
    getRubyCountForDiamondBatch(counts, diamondCountLimit) === RUBIES_PER_DIAMOND;
  const renderedCount = unlockedCount;
  const diamondIndexByFirstQuiz = new Map(
    diamondGroups.map((rubyQuizIndexes, diamondIndex) => [rubyQuizIndexes[0], diamondIndex]),
  );
  const boardItems: QuizBoardItem[] = [];

  for (let quizIndex = 0; quizIndex < renderedCount; quizIndex += 1) {
    if (consumedRubyQuizIndexes.has(quizIndex)) {
      const diamondIndex = diamondIndexByFirstQuiz.get(quizIndex);
      if (diamondIndex !== undefined) boardItems.push({ type: "diamond", diamondIndex });
      continue;
    }
    boardItems.push({ type: "quiz", quizIndex });
  }

  return (
    <div className="min-w-0 p-1 sm:p-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-xl font-bold tracking-[-0.04em] text-[#51475c]">
          {studentName.slice(1)}의 퀴즈
          {studentAge === null ? null : (
            <span className="age-hidden-until-selected">
              {` (${studentAge})`}
            </span>
          )}
        </h3>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
          {EARNABLE_MINERALS.map((mineral, index) => (
            <span
              key={mineral}
              className="flex items-center gap-1 text-sm font-bold tabular-nums text-[#766b7d]"
              aria-label={`${MINERALS[mineral].label} ${mineralCounts[mineral]}개`}
            >
              <StudentBlob
                variant={mineral}
                color={studentColor}
                seed={index}
                renderMode="thumbnail"
                className="h-7 w-7"
              />
              {mineralCounts[mineral]}
            </span>
          ))}
          <span
            className="flex items-center gap-1 text-sm font-bold tabular-nums text-[#766b7d]"
            aria-label={`다이아몬드 ${mineralCounts.diamond}개`}
          >
            <StudentBlob
              variant="diamond"
              color={studentColor}
              seed={3}
              renderMode="thumbnail"
              thumbnailMotion={mineralCounts.diamond > 0}
              className={`h-7 w-7 ${mineralCounts.diamond > 0 ? "" : "opacity-40 grayscale"}`}
            />
            {mineralCounts.diamond}
          </span>
        </div>
      </div>

      {waitingForTeam ? (
        <p className="mt-2 inline-flex rounded-full border border-[#e0c9da] bg-[#fff4fa] px-2.5 py-1 text-[11px] font-black text-[#8e5576]">
          루비 10/10 · 전원 완성까지 다이아 변환 대기
        </p>
      ) : null}

      <div className="progress-scroll mt-5 max-h-[168px] overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-4 2xl:max-h-[184px]">
        <ol
          className="grid w-max grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
          aria-label={`${studentName.slice(1)}의 퀴즈, ${unlockedCount}개 열림, 다이아몬드 ${diamondGroups.length}개`}
        >
          {boardItems.map((item) => {
            if (item.type === "diamond") {
              return (
                <li key={`diamond-${item.diamondIndex}`}>
                  <DiamondRewardButton
                    studentColor={studentColor}
                    seed={studentIndex * 10 + item.diamondIndex}
                    diamondIndex={item.diamondIndex}
                    compact={compact}
                    onClick={() => onOpenDiamond(studentIndex, item.diamondIndex)}
                  />
                </li>
              );
            }

            const { quizIndex } = item;
            const count = counts[quizIndex] ?? 0;
            const mineral = mineralForCount(count);
            const selected = quizIndex === selectedQuizIndex;
            return (
              <li key={quizIndex}>
                <button
                  type="button"
                  onClick={() => onOpenQuiz(studentIndex, quizIndex)}
                  aria-pressed={selected}
                  aria-label={`${quizIndex + 1}번 퀴즈${
                    mineral ? ` · ${MINERALS[mineral].label}` : ""
                  }`}
                  className={`flex items-center justify-center rounded-full border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5a3f0] focus-visible:ring-offset-1 ${
                    compact ? "h-14 w-14" : "h-16 w-16 2xl:h-[72px] 2xl:w-[72px]"
                  } ${
                    mineral
                      ? "border-[#d6c8e8] bg-[#f7f2ff] hover:border-[#9b84d9]"
                      : "border-[#dfd3c3] bg-white text-[#b3a693] hover:border-[#b6a5df] hover:bg-[#f8f4ff]"
                  } ${selected ? "border-[#8f78c9] ring-2 ring-inset ring-[#b5a3f0]" : ""}`}
                >
                  {mineral ? (
                    <StudentBlob
                      variant={mineral}
                      color={studentColor}
                      seed={studentIndex * 100 + quizIndex}
                      renderMode="thumbnail"
                      thumbnailMotion
                      className={compact ? "h-12 w-12" : "h-14 w-14 2xl:h-16 2xl:w-16"}
                    />
                  ) : (
                    <span className="text-base font-bold tabular-nums 2xl:text-lg">
                      {quizIndex + 1}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default memo(QuizBoard);
