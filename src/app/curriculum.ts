export type MathToken = number | readonly [number, number] | "+" | "×" | "(" | ")";

export type Choice = {
  id: string;
  tokens: readonly MathToken[];
  label: string;
};

export type Question = {
  id: string;
  expression: readonly MathToken[];
  label: string;
  choices: readonly Choice[];
  answer: string;
  hint: string;
};

const fraction = (id: string, n: number, d: number): Choice => ({
  id, tokens: [[n, d]], label: `${d}분의 ${n}`,
});
const integer = (id: string, n: number): Choice => ({ id, tokens: [n], label: String(n) });

export const concept = {
  id: 0,
  title: "분수와 음수",
  subtitle: "지수 문제는 마지막에 늘 이 계산으로 끝난다.",
  practiceCount: 6,
  testCount: 3,
  wonPerAnswer: 1000,
  coupon: "간식 쿠폰",
} as const;

export const nextSteps = [
  "거듭제곱", "같은 밑끼리 곱하기", "지수가 0", "지수가 음수", "지수가 분수", "밑을 같게 만들기",
] as const;

export const practiceQuestions: readonly Question[] = [
  {
    id: "practice-1", expression: [2, "×", [1, 4]], label: "2 곱하기 4분의 1",
    choices: [fraction("a", 1, 2), fraction("b", 2, 8), fraction("c", 1, 8), integer("d", 8)],
    answer: "a", hint: "4분의 1 조각이 2개. 분자에만 2를 곱해요.",
  },
  {
    id: "practice-2", expression: [4, "×", [1, 8]], label: "4 곱하기 8분의 1",
    choices: [fraction("a", 4, 32), fraction("b", 4, 8), fraction("c", 1, 8), integer("d", 4)],
    answer: "b", hint: "조각은 4개, 조각 크기는 그대로. 분모 8은 바뀌지 않아요.",
  },
  {
    id: "practice-3", expression: [[1, 2], "+", [1, 2]], label: "2분의 1 더하기 2분의 1",
    choices: [fraction("a", 2, 4), integer("b", 2), integer("c", 1), fraction("d", 1, 4)],
    answer: "c", hint: "반 조각 2개를 모으면 하나가 돼요.",
  },
  {
    id: "practice-4", expression: [[1, 2], "+", "(", [-1, 2], ")"], label: "2분의 1 더하기 음수 2분의 1",
    choices: [integer("a", 1), integer("b", -1), fraction("c", -1, 2), integer("d", 0)],
    answer: "d", hint: "오른쪽으로 반 칸, 왼쪽으로 반 칸. 다시 0이에요.",
  },
  {
    id: "practice-5", expression: [[-1, 3], "+", [1, 3]], label: "음수 3분의 1 더하기 3분의 1",
    choices: [fraction("a", -2, 3), integer("b", 0), fraction("c", 2, 3), integer("d", 1)],
    answer: "b", hint: "같은 크기를 반대 방향으로 움직이면 서로 없어져요.",
  },
  {
    id: "practice-6", expression: [3, "×", [1, 6], "+", "(", [-1, 2], ")"], label: "3 곱하기 6분의 1 더하기 음수 2분의 1",
    choices: [fraction("a", 1, 2), fraction("b", -1, 2), integer("c", 1), integer("d", 0)],
    answer: "d", hint: "6분의 1 조각 3개는 반. 반을 빼면 0이에요.",
  },
];

export const testQuestions: readonly Question[] = [
  {
    id: "test-1", expression: [3, "×", [1, 6]], label: "3 곱하기 6분의 1",
    choices: [fraction("a", 1, 18), fraction("b", 1, 2), integer("c", 3), fraction("d", 1, 6)],
    answer: "b", hint: "",
  },
  {
    id: "test-2", expression: [[1, 3], "+", "(", [-1, 3], ")"], label: "3분의 1 더하기 음수 3분의 1",
    choices: [fraction("a", 2, 3), fraction("b", -2, 3), integer("c", 0), integer("d", 1)],
    answer: "c", hint: "",
  },
  {
    id: "test-3", expression: [[-1, 4], "+", 3, "×", [1, 4]], label: "음수 4분의 1 더하기 3 곱하기 4분의 1",
    choices: [fraction("a", -1, 2), fraction("b", 1, 2), fraction("c", 3, 16), integer("d", 0)],
    answer: "b", hint: "",
  },
];

export function testScore(answers: readonly (string | null)[]) {
  return testQuestions.reduce((score, question, index) => score + Number(answers[index] === question.answer), 0);
}

export function earnedWon(answers: readonly (string | null)[]) {
  return answers.length === concept.testCount && answers.every(answer => answer !== null)
    ? testScore(answers) * concept.wonPerAnswer : 0;
}

export function submitTestAnswer(answers: readonly (string | null)[], index: number, answer: string) {
  if (index < 0 || index >= testQuestions.length || answers[index] !== null ||
      !testQuestions[index].choices.some(choice => choice.id === answer)) return answers;
  return answers.map((current, position) => position === index ? answer : current);
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}
