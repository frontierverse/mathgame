"use client";

import { type FormEvent, useState } from "react";

import PrimeFactorArrayP5 from "./PrimeFactorArrayP5";

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

function classificationFor(value: number) {
  if (value === 1) return "소수·합성수 아님";

  let divisorCount = 0;
  for (let divisor = 1; divisor * divisor <= value; divisor += 1) {
    if (value % divisor !== 0) continue;

    divisorCount += divisor * divisor === value ? 1 : 2;
  }

  return divisorCount === 2 ? "소수" : "합성수";
}

function divisorsFor(value: number) {
  const divisors: number[] = [];

  for (let divisor = 1; divisor * divisor <= value; divisor += 1) {
    if (value % divisor !== 0) continue;

    divisors.push(divisor);
    if (divisor !== value / divisor) divisors.push(value / divisor);
  }

  return divisors.sort((first, second) => first - second);
}

export default function PrimeCompositeLesson2D() {
  const [draftValue, setDraftValue] = useState("12");
  const [value, setValue] = useState(12);
  const [replayKey, setReplayKey] = useState(0);
  const nextValue = parseInputValue(draftValue);
  const classification = classificationFor(value);
  const divisors = divisorsFor(value);

  const applyValue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nextValue === null) return;

    setDraftValue(String(nextValue));
    setValue(nextValue);
    setReplayKey((current) => current + 1);
  };

  return (
    <section className="relative flex min-h-[520px] min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_12px_30px_rgba(111,92,130,0.09)] sm:min-h-[620px] lg:min-h-0">
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-4 sm:px-6 sm:pt-5">
        <h2 className="sr-only">소수와 합성수</h2>

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
            aria-label="소수와 합성수를 확인할 자연수"
            aria-describedby="prime-composite-input-range"
            aria-invalid={nextValue === null}
            className="h-11 w-20 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-2 text-center font-mono text-2xl font-black text-[var(--control-foreground)] shadow-sm outline-none transition focus:border-[#8068c5] focus:ring-2 focus:ring-[#8068c5]/30 aria-invalid:border-[#d95b67] sm:h-12 sm:w-24 sm:text-3xl"
          />
          <span aria-hidden="true" className="text-2xl font-bold sm:text-3xl">
            →
          </span>
          <span
            className="whitespace-nowrap rounded-full border border-[#8068c5] bg-[var(--control-background-active)] px-3 py-2 text-sm font-black text-[var(--foreground)] sm:text-base"
            aria-live="polite"
          >
            {classification}
          </span>
          <span id="prime-composite-input-range" className="sr-only">
            1 이상 60 이하의 자연수를 입력하세요.
          </span>
          <button
            type="submit"
            disabled={nextValue === null}
            aria-label="입력한 수 확인"
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
          aria-label="소수와 합성수 애니메이션 다시 보기"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5] sm:h-11 sm:w-11"
        >
          ↻
        </button>
      </header>

      <div
        role="img"
        aria-label={`${value}개의 블록을 약수쌍에 따라 여러 직사각형 모양으로 배열합니다. 만들 수 있는 직사각형은 ${Math.ceil(divisors.length / 2)}가지이며, 결과는 ${classification}입니다. 약수는 ${divisors.join(", ")}입니다.`}
        className="relative min-h-[390px] flex-1 sm:min-h-[450px]"
      >
        <PrimeFactorArrayP5 key={`${value}-${replayKey}`} value={value} replayKey={replayKey} />
      </div>
      <p className="sr-only" aria-live="polite">
        {value}는 {classification}입니다.
      </p>
    </section>
  );
}
