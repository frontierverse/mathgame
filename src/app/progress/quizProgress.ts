import { MINERAL_ORDER, type BlobVariant } from "./mineralData";
import { MAX_QUIZ_COUNT, MAX_SOLVES } from "./quizData";

export type QuizProgress = Record<string, number[]>;

export const mineralForStage = (stage: number): BlobVariant =>
  MINERAL_ORDER[Math.min(stage, MINERAL_ORDER.length - 1)];

export const mineralForCount = (count: number): BlobVariant | null =>
  count > 0 ? mineralForStage(count - 1) : null;

export const EARNABLE_MINERALS = MINERAL_ORDER.slice(0, MAX_SOLVES);
export const INITIAL_UNLOCKED_QUIZZES = 10;
export const RUBIES_PER_DIAMOND = 10;

export const startedQuizCount = (counts: number[]) =>
  counts.filter((count) => count > 0).length;

export function getMineralInventory(counts: number[]) {
  const totals: Record<BlobVariant, number> = {
    rock: 0,
    crystal: 0,
    ruby: 0,
    diamond: 0,
  };
  const rubyQuizIndexes: number[] = [];

  counts.forEach((count, quizIndex) => {
    const mineral = mineralForCount(count);
    if (mineral === "ruby") {
      rubyQuizIndexes.push(quizIndex);
      return;
    }
    if (mineral) totals[mineral] += 1;
  });

  const diamondCount = Math.floor(rubyQuizIndexes.length / RUBIES_PER_DIAMOND);
  const diamondGroups = Array.from({ length: diamondCount }, (_, diamondIndex) => {
    const start = diamondIndex * RUBIES_PER_DIAMOND;
    return rubyQuizIndexes.slice(start, start + RUBIES_PER_DIAMOND);
  });
  const consumedRubyQuizIndexes = new Set(diamondGroups.flat());

  totals.ruby = rubyQuizIndexes.length;
  totals.diamond = diamondGroups.length;

  return {
    totals,
    diamondGroups,
    consumedRubyQuizIndexes,
    totalRubyCount: rubyQuizIndexes.length,
  };
}

export function countMinerals(counts: number[]) {
  return getMineralInventory(counts).totals;
}

export function unlockedQuizCount(counts: number[]) {
  const { totalRubyCount } = getMineralInventory(counts);
  const completedBatches = Math.floor(totalRubyCount / RUBIES_PER_DIAMOND);
  return Math.min(
    MAX_QUIZ_COUNT,
    INITIAL_UNLOCKED_QUIZZES + completedBatches * RUBIES_PER_DIAMOND,
  );
}
