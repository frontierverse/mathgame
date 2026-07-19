import { curriculum } from "../mathLogic";

const QUIZ_STORAGE_CAPACITY = 100;
export const QUIZZES_PER_ROUND = 10;

export type CurriculumSubunitContext = {
  subunitId: string;
  gradeId: string;
  gradeLabel: string;
  semesterId: string;
  semesterLabel: string;
  unitId: string;
  unitTitle: string;
  subunitTitle: string;
};

export type CurriculumQuiz = CurriculumSubunitContext & {
  id: string;
  quizIndex: number;
  globalNumber: number;
  numberInSubunit: number;
  question: string;
  answer: string | null;
};

export type CurriculumQuizSet = CurriculumSubunitContext & {
  startIndex: number;
  quizzes: readonly CurriculumQuiz[];
};

export type CurriculumQuizRound = {
  id: string;
  roundNumber: number;
  quizzes: readonly CurriculumQuiz[];
  quizIndexes: readonly number[];
  gradeLabel: string;
  semesterLabel: string;
  unitTitle: string;
  subunitTitle: string;
};

type QuizSetDefinition = {
  subunitId: string;
  startIndex: number;
  questions: readonly string[];
};

const subunitContexts = new Map<string, CurriculumSubunitContext>();

curriculum.forEach((grade) => {
  grade.semesters.forEach((semester) => {
    semester.units.forEach((unit) => {
      unit.subunits.forEach((subunitTitle, subunitIndex) => {
        const subunitId = `${unit.id}-su${subunitIndex + 1}`;
        subunitContexts.set(subunitId, {
          subunitId,
          gradeId: grade.id,
          gradeLabel: grade.label,
          semesterId: semester.id,
          semesterLabel: semester.label,
          unitId: unit.id,
          unitTitle: unit.title,
          subunitTitle,
        });
      });
    });
  });
});

const quizSetDefinitions: readonly QuizSetDefinition[] = [
  {
    subunitId: "m1-s1-u1-su1",
    startIndex: 0,
    questions: [
      "사람들은 왜 숫자를 만들었을까?",
      "곱셈은 왜 만들어졌을까?",
      "10 + 10 + 10 + 10을 곱셈으로 표현하면?",
      "2x3을 더하기로 변경하면?",
      "3x2를 더하기로 변경하면?",
      "2^4를 곱셈으로 나타내라.",
      "2^4의 값을 구하라.",
      "약수의 뜻을 설명하라.",
      "배수의 뜻을 설명하라.",
      "24의 약수를 모두 쓰라.",
      "7의 배수를 작은 수부터 5개 쓰라.",
      "소수의 뜻을 설명하라.",
      "합성수의 뜻을 설명하라.",
      "1이 소수도 합성수도 아닌 이유를 설명하라.",
      "1부터 20까지의 소수를 모두 쓰라.",
      "1부터 20까지의 합성수를 모두 쓰라.",
      "2, 3, 5, 7, 11 중 짝수인 소수를 찾으라.",
      "가장 작은 소수를 쓰라.",
      "가장 작은 합성수를 쓰라.",
      "29가 소수인 이유를 설명하라.",
      "51이 합성수인 이유를 설명하라.",
      "57이 합성수인 이유를 설명하라.",
      "91이 합성수인 이유를 설명하라.",
      "2의 배수 판별법을 설명하라.",
      "3의 배수 판별법을 설명하라.",
      "5의 배수 판별법을 설명하라.",
      "9의 배수 판별법을 설명하라.",
      "1부터 100까지의 소수를 찾을 때, 어떤 수들의 배수를 지우면 되는지 설명하라.",
      "37이 소수인지 판별하라.",
      "49가 합성수인 이유를 설명하라.",
      "77이 합성수인 이유를 설명하라.",
    ],
  },
  {
    subunitId: "m1-s1-u1-su2",
    startIndex: 31,
    questions: [
      "소인수분해의 뜻을 설명하라.",
      "12를 소수의 곱으로 나타내라.",
      "2 × 2 × 3을 거듭제곱을 사용하여 나타내라.",
      "18을 소인수분해하라.",
      "24를 소인수분해하라.",
      "36을 소인수분해하라.",
      "45를 소인수분해하라.",
      "60을 소인수분해하라.",
      "72를 소인수분해하라.",
      "84를 소인수분해하라.",
      "90을 소인수분해하라.",
      "2 × 2 × 2 × 3을 거듭제곱을 사용하여 나타내라.",
      "2 × 2 × 3 × 3 × 3을 거듭제곱을 사용하여 나타내라.",
      "5 × 5 × 7을 거듭제곱을 사용하여 나타내라.",
      "2^3 × 3을 실제 곱셈으로 나타내라.",
      "2^3 × 3의 값을 구하라.",
      "2^2 × 3^2을 실제 곱셈으로 나타내라.",
      "2^2 × 3^2의 값을 구하라.",
      "2^2 × 5^2을 실제 곱셈으로 나타내라.",
      "2^2 × 5^2의 값을 구하라.",
      "2^3 × 3^2의 값을 구하라.",
      "2^2 × 3 × 5의 값을 구하라.",
      "2^4 × 5의 값을 구하라.",
      "24 = 2 × 12는 올바른 소인수분해인가?",
      "36 = 2^2 × 3^2은 올바른 소인수분해인가?",
      "45 = 3 × 15는 올바른 소인수분해인가?",
      "70 = 2 × 5 × 7은 올바른 소인수분해인가?",
      "24와 36의 최대공약수를 구하라.",
      "24와 36의 최소공배수를 구하라.",
      "100을 소인수분해하라.",
    ],
  },
];

// Add answers here as they are supplied. Quiz numbers use zero-based indexes.
const quizAnswersByIndex: Readonly<Partial<Record<number, string>>> = {};

function requireSubunitContext(subunitId: string) {
  const context = subunitContexts.get(subunitId);
  if (!context) throw new Error(`Unknown curriculum subunit: ${subunitId}`);
  return context;
}

function requireAtomicQuestion(question: string, subunitId: string, questionIndex: number) {
  const sentenceEndCount = question.match(/[.!?]/g)?.length ?? 0;
  const containsNumberedParts = /\(\d+\)/.test(question);
  const containsBundledInstruction = question.includes("각각");

  if (sentenceEndCount !== 1 || containsNumberedParts || containsBundledInstruction) {
    throw new Error(
      `Quiz must contain one short task: ${subunitId} question ${questionIndex + 1}`,
    );
  }
}

export const CURRICULUM_QUIZ_SETS: readonly CurriculumQuizSet[] =
  quizSetDefinitions.map((definition) => {
    const context = requireSubunitContext(definition.subunitId);
    const quizzes = definition.questions.map((question, questionIndex) => {
      requireAtomicQuestion(question, definition.subunitId, questionIndex);
      const quizIndex = definition.startIndex + questionIndex;
      return {
        ...context,
        id: `${definition.subunitId}-q${questionIndex + 1}`,
        quizIndex,
        globalNumber: quizIndex + 1,
        numberInSubunit: questionIndex + 1,
        question,
        answer: quizAnswersByIndex[quizIndex] ?? null,
      } satisfies CurriculumQuiz;
    });

    return {
      ...context,
      startIndex: definition.startIndex,
      quizzes,
    } satisfies CurriculumQuizSet;
  });

const quizSetsBySubunitId = new Map(
  CURRICULUM_QUIZ_SETS.map((quizSet) => [quizSet.subunitId, quizSet]),
);
const quizzesByIndex = new Map<number, CurriculumQuiz>();

CURRICULUM_QUIZ_SETS.forEach((quizSet) => {
  quizSet.quizzes.forEach((quiz) => {
    if (quiz.quizIndex < 0 || quiz.quizIndex >= QUIZ_STORAGE_CAPACITY) {
      throw new Error(`Quiz index is outside the supported range: ${quiz.quizIndex}`);
    }
    if (quizzesByIndex.has(quiz.quizIndex)) {
      throw new Error(`Duplicate quiz index: ${quiz.quizIndex}`);
    }
    quizzesByIndex.set(quiz.quizIndex, quiz);
  });
});

export const REGISTERED_QUIZ_COUNT = quizzesByIndex.size;
export const MAX_QUIZ_COUNT = REGISTERED_QUIZ_COUNT;

for (let quizIndex = 0; quizIndex < MAX_QUIZ_COUNT; quizIndex += 1) {
  if (!quizzesByIndex.has(quizIndex)) {
    throw new Error(`Missing quiz index: ${quizIndex}`);
  }
}

export const QUIZZES = Array.from(
  { length: MAX_QUIZ_COUNT },
  (_, quizIndex) => quizzesByIndex.get(quizIndex)?.question ?? String(quizIndex + 1),
);

export const getQuizForIndex = (quizIndex: number) => quizzesByIndex.get(quizIndex) ?? null;

export const getQuizSetForSubunit = (subunitId: string) =>
  quizSetsBySubunitId.get(subunitId) ?? null;

export const quizTextForIndex = (quizIndex: number) =>
  getQuizForIndex(quizIndex)?.question ?? String(quizIndex + 1);

export const quizAnswerForIndex = (quizIndex: number) =>
  getQuizForIndex(quizIndex)?.answer ?? null;

function joinUniqueLabels(labels: readonly string[]) {
  return Array.from(new Set(labels)).join(" · ");
}

export const CURRICULUM_QUIZ_ROUNDS: readonly CurriculumQuizRound[] = Array.from(
  { length: Math.ceil(MAX_QUIZ_COUNT / QUIZZES_PER_ROUND) },
  (_, roundIndex) => {
    const startIndex = roundIndex * QUIZZES_PER_ROUND;
    const quizzes = Array.from(
      { length: Math.min(QUIZZES_PER_ROUND, MAX_QUIZ_COUNT - startIndex) },
      (__, offset) => quizzesByIndex.get(startIndex + offset),
    ).filter((quiz): quiz is CurriculumQuiz => quiz !== undefined);

    return {
      id: `round-${roundIndex + 1}`,
      roundNumber: roundIndex + 1,
      quizzes,
      quizIndexes: quizzes.map(({ quizIndex }) => quizIndex),
      gradeLabel: joinUniqueLabels(quizzes.map(({ gradeLabel }) => gradeLabel)),
      semesterLabel: joinUniqueLabels(quizzes.map(({ semesterLabel }) => semesterLabel)),
      unitTitle: joinUniqueLabels(quizzes.map(({ unitTitle }) => unitTitle)),
      subunitTitle: joinUniqueLabels(quizzes.map(({ subunitTitle }) => subunitTitle)),
    } satisfies CurriculumQuizRound;
  },
);

const quizRoundsById = new Map(
  CURRICULUM_QUIZ_ROUNDS.map((round) => [round.id, round]),
);

export const getQuizRoundById = (roundId: string) => quizRoundsById.get(roundId) ?? null;

const LEGACY_QUIZ_INDEX_MAP: readonly (readonly number[])[] = [
  [0],
  [1, 3],
  [4, 5, 6],
  [7, 8, 9, 10],
  [11, 12, 13],
  [14, 15],
  [16, 17, 18],
  [19, 20, 21, 22],
  [23, 24, 25, 26],
  [27],
  [31, 32, 33],
  [34, 35],
  [36, 37],
  [38, 39],
  [40, 41],
  [42, 43, 44],
  [45, 46, 47, 48, 49, 50],
  [51, 52, 53],
  [35, 37, 54, 55, 56, 57],
  [35, 36, 58, 59],
];

export function migrateLegacyQuizCounts(legacyCounts: readonly number[]) {
  const migratedCounts = Array.from({ length: MAX_QUIZ_COUNT }, () => 0);

  LEGACY_QUIZ_INDEX_MAP.forEach((newIndexes, legacyIndex) => {
    const solveCount = legacyCounts[legacyIndex] ?? 0;
    newIndexes.forEach((newIndex) => {
      migratedCounts[newIndex] = Math.max(migratedCounts[newIndex], solveCount);
    });
  });

  return migratedCounts;
}
