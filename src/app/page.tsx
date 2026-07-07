"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

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

export default function Home() {
  const [expression, setExpression] = useState("");
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
  const selectedGrade = curriculum.find((grade) => grade.id === selectedGradeId) ?? null;
  const selectedSemester =
    selectedGrade?.semesters.find((semester) => semester.id === selectedSemesterId) ?? null;
  const selectedUnit = selectedSemester?.units.find((unit) => unit.id === selectedUnitId) ?? null;
  const curriculumStepTitle = selectedUnit
    ? "소단원 선택"
    : selectedSemester
      ? "대단원 선택"
      : selectedGrade
        ? "학기 선택"
        : "학년 선택";
  const curriculumPath = [selectedGrade?.label, selectedSemester?.label, selectedUnit?.title, selectedSubunit]
    .filter(Boolean)
    .join(" / ");

  function selectGrade(gradeId: CurriculumGrade["id"]) {
    setSelectedGradeId(gradeId);
    setSelectedSemesterId(null);
    setSelectedUnitId(null);
    setSelectedSubunit(null);
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

  useEffect(() => {
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
                  <h2 className="text-3xl font-black leading-tight text-[#3c2a5c] sm:text-4xl">
                    {curriculumStepTitle}
                  </h2>
                </div>
              </div>
              <div className="flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-[#4f8df7] shadow-[0_5px_0_#d8cff0]">
                {curriculumPath || "중학교 수학"}
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-base font-bold leading-7 text-[#4f4664] sm:text-lg">
              학년, 학기, 대단원, 소단원을 차례대로 선택해 오늘 탐험할 수학 개념을
              정해보세요. 오른쪽 버튼 입력은 언제든 사용할 수 있어요.
            </p>

            <div className="relative mt-6 flex-1 overflow-hidden rounded-[28px] border-4 border-white/80 bg-[#f7f4ff]">
              <div className="absolute inset-x-5 bottom-32 top-8 z-20 overflow-y-auto pr-1">
                <div className="mx-auto max-w-4xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#7c5cd6]">{curriculumStepTitle}</p>
                      <h3 className="text-2xl font-black text-[#3d285f]">
                        {curriculumPath || "학년을 먼저 골라주세요"}
                      </h3>
                    </div>
                    {selectedGrade && (
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

                  {!selectedGrade && (
                    <div className="grid gap-3 sm:grid-cols-3">
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

                  {selectedUnit && (
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
                <div className="flex min-h-[78px] w-full max-w-xl items-center justify-center rounded-[40px] bg-white px-6 py-4 shadow-[0_6px_0_#d8cff0]">
                  {expressionTokens.length > 0 ? (
                    <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
                      {expressionTokens.map((token, index) => {
                        const tile = expressionTileStyles[token.value] ?? expressionTileStyles["0"];
                        const radius = expressionTileRadii[index % expressionTileRadii.length];
                        const rotation = expressionTileRotations[index % expressionTileRotations.length];

                        if (token.kind === "separator") {
                          return (
                            <span
                              key={`${token.value}-${index}`}
                              className="flex h-12 min-w-3 items-end justify-center pb-1 text-2xl font-black leading-none text-[#9f9278]"
                            >
                              {token.value}
                            </span>
                          );
                        }

                        if (token.kind === "operator") {
                          return (
                            <span
                              key={`${token.value}-${index}`}
                              className="flex h-12 min-w-8 items-center justify-center px-1 text-3xl font-black leading-none text-[#4a3470]"
                            >
                              {token.value}
                            </span>
                          );
                        }

                        return (
                          <span
                            key={`${token.value}-${index}`}
                            className={`flex h-12 min-w-12 items-center justify-center px-3 text-2xl font-black shadow-[0_5px_0_rgba(61,40,95,0.16)] ${tile.color} ${tile.text}`}
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
                <div className="mt-3 text-sm font-bold text-[#7b7285]">{preview}</div>
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
