import { curriculum } from "../mathLogic";
import {
  classifyNumericQuiz,
  type NumericQuizVariant,
  type QuizNumberPolicy,
} from "./numericQuizRuleCompiler";

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
  curriculumLabel: string;
};

type QuizQuestionDefinition =
  | string
  | {
      question: string;
      numberPolicy: QuizNumberPolicy;
      allowCombinedTasks?: boolean;
    };

type QuizSetDefinition = {
  subunitId: string;
  startIndex: number;
  questions: readonly QuizQuestionDefinition[];
};

function fixedNumberQuestion(
  question: string,
  reason: string,
  options: { allowCombinedTasks?: boolean } = {},
) {
  return {
    question,
    numberPolicy: { mode: "fixed", reason },
    ...options,
  } satisfies Exclude<QuizQuestionDefinition, string>;
}

const SPELLED_OUT_POWER_PATTERN = /\d+\s*의\s*\d+\s*제곱/;

function requireSymbolicMathNotation(value: string, context: string) {
  if (SPELLED_OUT_POWER_PATTERN.test(value)) {
    throw new Error(
      `${context}: write powers with caret notation such as 2^4, not Korean prose: ${value}`,
    );
  }
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
      "2^3을 곱셈식으로 변경해 보세요.",
      "2^4은 몇인가요?",
      "6을 소인수분해 해보세요.",
      "50을 소인수분해 해보세요.",
    ],
  },
  {
    subunitId: "m1-s1-u1-su3",
    startIndex: 22,
    questions: [
      "약수가 무엇인가요?",
      fixedNumberQuestion(
        "12와 16의 약수들을 각각 나열하세요.",
        "두 수의 약수를 각각 나열하는 고정 문항",
        { allowCombinedTasks: true },
      ),
      fixedNumberQuestion(
        "12와 16의 공약수들은 무엇인가요? 공약수는 무슨 뜻인가요?",
        "공약수의 뜻과 제시한 두 수의 공약수를 함께 묻는 고정 문항",
        { allowCombinedTasks: true },
      ),
      fixedNumberQuestion(
        "12와 16의 최대공약수는 무엇인가요? 최대공약수는 무슨 뜻인가요?",
        "제시한 두 수의 최대공약수와 그 뜻을 함께 묻는 고정 문항",
        { allowCombinedTasks: true },
      ),
      fixedNumberQuestion(
        "3의 배수를 4개 나열해보세요. 4의 배수를 4개 나열해보세요.",
        "제시한 두 수의 배수를 각각 나열하는 고정 문항",
        { allowCombinedTasks: true },
      ),
      "배수는 무슨 뜻인가요?",
      fixedNumberQuestion(
        "3과 4의 공배수들은 무엇인가요?",
        "제시한 두 수의 공배수를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "3과 4의 최소공배수는 무엇인가요?",
        "제시한 두 수의 최소공배수를 묻는 고정 문항",
      ),
      "최소공배수가 무엇인가요?",
      fixedNumberQuestion(
        "2와 4의 최대공약수와 최소공배수는 무엇인가요?",
        "제시한 두 수의 최대공약수와 최소공배수를 묻는 문항",
      ),
      fixedNumberQuestion(
        "8과 9의 최대공약수와 최소공배수는 무엇인가요? 왜 최소공약수는 배우지 않을까요? 왜 최대공배수는 배우지 않을까요?",
        "최대공약수와 최소공배수, 최소공약수와 최대공배수의 성질을 함께 묻는 고정 문항",
        { allowCombinedTasks: true },
      ),
    ],
  },
  {
    subunitId: "m1-s1-u2-su1",
    startIndex: 33,
    questions: [
      "양수는 무엇인가요?",
      "음수는 무엇인가요?",
      fixedNumberQuestion(
        "0은 양수·음수 중 어느 쪽인가요?",
        "0의 분류를 묻는 고정 문항",
      ),
      "정수는 무엇인가요?",
      fixedNumberQuestion(
        "-4, 0, 7/2 중 정수가 아닌 수는 무엇인가요?",
        "정수와 분수를 구별하는 고정 문항",
      ),
      "유리수는 무엇인가요?",
      fixedNumberQuestion(
        "-3, 0, 2/5 중 유리수가 아닌 수는 무엇인가요?",
        "정수와 분수가 모두 유리수임을 확인하는 고정 문항",
      ),
      fixedNumberQuestion(
        "수직선에서 -4는 0의 어느 쪽에 있나요?",
        "수직선에서 음수의 위치를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "-4와 2 중 큰 수는 무엇인가요?",
        "음수와 양수의 대소를 비교하는 고정 문항",
      ),
      fixedNumberQuestion(
        "-3과 -8 중 큰 수는 무엇인가요?",
        "두 음수의 대소를 비교하는 고정 문항",
      ),
      fixedNumberQuestion(
        "-2, 0, 3을 작은 수부터 나열하세요.",
        "정수의 대소를 나열하는 고정 문항",
      ),
      "절댓값은 무엇인가요?",
      fixedNumberQuestion(
        "|-5|은 무엇인가요?",
        "음수의 절댓값을 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "|3|와 |-3|은 같나요?",
        "서로 반대인 수의 절댓값을 비교하는 고정 문항",
      ),
      "반대되는 수는 무엇인가요?",
      fixedNumberQuestion(
        "3의 반대되는 수는 무엇인가요?",
        "양수의 반대되는 수를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "-7의 반대되는 수는 무엇인가요?",
        "음수의 반대되는 수를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "0의 반대되는 수는 무엇인가요?",
        "0의 반대되는 수를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "-2는 정수인가요?",
        "음수의 정수 여부를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "3/4은 정수인가요?",
        "분수의 정수 여부를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "-5/2는 유리수인가요?",
        "음의 분수의 유리수 여부를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "2와 5/2 중 큰 수는?",
        "정수와 양의 분수를 비교하는 고정 문항",
      ),
      fixedNumberQuestion(
        "-1/2와 -3/4 중 큰 수는?",
        "두 음의 분수를 비교하는 고정 문항",
      ),
      fixedNumberQuestion(
        "-1, 2/3, 0을 작은 수부터 나열하세요.",
        "정수와 분수의 대소를 나열하는 고정 문항",
      ),
      fixedNumberQuestion(
        "|-7/3|은?",
        "음의 분수의 절댓값을 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "2/5의 반대되는 수는?",
        "양의 분수의 반대되는 수를 묻는 고정 문항",
      ),
      fixedNumberQuestion(
        "-9/4의 반대되는 수는?",
        "음의 분수의 반대되는 수를 묻는 고정 문항",
      ),
    ],
  },
  {
    subunitId: "m1-s1-u2-su2",
    startIndex: 60,
    questions: [
      "-7 + 3을 계산하세요.",
      "-5 + -6을 계산하세요.",
      "8 - 13을 계산하세요.",
      "-4 - 7을 계산하세요.",
      "-9 - -5을 계산하세요.",
      "2/3 + 1/6을 계산하세요.",
      "-3/4 + 1/2을 계산하세요.",
      "5/6 - 1/3을 계산하세요.",
      "-2/5 - 3/10을 계산하세요.",
      "-3/4 - -1/2을 계산하세요.",
    ],
  },
  {
    subunitId: "m1-s1-u2-su3",
    startIndex: 70,
    questions: [
      "-6 × 4을 계산하세요.",
      "-5 × -3을 계산하세요.",
      "18 ÷ -6을 계산하세요.",
      "-20 ÷ 5을 계산하세요.",
      "-24 ÷ -6을 계산하세요.",
      "2/3 × 3/5을 계산하세요.",
      "-3/4 × 2/3을 계산하세요.",
      "5/6 ÷ 1/3을 계산하세요.",
      "-3/5 ÷ 9/10을 계산하세요.",
      "-7/8 ÷ -7/4을 계산하세요.",
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
  17: "같은 수의 곱셈을 빠르게 나타내기 위해서. 예: 2x2x2x2 = 2^4",
  18: "2x2x2",
  19: "16",
  20: "6 = 2 x 3",
  21: "50 = 2 x 5^2",
  22: "어떤 수를 나누어떨어지게 하는 수",
  23: "12의 약수: 1, 2, 3, 4, 6, 12 / 16의 약수: 1, 2, 4, 8, 16",
  24: "12와 16의 공약수는 1, 2, 4입니다. 공약수는 두 수 이상의 공통인 약수입니다.",
  25: "12와 16의 최대공약수는 4입니다. 최대공약수는 공약수 중 가장 큰 수입니다.",
  26: "3의 배수: 3, 6, 9, 12 / 4의 배수: 4, 8, 12, 16",
  27: "어떤 수를 1배, 2배, 3배, … 한 수입니다.",
  28: "12, 24, 36, …",
  29: "12",
  30: "공배수 중 가장 작은 수",
  31: "최대공약수 2, 최소공배수 4",
  32: "최대공약수 1, 최소공배수 72. 최소공약수는 항상 1이라 따로 구할 필요가 없습니다. 공배수는 끝없이 커지므로 최대공배수는 없습니다.",
  33: "0보다 큰 수입니다. + 기호는 생략할 수 있습니다.",
  34: "0보다 작은 수입니다. 앞에 - 기호를 붙입니다.",
  35: "둘 다 아닙니다.",
  36: "양의 정수, 0, 음의 정수를 모두 포함하는 수입니다.",
  37: "7/2",
  38: "분모가 0이 아닌 두 정수의 비로 나타낼 수 있는 수입니다. 정수도 유리수입니다.",
  39: "없습니다. 모두 유리수입니다.",
  40: "왼쪽입니다. 왼쪽에 있을수록 더 작은 수입니다.",
  41: "2",
  42: "-3",
  43: "-2 < 0 < 3",
  44: "수직선에서 0까지의 거리입니다.",
  45: "5",
  46: "네. 둘 다 3입니다.",
  47: "어떤 수와 더해서 0이 되는 수입니다.",
  48: "-3",
  49: "7",
  50: "0",
  51: "네.",
  52: "아니요.",
  53: "네.",
  54: "5/2",
  55: "-1/2",
  56: "-1 < 0 < 2/3",
  57: "7/3",
  58: "-2/5",
  59: "9/4",
  60: "-4",
  61: "-11",
  62: "-5",
  63: "-11",
  64: "-4",
  65: "5/6",
  66: "-1/4",
  67: "1/2",
  68: "-7/10",
  69: "-1/4",
  70: "-24",
  71: "15",
  72: "-3",
  73: "-4",
  74: "4",
  75: "2/5",
  76: "-1/2",
  77: "5/2",
  78: "-2/3",
  79: "1/2",
};

function requireSubunitContext(subunitId: string) {
  const context = subunitContexts.get(subunitId);
  if (!context) throw new Error(`Unknown curriculum subunit: ${subunitId}`);
  return context;
}

function requireAtomicQuestion(
  question: string,
  subunitId: string,
  questionIndex: number,
  allowCombinedTasks = false,
) {
  const sentenceEndCount = question.match(/[.!?]/g)?.length ?? 0;
  const containsNumberedParts = /\(\d+\)/.test(question);
  const containsBundledInstruction = question.includes("각각");
  const isTwoChoiceQuestion = /소수인가요\? 합성수인가요\?$/.test(question);

  if (
    (sentenceEndCount !== 1 && !isTwoChoiceQuestion && !allowCombinedTasks) ||
    containsNumberedParts ||
    (containsBundledInstruction && !allowCombinedTasks)
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
      const allowCombinedTasks =
        typeof questionDefinition === "string"
          ? false
          : questionDefinition.allowCombinedTasks === true;
      const quizIndex = definition.startIndex + questionIndex;
      const quizContext =
        `${definition.subunitId} question ${questionIndex + 1} (quiz index ${quizIndex})`;
      const answer = quizAnswersByIndex[quizIndex] ?? null;

      requireSymbolicMathNotation(question, `${quizContext} question`);
      if (answer !== null) {
        requireSymbolicMathNotation(answer, `${quizContext} answer`);
      }
      requireAtomicQuestion(
        question,
        definition.subunitId,
        questionIndex,
        allowCombinedTasks,
      );
      const numericVariant = classifyNumericQuiz(
        question,
        numberPolicy,
        quizContext,
      );
      return {
        ...context,
        id: `${definition.subunitId}-q${questionIndex + 1}`,
        quizIndex,
        globalNumber: quizIndex + 1,
        numberInSubunit: questionIndex + 1,
        question,
        answer,
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

if (MAX_QUIZ_COUNT % QUIZZES_PER_ROUND !== 0) {
  throw new Error(
    `Registered quiz count must be divisible by ${QUIZZES_PER_ROUND}: ${MAX_QUIZ_COUNT}`,
  );
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

function uniqueInOrder(values: readonly string[]) {
  return Array.from(new Set(values));
}

function curriculumLabelForRound(quizzes: readonly CurriculumQuiz[]) {
  const unitGroups = new Map<
    string,
    { unitTitle: string; subunitTitles: string[] }
  >();

  quizzes.forEach((quiz) => {
    const unitKey = `${quiz.gradeId}:${quiz.semesterId}:${quiz.unitId}`;
    const group = unitGroups.get(unitKey);
    if (!group) {
      unitGroups.set(unitKey, {
        unitTitle: quiz.unitTitle,
        subunitTitles: [quiz.subunitTitle],
      });
      return;
    }
    if (!group.subunitTitles.includes(quiz.subunitTitle)) {
      group.subunitTitles.push(quiz.subunitTitle);
    }
  });

  return Array.from(unitGroups.values())
    .map(({ unitTitle, subunitTitles }) =>
      subunitTitles.length === 1 && subunitTitles[0] === unitTitle
        ? unitTitle
        : `${unitTitle} › ${subunitTitles.join(" · ")}`,
    )
    .join(" / ");
}

const orderedQuizzes = Array.from({ length: MAX_QUIZ_COUNT }, (_, quizIndex) => {
  const quiz = quizzesByIndex.get(quizIndex);
  if (!quiz) throw new Error(`Missing quiz index: ${quizIndex}`);
  return quiz;
});

export const CURRICULUM_QUIZ_ROUNDS: readonly CurriculumQuizRound[] =
  Array.from(
    { length: orderedQuizzes.length / QUIZZES_PER_ROUND },
    (_, roundIndex) => {
      const quizzes = orderedQuizzes.slice(
        roundIndex * QUIZZES_PER_ROUND,
        (roundIndex + 1) * QUIZZES_PER_ROUND,
      );

      if (quizzes.length !== QUIZZES_PER_ROUND) {
        throw new Error(`Quiz round ${roundIndex + 1} must contain 10 quizzes.`);
      }

      return {
        id: `round-${roundIndex + 1}`,
        roundNumber: roundIndex + 1,
        quizzes,
        quizIndexes: quizzes.map(({ quizIndex }) => quizIndex),
        gradeLabel: uniqueInOrder(quizzes.map(({ gradeLabel }) => gradeLabel)).join(
          " · ",
        ),
        semesterLabel: uniqueInOrder(
          quizzes.map(({ semesterLabel }) => semesterLabel),
        ).join(" · "),
        curriculumLabel: curriculumLabelForRound(quizzes),
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
