export type MathTextSegment =
  | { type: "text"; value: string }
  | { type: "power"; base: string; exponent: string; source: string };

const POWER_PATTERN = /(\d+)\^(\d+)/g;

export function parseMathText(text: string): MathTextSegment[] {
  const segments: MathTextSegment[] = [];
  let cursor = 0;

  Array.from(text.matchAll(POWER_PATTERN)).forEach((match) => {
    const index = match.index ?? 0;
    const [source, base, exponent] = match;

    if (index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, index) });
    }
    segments.push({ type: "power", base, exponent, source });
    cursor = index + source.length;
  });

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}
