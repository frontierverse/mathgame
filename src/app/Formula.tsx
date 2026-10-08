import type { MathToken } from "./curriculum";

export default function Formula({ tokens, label, question = false, highlight }: {
  tokens: readonly MathToken[];
  label: string;
  question?: boolean;
  highlight?: "numerator" | "direction";
}) {
  return (
    <math xmlns="http://www.w3.org/1998/Math/MathML" aria-label={question ? `${label}의 계산 결과를 고르세요.` : label}>
      <mrow>
        {tokens.map((token, index) => {
          if (Array.isArray(token)) {
            const [numerator, denominator] = token;
            const direction = highlight === "direction" ? (numerator < 0 ? "negative-number" : "positive-number") : undefined;
            return <mrow key={index} className={direction}>
              {numerator < 0 && <mo>−</mo>}
              <mfrac><mn className={highlight === "numerator" ? "numerator-highlight" : undefined}>{Math.abs(numerator)}</mn><mn>{denominator}</mn></mfrac>
            </mrow>;
          }
          return typeof token === "number"
            ? <mn key={index} className={highlight === "numerator" && token !== 0 ? "numerator-highlight" : undefined}>{token < 0 ? `−${Math.abs(token)}` : token}</mn>
            : <mo key={index} stretchy="false">{token}</mo>;
        })}
        {question && <><mo>=</mo><mo className="question-mark">?</mo></>}
      </mrow>
    </math>
  );
}
