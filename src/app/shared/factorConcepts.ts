export const factorConceptLessonIds = [
  "divisors",
  "primes-composites",
  "prime-factorization",
  "multiples",
  "common-multiples",
  "least-common-multiple",
  "common-divisors",
  "greatest-common-divisor",
] as const;

export type FactorConceptLessonId =
  (typeof factorConceptLessonIds)[number];

const factorConceptLessonIdSet = new Set<string>(factorConceptLessonIds);

export function isFactorConceptLessonId(
  lessonId: string,
): lessonId is FactorConceptLessonId {
  return factorConceptLessonIdSet.has(lessonId);
}

export type FactorConceptExampleVisual =
  | {
      kind: "array";
      count: number;
      columns: number;
      formula: string;
    }
  | {
      kind: "factorization";
      value: number;
      factors: readonly number[];
    }
  | {
      kind: "jumps";
      step: number;
      stops: readonly number[];
    }
  | {
      kind: "meeting";
      first: readonly number[];
      second: readonly number[];
      hits: readonly number[];
      firstOnly?: boolean;
    }
  | {
      kind: "groups";
      totals: readonly [number, number];
      groupSize: number;
    };

export type FactorConceptExample = {
  label: string;
  ariaLabel: string;
  visual: FactorConceptExampleVisual;
};

export type FactorConceptProblem = {
  prompt: string;
  choices: readonly string[];
  correctIndex: number;
};

export type FactorConcept = {
  title: string;
  question: string;
  answer: readonly string[];
  note?: string;
  sceneAriaLabel: string;
  examples: readonly [FactorConceptExample, FactorConceptExample];
  problems: readonly FactorConceptProblem[];
};

export const factorConcepts: Record<
  FactorConceptLessonId,
  FactorConcept
> = {
  divisors: {
    title: "약수",
    question: "어떤 수로 만들까?",
    answer: ["남김없이 만들면 약수"],
    sceneAriaLabel:
      "12개의 블록이 1 곱하기 12, 2 곱하기 6, 3 곱하기 4 직사각형으로 바뀌며 12의 약수 짝을 보여 줍니다.",
    examples: [
      {
        label: "6 = 2 × 3",
        ariaLabel: "블록 6개를 2행 3열로 남김없이 배열",
        visual: { kind: "array", count: 6, columns: 3, formula: "6 = 2 × 3" },
      },
      {
        label: "10 = 2 × 5",
        ariaLabel: "블록 10개를 2행 5열로 남김없이 배열",
        visual: { kind: "array", count: 10, columns: 5, formula: "10 = 2 × 5" },
      },
    ],
    problems: [
      { prompt: "2는 8의 약수?", choices: ["○", "×"], correctIndex: 0 },
      { prompt: "2는 9의 약수?", choices: ["○", "×"], correctIndex: 1 },
      { prompt: "3은 15의 약수?", choices: ["○", "×"], correctIndex: 0 },
    ],
  },
  "primes-composites": {
    title: "소수와 합성수",
    question: "모양이 어떻게 다를까?",
    answer: ["한 모양 → 소수", "여러 모양 → 합성수"],
    note: "1은 약수가 1개",
    sceneAriaLabel:
      "블록 7개는 한 줄만 완성되고, 블록 8개는 한 줄과 2행 4열 직사각형을 완성합니다.",
    examples: [
      {
        label: "5 → 소수",
        ariaLabel: "블록 5개로 한 줄 직사각형만 완성",
        visual: { kind: "array", count: 5, columns: 5, formula: "5 → 소수" },
      },
      {
        label: "6 → 합성수",
        ariaLabel: "블록 6개로 2행 3열 직사각형도 완성",
        visual: { kind: "array", count: 6, columns: 3, formula: "6 → 합성수" },
      },
    ],
    problems: [
      { prompt: "소수는?", choices: ["3", "4", "6"], correctIndex: 0 },
      { prompt: "합성수는?", choices: ["5", "7", "8"], correctIndex: 2 },
      {
        prompt: "1은?",
        choices: ["소수", "합성수", "둘 다 아님"],
        correctIndex: 2,
      },
    ],
  },
  "prime-factorization": {
    title: "소인수분해",
    question: "언제 멈추면 될까?",
    answer: ["모두 소수면 끝!"],
    sceneAriaLabel:
      "12가 3과 4로 갈라지고, 4가 다시 2와 2로 갈라져 2, 2, 3만 남습니다.",
    examples: [
      {
        label: "18 = 2 × 3 × 3",
        ariaLabel: "18을 소수 2, 3, 3으로 분해",
        visual: { kind: "factorization", value: 18, factors: [2, 3, 3] },
      },
      {
        label: "20 = 2 × 2 × 5",
        ariaLabel: "20을 소수 2, 2, 5로 분해",
        visual: { kind: "factorization", value: 20, factors: [2, 2, 5] },
      },
    ],
    problems: [
      { prompt: "6 = ?", choices: ["2 × 3", "1 × 6", "3 + 3"], correctIndex: 0 },
      { prompt: "10 = ?", choices: ["2 × 5", "1 × 10", "5 + 5"], correctIndex: 0 },
      {
        prompt: "24 = ?",
        choices: ["2 × 2 × 2 × 3", "4 × 6", "3 × 8"],
        correctIndex: 0,
      },
    ],
  },
  multiples: {
    title: "배수",
    question: "다음 착지는 어디?",
    answer: ["같은 수만큼 더해"],
    sceneAriaLabel:
      "0에서 2씩 점프하며 2, 4, 6, 8, 10에 도착하고, 이를 반복 덧셈과 2 곱하기 1부터 2 곱하기 5까지의 식으로 함께 보여 줍니다.",
    examples: [
      {
        label: "0 + 3 + 3 = 6",
        ariaLabel:
          "3칸씩 점프하여 3, 6, 9, 12에 도착하고, 3 곱하기 1과 3 곱하기 2 및 반복 덧셈으로 확인",
        visual: { kind: "jumps", step: 3, stops: [3, 6, 9, 12] },
      },
      {
        label: "0 + 4 + 4 = 8",
        ariaLabel:
          "4칸씩 점프하여 4, 8, 12, 16에 도착하고, 4 곱하기 1과 4 곱하기 2 및 반복 덧셈으로 확인",
        visual: { kind: "jumps", step: 4, stops: [4, 8, 12, 16] },
      },
    ],
    problems: [
      { prompt: "0 + 5 + 5 = ?", choices: ["8", "10", "15"], correctIndex: 1 },
      { prompt: "3 × 4 = ?", choices: ["10", "11", "12"], correctIndex: 2 },
      { prompt: "2 → 4 → 6 → ?", choices: ["7", "8"], correctIndex: 1 },
    ],
  },
  "common-multiples": {
    title: "공배수",
    question: "두 색이 겹친 곳은?",
    answer: ["겹친 수가 공배수"],
    sceneAriaLabel:
      "2의 배수와 3의 배수가 수직선의 6과 12에서 겹칩니다.",
    examples: [
      {
        label: "2 · 4 → 4, 8",
        ariaLabel: "2의 배수와 4의 배수가 4와 8에서 겹침",
        visual: {
          kind: "meeting",
          first: [2, 4, 6, 8],
          second: [4, 8],
          hits: [4, 8],
        },
      },
      {
        label: "3 · 4 → 12",
        ariaLabel: "3의 배수와 4의 배수가 12에서 겹침",
        visual: {
          kind: "meeting",
          first: [3, 6, 9, 12],
          second: [4, 8, 12],
          hits: [12],
        },
      },
    ],
    problems: [
      { prompt: "2 · 5가 겹치면?", choices: ["8", "10", "12"], correctIndex: 1 },
      { prompt: "3 · 4가 겹치면?", choices: ["6", "9", "12"], correctIndex: 2 },
      { prompt: "4 · 6이 겹치면?", choices: ["8", "10", "12"], correctIndex: 2 },
    ],
  },
  "least-common-multiple": {
    title: "최소공배수",
    question: "처음 만난 수는?",
    answer: ["첫 공배수 = 최소공배수"],
    sceneAriaLabel:
      "2칸 점프와 3칸 점프가 처음으로 6에서 함께 도착합니다.",
    examples: [
      {
        label: "2 · 4 → 4",
        ariaLabel: "2와 4의 첫 공배수는 4",
        visual: {
          kind: "meeting",
          first: [2, 4, 6, 8],
          second: [4, 8],
          hits: [4],
          firstOnly: true,
        },
      },
      {
        label: "3 · 5 → 15",
        ariaLabel: "3과 5의 첫 공배수는 15",
        visual: {
          kind: "meeting",
          first: [3, 6, 9, 12, 15],
          second: [5, 10, 15],
          hits: [15],
          firstOnly: true,
        },
      },
    ],
    problems: [
      { prompt: "3 · 4의 첫 만남?", choices: ["6", "12", "16"], correctIndex: 1 },
      { prompt: "4 · 6의 첫 만남?", choices: ["8", "12", "18"], correctIndex: 1 },
      { prompt: "2 · 5의 첫 만남?", choices: ["5", "10", "15"], correctIndex: 1 },
    ],
  },
  "common-divisors": {
    title: "공약수",
    question: "둘 다 묶이는 수는?",
    answer: ["둘 다 나누면 공약수"],
    sceneAriaLabel:
      "12개와 18개의 블록이 각각 2개씩, 이어서 3개씩 남김없이 묶입니다.",
    examples: [
      {
        label: "8 · 12 → 4개씩",
        ariaLabel: "8개와 12개를 모두 4개씩 묶음",
        visual: { kind: "groups", totals: [8, 12], groupSize: 4 },
      },
      {
        label: "10 · 15 → 5개씩",
        ariaLabel: "10개와 15개를 모두 5개씩 묶음",
        visual: { kind: "groups", totals: [10, 15], groupSize: 5 },
      },
    ],
    problems: [
      { prompt: "6 · 9, 3개씩?", choices: ["○", "×"], correctIndex: 0 },
      { prompt: "8 · 10, 2개씩?", choices: ["○", "×"], correctIndex: 0 },
      { prompt: "12 · 15, 4개씩?", choices: ["○", "×"], correctIndex: 1 },
    ],
  },
  "greatest-common-divisor": {
    title: "최대공약수",
    question: "가장 크게 몇 개씩?",
    answer: ["가장 큰 공약수"],
    sceneAriaLabel:
      "12개와 18개의 블록을 가장 크게 6개씩 묶고, 후보 2, 3, 6 가운데 6을 강조합니다.",
    examples: [
      {
        label: "8 · 12 → 4",
        ariaLabel: "8과 12의 최대공약수는 4",
        visual: { kind: "groups", totals: [8, 12], groupSize: 4 },
      },
      {
        label: "10 · 15 → 5",
        ariaLabel: "10과 15의 최대공약수는 5",
        visual: { kind: "groups", totals: [10, 15], groupSize: 5 },
      },
    ],
    problems: [
      { prompt: "6 · 9, 가장 크게?", choices: ["2", "3", "6"], correctIndex: 1 },
      { prompt: "12 · 16, 가장 크게?", choices: ["2", "4", "8"], correctIndex: 1 },
      { prompt: "15 · 25, 가장 크게?", choices: ["3", "5", "10"], correctIndex: 1 },
    ],
  },
};

export function getFactorConcept(lessonId: string) {
  return isFactorConceptLessonId(lessonId)
    ? factorConcepts[lessonId]
    : null;
}
