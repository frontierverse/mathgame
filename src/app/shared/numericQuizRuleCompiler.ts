const UINT32_RANGE = 0x1_0000_0000;

type RandomSource = () => number;
type QuestionFactory = (random: RandomSource) => string;
type AnswerResolver = (question: string) => string | null;
type MatchedNumericQuizRule = {
  factory: QuestionFactory;
  answerForQuestion?: AnswerResolver;
};

export type QuizNumberPolicy =
  | { mode: "auto" }
  | { mode: "fixed"; reason: string };

export type NumericQuizVariant =
  | { mode: "static"; reason: "no-number" }
  | { mode: "fixed"; reason: string }
  | { mode: "random"; ruleId: string };

export type CompiledNumericQuizRule = Extract<
  NumericQuizVariant,
  { mode: "random" }
> & {
  generate: (seed: number) => string;
  answerForQuestion: AnswerResolver;
};

type NumericQuizRule = {
  id: string;
  match: (question: string) => QuestionFactory | MatchedNumericQuizRule | null;
};

function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function randomInteger(random: RandomSource, minimum: number, maximum: number) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function randomItem<T>(random: RandomSource, items: readonly T[]) {
  return items[randomInteger(random, 0, items.length - 1)] as T;
}

function randomDistinctItems<T>(
  random: RandomSource,
  items: readonly T[],
  count: number,
) {
  const remaining = [...items];
  return Array.from({ length: Math.min(count, remaining.length) }, () => {
    const index = randomInteger(random, 0, remaining.length - 1);
    return remaining.splice(index, 1)[0] as T;
  });
}

function randomDistinctFactors(
  random: RandomSource,
  secondFactorPool: readonly number[],
) {
  const first = randomInteger(random, 2, 9);
  let second = randomItem(random, secondFactorPool);
  if (first === second) {
    const currentIndex = secondFactorPool.indexOf(second);
    second = secondFactorPool[(currentIndex + 1) % secondFactorPool.length] as number;
  }
  return [first, second] as const;
}

const NUMBERS_BEFORE_EUL = [3, 6, 7, 8, 10, 11] as const;
const NUMBERS_BEFORE_REUL = [2, 4, 5, 9] as const;
const FACTORS_BEFORE_EUL = [3, 6, 7, 8] as const;
const FACTORS_BEFORE_REUL = [2, 4, 5, 9] as const;
const NUMBERS_BEFORE_EUN = [
  3, 6, 7, 8, 10, 11, 13, 16, 17, 18, 20, 21, 23, 26, 27, 28, 30, 31,
] as const;
const DIVISOR_TARGETS = [6, 8, 10, 12, 14, 15, 18, 20, 21, 24, 27, 30] as const;
const CLASSIFICATION_TARGETS = NUMBERS_BEFORE_EUN;
const CLASSIFICATION_TARGETS_BEFORE_NEUN = [
  2, 4, 5, 9, 12, 14, 15, 19, 22, 24, 25, 29, 32,
] as const;
const COMPOSITE_TARGETS_BEFORE_I = [
  6, 8, 10, 16, 18, 20, 21, 26, 27, 28, 30, 33, 36, 40, 48, 50, 56,
  60, 63, 66, 70, 80, 90, 96, 98, 100,
] as const;
const COMPOSITE_TARGETS_BEFORE_REUL = [
  4, 9, 12, 14, 15, 22, 24, 25, 32, 34, 35, 42, 44, 45, 54,
] as const;
const SMALL_FACTORIZATION_TARGETS = [
  6, 8, 10, 16, 18, 20, 21, 27, 28, 30, 36, 40,
] as const;
const LARGE_FACTORIZATION_TARGETS = [
  48, 50, 56, 60, 63, 66, 70, 80, 90, 96, 98, 100,
] as const;
const PRIME_FACTORS = [2, 3, 5, 7, 11] as const;
const PRIME_FACTORS_BEFORE_EUL = [3, 7, 11] as const;
const PRIME_FACTORS_BEFORE_REUL = [2, 5] as const;
const POWER_BASES = [2, 3, 5] as const;
const POWER_VALUE_PAIRS = [
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 2],
  [3, 3],
  [3, 4],
  [4, 2],
  [4, 3],
  [4, 4],
  [5, 2],
  [5, 3],
  [5, 4],
  [6, 2],
  [6, 3],
  [7, 2],
  [7, 3],
  [8, 2],
  [8, 3],
  [9, 2],
  [10, 2],
] as const;
const TWO_POWER_EXPRESSIONS = [
  [2, 2, 3, 2],
  [2, 3, 3, 2],
  [2, 2, 5, 2],
  [2, 3, 5, 2],
  [3, 2, 5, 2],
  [2, 3, 3, 3],
  [2, 2, 3, 3],
  [3, 2, 2, 3],
  [5, 2, 2, 3],
  [5, 2, 3, 3],
  [3, 3, 5, 2],
] as const;
const COMMON_FACTOR_PAIRS = [
  [12, 18],
  [24, 36],
  [32, 48],
  [42, 56],
  [45, 60],
  [54, 72],
  [64, 80],
  [72, 96],
  [84, 126],
] as const;
const COMMON_FACTOR_PAIRS_BEFORE_GWA = [
  [18, 30],
  [21, 35],
  [27, 45],
  [28, 42],
  [33, 55],
  [36, 54],
  [63, 84],
  [70, 98],
] as const;
const SIEVE_LIMITS = [30, 50, 80, 100, 120] as const;

function repeatedPrimeProduct(
  random: RandomSource,
  repeatLastPrime: boolean,
  particle: "을" | "를",
) {
  const lastPrime = randomItem(
    random,
    particle === "을" ? PRIME_FACTORS_BEFORE_EUL : PRIME_FACTORS_BEFORE_REUL,
  );
  const firstPrime = randomItem(
    random,
    PRIME_FACTORS.filter((prime) => prime !== lastPrime),
  );
  const firstExponent = randomInteger(random, 2, 4);
  const lastExponent = repeatLastPrime ? randomInteger(random, 2, 4) : 1;

  return [
    ...Array.from({ length: firstExponent }, () => firstPrime),
    ...Array.from({ length: lastExponent }, () => lastPrime),
  ].join(" × ");
}

function powerTimesPrimeExpression(
  random: RandomSource,
  particle: "을" | "를" = "을",
) {
  const multiplier = randomItem(
    random,
    particle === "을" ? ([3, 7] as const) : PRIME_FACTORS_BEFORE_REUL,
  );
  const base = randomItem(
    random,
    POWER_BASES.filter((prime) => prime !== multiplier),
  );
  return `${base}^${randomInteger(random, 2, 3)} × ${multiplier}`;
}

function twoPowersExpression(random: RandomSource, finalExponent?: number) {
  const candidates =
    finalExponent === undefined
      ? TWO_POWER_EXPRESSIONS
      : TWO_POWER_EXPRESSIONS.filter(
          ([, , , secondExponent]) => secondExponent === finalExponent,
        );
  const [firstBase, firstExponent, secondBase, secondExponent] = randomItem(
    random,
    candidates,
  );
  return `${firstBase}^${firstExponent} × ${secondBase}^${secondExponent}`;
}

function invalidFactorizationStatement(random: RandomSource) {
  const prime = randomItem(random, PRIME_FACTORS);
  const composite = randomItem(random, COMPOSITE_TARGETS_BEFORE_REUL);
  return `${prime * composite} = ${prime} × ${composite}는 올바른 소인수분해인가?`;
}

function validPrimeProductStatement(random: RandomSource) {
  const lastPrime = randomItem(random, PRIME_FACTORS_BEFORE_EUL);
  const firstTwo = randomDistinctItems(
    random,
    PRIME_FACTORS.filter((prime) => prime !== lastPrime),
    2,
  );
  const factors = [...firstTwo, lastPrime];
  return `${factors.reduce((product, factor) => product * factor, 1)} = ${factors.join(" × ")}은 올바른 소인수분해인가?`;
}

function replaceLeadingExpression(question: string, expression: string) {
  return question.replace(/^[\d^ ×+x]+/, expression);
}

function replaceNumberLiterals(question: string, replacements: readonly number[]) {
  let replacementIndex = 0;
  const result = question.replace(/\d+/g, () => {
    const replacement = replacements[replacementIndex];
    replacementIndex += 1;
    if (replacement === undefined) {
      throw new Error(`Missing numeric replacement for quiz: ${question}`);
    }
    return String(replacement);
  });

  if (replacementIndex !== replacements.length) {
    throw new Error(`Unused numeric replacement for quiz: ${question}`);
  }
  return result;
}

function isPrime(value: number) {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

type ProductTerm = { base: number; exponent: number };

function parseProductExpression(expression: string): ProductTerm[] | null {
  const rawTerms = expression.split(" × ");
  const terms = rawTerms.map((rawTerm) => {
    const match = rawTerm.match(/^(\d+)(?:\^(\d+))?$/);
    if (!match) return null;
    return {
      base: Number(match[1]),
      exponent: match[2] === undefined ? 1 : Number(match[2]),
    };
  });
  return terms.every((term): term is ProductTerm => term !== null) ? terms : null;
}

function productValue(terms: readonly ProductTerm[]) {
  return terms.reduce(
    (product, term) => product * term.base ** term.exponent,
    1,
  );
}

function factorizationPool(originalValue: number) {
  return originalValue <= 45
    ? SMALL_FACTORIZATION_TARGETS
    : LARGE_FACTORIZATION_TARGETS;
}

const RULES: readonly NumericQuizRule[] = [
  {
    id: "repeated-addition-to-multiplication",
    match(question) {
      const match = question.match(
        /^(\d+(?: \+ \d+){2,})(을|를) 곱셈으로 표현하면\?$/,
      );
      if (!match) return null;
      const addends = match[1]?.split(" + ").map(Number) ?? [];
      if (!addends.every((addend) => addend === addends[0])) return null;
      const particle = match[2] as "을" | "를";

      return (random) => {
        const addend = randomItem(
          random,
          particle === "을" ? NUMBERS_BEFORE_EUL : NUMBERS_BEFORE_REUL,
        );
        const repeatCount = randomInteger(random, 3, 5);
        return replaceLeadingExpression(
          question,
          Array.from({ length: repeatCount }, () => addend).join(" + "),
        );
      };
    },
  },
  {
    id: "multiplication-to-addition",
    match(question) {
      const match = question.match(
        /^\d+[x×]\d+(을|를) 더하기로 변경하면\?$/,
      );
      if (!match) return null;
      const particle = match[1] as "을" | "를";

      return (random) => {
        const [first, second] = randomDistinctFactors(
          random,
          particle === "을" ? FACTORS_BEFORE_EUL : FACTORS_BEFORE_REUL,
        );
        return replaceNumberLiterals(question, [first, second]);
      };
    },
  },
  {
    id: "division-meaning",
    match(question) {
      const match = question.match(
        /^\d+ 나누기 \d+(은|는) \d+\(나눗셈식\)의 의미를 예를 들어 말할수있나요\?$/,
      );
      if (!match) return null;
      const particle = match[1] as "은" | "는";
      return (random) => {
        const divisor = randomItem(
          random,
          particle === "은" ? FACTORS_BEFORE_EUL : FACTORS_BEFORE_REUL,
        );
        const quotient = randomInteger(random, 2, 9);
        return replaceNumberLiterals(question, [
          divisor * quotient,
          divisor,
          quotient,
        ]);
      };
    },
  },
  {
    id: "division-by-zero",
    match(question) {
      if (!/^\d+ 나누기 0은 무엇인가요\?$/.test(question)) return null;
      return (random) =>
        replaceNumberLiterals(question, [randomInteger(random, 2, 60), 0]);
    },
  },
  {
    id: "zero-dividend",
    match(question) {
      const match = question.match(/^0 나누기 \d+(은|는)\?$/);
      if (!match) return null;
      const particle = match[1] as "은" | "는";
      return (random) =>
        replaceNumberLiterals(question, [
          0,
          randomItem(
            random,
            particle === "은"
              ? NUMBERS_BEFORE_EUN
              : CLASSIFICATION_TARGETS_BEFORE_NEUN,
          ),
        ]);
    },
  },
  {
    id: "list-divisors",
    match(question) {
      if (!/^\d+의 약수는\?$/.test(question)) return null;
      return (random) =>
        replaceNumberLiterals(question, [randomItem(random, DIVISOR_TARGETS)]);
    },
  },
  {
    id: "prime-or-composite",
    match(question) {
      const match = question.match(
        /^\d+(은|는) 소수인가요\? 합성수인가요\?$/,
      );
      if (!match) return null;
      const particle = match[1] as "은" | "는";
      return {
        factory: (random) =>
          replaceNumberLiterals(question, [
            randomItem(
              random,
              particle === "은"
                ? CLASSIFICATION_TARGETS
                : CLASSIFICATION_TARGETS_BEFORE_NEUN,
            ),
          ]),
        answerForQuestion: (generatedQuestion) => {
          const value = Number(generatedQuestion.match(/^\d+/)?.[0]);
          return isPrime(value) ? "소수" : "합성수";
        },
      };
    },
  },
  {
    id: "power-to-multiplication",
    match(question) {
      if (!/^\d+\^\d+을 곱셈식으로 변경해 보세요\.$/.test(question)) {
        return null;
      }
      return (random) =>
        replaceNumberLiterals(question, [
          randomInteger(random, 2, 8),
          randomInteger(random, 2, 5),
        ]);
    },
  },
  {
    id: "power-value",
    match(question) {
      if (!/^\d+\^\d+은 몇인가요\?$/.test(question)) return null;
      return (random) => {
        const [base, exponent] = randomItem(random, POWER_VALUE_PAIRS);
        return replaceNumberLiterals(question, [base, exponent]);
      };
    },
  },
  {
    id: "factorization-practice",
    match(question) {
      const match = question.match(/^(\d+)(을|를) 소인수분해 해보세요\.$/);
      if (!match) return null;
      const originalValue = Number(match[1]);
      return (random) => {
        const target = randomItem(random, factorizationPool(originalValue));
        return question.replace(/^\d+[을를]/, `${target}을`);
      };
    },
  },
  {
    id: "composite-reason",
    match(question) {
      if (!/^\d+[이가] 합성수인 이유를 설명하라\.$/.test(question)) return null;
      return (random) => {
        const target = randomItem(random, COMPOSITE_TARGETS_BEFORE_I);
        return question.replace(/^\d+[이가]/, `${target}이`);
      };
    },
  },
  {
    id: "sieve-range",
    match(question) {
      if (
        !/^1부터 \d+까지의 소수를 찾을 때, 어떤 수들의 배수를 지우면 되는지 설명하라\.$/.test(
          question,
        )
      ) {
        return null;
      }
      return (random) =>
        replaceNumberLiterals(question, [1, randomItem(random, SIEVE_LIMITS)]);
    },
  },
  {
    id: "prime-test",
    match(question) {
      const match = question.match(/^\d+(이|가) 소수인지 판별하라\.$/);
      if (!match) return null;
      const particle = match[1] as "이" | "가";
      return (random) =>
        replaceNumberLiterals(question, [
          randomItem(
            random,
            particle === "이"
              ? NUMBERS_BEFORE_EUN
              : CLASSIFICATION_TARGETS_BEFORE_NEUN,
          ),
        ]);
    },
  },
  {
    id: "prime-product",
    match(question) {
      const match = question.match(/^(\d+)(을|를) 소수의 곱으로 나타내라\.$/);
      if (!match) return null;
      const particle = match[2] as "을" | "를";
      return (random) =>
        replaceNumberLiterals(question, [
          randomItem(
            random,
            particle === "를"
              ? COMPOSITE_TARGETS_BEFORE_REUL
              : SMALL_FACTORIZATION_TARGETS,
          ),
        ]);
    },
  },
  {
    id: "repeated-primes-to-power",
    match(question) {
      const match = question.match(
        /^(\d+(?: × \d+)+)(을|를) 거듭제곱을 사용하여 나타내라\.$/,
      );
      if (!match) return null;
      const factors = match[1]?.split(" × ").map(Number) ?? [];
      if (!factors.every(isPrime)) return null;
      const counts = new Map<number, number>();
      factors.forEach((factor) => counts.set(factor, (counts.get(factor) ?? 0) + 1));
      const repeatedGroupCount = [...counts.values()].filter((count) => count > 1).length;
      if (repeatedGroupCount === 0) return null;
      const particle = match[2] as "을" | "를";
      return (random) =>
        replaceLeadingExpression(
          question,
          repeatedPrimeProduct(random, repeatedGroupCount > 1, particle),
        );
    },
  },
  {
    id: "factorization",
    match(question) {
      const match = question.match(/^(\d+)(을|를) 소인수분해하라\.$/);
      if (!match) return null;
      const originalValue = Number(match[1]);
      return (random) => {
        const target = randomItem(random, factorizationPool(originalValue));
        return question.replace(/^\d+[을를]/, `${target}을`);
      };
    },
  },
  {
    id: "power-product-expansion",
    match(question) {
      const match = question.match(
        /^(\d+(?:\^\d+)?(?: × \d+(?:\^\d+)?)+)(을|를) 실제 곱셈으로 나타내라\.$/,
      );
      if (!match) return null;
      const terms = parseProductExpression(match[1] ?? "");
      if (!terms) return null;
      const powerShape = terms.map((term) => term.exponent > 1);
      const particle = match[2] as "을" | "를";

      if (terms.length === 2 && powerShape[0] && !powerShape[1]) {
        return (random) =>
          replaceLeadingExpression(
            question,
            powerTimesPrimeExpression(random, particle),
          );
      }
      if (terms.length === 2 && powerShape.every(Boolean)) {
        return (random) =>
          replaceLeadingExpression(
            question,
            twoPowersExpression(random, particle === "을" ? 3 : 2),
          );
      }
      return null;
    },
  },
  {
    id: "power-product-value",
    match(question) {
      const match = question.match(
        /^(\d+(?:\^\d+)?(?: × \d+(?:\^\d+)?)+)의 값을 구하라\.$/,
      );
      if (!match) return null;
      const terms = parseProductExpression(match[1] ?? "");
      if (!terms) return null;
      const powerShape = terms.map((term) => term.exponent > 1);

      if (terms.length === 2 && powerShape[0] && !powerShape[1]) {
        return (random) =>
          replaceLeadingExpression(question, powerTimesPrimeExpression(random));
      }
      if (terms.length === 2 && powerShape.every(Boolean)) {
        return (random) =>
          replaceLeadingExpression(question, twoPowersExpression(random));
      }
      if (
        terms.length === 3 &&
        powerShape[0] &&
        !powerShape[1] &&
        !powerShape[2]
      ) {
        return (random) => {
          const [base, firstPrime, secondPrime] = randomDistinctItems(
            random,
            POWER_BASES,
            3,
          );
          return replaceLeadingExpression(
            question,
            `${base}^${randomInteger(random, 2, 3)} × ${firstPrime} × ${secondPrime}`,
          );
        };
      }
      return null;
    },
  },
  {
    id: "factorization-validity",
    match(question) {
      const match = question.match(
        /^(\d+) = (\d+(?:\^\d+)?(?: × \d+(?:\^\d+)?)+)(은|는) 올바른 소인수분해인가\?$/,
      );
      if (!match) return null;
      const leftValue = Number(match[1]);
      const terms = parseProductExpression(match[2] ?? "");
      if (!terms || productValue(terms) !== leftValue) return null;
      const isValid = terms.every((term) => isPrime(term.base));

      if (!isValid && terms.length === 2) {
        return (random) => invalidFactorizationStatement(random);
      }
      if (
        isValid &&
        terms.length === 2 &&
        terms.every((term) => term.exponent > 1)
      ) {
        return (random) => {
          const [firstBase, firstExponent, secondBase, secondExponent] = randomItem(
            random,
            TWO_POWER_EXPRESSIONS,
          );
          const value = firstBase ** firstExponent * secondBase ** secondExponent;
          return `${value} = ${firstBase}^${firstExponent} × ${secondBase}^${secondExponent}은 올바른 소인수분해인가?`;
        };
      }
      if (
        isValid &&
        terms.length === 3 &&
        terms.every((term) => term.exponent === 1)
      ) {
        return (random) => validPrimeProductStatement(random);
      }
      return null;
    },
  },
  {
    id: "gcd-or-lcm",
    match(question) {
      const match = question.match(
        /^\d+(와|과) \d+의 (최대공약수|최소공배수)를 구하라\.$/,
      );
      if (!match) return null;
      const particle = match[1] as "와" | "과";
      return (random) => {
        const pairPool: readonly (readonly [number, number])[] =
          particle === "와" ? COMMON_FACTOR_PAIRS : COMMON_FACTOR_PAIRS_BEFORE_GWA;
        const [first, second] = randomItem(random, pairPool);
        return replaceNumberLiterals(question, [first, second]);
      };
    },
  },
];

const RULE_VALIDATION_SEEDS = [
  0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 0xffff_ffff,
] as const;

function findRuleMatches(question: string) {
  return RULES.flatMap((rule) => {
    const matchedRule = rule.match(question);
    if (!matchedRule) return [];
    return [
      {
        rule,
        factory:
          typeof matchedRule === "function" ? matchedRule : matchedRule.factory,
        answerForQuestion:
          typeof matchedRule === "function"
            ? undefined
            : matchedRule.answerForQuestion,
      },
    ];
  });
}

function validateQuestionFactory(
  question: string,
  rule: NumericQuizRule,
  factory: QuestionFactory,
  context?: string,
) {
  const outputs = new Set<string>();

  RULE_VALIDATION_SEEDS.forEach((seed) => {
    const output = factory(createSeededRandom(seed));
    const repeatedOutput = factory(createSeededRandom(seed));
    if (output !== repeatedOutput) {
      throw new Error(
        `${errorPrefix(context)}Numeric quiz rule ${rule.id} is not deterministic for seed ${seed}: ${question}`,
      );
    }
    if (!output || /undefined|NaN|Infinity/.test(output)) {
      throw new Error(
        `${errorPrefix(context)}Numeric quiz rule ${rule.id} generated invalid text: ${question}`,
      );
    }
    const hasUnsafeNumber = (output.match(/\d+/g) ?? []).some(
      (literal) => !Number.isSafeInteger(Number(literal)),
    );
    if (hasUnsafeNumber) {
      throw new Error(
        `${errorPrefix(context)}Numeric quiz rule ${rule.id} generated an unsafe number: ${question}`,
      );
    }

    const generatedMatches = findRuleMatches(output);
    if (
      generatedMatches.length !== 1 ||
      generatedMatches[0]?.rule.id !== rule.id
    ) {
      throw new Error(
        `${errorPrefix(context)}Numeric quiz rule ${rule.id} generated text outside its own pattern: ${output}`,
      );
    }
    outputs.add(output);
  });

  if (outputs.size < 2) {
    throw new Error(
      `${errorPrefix(context)}Numeric quiz rule ${rule.id} must generate at least two questions: ${question}`,
    );
  }
}

function errorPrefix(context?: string) {
  return context ? `${context}: ` : "";
}

export function compileNumericQuizRule(
  question: string,
  policy: QuizNumberPolicy = { mode: "auto" },
  context?: string,
):
  | Extract<NumericQuizVariant, { mode: "static" | "fixed" }>
  | CompiledNumericQuizRule {
  const hasNumber = /\d/.test(question);

  if (policy.mode === "fixed") {
    const reason = policy.reason.trim();
    if (!hasNumber) {
      throw new Error(
        `${errorPrefix(context)}A fixed-number quiz must contain a number: ${question}`,
      );
    }
    if (!reason) {
      throw new Error(
        `${errorPrefix(context)}A fixed-number quiz needs a reason: ${question}`,
      );
    }
    return { mode: "fixed", reason };
  }

  if (!hasNumber) return { mode: "static", reason: "no-number" };

  const matches = findRuleMatches(question);

  if (matches.length === 0) {
    throw new Error(
      `${errorPrefix(context)}Unsupported numeric quiz pattern. Add a reusable rule or mark intentional constants as fixed: ${question}`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `${errorPrefix(context)}Ambiguous numeric quiz pattern (${matches.map(({ rule }) => rule.id).join(", ")}): ${question}`,
    );
  }

  const [{ rule, factory, answerForQuestion }] = matches;
  validateQuestionFactory(question, rule, factory, context);
  return {
    mode: "random",
    ruleId: rule.id,
    generate: (seed) => factory(createSeededRandom(seed >>> 0)),
    answerForQuestion: answerForQuestion ?? (() => null),
  };
}

export function classifyNumericQuiz(
  question: string,
  policy: QuizNumberPolicy = { mode: "auto" },
  context?: string,
): NumericQuizVariant {
  const compiled = compileNumericQuizRule(question, policy, context);
  if (compiled.mode === "random") {
    return { mode: "random", ruleId: compiled.ruleId };
  }
  return compiled;
}
