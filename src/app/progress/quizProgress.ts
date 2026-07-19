import { MINERAL_ORDER, type BlobVariant } from "./mineralData";
import {
  CURRICULUM_QUIZ_ROUNDS,
  MAX_QUIZ_COUNT,
  MAX_SOLVES,
} from "./quizData";

export type QuizProgress = Record<string, number[]>;

export type DiamondGroup = {
  diamondIndex: number;
  quizIndexes: readonly number[];
};

export const DIAMOND_QUIZ_GROUPS: readonly DiamondGroup[] =
  CURRICULUM_QUIZ_ROUNDS.map((round, diamondIndex) => ({
    diamondIndex,
    quizIndexes: round.quizIndexes,
  }));

export const mineralForStage = (stage: number): BlobVariant =>
  MINERAL_ORDER[Math.min(stage, MINERAL_ORDER.length - 1)];

export const mineralForCount = (count: number): BlobVariant | null =>
  count > 0 ? mineralForStage(count - 1) : null;

export const EARNABLE_MINERALS = MINERAL_ORDER.slice(0, MAX_SOLVES);
export const INITIAL_UNLOCKED_QUIZZES =
  DIAMOND_QUIZ_GROUPS[0]?.quizIndexes.length ?? 0;
export const MAX_DIAMOND_COUNT = DIAMOND_QUIZ_GROUPS.length;

export const startedQuizCount = (counts: number[]) =>
  counts.filter((count) => count > 0).length;

export function getDiamondQuizIndexes(diamondIndex: number) {
  if (!Number.isInteger(diamondIndex) || diamondIndex < 0) return [];
  return DIAMOND_QUIZ_GROUPS[diamondIndex]?.quizIndexes ?? [];
}

export function getRubyCountForDiamondBatch(counts: number[], diamondIndex: number) {
  return getDiamondQuizIndexes(diamondIndex).filter(
    (quizIndex) => mineralForCount(counts[quizIndex] ?? 0) === "ruby",
  ).length;
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

  const completedGroups = DIAMOND_QUIZ_GROUPS.filter((group) =>
    participants.every(
      (studentName) =>
        getRubyCountForDiamondBatch(progress[studentName] ?? [], group.diamondIndex) ===
        group.quizIndexes.length,
    ),
  );
  const nextGroup = DIAMOND_QUIZ_GROUPS.find(
    (group) => !completedGroups.includes(group),
  );
  const currentRubyCounts = nextGroup
    ? participants.map((studentName) =>
        getRubyCountForDiamondBatch(progress[studentName] ?? [], nextGroup.diamondIndex),
      )
    : [];

  return {
    diamondCount: completedGroups.length,
    participantCount,
    nextDiamondIndex: nextGroup?.diamondIndex ?? null,
    readyStudentCount: nextGroup
      ? currentRubyCounts.filter((rubyCount) => rubyCount === nextGroup.quizIndexes.length)
          .length
      : participantCount,
    currentRubyCount: currentRubyCounts.reduce((sum, rubyCount) => sum + rubyCount, 0),
    currentRubyTarget: nextGroup ? participantCount * nextGroup.quizIndexes.length : 0,
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

  Array.from({ length: MAX_QUIZ_COUNT }, (_, quizIndex) => {
    const mineral = mineralForCount(counts[quizIndex] ?? 0);
    if (mineral === "ruby") {
      rubyQuizIndexes.push(quizIndex);
      return;
    }
    if (mineral) totals[mineral] += 1;
  });

  const rubyQuizIndexSet = new Set(rubyQuizIndexes);
  const diamondGroups = DIAMOND_QUIZ_GROUPS.filter(
    (group) =>
      group.diamondIndex < maxDiamondCount &&
      group.quizIndexes.every((quizIndex) => rubyQuizIndexSet.has(quizIndex)),
  );
  const consumedRubyQuizIndexes = new Set(
    diamondGroups.flatMap(({ quizIndexes }) => quizIndexes),
  );

  totals.ruby = rubyQuizIndexes.filter(
    (quizIndex) => !consumedRubyQuizIndexes.has(quizIndex),
  ).length;
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
  const visibleGroups = DIAMOND_QUIZ_GROUPS.filter(
    ({ diamondIndex }) => diamondIndex < maxDiamondCount,
  );
  let unlockedCount = 0;

  for (const group of visibleGroups) {
    unlockedCount += group.quizIndexes.length;
    if (getRubyCountForDiamondBatch(counts, group.diamondIndex) < group.quizIndexes.length) {
      break;
    }
  }

  return Math.min(MAX_QUIZ_COUNT, unlockedCount);
}
