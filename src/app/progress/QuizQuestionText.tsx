import { parseMathText } from "../shared/mathText";

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

function renderPowers(text: string) {
  return parseMathText(text).map((segment, index) =>
    segment.type === "text" ? (
      segment.value
    ) : (
      <span
        key={`${index}-${segment.source}`}
        role="math"
        aria-label={`${segment.base}의 ${segment.exponent}제곱`}
        className="inline-block whitespace-nowrap tracking-normal"
      >
        <span aria-hidden="true">
          {segment.base}
          <sup className="ml-[0.04em]">{segment.exponent}</sup>
        </span>
      </span>
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
        <p className="break-keep">{renderPowers(instruction)}</p>
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
                {renderPowers(item.text)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
