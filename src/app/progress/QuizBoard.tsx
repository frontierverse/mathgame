"use client";

import { MINERALS } from "./mineralData";
import { QUIZZES } from "./quizData";
import {
  countMinerals,
  EARNABLE_MINERALS,
  mineralForCount,
  unlockedQuizCount,
} from "./quizProgress";
import StudentBlob from "./StudentBlob";

type QuizBoardProps = {
  studentName: string;
  studentIndex: number;
  studentColor: string;
  counts: number[];
  onOpenQuiz: (quizIndex: number) => void;
};

const FADED_PREVIEW_COUNT = 10;

export default function QuizBoard({
  studentName,
  studentIndex,
  studentColor,
  counts,
  onOpenQuiz,
}: QuizBoardProps) {
  const mineralCounts = countMinerals(counts);
  const unlockedCount = unlockedQuizCount(counts);
  const renderedCount = Math.min(QUIZZES.length, unlockedCount + FADED_PREVIEW_COUNT);
  const visibleQuizzes = QUIZZES.slice(0, renderedCount);

  return (
    <div className="min-w-0 p-1 sm:p-2">
      <div className="flex items-end justify-between gap-3">
        <h3 className="text-xl font-bold tracking-[-0.04em] text-[#51475c]">
          {studentName.slice(1)}의 퀴즈
        </h3>
        <div className="ml-auto flex items-center gap-2.5">
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
        </div>
      </div>

      <ol
        className="mt-5 flex flex-wrap content-start gap-1"
        aria-label={`${studentName.slice(1)}의 퀴즈, ${unlockedCount}개 열림`}
      >
        {visibleQuizzes.map((_, quizIndex) => {
          const count = counts[quizIndex] ?? 0;
          const mineral = mineralForCount(count);
          const locked = quizIndex >= unlockedCount;
          const fadeDistance = quizIndex - unlockedCount;
          const opacity = locked ? Math.max(0.07, 0.7 - fadeDistance * 0.07) : 1;
          return (
            <li key={quizIndex}>
              <button
                type="button"
                onClick={() => onOpenQuiz(quizIndex)}
                disabled={locked}
                aria-label={`${quizIndex + 1}번 퀴즈${locked ? " · 아직 잠김" : mineral ? ` · ${MINERALS[mineral].label}` : ""}`}
                style={{ opacity }}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5a3f0] focus-visible:ring-offset-1 sm:h-14 sm:w-14 ${
                  locked
                    ? "cursor-default border-[#e5ddd2] bg-white text-[#c8bdaf]"
                    : mineral
                    ? "border-[#d6c8e8] bg-[#f7f2ff] hover:-translate-y-0.5 hover:border-[#9b84d9]"
                    : "border-[#dfd3c3] bg-white text-[#b3a693] hover:-translate-y-0.5 hover:border-[#b6a5df] hover:bg-[#f8f4ff]"
                }`}
              >
                {mineral ? (
                  <StudentBlob
                    variant={mineral}
                    color={studentColor}
                    seed={studentIndex * 100 + quizIndex}
                    renderMode="thumbnail"
                    thumbnailMotion
                    className="h-10 w-10 sm:h-12 sm:w-12"
                  />
                ) : (
                  <span className="text-sm font-bold tabular-nums sm:text-base">{quizIndex + 1}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
