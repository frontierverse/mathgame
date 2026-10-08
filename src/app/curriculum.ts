export type MathNumber = number | readonly [number, number];
export type MathToken = MathNumber | "+" | "−" | "×" | "=" | "(" | ")";

export type Choice = {
  id: string;
  label: string;
} & (
  | { kind: "expression"; tokens: readonly MathToken[] }
  | { kind: "movement"; start: MathNumber; direction: "left" | "right"; distance: MathNumber }
);

export type Question = {
  id: string;
  expression: readonly MathToken[];
  label: string;
  choices: readonly Choice[];
  answer: string;
  hint: string;
  instruction: "뜻이 같은 풀이" | "첫 수에서 출발";
};

export function mathTokenLabel(token: MathToken): string {
  if (typeof token === "number") return token < 0 ? `음수 ${Math.abs(token)}` : String(token);
  if (typeof token !== "string") return `${token[0] < 0 ? "음수 " : ""}${token[1]}분의 ${Math.abs(token[0])}`;
  return ({ "+": "더하기", "−": "빼기", "×": "곱하기", "=": "은", "(": "괄호 열기", ")": "괄호 닫기" })[token];
}

const expression = (id: string, tokens: readonly MathToken[]): Choice => ({
  id, kind: "expression", tokens, label: tokens.map(mathTokenLabel).join(" "),
});
const repeat = (id: string, value: MathNumber, count: number, operator: "+" | "×" = "+"): Choice =>
  expression(id, Array.from({ length: count * 2 - 1 }, (_, index) => index % 2 === 0 ? value : operator));
const movement = (id: string, start: MathNumber, direction: "left" | "right", distance: MathNumber): Choice => ({
  id, kind: "movement", start, direction, distance,
  label: `${mathTokenLabel(start)}에서 ${direction === "left" ? "왼쪽" : "오른쪽"}으로 ${mathTokenLabel(distance)}만큼 이동`,
});

export const concept = {
  id: 0,
  title: "분수와 음수",
  practiceCount: 6,
  testCount: 3,
  wonPerAnswer: 1000,
  coupon: "간식 쿠폰",
} as const;

export const nextSteps = [
  "거듭제곱", "같은 밑끼리 곱하기", "지수가 0", "지수가 음수", "지수가 분수", "밑을 같게 만들기",
  "모두 함께", "실전 · 수능 수학 1번",
] as const;

export const practiceQuestions: readonly Question[] = [
  {
    id: "practice-1", expression: [2, "×", [1, 4]], label: "2 곱하기 4분의 1",
    choices: [repeat("a", [1, 4], 2), repeat("b", [1, 8], 2), repeat("c", [1, 4], 2, "×"), repeat("d", 2, 4)],
    answer: "a", hint: "같은 조각 2번", instruction: "뜻이 같은 풀이",
  },
  {
    id: "practice-2", expression: [4, "×", [1, 8]], label: "4 곱하기 8분의 1",
    choices: [repeat("a", [1, 32], 4), repeat("b", [1, 8], 4), repeat("c", [1, 8], 3), repeat("d", [1, 8], 4, "×")],
    answer: "b", hint: "같은 조각 4번", instruction: "뜻이 같은 풀이",
  },
  {
    id: "practice-3", expression: [[1, 2], "+", [1, 2]], label: "2분의 1 더하기 2분의 1",
    choices: [movement("a", [1, 2], "right", [1, 4]), movement("b", 1, "right", [1, 2]), movement("c", [1, 2], "right", [1, 2]), movement("d", [1, 2], "left", [1, 2])],
    answer: "c", hint: "양수는 오른쪽", instruction: "첫 수에서 출발",
  },
  {
    id: "practice-4", expression: [[1, 2], "+", "(", [-1, 2], ")"], label: "2분의 1 더하기 음수 2분의 1",
    choices: [movement("a", [1, 2], "right", [1, 2]), movement("b", [-1, 2], "left", [1, 2]), movement("c", [1, 2], "left", [1, 4]), movement("d", [1, 2], "left", [1, 2])],
    answer: "d", hint: "음수는 왼쪽", instruction: "첫 수에서 출발",
  },
  {
    id: "practice-5", expression: [[-1, 3], "+", [1, 3]], label: "음수 3분의 1 더하기 3분의 1",
    choices: [movement("a", [-1, 3], "left", [1, 3]), movement("b", [-1, 3], "right", [1, 3]), movement("c", [1, 3], "right", [1, 3]), movement("d", [-1, 3], "right", 1)],
    answer: "b", hint: "양수는 오른쪽", instruction: "첫 수에서 출발",
  },
  {
    id: "practice-6", expression: [3, "×", [1, 6], "+", "(", [-1, 2], ")"], label: "3 곱하기 6분의 1 더하기 음수 2분의 1",
    choices: [expression("a", [[1, 6], "+", [1, 6], "−", [1, 2]]), expression("b", [[1, 6], "+", [1, 6], "+", [1, 6], "+", [1, 2]]), expression("c", [[1, 6], "+", [1, 6], "+", [1, 6], "−", [1, 6]]), expression("d", [[1, 6], "+", [1, 6], "+", [1, 6], "−", [1, 2]])],
    answer: "d", hint: "3번 더한 뒤 빼기", instruction: "뜻이 같은 풀이",
  },
];

export const testQuestions: readonly Question[] = [
  {
    id: "test-1", expression: [3, "×", [1, 6]], label: "3 곱하기 6분의 1",
    choices: [repeat("a", [1, 18], 3), repeat("b", [1, 6], 3), repeat("c", [1, 6], 3, "×"), repeat("d", [1, 6], 2)],
    answer: "b", hint: "", instruction: "뜻이 같은 풀이",
  },
  {
    id: "test-2", expression: [[1, 3], "+", "(", [-1, 3], ")"], label: "3분의 1 더하기 음수 3분의 1",
    choices: [movement("a", [1, 3], "right", [1, 3]), movement("b", [-1, 3], "left", [1, 3]), movement("c", [1, 3], "left", [1, 3]), movement("d", [1, 3], "left", [1, 6])],
    answer: "c", hint: "", instruction: "첫 수에서 출발",
  },
  {
    id: "test-3", expression: [[-1, 4], "+", 3, "×", [1, 4]], label: "음수 4분의 1 더하기 3 곱하기 4분의 1",
    choices: [expression("a", [[-1, 4], "−", [1, 4], "−", [1, 4], "−", [1, 4]]), expression("b", [[-1, 4], "+", [1, 4], "+", [1, 4], "+", [1, 4]]), expression("c", [[-1, 4], "+", [1, 4], "+", [1, 4]]), expression("d", ["(", [-1, 4], "+", 3, ")", "×", [1, 4]])],
    answer: "b", hint: "", instruction: "뜻이 같은 풀이",
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
