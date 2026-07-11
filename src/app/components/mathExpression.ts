import type { ExactValue, ExpressionPreview } from "./types";

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

function exact(numerator: bigint, denominator = 1n): ExactValue {
  if (denominator === 0n) throw new Error("0으로 나눌 수 없습니다");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);

  return {
    numerator: (numerator * sign) / divisor,
    denominator: (denominator < 0n ? -denominator : denominator) / divisor,
  };
}

function evaluateExpression(expression: string): ExactValue {
  const input = expression.replaceAll("×", "*").replaceAll("÷", "/").replace(/\s/g, "");
  let index = 0;

  function parseExpression(): ExactValue {
    let value = parseTerm();
    while (input[index] === "+" || input[index] === "-") {
      const operator = input[index++];
      const right = parseTerm();
      value = operator === "+"
        ? exact(value.numerator * right.denominator + right.numerator * value.denominator, value.denominator * right.denominator)
        : exact(value.numerator * right.denominator - right.numerator * value.denominator, value.denominator * right.denominator);
    }
    return value;
  }

  function parseTerm(): ExactValue {
    let value = parseFactor();
    while (input[index] === "*" || input[index] === "/") {
      const operator = input[index++];
      const right = parseFactor();
      value = operator === "*"
        ? exact(value.numerator * right.numerator, value.denominator * right.denominator)
        : exact(value.numerator * right.denominator, value.denominator * right.numerator);
    }
    return value;
  }

  function parseFactor(): ExactValue {
    if (input[index] === "+") {
      index += 1;
      return parseFactor();
    }
    if (input[index] === "-") {
      index += 1;
      const value = parseFactor();
      return exact(-value.numerator, value.denominator);
    }
    if (input[index] === "(") {
      index += 1;
      const value = parseExpression();
      if (input[index] !== ")") throw new Error("괄호를 닫아주세요");
      index += 1;
      return value;
    }
    const start = index;
    while (/\d/.test(input[index] ?? "")) index += 1;
    if (start === index) throw new Error("숫자를 입력해주세요");
    return exact(BigInt(input.slice(start, index)));
  }

  const result = parseExpression();
  if (!input || index !== input.length) throw new Error("식을 완성해주세요");
  return result;
}

function formatInteger(value: bigint) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatResult(value: ExactValue) {
  if (value.denominator === 1n) return formatInteger(value.numerator);
  return `${formatInteger(value.numerator)} / ${formatInteger(value.denominator)}`;
}

export function getPreview(expression: string): ExpressionPreview {
  if (!expression) return { label: "식을 입력하면 공간이 반응합니다", result: null };
  try {
    return { label: "계산 결과", result: formatResult(evaluateExpression(expression)) };
  } catch {
    return { label: "식을 완성해 주세요", result: null };
  }
}

export function getKeyboardToken(key: string, code: string) {
  if (/^\d$/.test(key)) return key;
  const numpad = code.match(/^Numpad(\d)$/);
  if (numpad) return numpad[1];
  if (["+", "-", "(", ")"].includes(key)) return key;
  if (key === "*" || key.toLowerCase() === "x" || code === "NumpadMultiply") return "×";
  if (key === "/" || code === "NumpadDivide") return "÷";
  if (code === "NumpadAdd") return "+";
  if (code === "NumpadSubtract") return "-";
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
