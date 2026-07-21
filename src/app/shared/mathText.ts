export type MathFormulaToken =
  | { type: "number"; value: string; sign?: "+" | "-" }
  | { type: "operator"; value: string }
  | { type: "power"; base: string; exponent: string }
  | {
      type: "fraction";
      numerator: string;
      denominator: string;
      sign?: "+" | "-";
    };

export type MathTextSegment =
  | { type: "text"; value: string }
  | {
      type: "formula";
      source: string;
      tokens: readonly MathFormulaToken[];
      ariaLabel: string;
    };

const MATH_PATTERN =
  /(?:\d+\^\d+|[+-]?\d+(?:\/\d+)?)(?:\s*(?:[xX×*+÷/=()\-<>])\s*(?:\d+\^\d+|[+-]?\d+(?:\/\d+)?))+|\|[+-]?\d+(?:\/\d+)?\||[+-]?\d+\/\d+|[+-]\d+|\d+\^\d+/g;
const FORMULA_TOKEN_PATTERN =
  /([+-]?\d+)\/(\d+)|(\d+)\^(\d+)|\d+|[xX×*+÷/=()\-<>|]/g;

function normalizeOperator(operator: string) {
  if (operator === "x" || operator === "X" || operator === "*") return "×";
  if (operator === "-") return "−";
  return operator;
}

function isUnarySign(
  rawTokens: readonly RegExpMatchArray[],
  tokenIndex: number,
) {
  if (tokenIndex === 0) return true;

  const previousToken = rawTokens[tokenIndex - 1]?.[0] ?? "";
  return /^[xX×*+÷/=()\-<>|]$/.test(previousToken);
}

function tokenizeFormula(source: string): MathFormulaToken[] {
  const tokens: MathFormulaToken[] = [];
  const rawTokens = Array.from(source.matchAll(FORMULA_TOKEN_PATTERN));

  for (let tokenIndex = 0; tokenIndex < rawTokens.length; tokenIndex += 1) {
    const match = rawTokens[tokenIndex];
    const [token, fractionNumerator, fractionDenominator, base, exponent] = match;
    if (fractionNumerator && fractionDenominator) {
      const sign = fractionNumerator.startsWith("-")
        ? "-"
        : fractionNumerator.startsWith("+")
          ? "+"
          : undefined;
      tokens.push({
        type: "fraction",
        numerator: sign ? fractionNumerator.slice(1) : fractionNumerator,
        denominator: fractionDenominator,
        ...(sign ? { sign } : {}),
      });
      continue;
    }
    if (base && exponent) {
      tokens.push({ type: "power", base, exponent });
      continue;
    }
    if (
      (token === "+" || token === "-") &&
      isUnarySign(rawTokens, tokenIndex) &&
      /^\d+$/.test(rawTokens[tokenIndex + 1]?.[0] ?? "")
    ) {
      tokens.push({
        type: "number",
        value: rawTokens[tokenIndex + 1][0],
        sign: token,
      });
      tokenIndex += 1;
      continue;
    }
    if (/^\d+$/.test(token)) {
      tokens.push({ type: "number", value: token });
      continue;
    }
    tokens.push({ type: "operator", value: normalizeOperator(token) });
  }

  return tokens;
}

function valueAriaLabel(token: MathFormulaToken) {
  if (token.type === "number") {
    const sign = token.sign === "-" ? "음수 " : token.sign === "+" ? "양수 " : "";
    return `${sign}${token.value}`;
  }
  if (token.type === "fraction") {
    const sign = token.sign === "-" ? "음수 " : token.sign === "+" ? "양수 " : "";
    return `${sign}${token.denominator}분의 ${token.numerator}`;
  }
  return null;
}

function formulaAriaLabel(tokens: readonly MathFormulaToken[]) {
  const isAbsoluteValue =
    tokens.length === 3 &&
    tokens[0]?.type === "operator" &&
    tokens[0].value === "|" &&
    tokens[2]?.type === "operator" &&
    tokens[2].value === "|";
  const absoluteValue = isAbsoluteValue ? valueAriaLabel(tokens[1]) : null;

  if (absoluteValue) return `${absoluteValue}의 절댓값`;

  return tokens
    .map((token) => {
      if (token.type === "number") return valueAriaLabel(token);
      if (token.type === "power") return `${token.base}의 ${token.exponent}제곱`;
      if (token.type === "fraction") return valueAriaLabel(token);
      if (token.type === "operator" && token.value === "×") return "곱하기";
      if (token.type === "operator" && token.value === "÷") return "나누기";
      if (token.type === "operator" && token.value === "=") return "같다";
      if (token.type === "operator" && token.value === "+") return "더하기";
      if (token.type === "operator" && token.value === "−") return "빼기";
      if (token.type === "operator" && token.value === "<") return "작다";
      if (token.type === "operator" && token.value === ">") return "크다";
      if (token.type === "operator" && token.value === "|") return "절댓값";
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
