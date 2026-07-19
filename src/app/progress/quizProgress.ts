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
export const MAX_DIAMOND_COUNT = Math.floor(MAX_QUIZ_COUNT / RUBIES_PER_DIAMOND);

export const startedQuizCount = (counts: number[]) =>
  counts.filter((count) => count > 0).length;

export function getRubyCountForDiamondBatch(counts: number[], diamondIndex: number) {
  if (
    !Number.isInteger(diamondIndex) ||
    diamondIndex < 0 ||
    diamondIndex >= MAX_DIAMOND_COUNT
  ) {
    return 0;
  }

  const groupStart = diamondIndex * RUBIES_PER_DIAMOND;
  let rubyCount = 0;
  for (let offset = 0; offset < RUBIES_PER_DIAMOND; offset += 1) {
    if (mineralForCount(counts[groupStart + offset] ?? 0) === "ruby") rubyCount += 1;
  }
  return rubyCount;
}

export type TeamDiamondProgress = {
  diamondCount: number;
  participantCount: number;
  nextDiamondIndex: number | null;
  readyStudentCount: number;
  currentRubyCount: number;
  currentRubyTarget: number;
};

export function getTeamDiamondProgress(
  progress: QuizProgress,
  studentNames: readonly string[],
): TeamDiamondProgress {
  const participants = Array.from(new Set(studentNames));
  const participantCount = participants.length;

  if (participantCount === 0) {
    return {
      diamondCount: 0,
      participantCount: 0,
      nextDiamondIndex: null,
      readyStudentCount: 0,
      currentRubyCount: 0,
      currentRubyTarget: 0,
    };
  }

  let diamondCount = 0;
  while (
    diamondCount < MAX_DIAMOND_COUNT &&
    participants.every(
      (studentName) =>
        getRubyCountForDiamondBatch(progress[studentName] ?? [], diamondCount) ===
        RUBIES_PER_DIAMOND,
    )
  ) {
    diamondCount += 1;
  }

  const nextDiamondIndex = diamondCount < MAX_DIAMOND_COUNT ? diamondCount : null;
  const currentRubyCounts =
    nextDiamondIndex === null
      ? participants.map(() => RUBIES_PER_DIAMOND)
      : participants.map((studentName) =>
          getRubyCountForDiamondBatch(progress[studentName] ?? [], nextDiamondIndex),
        );

  return {
    diamondCount,
    participantCount,
    nextDiamondIndex,
    readyStudentCount: currentRubyCounts.filter(
      (rubyCount) => rubyCount === RUBIES_PER_DIAMOND,
    ).length,
    currentRubyCount: currentRubyCounts.reduce((sum, rubyCount) => sum + rubyCount, 0),
    currentRubyTarget: participantCount * RUBIES_PER_DIAMOND,
  };
}

export function getMineralInventory(
  counts: number[],
  maxDiamondCount = Number.POSITIVE_INFINITY,
) {
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

  const rubyQuizIndexSet = new Set(rubyQuizIndexes);
  const diamondGroups: number[][] = [];

  for (
    let groupStart = 0;
    groupStart + RUBIES_PER_DIAMOND <= MAX_QUIZ_COUNT;
    groupStart += RUBIES_PER_DIAMOND
  ) {
    if (diamondGroups.length >= maxDiamondCount) break;

    const group = Array.from(
      { length: RUBIES_PER_DIAMOND },
      (_, offset) => groupStart + offset,
    );

    // Diamonds must be earned in fixed order: quizzes 1–10, then 11–20, and so on.
    if (!group.every((quizIndex) => rubyQuizIndexSet.has(quizIndex))) break;
    diamondGroups.push(group);
  }
  const consumedRubyQuizIndexes = new Set(diamondGroups.flat());

  totals.ruby = rubyQuizIndexes.length - consumedRubyQuizIndexes.size;
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

export function unlockedQuizCount(
  counts: number[],
  maxDiamondCount = Number.POSITIVE_INFINITY,
) {
  const { diamondGroups } = getMineralInventory(counts, maxDiamondCount);
  const completedBatches = diamondGroups.length;
  return Math.min(
    MAX_QUIZ_COUNT,
    INITIAL_UNLOCKED_QUIZZES + completedBatches * RUBIES_PER_DIAMOND,
  );
}
