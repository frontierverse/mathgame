import {
  CURRICULUM_QUIZ_SETS,
  quizAnswerForIndex,
  quizTextForIndex,
} from "./curriculumQuizzes";
import {
  compileNumericQuizRule,
  type CompiledNumericQuizRule,
} from "./numericQuizRuleCompiler";

const UINT32_RANGE = 0x1_0000_0000;

export type ResolvedQuizContent = {
  variantKey: string;
  question: string;
  answer: string | null;
  randomized: boolean;
};

const compiledRulesByQuizIndex = new Map<number, CompiledNumericQuizRule>();

CURRICULUM_QUIZ_SETS.forEach((quizSet) => {
  quizSet.quizzes.forEach((quiz) => {
    if (quiz.numericVariant.mode !== "random") return;

    const compiled = compileNumericQuizRule(
      quiz.question,
      { mode: "auto" },
      `${quiz.id} (quiz index ${quiz.quizIndex})`,
    );
    if (compiled.mode !== "random") {
      throw new Error(`Expected a random numeric quiz rule: ${quiz.id}`);
    }
    if (compiled.ruleId !== quiz.numericVariant.ruleId) {
      throw new Error(`Numeric quiz rule changed during registration: ${quiz.id}`);
    }
    compiledRulesByQuizIndex.set(quiz.quizIndex, compiled);
  });
});

export function quizHasRandomVariant(quizIndex: number) {
  return compiledRulesByQuizIndex.has(quizIndex);
}

export function resolveQuizContent(
  quizIndex: number,
  variantSeed?: number | null,
): ResolvedQuizContent {
  const compiledRule = compiledRulesByQuizIndex.get(quizIndex);
  if (!compiledRule || variantSeed === null || variantSeed === undefined) {
    return {
      variantKey: `static-${quizIndex}`,
      question: quizTextForIndex(quizIndex),
      answer: quizAnswerForIndex(quizIndex),
      randomized: false,
    };
  }

  const normalizedSeed = variantSeed >>> 0;
  const question = compiledRule.generate(normalizedSeed);
  return {
    variantKey: `${quizIndex}-${normalizedSeed}`,
    question,
    answer: compiledRule.answerForQuestion(question),
    randomized: true,
  };
}

function randomUint32() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] ?? 0;
  }
  return Math.floor(Math.random() * UINT32_RANGE) >>> 0;
}

export function createRandomQuizVariantSeed(
  quizIndex: number,
  previousSeed?: number,
): number | null {
  if (!quizHasRandomVariant(quizIndex)) return null;

  const previousQuestion =
    previousSeed === undefined
      ? null
      : resolveQuizContent(quizIndex, previousSeed).question;

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidate = randomUint32();
    if (
      candidate !== previousSeed &&
      resolveQuizContent(quizIndex, candidate).question !== previousQuestion
    ) {
      return candidate;
    }
  }

  const fallbackBase = randomUint32();
  for (let offset = 0; offset < 4096; offset += 1) {
    const fallbackSeed = (fallbackBase + offset) >>> 0;
    if (resolveQuizContent(quizIndex, fallbackSeed).question !== previousQuestion) {
      return fallbackSeed;
    }
  }

  throw new Error(
    `Unable to generate a different numeric quiz variant for quiz ${quizIndex}`,
  );
}
