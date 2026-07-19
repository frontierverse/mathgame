export type MathFormulaToken =
  | { type: "number"; value: string }
  | { type: "operator"; value: string }
  | { type: "power"; base: string; exponent: string };

export type MathTextSegment =
  | { type: "text"; value: string }
  | {
      type: "formula";
      source: string;
      tokens: readonly MathFormulaToken[];
      ariaLabel: string;
    };

const MATH_PATTERN =
  /(?:\d+\^\d+|\d+)(?:\s*(?:[xX×*+÷/=()\-])\s*(?:\d+\^\d+|\d+))+|(?:\d+\^\d+)/g;
const FORMULA_TOKEN_PATTERN = /(\d+)\^(\d+)|\d+|[xX×*+÷/=()\-]/g;

function normalizeOperator(operator: string) {
  if (operator === "x" || operator === "X" || operator === "*") return "×";
  if (operator === "-") return "−";
  return operator;
}

function tokenizeFormula(source: string): MathFormulaToken[] {
  const tokens: MathFormulaToken[] = [];

  Array.from(source.matchAll(FORMULA_TOKEN_PATTERN)).forEach((match) => {
    const [token, base, exponent] = match;
    if (base && exponent) {
      tokens.push({ type: "power", base, exponent });
      return;
    }
    if (/^\d+$/.test(token)) {
      tokens.push({ type: "number", value: token });
      return;
    }
    tokens.push({ type: "operator", value: normalizeOperator(token) });
  });

  return tokens;
}

function formulaAriaLabel(tokens: readonly MathFormulaToken[]) {
  return tokens
    .map((token) => {
      if (token.type === "power") return `${token.base}의 ${token.exponent}제곱`;
      if (token.type === "operator" && token.value === "×") return "곱하기";
      if (token.type === "operator" && token.value === "÷") return "나누기";
      if (token.type === "operator" && token.value === "=") return "같다";
      if (token.type === "operator" && token.value === "+") return "더하기";
      if (token.type === "operator" && token.value === "−") return "빼기";
      return token.value;
    })
    .join(" ");
}

export function parseMathText(text: string): MathTextSegment[] {
  const segments: MathTextSegment[] = [];
  let cursor = 0;

  Array.from(text.matchAll(MATH_PATTERN)).forEach((match) => {
    const index = match.index ?? 0;
    const source = match[0];
    const tokens = tokenizeFormula(source);

    if (index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, index) });
    }

    if (tokens.length > 0) {
      segments.push({
        type: "formula",
        source,
        tokens,
        ariaLabel: formulaAriaLabel(tokens),
      });
    } else {
      segments.push({ type: "text", value: source });
    }
    cursor = index + source.length;
  });

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}
