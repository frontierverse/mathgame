import { MAX_QUIZ_COUNT, MAX_SOLVES } from "./quizData";
import type { QuizProgress } from "./quizProgress";

export const RANDOM_QUIZ_QUEUE_STORAGE_KEY = "math-space-random-quiz-queue-v5";
export const PREVIOUS_RANDOM_QUIZ_QUEUE_STORAGE_KEY =
  "math-space-random-quiz-queue-v4";
export const RESET_RANDOM_QUIZ_QUEUE_STORAGE_KEYS = [
  "math-space-random-quiz-queue-v3",
  "math-space-random-quiz-queue-v2",
  "math-space-random-quiz-queue-v1",
] as const;

export type RandomQuizRoundQueueState = {
  order: number[];
  pendingByQuiz: Record<string, string>;
  lastSolverByQuiz: Record<string, string>;
  variantSeedByQuiz: Record<string, number>;
  lastVariantSeedByQuiz: Record<string, number>;
};

export type RandomQuizQueueState = {
  version: 4;
  rounds: Record<string, RandomQuizRoundQueueState>;
};

export type RandomQuizParticipant = {
  name: string;
  originalIndex: number;
};

export const EMPTY_RANDOM_QUIZ_QUEUE_STATE: RandomQuizQueueState = {
  version: 4,
  rounds: {},
};

export const EMPTY_RANDOM_QUIZ_ROUND_QUEUE_STATE: RandomQuizRoundQueueState = {
  order: [],
  pendingByQuiz: {},
  lastSolverByQuiz: {},
  variantSeedByQuiz: {},
  lastVariantSeedByQuiz: {},
};

function normalizeNameMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([rawQuizIndex, studentName]) => {
      const quizIndex = Number(rawQuizIndex);
      return (
        Number.isInteger(quizIndex) &&
        quizIndex >= 0 &&
        quizIndex < MAX_QUIZ_COUNT &&
        typeof studentName === "string" &&
        studentName.length > 0
      );
    }),
  );
}

function normalizeVariantSeedMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([rawQuizIndex, variantSeed]) => {
      const quizIndex = Number(rawQuizIndex);
      return (
        Number.isInteger(quizIndex) &&
        quizIndex >= 0 &&
        quizIndex < MAX_QUIZ_COUNT &&
        typeof variantSeed === "number" &&
        Number.isInteger(variantSeed) &&
        variantSeed >= 0 &&
        variantSeed <= 0xffff_ffff
      );
    }),
  );
}

export function normalizeRandomQuizQueueState(value: unknown): RandomQuizQueueState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_RANDOM_QUIZ_QUEUE_STATE;
  }

  const rawState = value as { rounds?: unknown };
  if (!rawState.rounds || typeof rawState.rounds !== "object" || Array.isArray(rawState.rounds)) {
    return EMPTY_RANDOM_QUIZ_QUEUE_STATE;
  }

  const rounds: Record<string, RandomQuizRoundQueueState> = {};
  Object.entries(rawState.rounds).forEach(([roundId, rawRound]) => {
    if (!roundId || !rawRound || typeof rawRound !== "object" || Array.isArray(rawRound)) {
      return;
    }

    const round = rawRound as Partial<RandomQuizRoundQueueState>;
    const seenQuizIndexes = new Set<number>();
    const order = Array.isArray(round.order)
      ? round.order.filter((quizIndex): quizIndex is number => {
          if (
            !Number.isInteger(quizIndex) ||
            quizIndex < 0 ||
            quizIndex >= MAX_QUIZ_COUNT ||
            seenQuizIndexes.has(quizIndex)
          ) {
            return false;
          }
          seenQuizIndexes.add(quizIndex);
          return true;
        })
      : [];

    rounds[roundId] = {
      order,
      pendingByQuiz: normalizeNameMap(round.pendingByQuiz),
      lastSolverByQuiz: normalizeNameMap(round.lastSolverByQuiz),
      variantSeedByQuiz: normalizeVariantSeedMap(round.variantSeedByQuiz),
      lastVariantSeedByQuiz: normalizeVariantSeedMap(round.lastVariantSeedByQuiz),
    };
  });

  return {
    version: 4,
    rounds,
  };
}

export function clearRandomQuizRoundQueue(
  state: RandomQuizQueueState,
  roundId: string,
): RandomQuizQueueState {
  if (!state.rounds[roundId]) return state;

  const remainingRounds = { ...state.rounds };
  delete remainingRounds[roundId];
  return {
    version: 4,
    rounds: remainingRounds,
  };
}

export function getRandomQuizRoundQueue(
  state: RandomQuizQueueState,
  roundId: string,
): RandomQuizRoundQueueState {
  return state.rounds[roundId] ?? EMPTY_RANDOM_QUIZ_ROUND_QUEUE_STATE;
}

export function reconcileQuizOrder(
  currentOrder: readonly number[],
  activeQuizIndexes: readonly number[],
) {
  const activeQuizIndexSet = new Set(activeQuizIndexes);
  const seenQuizIndexes = new Set<number>();
  const nextOrder = currentOrder.filter((quizIndex) => {
    if (!activeQuizIndexSet.has(quizIndex) || seenQuizIndexes.has(quizIndex)) return false;
    seenQuizIndexes.add(quizIndex);
    return true;
  });

  activeQuizIndexes.forEach((quizIndex) => {
    if (seenQuizIndexes.has(quizIndex)) return;
    seenQuizIndexes.add(quizIndex);
    nextOrder.push(quizIndex);
  });

  return nextOrder;
}

export function canStudentSolveQuiz(
  progress: QuizProgress,
  studentName: string,
  quizIndex: number,
) {
  return (progress[studentName]?.[quizIndex] ?? 0) < MAX_SOLVES;
}

function totalSolveCount(progress: QuizProgress, studentName: string) {
  return (progress[studentName] ?? []).reduce(
    (sum, count) => sum + (Number.isInteger(count) ? Math.max(0, count) : 0),
    0,
  );
}

function randomIndex(length: number) {
  if (length <= 1) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] % length;
  }
  return Math.floor(Math.random() * length);
}

export function pickRandomQuizParticipant({
  quizIndex,
  participants,
  progress,
  pendingByQuiz,
  lastSolverName,
}: {
  quizIndex: number;
  participants: readonly RandomQuizParticipant[];
  progress: QuizProgress;
  pendingByQuiz: Readonly<Record<string, string>>;
  lastSolverName?: string;
}) {
  let candidates = participants.filter(({ name }) =>
    canStudentSolveQuiz(progress, name, quizIndex),
  );
  if (candidates.length === 0) return null;

  if (lastSolverName) {
    const otherStudents = candidates.filter(({ name }) => name !== lastSolverName);
    if (otherStudents.length > 0) candidates = otherStudents;
  }

  const lowestQuizCount = Math.min(
    ...candidates.map(({ name }) => progress[name]?.[quizIndex] ?? 0),
  );
  candidates = candidates.filter(
    ({ name }) => (progress[name]?.[quizIndex] ?? 0) === lowestQuizCount,
  );

  const pendingCountByStudent = new Map<string, number>();
  Object.values(pendingByQuiz).forEach((studentName) => {
    pendingCountByStudent.set(
      studentName,
      (pendingCountByStudent.get(studentName) ?? 0) + 1,
    );
  });
  const lowestWorkload = Math.min(
    ...candidates.map(
      ({ name }) => totalSolveCount(progress, name) + (pendingCountByStudent.get(name) ?? 0),
    ),
  );
  candidates = candidates.filter(
    ({ name }) =>
      totalSolveCount(progress, name) + (pendingCountByStudent.get(name) ?? 0) ===
      lowestWorkload,
  );

  return candidates[randomIndex(candidates.length)] ?? null;
}
