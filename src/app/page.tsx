"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

type Creature = {
  value: number;
  label: string;
  color: string;
  dots: number;
  position: string;
  backgroundPosition: string;
  radius: string;
  tilt: string;
};

type MathKey = {
  value: string;
  color: string;
  shadow: string;
  text: string;
};

type ExpressionDisplayToken = {
  value: string;
  kind: "digit" | "operator" | "separator";
};

type CurriculumUnit = {
  id: string;
  title: string;
  subunits: string[];
};

type CurriculumSemester = {
  id: "semester1" | "semester2";
  label: string;
  units: CurriculumUnit[];
};

type CurriculumGrade = {
  id: "middle1" | "middle2" | "middle3";
  label: string;
  subtitle: string;
  semesters: CurriculumSemester[];
};

type PrimeCompositeQuizChoice = {
  label: string;
  isCorrect: boolean;
};

type PrimeCompositeQuiz = {
  id: string;
  question: string;
  hint: string;
  explanation: string;
  choices: PrimeCompositeQuizChoice[];
};

type StandaloneSection = "arithmetic";

type ArithmeticTopic = "addition-multiplication" | "subtraction-division";

type ArithmeticRelation =
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

type SubtractionRelation =
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

const curriculum: CurriculumGrade[] = [
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

const numberKeys: MathKey[] = [
  { value: "7", color: "bg-[#4f8df7]", shadow: "shadow-[0_6px_0_#2f5fb7]", text: "text-white" },
  { value: "8", color: "bg-[#ff5c5d]", shadow: "shadow-[0_6px_0_#b7353a]", text: "text-white" },
  { value: "9", color: "bg-[#39b567]", shadow: "shadow-[0_6px_0_#257a45]", text: "text-white" },
  { value: "4", color: "bg-[#ffb23f]", shadow: "shadow-[0_6px_0_#b97718]", text: "text-[#3d285f]" },
  { value: "5", color: "bg-[#9f70eb]", shadow: "shadow-[0_6px_0_#6644a8]", text: "text-white" },
  { value: "6", color: "bg-[#22bfd4]", shadow: "shadow-[0_6px_0_#147d8d]", text: "text-white" },
  { value: "1", color: "bg-[#f56fd2]", shadow: "shadow-[0_6px_0_#aa3c91]", text: "text-white" },
  { value: "2", color: "bg-[#ff7a7a]", shadow: "shadow-[0_6px_0_#bd4848]", text: "text-white" },
  { value: "3", color: "bg-[#f4d03f]", shadow: "shadow-[0_6px_0_#a88b16]", text: "text-[#3d285f]" },
  { value: "0", color: "bg-[#7c5cd6]", shadow: "shadow-[0_6px_0_#493385]", text: "text-white" },
];

const operatorKeys: MathKey[] = [
  { value: "+", color: "bg-[#ff5963]", shadow: "shadow-[0_6px_0_#a62f38]", text: "text-white" },
  { value: "-", color: "bg-[#4f8df7]", shadow: "shadow-[0_6px_0_#2f5fb7]", text: "text-white" },
  { value: "×", color: "bg-[#39b567]", shadow: "shadow-[0_6px_0_#257a45]", text: "text-white" },
  { value: "÷", color: "bg-[#ffca3a]", shadow: "shadow-[0_6px_0_#a98212]", text: "text-[#3d285f]" },
  { value: "(", color: "bg-[#d65fd2]", shadow: "shadow-[0_6px_0_#8f378d]", text: "text-white" },
  { value: ")", color: "bg-[#22bfd4]", shadow: "shadow-[0_6px_0_#147d8d]", text: "text-white" },
];

const expressionTileStyles = [...numberKeys, ...operatorKeys].reduce<Record<string, MathKey>>(
  (styles, key) => {
    styles[key.value] = key;
    return styles;
  },
  {},
);

const operatorValues = new Set(operatorKeys.map((key) => key.value));

const expressionTileRadii = [
  "58% 42% 52% 48% / 45% 58% 42% 55%",
  "46% 54% 44% 56% / 57% 43% 58% 42%",
  "54% 46% 60% 40% / 48% 58% 42% 52%",
  "42% 58% 50% 50% / 52% 46% 54% 48%",
  "56% 44% 46% 54% / 42% 54% 46% 58%",
  "48% 52% 57% 43% / 55% 45% 53% 47%",
];

const expressionTileRotations = ["-5deg", "3deg", "-2deg", "4deg", "-3deg", "2deg"];

const buttonRepeatDelay = 360;
const inputRepeatInterval = 120;
const deleteRepeatInterval = 85;

const creatures: Creature[] = [
  {
    value: 2,
    label: "짝수",
    color: "bg-[#ff5c5d]",
    dots: 2,
    position: "left-[11%] top-[18%]",
    backgroundPosition: "left-[3%] top-[18%]",
    radius: "58% 42% 52% 48% / 44% 58% 42% 56%",
    tilt: "-3deg",
  },
  {
    value: 3,
    label: "소수",
    color: "bg-[#d8ad00]",
    dots: 3,
    position: "left-[37%] top-[10%]",
    backgroundPosition: "left-[31%] top-[3%]",
    radius: "46% 54% 44% 56% / 56% 42% 58% 44%",
    tilt: "2deg",
  },
  {
    value: 5,
    label: "합성수 열쇠",
    color: "bg-[#39b567]",
    dots: 5,
    position: "right-[18%] top-[19%]",
    backgroundPosition: "right-[4%] top-[12%]",
    radius: "54% 46% 60% 40% / 48% 58% 42% 52%",
    tilt: "-2deg",
  },
  {
    value: 9,
    label: "제곱수",
    color: "bg-[#4f8df7]",
    dots: 9,
    position: "left-[26%] bottom-[16%]",
    backgroundPosition: "left-[5%] bottom-[8%]",
    radius: "42% 58% 50% 50% / 52% 46% 54% 48%",
    tilt: "3deg",
  },
  {
    value: 11,
    label: "보너스",
    color: "bg-[#d65fd2]",
    dots: 11,
    position: "right-[14%] bottom-[12%]",
    backgroundPosition: "right-[22%] bottom-[5%]",
    radius: "56% 44% 46% 54% / 42% 54% 46% 58%",
    tilt: "-1deg",
  },
];

const primeCompositeQuizzes: PrimeCompositeQuiz[] = [
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

function normalizeExpression(expression: string) {
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

function evaluateExactExpression(expression: string): ExactValue {
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

function formatNumberText(value: string) {
  const [integer, decimal] = value.split(".");
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimal === undefined ? formattedInteger : `${formattedInteger}.${decimal}`;
}

function getExpressionDisplayTokens(expression: string): ExpressionDisplayToken[] {
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

function getExpressionPreview(expression: string) {
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

function getKeyboardExpressionToken(key: string, code: string) {
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

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

type MascotTone = "neutral" | "wrong" | "correct";

function QuizMascotFace({ tone }: { tone: MascotTone }) {
  const color =
    tone === "wrong" ? "bg-[#ff5963]" : tone === "correct" ? "bg-[#39b567]" : "bg-[#9f70eb]";

  return (
    <div
      className={`relative flex h-20 w-20 shrink-0 items-center justify-center shadow-[inset_0_-8px_0_rgba(61,40,95,0.15)] sm:h-24 sm:w-24 ${color}`}
      style={{
        borderRadius: "58% 42% 52% 48% / 44% 58% 42% 56%",
        transform: "rotate(-3deg)",
      }}
    >
      <span className="absolute left-5 top-4 h-4 w-6 rounded-full bg-white/30 blur-[1px] sm:left-6 sm:top-5 sm:h-4 sm:w-7" />
      <span className="absolute left-6 top-8 h-2.5 w-2.5 rounded-full bg-[#3d285f] sm:left-7 sm:top-9" />
      <span className="absolute right-6 top-8 h-2.5 w-2.5 rounded-full bg-[#3d285f] sm:right-7 sm:top-9" />
      <span className="absolute top-[42px] h-3 w-6 rounded-b-full border-b-4 border-[#3d285f] sm:top-[52px]" />
    </div>
  );
}

function QuizSpeechBubble({
  tone,
  size = "md",
  children,
}: {
  tone: MascotTone;
  size?: "md" | "lg";
  children: ReactNode;
}) {
  const textColor =
    tone === "wrong" ? "text-[#d5486d]" : tone === "correct" ? "text-[#2e9155]" : "text-[#3d285f]";
  const textSize = size === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl";

  return (
    <div className="flex items-end justify-center gap-4">
      <QuizMascotFace tone={tone} />
      <div className="relative" style={{ filter: "drop-shadow(0 6px 0 #ded9ec)" }}>
        <div className="max-w-xl rounded-[30px] bg-white px-7 py-5 text-left">
          <p className={`break-words font-black leading-snug ${textSize} ${textColor}`}>
            {children}
          </p>
        </div>
        <svg className="absolute -left-6 bottom-3 h-10 w-10" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M34 2 C 28 14, 18 26, 2 36 C 22 33, 33 22, 37 10 Z" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}

function PrimeCompositeQuizSection() {
  const [quizIndex, setQuizIndex] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [wrongChoiceIndex, setWrongChoiceIndex] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  if (isFinished) {
    return (
      <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
        <div className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-[8px] bg-[#f7f4ff] px-6 py-8 text-center">
          <QuizSpeechBubble tone="correct" size="lg">
            퀴즈를 모두 풀었어요! 다음 퀴즈가 곧 찾아올 거예요.
          </QuizSpeechBubble>
          <button
            type="button"
            onClick={() => {
              setQuizIndex(0);
              setIsSolved(false);
              setWrongChoiceIndex(null);
              setIsFinished(false);
            }}
            className="rounded-full bg-[#9f70eb] px-8 py-3 text-lg font-black text-white shadow-[0_5px_0_#6644a8] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
          >
            처음부터 다시 풀기
          </button>
        </div>
      </section>
    );
  }

  const quiz = primeCompositeQuizzes[quizIndex];
  const isLastQuiz = quizIndex === primeCompositeQuizzes.length - 1;

  function chooseAnswer(choiceIndex: number) {
    if (isSolved) {
      return;
    }

    if (quiz.choices[choiceIndex].isCorrect) {
      setIsSolved(true);
      setWrongChoiceIndex(null);
      return;
    }

    setWrongChoiceIndex(choiceIndex);
  }

  function goToNextQuiz() {
    if (isLastQuiz) {
      setIsFinished(true);
      return;
    }

    setQuizIndex((current) => current + 1);
    setIsSolved(false);
    setWrongChoiceIndex(null);
  }

  return (
    <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
      <div className="flex min-h-64 flex-col items-center justify-center gap-6 rounded-[8px] bg-[#f7f4ff] px-6 py-8 text-center">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#9f70eb] px-4 py-1.5 text-sm font-black text-white">
            퀴즈 {quizIndex + 1}
          </span>
          <span className="text-sm font-extrabold text-[#7c5cd6]">
            {quizIndex + 1} / {primeCompositeQuizzes.length}
          </span>
        </div>
        <QuizSpeechBubble tone="neutral" size="lg">
          {quiz.question}
        </QuizSpeechBubble>
        <div className="flex flex-wrap items-stretch justify-center gap-4">
          {quiz.choices.map((choice, choiceIndex) => {
            const isCorrectAndSolved = isSolved && choice.isCorrect;
            const isWrongPick = wrongChoiceIndex === choiceIndex && !isSolved;

            return (
              <button
                key={choice.label}
                type="button"
                onClick={() => chooseAnswer(choiceIndex)}
                disabled={isSolved}
                className={`min-w-52 rounded-[8px] px-8 py-5 text-2xl font-black transition ${
                  isCorrectAndSolved
                    ? "bg-[#39b567] text-white shadow-[0_6px_0_#257a45]"
                    : isWrongPick
                      ? "bg-[#ff5963] text-white shadow-[0_6px_0_#a62f38]"
                      : "bg-white text-[#3d285f] shadow-[0_6px_0_#ded9ec] enabled:hover:-translate-y-0.5 enabled:hover:bg-[#fff7ea] enabled:active:translate-y-0 disabled:opacity-60"
                }`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        {wrongChoiceIndex !== null && !isSolved && (
          <QuizSpeechBubble tone="wrong">아직 아니에요! 힌트: {quiz.hint}</QuizSpeechBubble>
        )}
        {isSolved && (
          <>
            <QuizSpeechBubble tone="correct">정답이에요! {quiz.explanation}</QuizSpeechBubble>
            <button
              type="button"
              onClick={goToNextQuiz}
              className="rounded-full bg-[#ffb23f] px-8 py-3 text-lg font-black text-[#3d285f] shadow-[0_5px_0_#b97718] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
            >
              {isLastQuiz ? "퀴즈 끝내기" : "다음 문제"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function formatBigIntText(value: bigint) {
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

function getUnitExpression(value: bigint) {
  if (value <= 0n) {
    return "0";
  }

  if (value <= 16n) {
    return `${Array.from({ length: Number(value) }, () => "1").join(" + ")} = ${formatBigIntText(value)}`;
  }

  const visibleOnes = Array.from({ length: 8 }, () => "1").join(" + ");

  return `${visibleOnes} + ... + ${visibleOnes} = ${formatBigIntText(value)}`;
}

function getVisibleUnitSticks(value: bigint) {
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

function getArithmeticRelation(expression: string): ArithmeticRelation {
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

function ArithmeticOperationsSection({ relation }: { relation: ArithmeticRelation }) {
  if (relation.kind === "empty") {
    return (
      <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
        <div className="flex min-h-64 items-center justify-center rounded-[8px] bg-[#f7f4ff] px-6 text-center text-4xl font-black leading-tight text-[#9f9278]">
          식 입력 후 사용하기
        </div>
      </section>
    );
  }

  if (relation.kind === "unsupported") {
    return (
      <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
        <div className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-[8px] bg-[#f7f4ff] px-6 text-center">
          <p className="break-words text-4xl font-black leading-tight text-[#3d285f]">
            {relation.sourceExpression}
          </p>
          <p className="text-2xl font-black leading-tight text-[#9f9278]">{relation.message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
      <div className="flex min-h-64 flex-col items-center justify-center gap-6 rounded-[8px] bg-[#f7f4ff] px-6 py-8 text-center">
        <div className="flex min-h-12 max-w-3xl flex-wrap items-end justify-center gap-x-2 gap-y-3">
          {getVisibleUnitSticks(relation.total).map((stick, index, sticks) => (
            <span key={stick} className="flex items-end gap-2">
              <span className="relative h-9 w-3">
                <span className="absolute bottom-0 left-1/2 h-9 w-1 -translate-x-1/2 rotate-[-10deg] rounded-full bg-[#8b5a2b]" />
                <span className="absolute left-1/2 top-2 h-3 w-1 rotate-[38deg] rounded-full bg-[#a06a35]" />
              </span>
              {relation.total > 20n && index === Math.floor(sticks.length / 2) - 1 && (
                <span className="px-2 pb-1 text-3xl font-black leading-none text-[#7c5cd6]">...</span>
              )}
            </span>
          ))}
        </div>
        {relation.addend !== 1n && (
          <p className="break-words text-3xl font-black leading-tight text-[#6f4ab4]">
            {getUnitExpression(relation.total)}
          </p>
        )}
        <div className="h-px w-full max-w-2xl bg-white" />
        <p className="break-words text-5xl font-black leading-tight text-[#3d285f]">
          {relation.additionExpression}
        </p>
        <p className="break-words text-5xl font-black leading-tight text-[#3d285f]">
          {relation.multiplicationExpression}
        </p>
        <p className="break-words text-5xl font-black leading-tight text-[#d57920]">
          = {formatBigIntText(relation.total)}
        </p>
      </div>
    </section>
  );
}

function getNumberJosa(value: bigint, consonantForm: string, vowelForm: string) {
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

function getSubtractionDivisionRelation(expression: string): SubtractionRelation {
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

function SubtractionDivisionSection({ relation }: { relation: SubtractionRelation }) {
  if (relation.kind === "empty") {
    return (
      <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
        <div className="flex min-h-64 items-center justify-center rounded-[8px] bg-[#f7f4ff] px-6 text-center">
          <p className="text-3xl font-black leading-snug text-[#9f9278]">
            12 - 3 처럼 같은 수를 빼는 식을 만들고
            <br />
            &lsquo;한 번 빼기&rsquo;를 눌러보세요
          </p>
        </div>
      </section>
    );
  }

  if (relation.kind === "unsupported") {
    return (
      <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
        <div className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-[8px] bg-[#f7f4ff] px-6 text-center">
          <p className="break-words text-4xl font-black leading-tight text-[#3d285f]">
            {relation.sourceExpression}
          </p>
          <p className="text-2xl font-black leading-tight text-[#9f9278]">{relation.message}</p>
        </div>
      </section>
    );
  }

  const showSticks = relation.start > 0n && relation.start <= 24n;
  const stickGroupCount = showSticks ? Number(relation.count) : 0;
  const sticksPerGroup = showSticks ? Number(relation.subtrahend) : 0;
  const remainderSticks = showSticks ? Number(relation.remainder) : 0;

  return (
    <section className="rounded-[8px] bg-white p-8 shadow-[0_6px_0_#ded9ec]">
      <div className="flex min-h-64 flex-col items-center justify-center gap-6 rounded-[8px] bg-[#f7f4ff] px-6 py-8 text-center">
        {showSticks && (
          <div className="flex max-w-3xl flex-wrap items-end justify-center gap-x-4 gap-y-3">
            {Array.from({ length: stickGroupCount }, (_, groupIndex) => (
              <span
                key={groupIndex}
                className="flex items-end gap-1.5 rounded-[10px] bg-white/80 px-2.5 py-1.5"
              >
                {Array.from({ length: sticksPerGroup }, (_, stickIndex) => (
                  <span key={stickIndex} className="relative h-9 w-3">
                    <span className="absolute bottom-0 left-1/2 h-9 w-1 -translate-x-1/2 rotate-[-10deg] rounded-full bg-[#8b5a2b]" />
                    <span className="absolute left-1/2 top-2 h-3 w-1 rotate-[38deg] rounded-full bg-[#a06a35]" />
                  </span>
                ))}
              </span>
            ))}
            {remainderSticks > 0 && (
              <span className="flex items-end gap-1.5 rounded-[10px] border-2 border-dashed border-[#c9b8f0] px-2.5 py-1.5">
                {Array.from({ length: remainderSticks }, (_, stickIndex) => (
                  <span key={stickIndex} className="relative h-9 w-3 opacity-60">
                    <span className="absolute bottom-0 left-1/2 h-9 w-1 -translate-x-1/2 rotate-[-10deg] rounded-full bg-[#8b5a2b]" />
                    <span className="absolute left-1/2 top-2 h-3 w-1 rotate-[38deg] rounded-full bg-[#a06a35]" />
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
        <p className="break-words text-3xl font-black leading-tight text-[#6f4ab4]">
          {formatBigIntText(relation.start)}에서 {formatBigIntText(relation.subtrahend)}
          {getNumberJosa(relation.subtrahend, "을", "를")} {formatBigIntText(relation.count)}번 뺐어요
        </p>
        <p className="break-words text-5xl font-black leading-tight text-[#3d285f]">
          {relation.subtractionExpression} = {formatBigIntText(relation.remainder)}
        </p>
        <div className="flex flex-wrap items-stretch justify-center gap-3">
          <div className="min-w-36 rounded-[8px] bg-white px-5 py-3 shadow-[0_4px_0_#ded9ec]">
            <p className="text-sm font-extrabold text-[#7c5cd6]">뺀 뒤 남은 수</p>
            <p className="mt-1 text-3xl font-black text-[#3d285f]">
              {formatBigIntText(relation.remainder)}
            </p>
          </div>
          <div className="min-w-36 rounded-[8px] bg-white px-5 py-3 shadow-[0_4px_0_#ded9ec]">
            <p className="text-sm font-extrabold text-[#7c5cd6]">뺀 횟수</p>
            <p className="mt-1 text-3xl font-black text-[#3d285f]">
              {formatBigIntText(relation.count)}번
            </p>
          </div>
          <div className="min-w-36 rounded-[8px] bg-white px-5 py-3 shadow-[0_4px_0_#ded9ec]">
            <p className="text-sm font-extrabold text-[#d57920]">나눗셈의 답</p>
            <p className="mt-1 text-3xl font-black text-[#d57920]">
              {relation.isComplete ? (
                <>
                  {formatBigIntText(relation.count)}
                  {relation.remainder > 0n && (
                    <span className="ml-2 text-xl">나머지 {formatBigIntText(relation.remainder)}</span>
                  )}
                </>
              ) : (
                "?"
              )}
            </p>
          </div>
        </div>
        <div className="h-px w-full max-w-2xl bg-white" />
        {relation.isComplete ? (
          <>
            <p className="break-words text-3xl font-black leading-snug text-[#3d285f]">
              {formatBigIntText(relation.subtrahend)}
              {getNumberJosa(relation.subtrahend, "을", "를")} {formatBigIntText(relation.count)}번{" "}
              {relation.remainder > 0n
                ? `빼면 ${formatBigIntText(relation.remainder)}${getNumberJosa(relation.remainder, "이", "가")} 남으니`
                : "뺐으니"}
            </p>
            <p className="break-words text-5xl font-black leading-tight text-[#d57920]">
              {relation.divisionExpression} = {formatBigIntText(relation.count)}
              {relation.remainder > 0n && ` … ${formatBigIntText(relation.remainder)}`}
            </p>
          </>
        ) : (
          <p className="break-words text-3xl font-black leading-snug text-[#9f9278]">
            아직 {formatBigIntText(relation.subtrahend)}
            {getNumberJosa(relation.subtrahend, "을", "를")} 더 뺄 수 있어요. 계속 빼보세요!
          </p>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [expression, setExpression] = useState("");
  const [appliedArithmeticExpression, setAppliedArithmeticExpression] = useState("");
  const [appliedSubtractionExpression, setAppliedSubtractionExpression] = useState("");
  const [selectedStandaloneSection, setSelectedStandaloneSection] = useState<StandaloneSection | null>(
    null,
  );
  const [selectedArithmeticTopic, setSelectedArithmeticTopic] = useState<ArithmeticTopic | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<CurriculumGrade["id"] | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<CurriculumSemester["id"] | null>(
    null,
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedSubunit, setSelectedSubunit] = useState<string | null>(null);
  const repeatDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const preview = useMemo(() => getExpressionPreview(expression), [expression]);
  const expressionTokens = useMemo(() => getExpressionDisplayTokens(expression), [expression]);
  const arithmeticRelation = useMemo(
    () => getArithmeticRelation(appliedArithmeticExpression),
    [appliedArithmeticExpression],
  );
  const subtractionRelation = useMemo(
    () => getSubtractionDivisionRelation(appliedSubtractionExpression),
    [appliedSubtractionExpression],
  );
  const selectedGrade = curriculum.find((grade) => grade.id === selectedGradeId) ?? null;
  const selectedSemester =
    selectedGrade?.semesters.find((semester) => semester.id === selectedSemesterId) ?? null;
  const selectedUnit = selectedSemester?.units.find((unit) => unit.id === selectedUnitId) ?? null;
  const curriculumStepTitle = selectedStandaloneSection
    ? selectedArithmeticTopic === "addition-multiplication"
      ? "덧셈과 곱셈"
      : selectedArithmeticTopic === "subtraction-division"
        ? "뺄셈과 나눗셈"
        : "사칙연산"
    : selectedSubunit
      ? selectedSubunit
      : selectedUnit
        ? "소단원 선택"
        : selectedSemester
          ? "대단원 선택"
          : selectedGrade
            ? "학기 선택"
            : "학년 선택";
  const curriculumPath = selectedStandaloneSection
    ? ["사칙연산", curriculumStepTitle !== "사칙연산" ? curriculumStepTitle : null]
        .filter(Boolean)
        .join(" / ")
    : [selectedGrade?.label, selectedSemester?.label, selectedUnit?.title, selectedSubunit]
        .filter(Boolean)
        .join(" / ");
  const canGoBackCurriculumStep = selectedStandaloneSection !== null || selectedGrade !== null;
  const canApplyExpressionToSection = selectedArithmeticTopic !== null && expression.length > 0;

  function selectGrade(gradeId: CurriculumGrade["id"]) {
    setSelectedStandaloneSection(null);
    setSelectedArithmeticTopic(null);
    setSelectedGradeId(gradeId);
    setSelectedSemesterId(null);
    setSelectedUnitId(null);
    setSelectedSubunit(null);
  }

  function selectStandaloneSection(section: StandaloneSection) {
    setSelectedStandaloneSection(section);
    setSelectedArithmeticTopic(null);
    setSelectedGradeId(null);
    setSelectedSemesterId(null);
    setSelectedUnitId(null);
    setSelectedSubunit(null);
  }

  function selectArithmeticTopic(topic: ArithmeticTopic) {
    setSelectedArithmeticTopic(topic);
  }

  function selectSemester(semesterId: CurriculumSemester["id"]) {
    setSelectedSemesterId(semesterId);
    setSelectedUnitId(null);
    setSelectedSubunit(null);
  }

  function selectUnit(unitId: string) {
    setSelectedUnitId(unitId);
    setSelectedSubunit(null);
  }

  function goBackCurriculumStep() {
    if (selectedArithmeticTopic) {
      setSelectedArithmeticTopic(null);
      return;
    }

    if (selectedStandaloneSection) {
      setSelectedStandaloneSection(null);
      return;
    }

    if (selectedSubunit) {
      setSelectedSubunit(null);
      return;
    }

    if (selectedUnitId) {
      setSelectedUnitId(null);
      setSelectedSubunit(null);
      return;
    }

    if (selectedSemesterId) {
      setSelectedSemesterId(null);
      setSelectedSubunit(null);
      return;
    }

    if (selectedGradeId) {
      setSelectedGradeId(null);
      setSelectedSubunit(null);
    }
  }

  function addToken(token: string) {
    setExpression((current) => `${current}${token}`);
  }

  function removeToken() {
    setExpression((current) => current.slice(0, -1));
  }

  function stopRepeatPress() {
    if (repeatDelayRef.current) {
      clearTimeout(repeatDelayRef.current);
      repeatDelayRef.current = null;
    }

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }

  function startRepeatPress(action: () => void, interval: number) {
    stopRepeatPress();
    action();

    repeatDelayRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(action, interval);
    }, buttonRepeatDelay);
  }

  function handleRepeatPointerDown(
    event: PointerEvent<HTMLButtonElement>,
    action: () => void,
    interval: number,
  ) {
    event.preventDefault();
    startRepeatPress(action, interval);
  }

  function handleRepeatKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    action: () => void,
    interval: number,
  ) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!event.repeat) {
      startRepeatPress(action, interval);
    }
  }

  function handleRepeatKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    stopRepeatPress();
  }

  function clearExpression() {
    setExpression("");
  }

  function applyExpressionToCurrentSection() {
    if (!expression) {
      return;
    }

    if (selectedArithmeticTopic === "addition-multiplication") {
      setAppliedArithmeticExpression(expression);
      return;
    }

    if (selectedArithmeticTopic === "subtraction-division") {
      if (expression === appliedSubtractionExpression) {
        const relation = getSubtractionDivisionRelation(expression);

        if (relation.kind === "subtraction" && !relation.isComplete) {
          const nextExpression = `${expression}-${relation.subtrahend.toString()}`;

          setExpression(nextExpression);
          setAppliedSubtractionExpression(nextExpression);
          return;
        }
      }

      setAppliedSubtractionExpression(expression);
    }
  }

  useEffect(() => {
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) {
        return;
      }

      const token = getKeyboardExpressionToken(event.key, event.code);

      if (token) {
        event.preventDefault();
        setExpression((current) => `${current}${token}`);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setExpression((current) => current.slice(0, -1));
      }
    }

    function stopActiveRepeat() {
      if (repeatDelayRef.current) {
        clearTimeout(repeatDelayRef.current);
        repeatDelayRef.current = null;
      }

      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
    }

    document.addEventListener("pointerup", stopActiveRepeat, true);
    document.addEventListener("pointercancel", stopActiveRepeat, true);
    document.addEventListener("mouseup", stopActiveRepeat, true);
    document.addEventListener("touchend", stopActiveRepeat, true);
    document.addEventListener("touchcancel", stopActiveRepeat, true);
    document.addEventListener("visibilitychange", stopActiveRepeat, true);
    window.addEventListener("pointerup", stopActiveRepeat);
    window.addEventListener("pointercancel", stopActiveRepeat);
    window.addEventListener("mouseup", stopActiveRepeat);
    window.addEventListener("touchend", stopActiveRepeat);
    window.addEventListener("touchcancel", stopActiveRepeat);
    window.addEventListener("blur", stopActiveRepeat);
    document.addEventListener("keydown", handleGlobalKeyDown, true);

    return () => {
      document.removeEventListener("pointerup", stopActiveRepeat, true);
      document.removeEventListener("pointercancel", stopActiveRepeat, true);
      document.removeEventListener("mouseup", stopActiveRepeat, true);
      document.removeEventListener("touchend", stopActiveRepeat, true);
      document.removeEventListener("touchcancel", stopActiveRepeat, true);
      document.removeEventListener("visibilitychange", stopActiveRepeat, true);
      window.removeEventListener("pointerup", stopActiveRepeat);
      window.removeEventListener("pointercancel", stopActiveRepeat);
      window.removeEventListener("mouseup", stopActiveRepeat);
      window.removeEventListener("touchend", stopActiveRepeat);
      window.removeEventListener("touchcancel", stopActiveRepeat);
      window.removeEventListener("blur", stopActiveRepeat);
      document.removeEventListener("keydown", handleGlobalKeyDown, true);
      stopActiveRepeat();
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff7ea] text-[#342250]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <span className="absolute left-[5%] top-[6%] h-5 w-5 rounded-full bg-[#ff9ea0]" />
        <span className="absolute right-[7%] top-[12%] h-4 w-4 rounded-full bg-[#80b8ff]" />
        <span className="absolute left-[2%] top-[22%] h-3 w-3 rounded-full bg-[#e873df]" />
        <span className="absolute right-[17%] bottom-[10%] h-4 w-4 rounded-full bg-[#54c978]" />
        {creatures.map((creature) => (
          <div
            key={`background-${creature.value}`}
            className={`absolute opacity-20 ${creature.backgroundPosition}`}
          >
            <div
              className={`relative flex h-28 w-28 items-center justify-center shadow-[inset_0_-10px_0_rgba(61,40,95,0.1)] sm:h-36 sm:w-36 ${creature.color}`}
              style={{
                borderRadius: creature.radius,
                transform: `rotate(${creature.tilt})`,
              }}
            >
              <span className="absolute left-7 top-6 h-5 w-8 rounded-full bg-white/30 blur-[1px]" />
              <span className="absolute left-9 top-10 h-3 w-3 rounded-full bg-[#3d285f]" />
              <span className="absolute right-9 top-10 h-3 w-3 rounded-full bg-[#3d285f]" />
              <span className="absolute top-[62px] h-4 w-8 rounded-b-full border-b-4 border-[#3d285f]" />
              <span className="pt-12 text-4xl font-black text-white/75">{creature.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative flex min-h-[620px] flex-col overflow-hidden rounded-[32px] bg-[#e9e0ff] p-5 shadow-[0_12px_0_#d8cff0] sm:p-7 lg:min-h-[650px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rotate-[-4deg] bg-[#9f70eb] shadow-[inset_0_-7px_0_rgba(61,40,95,0.12)]"
                  style={{
                    borderRadius: "58% 42% 53% 47% / 45% 56% 44% 55%",
                  }}
                />
                <div>
                  <p className="text-lg font-extrabold text-[#6f4ab4]">목차 탐험</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black leading-tight text-[#3c2a5c] sm:text-4xl">
                      {curriculumStepTitle}
                    </h2>
                    {selectedStandaloneSection === "arithmetic" && !selectedArithmeticTopic && (
                      <div className="flex items-center gap-1.5">
                        {operatorKeys.slice(0, 4).map((key, index) => (
                          <span
                            key={key.value}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center text-base font-black shadow-[0_3px_0_rgba(61,40,95,0.16)] ${key.color} ${key.text}`}
                            style={{
                              borderRadius: expressionTileRadii[index % expressionTileRadii.length],
                              transform: `rotate(${expressionTileRotations[index % expressionTileRotations.length]})`,
                            }}
                          >
                            {key.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex w-full min-w-0 items-center justify-end gap-3 sm:w-auto">
                <div className="flex min-h-12 min-w-0 max-w-full items-center justify-center rounded-full bg-white px-5 text-sm font-black text-[#4f8df7] shadow-[0_5px_0_#d8cff0]">
                  <span className="truncate">{curriculumPath || "중학교 수학"}</span>
                </div>
                {canGoBackCurriculumStep && (
                  <button
                    type="button"
                    onClick={goBackCurriculumStep}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-black text-[#7c5cd6] shadow-[0_5px_0_#d8cff0] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
                    aria-label="이전 단계"
                    title="이전 단계"
                  >
                    ←
                  </button>
                )}
              </div>
            </div>

            <div className="relative mt-6 flex-1 overflow-hidden rounded-[28px] border-4 border-white/80 bg-[#f7f4ff]">
              <div className="absolute inset-x-5 bottom-32 top-8 z-20 overflow-y-auto pr-1">
                <div className="mx-auto max-w-4xl">
                  {!selectedGrade && !selectedStandaloneSection && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => selectStandaloneSection("arithmetic")}
                        className="min-h-36 rounded-[8px] bg-white p-5 text-left shadow-[0_6px_0_#ded9ec] transition hover:-translate-y-0.5 hover:bg-[#fff7ea] active:translate-y-0"
                      >
                        <div
                          className="mb-4 flex h-14 w-14 items-center justify-center bg-[#ffb23f] text-2xl font-black text-[#3d285f]"
                          style={{
                            borderRadius: expressionTileRadii[3],
                            transform: `rotate(${expressionTileRotations[3]})`,
                          }}
                        >
                          +×
                        </div>
                        <div className="text-2xl font-black text-[#3d285f]">사칙연산</div>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#6a5a82]">
                          더하기와 곱하기의 관계
                        </p>
                      </button>
                      {curriculum.map((grade, index) => (
                        <button
                          key={grade.id}
                          type="button"
                          onClick={() => selectGrade(grade.id)}
                          className="min-h-36 rounded-[8px] bg-white p-5 text-left shadow-[0_6px_0_#ded9ec] transition hover:-translate-y-0.5 hover:bg-[#fff7ea] active:translate-y-0"
                        >
                          <div
                            className={`mb-4 flex h-14 w-14 items-center justify-center text-xl font-black text-white ${
                              ["bg-[#ff5963]", "bg-[#39b567]", "bg-[#4f8df7]"][index]
                            }`}
                            style={{
                              borderRadius: expressionTileRadii[index % expressionTileRadii.length],
                              transform: `rotate(${expressionTileRotations[index]})`,
                            }}
                          >
                            {grade.label}
                          </div>
                          <div className="text-2xl font-black text-[#3d285f]">{grade.label}</div>
                          <p className="mt-2 text-sm font-bold leading-6 text-[#6a5a82]">
                            {grade.subtitle}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedStandaloneSection === "arithmetic" && !selectedArithmeticTopic && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => selectArithmeticTopic("addition-multiplication")}
                        className="min-h-36 rounded-[8px] bg-white p-5 text-left shadow-[0_6px_0_#ded9ec] transition hover:-translate-y-0.5 hover:bg-[#fff7ea] active:translate-y-0"
                      >
                        <div
                          className="mb-4 flex h-14 w-14 items-center justify-center bg-[#ffb23f] text-2xl font-black text-[#3d285f]"
                          style={{
                            borderRadius: expressionTileRadii[0],
                            transform: `rotate(${expressionTileRotations[0]})`,
                          }}
                        >
                          +×
                        </div>
                        <div className="text-2xl font-black text-[#3d285f]">덧셈과 곱셈</div>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#6a5a82]">
                          반복되는 덧셈을 곱셈으로 묶어보기
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectArithmeticTopic("subtraction-division")}
                        className="min-h-36 rounded-[8px] bg-white p-5 text-left shadow-[0_6px_0_#ded9ec] transition hover:-translate-y-0.5 hover:bg-[#fff7ea] active:translate-y-0"
                      >
                        <div
                          className="mb-4 flex h-14 w-14 items-center justify-center bg-[#4f8df7] text-2xl font-black text-white"
                          style={{
                            borderRadius: expressionTileRadii[1],
                            transform: `rotate(${expressionTileRotations[1]})`,
                          }}
                        >
                          −÷
                        </div>
                        <div className="text-2xl font-black text-[#3d285f]">뺄셈과 나눗셈</div>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#6a5a82]">
                          빼기와 나누기의 관계
                        </p>
                      </button>
                    </div>
                  )}

                  {selectedArithmeticTopic === "addition-multiplication" && (
                    <ArithmeticOperationsSection relation={arithmeticRelation} />
                  )}

                  {selectedArithmeticTopic === "subtraction-division" && (
                    <SubtractionDivisionSection relation={subtractionRelation} />
                  )}

                  {selectedGrade && !selectedSemester && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedGrade.semesters.map((semester, index) => (
                        <button
                          key={semester.id}
                          type="button"
                          onClick={() => selectSemester(semester.id)}
                          className="min-h-32 rounded-[8px] bg-white p-5 text-left shadow-[0_6px_0_#ded9ec] transition hover:-translate-y-0.5 hover:bg-[#fff7ea] active:translate-y-0"
                        >
                          <div className="mb-3 text-sm font-extrabold text-[#7c5cd6]">
                            {selectedGrade.label}
                          </div>
                          <div className="text-3xl font-black text-[#3d285f]">{semester.label}</div>
                          <p className="mt-3 text-sm font-bold text-[#6a5a82]">
                            대단원 {semester.units.length}개
                          </p>
                          <div className="mt-4 h-2 rounded-full bg-[#e9e0ff]">
                            <div
                              className={`h-2 rounded-full ${
                                index === 0 ? "w-2/3 bg-[#ff5963]" : "w-full bg-[#4f8df7]"
                              }`}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedSemester && !selectedUnit && (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {selectedSemester.units.map((unit, index) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => selectUnit(unit.id)}
                          className="rounded-[8px] bg-white p-4 text-left shadow-[0_6px_0_#ded9ec] transition hover:-translate-y-0.5 hover:bg-[#fff7ea] active:translate-y-0"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9f70eb] text-sm font-black text-white">
                              {index + 1}
                            </span>
                            <span>
                              <span className="block text-xl font-black leading-tight text-[#3d285f]">
                                {unit.title}
                              </span>
                              <span className="mt-2 block text-sm font-bold leading-6 text-[#6a5a82]">
                                {unit.subunits.slice(0, 3).join(" · ")}
                                {unit.subunits.length > 3 ? " · ..." : ""}
                              </span>
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedUnit && selectedSubunit === "소수와 합성수" && <PrimeCompositeQuizSection />}

                  {selectedUnit && selectedSubunit !== "소수와 합성수" && (
                    <div className="rounded-[8px] bg-white p-5 shadow-[0_6px_0_#ded9ec]">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-[#7c5cd6]">대단원</p>
                          <h3 className="text-3xl font-black text-[#3d285f]">{selectedUnit.title}</h3>
                        </div>
                        <p className="text-sm font-bold text-[#6a5a82]">
                          소단원 {selectedUnit.subunits.length}개
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedUnit.subunits.map((subunit, index) => (
                          <button
                            key={subunit}
                            type="button"
                            onClick={() => setSelectedSubunit(subunit)}
                            className={`rounded-[8px] p-4 text-left shadow-[0_5px_0_#ded9ec] transition hover:-translate-y-0.5 active:translate-y-0 ${
                              selectedSubunit === subunit ? "bg-[#fffbdf]" : "bg-[#f7f4ff]"
                            }`}
                          >
                            <span className="mb-2 block text-xs font-black text-[#7c5cd6]">
                              {index + 1}번째 소단원
                            </span>
                            <span className="block text-lg font-black text-[#3d285f]">{subunit}</span>
                          </button>
                        ))}
                      </div>
                      {selectedSubunit && (
                        <div className="mt-4 rounded-[8px] bg-[#efe8ff] p-4 text-sm font-bold leading-6 text-[#6a5a82]">
                          선택됨: {selectedSubunit}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-6 z-30 flex flex-col items-center px-5 text-center">
                <div className="flex w-full max-w-3xl items-stretch gap-3">
                  <div className="flex h-[78px] min-w-0 flex-1 items-center justify-end overflow-hidden rounded-[40px] bg-white px-6 py-4 shadow-[0_6px_0_#d8cff0]">
                    {expressionTokens.length > 0 ? (
                      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2 overflow-hidden">
                        {expressionTokens.map((token, index) => {
                          const tile = expressionTileStyles[token.value] ?? expressionTileStyles["0"];
                          const radius = expressionTileRadii[index % expressionTileRadii.length];
                          const rotation = expressionTileRotations[index % expressionTileRotations.length];

                          if (token.kind === "separator") {
                            return (
                              <span
                                key={`${token.value}-${index}`}
                                className="flex h-12 min-w-3 shrink-0 items-end justify-center pb-1 text-2xl font-black leading-none text-[#9f9278]"
                              >
                                {token.value}
                              </span>
                            );
                          }

                          if (token.kind === "operator") {
                            return (
                              <span
                                key={`${token.value}-${index}`}
                                className="flex h-12 min-w-8 shrink-0 items-center justify-center px-1 text-3xl font-black leading-none text-[#4a3470]"
                              >
                                {token.value}
                              </span>
                            );
                          }

                          return (
                            <span
                              key={`${token.value}-${index}`}
                              className={`flex h-12 min-w-12 shrink-0 items-center justify-center px-3 text-2xl font-black shadow-[0_5px_0_rgba(61,40,95,0.16)] ${tile.color} ${tile.text}`}
                              style={{
                                borderRadius: radius,
                                transform: `rotate(${rotation})`,
                              }}
                            >
                              {token.value}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-2xl font-black leading-tight text-[#9f9278] sm:text-3xl">
                        식을 입력해보세요
                      </div>
                    )}
                  </div>
                  {selectedArithmeticTopic !== null && (
                    <button
                      type="button"
                      onClick={applyExpressionToCurrentSection}
                      disabled={!canApplyExpressionToSection}
                      className="h-[78px] w-28 shrink-0 rounded-[28px] bg-[#ffb23f] text-base font-black text-[#3d285f] shadow-[0_6px_0_#b97718] transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-105 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {selectedArithmeticTopic === "subtraction-division" ? "한 번 빼기" : "사용하기"}
                    </button>
                  )}
                </div>
                <div className="mt-3 max-w-full truncate text-sm font-bold text-[#7b7285]">{preview}</div>
              </div>
            </div>
          </div>

          <aside className="flex flex-col rounded-[28px] border-4 border-white/80 bg-[#efe8ff] p-5 text-[#3d285f] shadow-[0_12px_0_#d8cff0] lg:min-h-[650px]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#7c5cd6]">입력 패드</p>
                <h2 className="text-2xl font-black">버튼 입력</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff5963] text-xl font-black text-white shadow-[0_5px_0_#d8a4b2]">
                =
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {numberKeys.map((key) => (
                <button
                  key={key.value}
                  type="button"
                  onPointerDown={(event) =>
                    handleRepeatPointerDown(event, () => addToken(key.value), inputRepeatInterval)
                  }
                  onPointerUp={stopRepeatPress}
                  onPointerCancel={stopRepeatPress}
                  onPointerLeave={stopRepeatPress}
                  onMouseUp={stopRepeatPress}
                  onMouseLeave={stopRepeatPress}
                  onTouchEnd={stopRepeatPress}
                  onTouchCancel={stopRepeatPress}
                  onKeyDown={(event) =>
                    handleRepeatKeyDown(event, () => addToken(key.value), inputRepeatInterval)
                  }
                  onKeyUp={handleRepeatKeyUp}
                  onBlur={stopRepeatPress}
                  className={`flex aspect-square w-full items-center justify-center rounded-full text-3xl font-black transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 ${key.color} ${key.shadow} ${key.text}`}
                  aria-label={`${key.value} 입력`}
                >
                  {key.value}
                </button>
              ))}
              <button
                type="button"
                onPointerDown={(event) =>
                  handleRepeatPointerDown(event, removeToken, deleteRepeatInterval)
                }
                onPointerUp={stopRepeatPress}
                onPointerCancel={stopRepeatPress}
                onPointerLeave={stopRepeatPress}
                onMouseUp={stopRepeatPress}
                onMouseLeave={stopRepeatPress}
                onTouchEnd={stopRepeatPress}
                onTouchCancel={stopRepeatPress}
                onKeyDown={(event) =>
                  handleRepeatKeyDown(event, removeToken, deleteRepeatInterval)
                }
                onKeyUp={handleRepeatKeyUp}
                onBlur={stopRepeatPress}
                className="flex aspect-square w-full items-center justify-center rounded-full bg-[#ffca3a] text-3xl font-black text-[#3d285f] shadow-[0_6px_0_#a98212] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                aria-label="한 글자 지우기"
                title="한 글자 지우기"
              >
                ⌫
              </button>
              <button
                type="button"
                onClick={clearExpression}
                className="flex aspect-square w-full items-center justify-center rounded-full bg-[#ff5963] text-3xl font-black text-white shadow-[0_6px_0_#a62f38] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                aria-label="전체 지우기"
                title="전체 지우기"
              >
                ⟲
              </button>
            </div>

            <div className="my-5 h-px bg-white/20" />

            <div className="grid grid-cols-3 gap-3">
              {operatorKeys.map((key) => (
                <button
                  key={key.value}
                  type="button"
                  onPointerDown={(event) =>
                    handleRepeatPointerDown(event, () => addToken(key.value), inputRepeatInterval)
                  }
                  onPointerUp={stopRepeatPress}
                  onPointerCancel={stopRepeatPress}
                  onPointerLeave={stopRepeatPress}
                  onMouseUp={stopRepeatPress}
                  onMouseLeave={stopRepeatPress}
                  onTouchEnd={stopRepeatPress}
                  onTouchCancel={stopRepeatPress}
                  onKeyDown={(event) =>
                    handleRepeatKeyDown(event, () => addToken(key.value), inputRepeatInterval)
                  }
                  onKeyUp={handleRepeatKeyUp}
                  onBlur={stopRepeatPress}
                  className={`flex aspect-square w-full items-center justify-center rounded-full text-3xl font-black transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 ${key.color} ${key.shadow} ${key.text}`}
                  aria-label={`${key.value} 입력`}
                >
                  {key.value}
                </button>
              ))}
            </div>

          </aside>
        </section>
      </div>
    </main>
  );
}
