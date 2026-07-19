import { curriculum } from "../mathLogic";
import {
  classifyNumericQuiz,
  type NumericQuizVariant,
  type QuizNumberPolicy,
} from "./numericQuizRuleCompiler";

const QUIZ_STORAGE_CAPACITY = 100;

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
  numericVariant: NumericQuizVariant;
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

type QuizQuestionDefinition =
  | string
  | {
      question: string;
      numberPolicy: QuizNumberPolicy;
    };

type QuizSetDefinition = {
  subunitId: string;
  startIndex: number;
  questions: readonly QuizQuestionDefinition[];
};

function fixedNumberQuestion(question: string, reason: string) {
  return {
    question,
    numberPolicy: { mode: "fixed", reason },
  } satisfies Exclude<QuizQuestionDefinition, string>;
}

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
    // Numeric strings use a registered random rule automatically. Use
    // fixedNumberQuestion only when the written number is the concept itself.
    questions: [
      "사람들은 왜 숫자를 만들었을까?",
      "곱셈은 왜 만들어졌을까?",
      fixedNumberQuestion("10 + 10 + 10 + 10을 곱셈으로 표현하면?", "제시한 식의 곱셈 표현을 묻는 문항"),
      fixedNumberQuestion("2x3을 더하기로 변경하면?", "제시한 곱셈식의 덧셈 표현을 묻는 문항"),
      fixedNumberQuestion("3x2를 더하기로 변경하면?", "제시한 곱셈식의 덧셈 표현을 묻는 문항"),
      "나누기의 뜻은?",
      fixedNumberQuestion("9 나누기 3은 3(나눗셈식)의 의미를 예를 들어 말할수있나요?", "제시한 나눗셈식의 의미를 묻는 문항"),
      fixedNumberQuestion("9 나누기 0은 무엇인가요?", "0으로 나누기를 묻는 개념 문항"),
      fixedNumberQuestion("0 나누기 11은?", "0을 나누는 계산을 묻는 문항"),
      "나누어 떨어지다가 무슨 뜻인가요?",
      "약수의 뜻은 뭔가요?",
      fixedNumberQuestion("6의 약수는?", "6의 약수를 묻는 문항"),
      "소수는 무엇인가요?",
      fixedNumberQuestion("1은 소수인가요?", "1의 소수 여부를 묻는 개념 문항"),
      "합성수는 무엇인가요?",
      "3은 소수인가요? 합성수인가요?",
      "10은 소수인가요? 합성수인가요?",
    ],
  },
  {
    subunitId: "m1-s1-u1-su2",
    startIndex: 17,
    questions: [
      "제곱은 왜 사용하나요?",
      "2의 3제곱을 곱셈식으로 변경해보세요.",
      "2의 4제곱은 몇인가요?",
      "6을 소인수분해 해보세요.",
      "50을 소인수분해 해보세요.",
    ],
  },
];

// Answers use zero-based quiz indexes.
const quizAnswersByIndex: Readonly<Partial<Record<number, string>>> = {
  0: "개수를 빠르게 세기위해서",
  1: '"같은 수"들의 덧셈을 빠르게 하기 위해서',
  2: "10 x 4",
  3: "2 + 2 + 2 아니면 3 + 3",
  4: "3 + 3 아니면 2 + 2 + 2",
  5: "공평하게 주다.",
  6: "사과 9개를 사람 3명에게 공평하게 줘서 1명당 3개씩 받았다.",
  7: "풀 수 없다.",
  8: "0",
  9: "나눗셈을 했을때 나머지가 0인 경우.",
  10: "어떤 수를 나누었을때 나누어떨어지는 수",
  11: "1, 2, 3, 6",
  12: '1과 자기자신만을 "약수"로 가지는 수',
  13: "1은 1만 약수로 가지기 때문에 아니다.",
  14: "1보다 크고 소수가 아닌 수 (약수가 3개 이상인 수)",
  15: "소수",
  16: "합성수",
};

function requireSubunitContext(subunitId: string) {
  const context = subunitContexts.get(subunitId);
  if (!context) throw new Error(`Unknown curriculum subunit: ${subunitId}`);
  return context;
}

function requireAtomicQuestion(question: string, subunitId: string, questionIndex: number) {
  const sentenceEndCount = question.match(/[.!?]/g)?.length ?? 0;
  const containsNumberedParts = /\(\d+\)/.test(question);
  const containsBundledInstruction = question.includes("각각");
  const isTwoChoiceQuestion = /소수인가요\? 합성수인가요\?$/.test(question);

  if (
    (sentenceEndCount !== 1 && !isTwoChoiceQuestion) ||
    containsNumberedParts ||
    containsBundledInstruction
  ) {
    throw new Error(
      `Quiz must contain one short task: ${subunitId} question ${questionIndex + 1}`,
    );
  }
}

export const CURRICULUM_QUIZ_SETS: readonly CurriculumQuizSet[] =
  quizSetDefinitions.map((definition) => {
    const context = requireSubunitContext(definition.subunitId);
    const quizzes = definition.questions.map((questionDefinition, questionIndex) => {
      const question =
        typeof questionDefinition === "string"
          ? questionDefinition
          : questionDefinition.question;
      const numberPolicy =
        typeof questionDefinition === "string"
          ? ({ mode: "auto" } as const)
          : questionDefinition.numberPolicy;
      const quizIndex = definition.startIndex + questionIndex;
      requireAtomicQuestion(question, definition.subunitId, questionIndex);
      const numericVariant = classifyNumericQuiz(
        question,
        numberPolicy,
        `${definition.subunitId} question ${questionIndex + 1} (quiz index ${quizIndex})`,
      );
      return {
        ...context,
        id: `${definition.subunitId}-q${questionIndex + 1}`,
        quizIndex,
        globalNumber: quizIndex + 1,
        numberInSubunit: questionIndex + 1,
        question,
        answer: quizAnswersByIndex[quizIndex] ?? null,
        numericVariant,
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

export const CURRICULUM_QUIZ_ROUNDS: readonly CurriculumQuizRound[] =
  CURRICULUM_QUIZ_SETS.filter(({ quizzes }) => quizzes.length > 0).map(
    (quizSet, roundIndex) => ({
      id: `round-${quizSet.subunitId}`,
      roundNumber: roundIndex + 1,
      quizzes: quizSet.quizzes,
      quizIndexes: quizSet.quizzes.map(({ quizIndex }) => quizIndex),
      gradeLabel: quizSet.gradeLabel,
      semesterLabel: quizSet.semesterLabel,
      unitTitle: quizSet.unitTitle,
      subunitTitle: quizSet.subunitTitle,
    }),
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
  [19, 20, 21],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
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
