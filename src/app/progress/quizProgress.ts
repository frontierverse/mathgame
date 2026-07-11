import { MINERAL_ORDER, type BlobVariant } from "./mineralData";
import { MAX_SOLVES, QUIZZES } from "./quizData";

export type QuizProgress = Record<string, number[]>;

export const mineralForStage = (stage: number): BlobVariant =>
  MINERAL_ORDER[Math.min(stage, MINERAL_ORDER.length - 1)];

export const mineralForCount = (count: number): BlobVariant | null =>
  count > 0 ? mineralForStage(count - 1) : null;

export const EARNABLE_MINERALS = MINERAL_ORDER.slice(0, MAX_SOLVES);
export const INITIAL_UNLOCKED_QUIZZES = 10;

export const startedQuizCount = (counts: number[]) =>
  counts.filter((count) => count > 0).length;

export function countMinerals(counts: number[]) {
  const totals: Record<BlobVariant, number> = {
    rock: 0,
    crystal: 0,
    ruby: 0,
    diamond: 0,
  };
  counts.forEach((count) => {
    const mineral = mineralForCount(count);
    if (mineral) totals[mineral] += 1;
  });
  return totals;
}

export function unlockedQuizCount(counts: number[]) {
  return Math.min(
    QUIZZES.length,
    INITIAL_UNLOCKED_QUIZZES + countMinerals(counts).ruby,
  );
}
