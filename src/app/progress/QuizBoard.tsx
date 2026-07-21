"use client";

import { memo } from "react";

import DiamondRewardButton from "./DiamondRewardButton";
import MineralObject from "./MineralObject";
import { MINERALS } from "./mineralData";
import {
  EARNABLE_MINERALS,
  getMineralInventory,
  mineralForCount,
  unlockedQuizCount,
} from "./quizProgress";

type QuizBoardProps = {
  studentName: string;
  studentAge: number | null;
  studentIndex: number;
  counts: number[];
  onOpenQuiz: (studentIndex: number, quizIndex: number) => void;
  onOpenDiamond: (studentIndex: number, diamondIndex: number) => void;
  selectedQuizIndex: number | null;
  quizIndexes?: readonly number[];
  compact?: boolean;
};

type QuizBoardItem =
  | { type: "quiz"; quizIndex: number }
  | { type: "diamond"; diamondIndex: number };

function QuizBoard({
  studentName,
  studentAge,
  studentIndex,
  counts,
  onOpenQuiz,
  onOpenDiamond,
  selectedQuizIndex,
  quizIndexes,
  compact = false,
}: QuizBoardProps) {
  const { totals: mineralCounts, diamondGroups, consumedRubyQuizIndexes } =
    getMineralInventory(counts);
  const unlockedCount = unlockedQuizCount(counts);
  const renderedQuizIndexes =
    quizIndexes ?? Array.from({ length: unlockedCount }, (_, quizIndex) => quizIndex);
  const diamondIndexByFirstQuiz = new Map(
    diamondGroups.map(({ diamondIndex, quizIndexes: rubyQuizIndexes }) => [
      rubyQuizIndexes[0],
      diamondIndex,
    ]),
  );
  const rubyCountByDiamondIndex = new Map(
    diamondGroups.map(({ diamondIndex, quizIndexes: rubyQuizIndexes }) => [
      diamondIndex,
      rubyQuizIndexes.length,
    ]),
  );
  const boardItems: QuizBoardItem[] = [];

  renderedQuizIndexes.forEach((quizIndex) => {
    if (consumedRubyQuizIndexes.has(quizIndex)) {
      const diamondIndex = diamondIndexByFirstQuiz.get(quizIndex);
      if (diamondIndex !== undefined) boardItems.push({ type: "diamond", diamondIndex });
      return;
    }
    boardItems.push({ type: "quiz", quizIndex });
  });
  const displayedDiamondCount = boardItems.filter(
    (item) => item.type === "diamond",
  ).length;

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
          {EARNABLE_MINERALS.map((mineral) => (
            <span
              key={mineral}
              className="flex items-center gap-1 text-sm font-bold tabular-nums text-[#766b7d]"
              aria-label={`${MINERALS[mineral].label} ${mineralCounts[mineral]}개`}
            >
              <MineralObject
                variant={mineral}
                className="h-7 w-7"
              />
              {mineralCounts[mineral]}
            </span>
          ))}
          <span
            className="flex items-center gap-1 text-sm font-bold tabular-nums text-[#766b7d]"
            aria-label={`다이아몬드 ${mineralCounts.diamond}개`}
          >
            <MineralObject
              variant="diamond"
              className={`h-7 w-7 ${mineralCounts.diamond > 0 ? "" : "opacity-40 grayscale"}`}
            />
            {mineralCounts.diamond}
          </span>
        </div>
      </div>

      <div
        className={`mt-5 px-2 py-4 ${
          compact ? "min-h-[152px]" : "min-h-[168px] 2xl:min-h-[184px]"
        }`}
      >
        <ol
          className={`grid w-full gap-2 ${
            compact
              ? "grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]"
              : "grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))]"
          }`}
          aria-label={`${studentName.slice(1)}의 퀴즈, ${renderedQuizIndexes.length}개 표시, 다이아몬드 ${displayedDiamondCount}개`}
        >
          {boardItems.map((item) => {
            if (item.type === "diamond") {
              return (
                <li
                  key={`diamond-${item.diamondIndex}`}
                  className="flex justify-center"
                >
                  <DiamondRewardButton
                    diamondIndex={item.diamondIndex}
                    rubyCount={rubyCountByDiamondIndex.get(item.diamondIndex) ?? 0}
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
              <li key={quizIndex} className="flex justify-center">
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
                    <MineralObject
                      variant={mineral}
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
