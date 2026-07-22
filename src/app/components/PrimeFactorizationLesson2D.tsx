"use client";

import { type FormEvent, useState } from "react";

import PrimeFactorizationConcept2D from "./PrimeFactorizationConcept2D";

const MIN_VALUE = 1;
const MAX_VALUE = 60;

function parseInputValue(rawValue: string) {
  if (!/^\d+$/.test(rawValue)) return null;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) {
    return null;
  }

  return value;
}

function primeFactorsFor(value: number) {
  if (value === 1) return [];

  const factors: number[] = [];
  let remainder = value;

  for (let divisor = 2; divisor * divisor <= remainder; divisor += 1) {
    while (remainder % divisor === 0) {
      factors.push(divisor);
      remainder /= divisor;
    }
  }

  if (remainder > 1) factors.push(remainder);
  return factors;
}

export default function PrimeFactorizationLesson2D() {
  const [draftValue, setDraftValue] = useState("12");
  const [value, setValue] = useState(12);
  const [replayKey, setReplayKey] = useState(0);
  const nextValue = parseInputValue(draftValue);
  const factors = primeFactorsFor(value);
  const factorText = factors.length > 0 ? factors.join(", ") : "없음";

  const applyValue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nextValue === null) return;

    setDraftValue(String(nextValue));
    setValue(nextValue);
    setReplayKey((current) => current + 1);
  };

  return (
    <section className="relative flex min-h-[520px] min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_12px_30px_rgba(111,92,130,0.09)] sm:min-h-[620px] lg:min-h-0">
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 pb-1 pt-4 sm:px-6 sm:pt-5">
        <h2 className="sr-only">소인수분해</h2>

        <form
          className="relative flex min-w-0 items-center gap-2"
          onSubmit={applyValue}
          noValidate
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="소인수분해할 자연수"
            aria-describedby="prime-factorization-input-range"
            aria-invalid={nextValue === null}
            className="h-11 w-20 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-2 text-center font-mono text-2xl font-black text-[var(--control-foreground)] shadow-sm outline-none transition focus:border-[#8068c5] focus:ring-2 focus:ring-[#8068c5]/30 aria-invalid:border-[#d95b67] sm:h-12 sm:w-24 sm:text-3xl"
          />
          <span aria-hidden="true" className="whitespace-nowrap text-2xl font-bold sm:text-3xl">
            소인수분해
          </span>
          <span id="prime-factorization-input-range" className="sr-only">
            1 이상 60 이하의 자연수를 입력하세요.
          </span>
          <button
            type="submit"
            disabled={nextValue === null}
            aria-label="입력한 수 소인수분해 보기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#6d559e] bg-[#8068c5] text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 sm:h-11 sm:w-11"
          >
            ▶
          </button>
          {nextValue === null ? (
            <span
              aria-live="polite"
              aria-label="1 이상 60 이하만 입력할 수 있습니다."
              className="absolute -bottom-4 left-0 w-20 text-center font-mono text-[11px] font-black text-[#d95b67] sm:w-24"
            >
              1–60
            </span>
          ) : null}
        </form>

        <button
          type="button"
          onClick={() => setReplayKey((current) => current + 1)}
          aria-label="소인수분해 애니메이션 다시 보기"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5] sm:h-11 sm:w-11"
        >
          ↻
        </button>
      </header>

      <div
        role="img"
        aria-label={`${value}를 소수로 끝까지 나누는 2D 과정입니다. 최종 소인수는 ${factorText}입니다.`}
        className="relative min-h-[390px] flex-1 sm:min-h-[450px]"
      >
        <PrimeFactorizationConcept2D key={`${value}-${replayKey}`} value={value} />
      </div>
      <p className="sr-only" aria-live="polite">
        {value}의 소인수는 {factorText}입니다.
      </p>
    </section>
  );
}
