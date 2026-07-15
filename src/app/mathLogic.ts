export type ExpressionDisplayToken = {
  value: string;
  kind: "digit" | "operator" | "separator";
};

export type CurriculumUnit = {
  id: string;
  title: string;
  subunits: string[];
};

export type CurriculumSemester = {
  id: "semester1" | "semester2";
  label: string;
  units: CurriculumUnit[];
};

export type CurriculumGrade = {
  id: "middle1" | "middle2" | "middle3";
  label: string;
  subtitle: string;
  semesters: CurriculumSemester[];
};

export type PrimeCompositeQuizChoice = {
  label: string;
  isCorrect: boolean;
};

export type PrimeCompositeQuiz = {
  id: string;
  question: string;
  hint: string;
  explanation: string;
  choices: PrimeCompositeQuizChoice[];
};

export type StandaloneSection = "arithmetic";

export type ArithmeticTopic = "addition-multiplication" | "subtraction-division";

export type ArithmeticRelation =
  | {
      kind: "empty";
    }
  | {
      kind: "unsupported";
      sourceExpression: string;
      message: string;
    }
  | {
      kind: "addition" | "multiplication";
      sourceExpression: string;
      addend: bigint;
      groups: bigint;
      total: bigint;
      additionExpression: string;
      multiplicationExpression: string;
      visibleTerms: string[];
      hiddenTermCount: bigint;
    };

export type SubtractionRelation =
  | {
      kind: "empty";
    }
  | {
      kind: "unsupported";
      sourceExpression: string;
      message: string;
    }
  | {
      kind: "subtraction" | "division";
      sourceExpression: string;
      start: bigint;
      subtrahend: bigint;
      count: bigint;
      remainder: bigint;
      isComplete: boolean;
      subtractionExpression: string;
      divisionExpression: string;
    };

export const curriculum: CurriculumGrade[] = [
  {
    id: "middle1",
    label: "중1",
    subtitle: "수와 식의 기본 감각을 만드는 단계",
    semesters: [
      {
        id: "semester1",
        label: "1학기",
        units: [
          {
            id: "m1-s1-u1",
            title: "소인수분해",
            subunits: ["소수와 합성수", "소인수분해", "최대공약수와 최소공배수"],
          },
          {
            id: "m1-s1-u2",
            title: "정수와 유리수",
            subunits: [
              "정수와 유리수",
              "정수와 유리수의 덧셈과 뺄셈",
              "정수와 유리수의 곱셈과 나눗셈",
            ],
          },
          {
            id: "m1-s1-u3",
            title: "문자와 식",
            subunits: ["문자의 사용과 식의 값", "일차식의 계산", "일차방정식", "일차방정식의 활용"],
          },
          {
            id: "m1-s1-u4",
            title: "좌표평면과 그래프",
            subunits: ["순서쌍과 좌표", "그래프의 이해", "정비례", "반비례"],
          },
        ],
      },
      {
        id: "semester2",
        label: "2학기",
        units: [
          {
            id: "m1-s2-u1",
            title: "기본 도형",
            subunits: ["점, 선, 면", "각", "위치 관계", "평행선의 성질"],
          },
          {
            id: "m1-s2-u2",
            title: "평면도형",
            subunits: ["다각형", "원과 부채꼴"],
          },
          {
            id: "m1-s2-u3",
            title: "입체도형",
            subunits: ["다면체", "회전체", "기둥과 뿔의 겉넓이와 부피", "구의 겉넓이와 부피"],
          },
          {
            id: "m1-s2-u4",
            title: "통계",
            subunits: ["자료의 정리", "도수분포표", "히스토그램과 도수분포다각형", "상대도수"],
          },
        ],
      },
    ],
  },
  {
    id: "middle2",
    label: "중2",
    subtitle: "식과 함수, 도형 성질을 확장하는 단계",
    semesters: [
      {
        id: "semester1",
        label: "1학기",
        units: [
          {
            id: "m2-s1-u1",
            title: "유리수와 순환소수",
            subunits: ["유리수와 소수", "순환소수의 표현", "순환소수를 분수로 나타내기"],
          },
          {
            id: "m2-s1-u2",
            title: "식의 계산",
            subunits: ["지수법칙", "단항식의 계산", "다항식의 덧셈과 뺄셈", "다항식의 곱셈과 나눗셈"],
          },
          {
            id: "m2-s1-u3",
            title: "일차부등식과 연립일차방정식",
            subunits: ["부등식과 그 성질", "일차부등식", "연립일차방정식", "연립일차방정식의 활용"],
          },
          {
            id: "m2-s1-u4",
            title: "일차함수",
            subunits: ["일차함수와 그래프", "일차함수의 식 구하기", "일차함수와 일차방정식의 관계"],
          },
        ],
      },
      {
        id: "semester2",
        label: "2학기",
        units: [
          {
            id: "m2-s2-u1",
            title: "삼각형의 성질",
            subunits: ["이등변삼각형", "직각삼각형의 합동", "삼각형의 외심과 내심"],
          },
          {
            id: "m2-s2-u2",
            title: "사각형의 성질",
            subunits: ["평행사변형", "여러 가지 사각형", "사각형 사이의 관계"],
          },
          {
            id: "m2-s2-u3",
            title: "도형의 닮음",
            subunits: ["닮은 도형", "삼각형의 닮음 조건", "평행선과 선분의 길이의 비", "닮음의 활용"],
          },
          {
            id: "m2-s2-u4",
            title: "피타고라스 정리",
            subunits: ["피타고라스 정리", "피타고라스 정리의 활용"],
          },
          {
            id: "m2-s2-u5",
            title: "확률",
            subunits: ["경우의 수", "확률의 뜻과 성질", "확률의 계산"],
          },
        ],
      },
    ],
  },
  {
    id: "middle3",
    label: "중3",
    subtitle: "실수, 이차식, 삼각비와 통계를 다루는 단계",
    semesters: [
      {
        id: "semester1",
        label: "1학기",
        units: [
          {
            id: "m3-s1-u1",
            title: "제곱근과 실수",
            subunits: ["제곱근", "무리수와 실수", "근호를 포함한 식의 계산"],
          },
          {
            id: "m3-s1-u2",
            title: "다항식의 곱셈과 인수분해",
            subunits: ["다항식의 곱셈", "곱셈 공식", "인수분해", "인수분해 공식의 활용"],
          },
          {
            id: "m3-s1-u3",
            title: "이차방정식",
            subunits: ["이차방정식과 그 해", "인수분해를 이용한 풀이", "완전제곱식을 이용한 풀이", "근의 공식", "이차방정식의 활용"],
          },
          {
            id: "m3-s1-u4",
            title: "이차함수",
            subunits: ["이차함수와 그래프", "이차함수 y=ax²의 그래프", "y=a(x-p)²+q의 그래프", "이차함수의 활용"],
          },
        ],
      },
      {
        id: "semester2",
        label: "2학기",
        units: [
          {
            id: "m3-s2-u1",
            title: "삼각비",
            subunits: ["삼각비의 뜻", "삼각비의 값", "삼각비의 활용"],
          },
          {
            id: "m3-s2-u2",
            title: "원의 성질",
            subunits: ["원과 직선", "원주각", "원주각의 활용"],
          },
          {
            id: "m3-s2-u3",
            title: "통계",
            subunits: ["대푯값", "산포도", "산점도와 상관관계"],
          },
        ],
      },
    ],
  },
];

export const primeCompositeQuizzes: PrimeCompositeQuiz[] = [
  {
    id: "one-is-not-prime",
    question: "1은 소수일까요?",
    hint: "소수는 약수가 1과 자기 자신, 꼭 2개인 수예요. 1의 약수를 세어보세요.",
    explanation:
      "1의 약수는 1 하나뿐이에요. 약수가 2개가 아니니까 1은 소수가 아니에요. 합성수도 아니랍니다!",
    choices: [
      { label: "소수예요", isCorrect: false },
      { label: "소수가 아니에요", isCorrect: true },
    ],
  },
];

export const buttonRepeatDelay = 360;
export const inputRepeatInterval = 120;
export const deleteRepeatInterval = 85;

const operatorValues = new Set(["+", "-", "×", "÷", "(", ")"]);

export function normalizeExpression(expression: string) {
  return expression.replaceAll("×", "*").replaceAll("÷", "/");
}

type ExactValue = {
  numerator: bigint;
  denominator: bigint;
};

function getGreatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

function createExactValue(numerator: bigint, denominator = 1n): ExactValue {
  if (denominator === 0n) {
    throw new Error("Division by zero");
  }

  const sign = denominator < 0n ? -1n : 1n;
  const signedNumerator = numerator * sign;
  const positiveDenominator = denominator < 0n ? -denominator : denominator;
  const divisor = getGreatestCommonDivisor(signedNumerator, positiveDenominator);

  return {
    numerator: signedNumerator / divisor,
    denominator: positiveDenominator / divisor,
  };
}

function addExactValues(left: ExactValue, right: ExactValue): ExactValue {
  return createExactValue(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractExactValues(left: ExactValue, right: ExactValue): ExactValue {
  return createExactValue(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function multiplyExactValues(left: ExactValue, right: ExactValue): ExactValue {
  return createExactValue(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divideExactValues(left: ExactValue, right: ExactValue): ExactValue {
  return createExactValue(left.numerator * right.denominator, left.denominator * right.numerator);
}

function getTerminatingDecimalScale(denominator: bigint) {
  let rest = denominator;
  let twos = 0;
  let fives = 0;

  while (rest % 2n === 0n) {
    rest /= 2n;
    twos += 1;
  }

  while (rest % 5n === 0n) {
    rest /= 5n;
    fives += 1;
  }

  if (rest !== 1n) {
    return null;
  }

  return Math.max(twos, fives);
}

function formatExactValue(value: ExactValue) {
  if (value.denominator === 1n) {
    return formatNumberText(value.numerator.toString());
  }

  const scale = getTerminatingDecimalScale(value.denominator);

  if (scale !== null && scale <= 18) {
    const sign = value.numerator < 0n ? "-" : "";
    const absoluteNumerator = value.numerator < 0n ? -value.numerator : value.numerator;
    const scaledNumerator = absoluteNumerator * 10n ** BigInt(scale);
    const decimalInteger = (scaledNumerator / value.denominator).toString().padStart(scale + 1, "0");
    const whole = decimalInteger.slice(0, -scale) || "0";
    const decimal = decimalInteger.slice(-scale).replace(/0+$/, "");

    return formatNumberText(`${sign}${whole}${decimal ? `.${decimal}` : ""}`);
  }

  return `${formatNumberText(value.numerator.toString())}/${formatNumberText(
    value.denominator.toString(),
  )}`;
}

export function evaluateExactExpression(expression: string): ExactValue {
  const input = normalizeExpression(expression);
  let index = 0;

  function skipSpaces() {
    while (input[index] === " ") {
      index += 1;
    }
  }

  function parseExpression(): ExactValue {
    let value = parseTerm();

    while (true) {
      skipSpaces();
      const operator = input[index];

      if (operator !== "+" && operator !== "-") {
        break;
      }

      index += 1;
      const nextValue = parseTerm();
      value = operator === "+" ? addExactValues(value, nextValue) : subtractExactValues(value, nextValue);
    }

    return value;
  }

  function parseTerm(): ExactValue {
    let value = parseFactor();

    while (true) {
      skipSpaces();
      const operator = input[index];

      if (operator !== "*" && operator !== "/") {
        break;
      }

      index += 1;
      const nextValue = parseFactor();
      value = operator === "*" ? multiplyExactValues(value, nextValue) : divideExactValues(value, nextValue);
    }

    return value;
  }

  function parseFactor(): ExactValue {
    skipSpaces();
    const token = input[index];

    if (token === "+") {
      index += 1;
      return parseFactor();
    }

    if (token === "-") {
      index += 1;
      const value = parseFactor();
      return createExactValue(-value.numerator, value.denominator);
    }

    if (token === "(") {
      index += 1;
      const value = parseExpression();
      skipSpaces();

      if (input[index] !== ")") {
        throw new Error("Missing closing parenthesis");
      }

      index += 1;
      return value;
    }

    return parseNumber();
  }

  function parseNumber(): ExactValue {
    skipSpaces();
    const start = index;

    while (/\d/.test(input[index] ?? "")) {
      index += 1;
    }

    if (start === index) {
      throw new Error("Expected number");
    }

    return createExactValue(BigInt(input.slice(start, index)));
  }

  const result = parseExpression();
  skipSpaces();

  if (index !== input.length) {
    throw new Error("Unexpected token");
  }

  return result;
}

export function formatNumberText(value: string) {
  const [integer, decimal] = value.split(".");
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimal === undefined ? formattedInteger : `${formattedInteger}.${decimal}`;
}

export function getExpressionDisplayTokens(expression: string): ExpressionDisplayToken[] {
  const tokens: ExpressionDisplayToken[] = [];
  let index = 0;

  while (index < expression.length) {
    const current = expression[index];

    if (/\d/.test(current)) {
      const start = index;

      while (/\d/.test(expression[index] ?? "")) {
        index += 1;
      }

      for (const value of formatNumberText(expression.slice(start, index))) {
        tokens.push({
          value,
          kind: value === "," ? "separator" : "digit",
        });
      }

      continue;
    }

    tokens.push({
      value: current,
      kind: operatorValues.has(current) ? "operator" : "separator",
    });
    index += 1;
  }

  return tokens;
}

export function getExpressionPreview(expression: string) {
  if (!expression) {
    return "버튼을 눌러 식을 만들어 보세요";
  }

  if (!/^[\d+\-*/().\s]+$/.test(normalizeExpression(expression))) {
    return "숫자와 연산 기호만 사용할 수 있어요";
  }

  try {
    const result = evaluateExactExpression(expression);

    return `결과는 ${formatExactValue(result)} 입니다`;
  } catch {
    return "식을 완성하면 결과가 보여요";
  }
}

export function getKeyboardExpressionToken(key: string, code: string) {
  if (/^\d$/.test(key)) {
    return key;
  }

  const keyNumpadDigit = key.match(/^Numpad(\d)$/);
  const codeNumpadDigit = code.match(/^Numpad(\d)$/);

  if (keyNumpadDigit) {
    return keyNumpadDigit[1];
  }

  if (codeNumpadDigit) {
    return codeNumpadDigit[1];
  }

  if (key === "+" || key === "-" || key === "(" || key === ")") {
    return key;
  }

  const operatorByKeyOrCode: Record<string, string> = {
    Add: "+",
    Divide: "÷",
    Multiply: "×",
    NumpadAdd: "+",
    NumpadDivide: "÷",
    NumpadMultiply: "×",
    NumpadSubtract: "-",
    Subtract: "-",
  };

  const operatorToken = operatorByKeyOrCode[key] ?? operatorByKeyOrCode[code];

  if (operatorToken) {
    return operatorToken;
  }

  if (key === "*" || key === "x" || key === "X" || key === "×") {
    return "×";
  }

  if (key === "/" || key === "÷") {
    return "÷";
  }

  return null;
}

export function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function formatBigIntText(value: bigint) {
  return formatNumberText(value.toString());
}

function getVisibleRepeatedTerms(addend: bigint, groups: bigint) {
  const visibleTermCount = Number(groups > 12n ? 12n : groups);

  return Array.from({ length: visibleTermCount }, () => formatBigIntText(addend));
}

function getRepeatedAdditionExpression(addend: bigint, groups: bigint) {
  const visibleTerms = getVisibleRepeatedTerms(addend, groups);

  if (groups > 12n) {
    return `${visibleTerms.join(" + ")} + ... + ${formatBigIntText(addend)}`;
  }

  return visibleTerms.join(" + ");
}

export function getUnitExpression(value: bigint) {
  if (value <= 0n) {
    return "0";
  }

  if (value <= 16n) {
    return `${Array.from({ length: Number(value) }, () => "1").join(" + ")} = ${formatBigIntText(value)}`;
  }

  const visibleOnes = Array.from({ length: 8 }, () => "1").join(" + ");

  return `${visibleOnes} + ... + ${visibleOnes} = ${formatBigIntText(value)}`;
}

export function getVisibleUnitSticks(value: bigint) {
  if (value <= 0n) {
    return [];
  }

  const visibleStickCount = Number(value > 20n ? 20n : value);

  return Array.from({ length: visibleStickCount }, (_, index) => index);
}

function createArithmeticRelation(
  sourceExpression: string,
  kind: "addition" | "multiplication",
  addend: bigint,
  groups: bigint,
  multiplicationExpression = `${formatBigIntText(addend)} × ${formatBigIntText(groups)}`,
): ArithmeticRelation {
  const total = addend * groups;

  return {
    kind,
    sourceExpression,
    addend,
    groups,
    total,
    additionExpression: getRepeatedAdditionExpression(addend, groups),
    multiplicationExpression,
    visibleTerms: getVisibleRepeatedTerms(addend, groups),
    hiddenTermCount: groups > 12n ? groups - 12n : 0n,
  };
}

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

export function getArithmeticRelation(expression: string): ArithmeticRelation {
  const compactExpression = normalizeExpression(expression).replace(/\s/g, "");

  if (!compactExpression) {
    return {
      kind: "empty",
    };
  }

  const additionTerms = compactExpression.split("+");

  if (additionTerms.length > 1 && additionTerms.every((term) => /^\d+$/.test(term))) {
    const values = additionTerms.map((term) => BigInt(term));
    const addend = values[0];
    const isRepeatedAddition = values.every((value) => value === addend);

    if (isRepeatedAddition) {
      return createArithmeticRelation(expression, "addition", addend, BigInt(values.length));
    }

    return {
      kind: "unsupported",
      sourceExpression: expression,
      message: "같은 수가 반복되는 더하기 식만 곱하기로 묶을 수 있어요.",
    };
  }

  const multiplicationMatch = compactExpression.match(/^(\d+)\*(\d+)$/);

  if (multiplicationMatch) {
    const leftValue = parsePositiveInteger(multiplicationMatch[1]);
    const rightValue = parsePositiveInteger(multiplicationMatch[2]);

    if (leftValue !== null && rightValue !== null && leftValue > 0n && rightValue > 0n) {
      const addend = leftValue >= rightValue ? leftValue : rightValue;
      const groups = leftValue >= rightValue ? rightValue : leftValue;

      return createArithmeticRelation(
        expression,
        "multiplication",
        addend,
        groups,
        `${formatBigIntText(leftValue)} × ${formatBigIntText(rightValue)}`,
      );
    }
  }

  return {
    kind: "unsupported",
    sourceExpression: expression,
    message: "더하기와 곱하기의 관계는 반복 덧셈 또는 두 수의 곱셈으로 볼 수 있어요.",
  };
}

export function getNumberJosa(value: bigint, consonantForm: string, vowelForm: string) {
  const lastDigit = Number(value % 10n);

  return [0, 1, 3, 6, 7, 8].includes(lastDigit) ? consonantForm : vowelForm;
}

function getRepeatedSubtractionExpression(start: bigint, subtrahend: bigint, count: bigint) {
  if (count <= 0n) {
    return formatBigIntText(start);
  }

  const visibleTermCount = Number(count > 12n ? 12n : count);
  const visibleTerms = Array.from({ length: visibleTermCount }, () => formatBigIntText(subtrahend));

  if (count > 12n) {
    return `${formatBigIntText(start)} - ${visibleTerms.join(" - ")} - ... - ${formatBigIntText(subtrahend)}`;
  }

  return `${formatBigIntText(start)} - ${visibleTerms.join(" - ")}`;
}

function createSubtractionRelation(
  sourceExpression: string,
  kind: "subtraction" | "division",
  start: bigint,
  subtrahend: bigint,
  count: bigint,
): SubtractionRelation {
  const remainder = start - subtrahend * count;

  return {
    kind,
    sourceExpression,
    start,
    subtrahend,
    count,
    remainder,
    isComplete: remainder < subtrahend,
    subtractionExpression: getRepeatedSubtractionExpression(start, subtrahend, count),
    divisionExpression: `${formatBigIntText(start)} ÷ ${formatBigIntText(subtrahend)}`,
  };
}

export function getSubtractionDivisionRelation(expression: string): SubtractionRelation {
  const compactExpression = normalizeExpression(expression).replace(/\s/g, "");

  if (!compactExpression) {
    return {
      kind: "empty",
    };
  }

  if (/^\d+(?:-\d+)+$/.test(compactExpression)) {
    const parts = compactExpression.split("-");
    const start = BigInt(parts[0]);
    const subtractedValues = parts.slice(1).map((part) => BigInt(part));
    const subtrahend = subtractedValues[0];

    if (!subtractedValues.every((value) => value === subtrahend)) {
      return {
        kind: "unsupported",
        sourceExpression: expression,
        message: "같은 수를 반복해서 빼는 식만 나눗셈으로 묶을 수 있어요.",
      };
    }

    if (subtrahend === 0n) {
      return {
        kind: "unsupported",
        sourceExpression: expression,
        message: "0을 빼면 수가 줄어들지 않아요. 0보다 큰 수를 빼보세요.",
      };
    }

    const count = BigInt(subtractedValues.length);
    const remainder = start - subtrahend * count;

    if (remainder < 0n) {
      return {
        kind: "unsupported",
        sourceExpression: expression,
        message: "너무 많이 뺐어요. 결과가 0보다 작아지지 않게 빼보세요.",
      };
    }

    return createSubtractionRelation(expression, "subtraction", start, subtrahend, count);
  }

  const divisionMatch = compactExpression.match(/^(\d+)\/(\d+)$/);

  if (divisionMatch) {
    const start = BigInt(divisionMatch[1]);
    const divisor = BigInt(divisionMatch[2]);

    if (divisor === 0n) {
      return {
        kind: "unsupported",
        sourceExpression: expression,
        message: "0으로는 나눌 수 없어요.",
      };
    }

    return createSubtractionRelation(expression, "division", start, divisor, start / divisor);
  }

  return {
    kind: "unsupported",
    sourceExpression: expression,
    message: "빼기와 나누기의 관계는 같은 수를 반복해서 빼는 식 또는 두 수의 나눗셈으로 볼 수 있어요.",
  };
}
