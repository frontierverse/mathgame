import { createElement } from "react";
import { parseMathText, type MathFormulaToken } from "../shared/mathText";

type QuizQuestionTextProps = {
  text: string;
  className?: string;
};

type NumberedItem = {
  number: string;
  text: string;
};

const NUMBERED_ITEM_PATTERN = /\((\d+)\)\s*/g;

function splitNumberedItems(text: string) {
  const matches = Array.from(text.matchAll(NUMBERED_ITEM_PATTERN)).filter(
    (match) => {
      const index = match.index ?? 0;
      return index === 0 || /\s/.test(text[index - 1]);
    },
  );

  const isSequentialList =
    matches.length > 1 &&
    matches.every((match, index) => Number(match[1]) === index + 1);

  if (!isSequentialList) {
    return { instruction: text, items: [] as NumberedItem[] };
  }

  const firstItemIndex = matches[0].index ?? 0;
  const items = matches.map((match, index) => {
    const itemStart = (match.index ?? 0) + match[0].length;
    const itemEnd = matches[index + 1]?.index ?? text.length;

    return {
      number: match[1],
      text: text.slice(itemStart, itemEnd).trim(),
    };
  });

  return {
    instruction: text.slice(0, firstItemIndex).trim(),
    items,
  };
}

function renderFormulaToken(token: MathFormulaToken, index: number) {
  if (token.type === "number") {
    return token.sign
      ? createElement(
          "mrow",
          { key: `number-${index}` },
          createElement("mo", null, token.sign === "-" ? "−" : token.sign),
          createElement("mn", null, token.value),
        )
      : createElement("mn", { key: `number-${index}` }, token.value);
  }

  if (token.type === "operator") {
    return createElement("mo", { key: `operator-${index}` }, token.value);
  }

  if (token.type === "fraction") {
    const fraction = createElement(
      "mfrac",
      null,
      createElement("mn", null, token.numerator),
      createElement("mn", null, token.denominator),
    );

    return token.sign
      ? createElement(
          "mrow",
          { key: `fraction-${index}` },
          createElement("mo", null, token.sign === "-" ? "−" : token.sign),
          fraction,
        )
      : createElement("mrow", { key: `fraction-${index}` }, fraction);
  }

  return createElement(
    "msup",
    { key: `power-${index}` },
    createElement("mn", null, token.base),
    createElement("mn", null, token.exponent),
  );
}

function renderMathText(text: string) {
  return parseMathText(text).map((segment, index) =>
    segment.type === "text" ? (
      segment.value
    ) : (
      createElement(
        "math",
        {
          key: `${index}-${segment.source}`,
          display: "inline",
          role: "math",
          "aria-label": segment.ariaLabel,
          className:
            "mx-[0.08em] inline-block align-[-0.12em] whitespace-nowrap tracking-normal",
        },
        createElement("mrow", null, segment.tokens.map(renderFormulaToken)),
      )
    ),
  );
}

export default function QuizQuestionText({
  text,
  className = "",
}: QuizQuestionTextProps) {
  const { instruction, items } = splitNumberedItems(text);

  return (
    <div className={className}>
      {instruction ? (
        <p className="break-keep">{renderMathText(instruction)}</p>
      ) : null}

      {items.length > 0 ? (
        <ol
          className={`grid list-none gap-[0.35em] pl-0 ${instruction ? "mt-[0.65em]" : ""}`}
        >
          {items.map((item) => (
            <li
              key={item.number}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-[0.45em]"
            >
              <span aria-hidden="true" className="tabular-nums">
                ({item.number})
              </span>
              <span className="min-w-0 break-keep tracking-normal">
                {renderMathText(item.text)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
