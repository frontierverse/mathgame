"use client";

import { useMemo, useState, type FormEvent } from "react";

import DivisorPizzaP5 from "./DivisorPizzaP5";

const DEFAULT_PIZZA_SLICES = 6;
const MAX_PIZZA_SLICES = 120;
const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const GROUP_COLORS = ["#ef9a65", "#72b9c4", "#9a84d4", "#e4b653", "#e8849c", "#71b989"];

function getDivisors(value: number) {
  const divisors: number[] = [];

  for (let divisor = 1; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) {
      divisors.push(divisor);
      if (divisor !== value / divisor) divisors.push(value / divisor);
    }
  }

  return divisors.sort((first, second) => first - second);
}

function getGreatestCommonDivisor(first: number, second: number) {
  let left = first;
  let right = second;

  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }

  return left;
}

function MiniSlice() {
  return <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-[4px] bg-[#f6ca6b] shadow-[inset_0_0_0_2px_#a8642e] [clip-path:polygon(50%_50%,100%_0,100%_100%)]" />;
}

function PeopleGroups({ people, sliceCount }: { people: number; sliceCount: number }) {
  const slicesPerPerson = sliceCount / people;

  return (
    <div className="mt-3 rounded-2xl border border-[var(--control-border)] bg-[var(--control-background)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-black text-[var(--control-foreground)]">1명당</span>
        <span className="font-mono text-lg font-black text-[var(--foreground)]">{slicesPerPerson}조각</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: people }, (_, personIndex) => (
          <div
            key={personIndex}
            className="flex min-h-14 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-2 shadow-sm"
            style={{ borderColor: GROUP_COLORS[personIndex] }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: GROUP_COLORS[personIndex] }}>
              {personIndex + 1}
            </span>
            <span className="flex flex-wrap gap-1">
              {Array.from({ length: slicesPerPerson }, (_, sliceIndex) => (
                <MiniSlice key={sliceIndex} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DivisorChips({
  value,
  divisors,
  commonDivisors,
}: {
  value: number;
  divisors: number[];
  commonDivisors: number[];
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-sm font-black text-[var(--control-foreground)]">{value}의 약수</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {divisors.map((divisor) => {
          const isCommonDivisor = commonDivisors.includes(divisor);

          return (
            <span
              key={divisor}
              className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 font-mono text-sm font-black ${
                isCommonDivisor
                  ? "border-[var(--statistics-series-1)] bg-[var(--control-background-active)] text-[var(--foreground)]"
                  : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)]"
              }`}
            >
              {divisor}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function DivisorsLesson2D() {
  const [pizzaSlices, setPizzaSlices] = useState(DEFAULT_PIZZA_SLICES);
  const [sliceInput, setSliceInput] = useState(String(DEFAULT_PIZZA_SLICES));
  const [commonDivisorValue, setCommonDivisorValue] = useState(8);
  const [commonDivisorInput, setCommonDivisorInput] = useState("8");
  const [people, setPeople] = useState<number | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [showRemainder, setShowRemainder] = useState(false);
  const [activePart, setActivePart] = useState<"divisors" | "division" | "common">("divisors");
  const [inputError, setInputError] = useState<string | null>(null);
  const [commonDivisorError, setCommonDivisorError] = useState<string | null>(null);
  const isDivisor = people !== null && pizzaSlices % people === 0;
  const remainder = people === null ? 0 : pizzaSlices % people;
  const divisors = useMemo(() => getDivisors(pizzaSlices), [pizzaSlices]);
  const comparisonDivisors = useMemo(
    () => getDivisors(commonDivisorValue),
    [commonDivisorValue],
  );
  const commonDivisors = useMemo(
    () => divisors.filter((divisor) => comparisonDivisors.includes(divisor)),
    [divisors, comparisonDivisors],
  );
  const greatestCommonDivisor = useMemo(
    () => getGreatestCommonDivisor(pizzaSlices, commonDivisorValue),
    [pizzaSlices, commonDivisorValue],
  );
  const divisionResults = PEOPLE_OPTIONS.filter((divisor) => divisor <= pizzaSlices).map((divisor) => ({
    divisor,
    quotient: Math.floor(pizzaSlices / divisor),
    remainder: pizzaSlices % divisor,
  }));

  function submitSliceCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextSliceCount = Number(sliceInput);
    if (!Number.isInteger(nextSliceCount) || nextSliceCount < 1 || nextSliceCount > MAX_PIZZA_SLICES) {
      setInputError(`1–${MAX_PIZZA_SLICES}`);
      return;
    }

    setPizzaSlices(nextSliceCount);
    setSliceInput(String(nextSliceCount));
    setPeople(null);
    setReplayKey((current) => current + 1);
    setShowRemainder(false);
    setActivePart("divisors");
    setInputError(null);
  }

  function resetLesson() {
    setPizzaSlices(DEFAULT_PIZZA_SLICES);
    setSliceInput(String(DEFAULT_PIZZA_SLICES));
    setCommonDivisorValue(8);
    setCommonDivisorInput("8");
    setPeople(null);
    setReplayKey((current) => current + 1);
    setShowRemainder(false);
    setActivePart("divisors");
    setInputError(null);
    setCommonDivisorError(null);
  }

  function submitCommonDivisorValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValue = Number(commonDivisorInput);
    if (!Number.isInteger(nextValue) || nextValue < 1 || nextValue > MAX_PIZZA_SLICES) {
      setCommonDivisorError(`1–${MAX_PIZZA_SLICES}`);
      return;
    }

    setCommonDivisorValue(nextValue);
    setCommonDivisorInput(String(nextValue));
    setCommonDivisorError(null);
  }

  return (
    <section className="relative flex min-h-[620px] min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-[#d9c8e9] bg-[#fffefa] shadow-[0_12px_30px_rgba(111,92,130,0.09)] sm:min-h-[680px] lg:min-h-0">
      <header className="relative z-20 flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#8068c5]">CHAPTER 12</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">약수</h2>
        </div>
        <button
          type="button"
          onClick={resetLesson}
          aria-label="약수 활동 다시 시작"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5]"
        >
          ↻
        </button>
      </header>

      <div className="relative z-10 grid flex-1 gap-3 px-4 pb-5 sm:px-7 lg:grid-cols-[minmax(280px,0.9fr)_minmax(360px,1.1fr)] lg:items-center lg:gap-8">
        <div
          role="img"
          aria-label={
            people === null
              ? `피자 ${pizzaSlices}조각을 남김없이 나눌 수 있는 사람 수는 ${divisors.join(", ")}명입니다.`
              : isDivisor
                ? `피자 ${pizzaSlices}조각을 ${people}명이 ${pizzaSlices / people}조각씩 나누는 애니메이션입니다.`
                : `피자 ${pizzaSlices}조각을 ${people}명에게 나누면 ${remainder}조각이 남는 애니메이션입니다.`
          }
          className="relative min-h-[280px] sm:min-h-[320px]"
        >
          <DivisorPizzaP5
            people={activePart === "divisors" ? people : null}
            replayKey={replayKey}
            sliceCount={pizzaSlices}
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <form onSubmit={submitSliceCount} className="flex flex-wrap items-end gap-2" noValidate>
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-black text-[var(--muted)]">조각</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max={MAX_PIZZA_SLICES}
                step="1"
                value={sliceInput}
                onChange={(event) => {
                  setSliceInput(event.target.value);
                  setInputError(null);
                }}
                aria-label="피자 조각 수"
                aria-describedby="pizza-slice-hint"
                className="min-h-11 w-full rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-3 font-mono text-lg font-black text-[var(--foreground)] outline-none transition focus:border-[#8068c5] focus-visible:ring-2 focus-visible:ring-[#8068c5]"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-[var(--statistics-series-2)] px-4 font-black text-[var(--control-background)] shadow-[0_4px_0_color-mix(in_srgb,var(--statistics-series-2)_65%,black)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--statistics-series-2)] focus-visible:ring-offset-2 active:translate-y-0"
            >
              적용
            </button>
          </form>
          <p id="pizza-slice-hint" aria-live="polite" className="mt-1 min-h-4 text-xs font-black text-[#8068c5]">
            {inputError ?? `1–${MAX_PIZZA_SLICES}`}
          </p>

          {activePart === "division" ? (
            <div className="grid gap-2" aria-label={`${pizzaSlices} 조각을 1부터 6까지 나눈 결과`}>
              {divisionResults.map((division) => {
                const dividesEvenly = division.remainder === 0;

                return (
                  <div
                    key={division.divisor}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 py-3 font-black"
                    style={
                      dividesEvenly
                        ? {
                            borderColor: "var(--statistics-series-2)",
                            backgroundColor: "color-mix(in srgb, var(--statistics-series-2) 18%, var(--surface))",
                          }
                        : undefined
                    }
                  >
                    <span className="font-mono text-lg text-[var(--foreground)]">
                      {pizzaSlices} ÷ {division.divisor} = {division.quotient}
                    </span>
                    <span className="text-sm text-[var(--control-foreground)]">나머지 {division.remainder}</span>
                  </div>
                );
              })}
            </div>
          ) : activePart === "common" ? null : (
            <>
              <p className="max-w-xl text-lg font-black leading-relaxed tracking-[-0.03em] text-[var(--foreground)] sm:text-xl">
                피자 {pizzaSlices}조각이 있어요.<br />
                몇 명이 먹어야{" "}
                <span
                  tabIndex={0}
                  title="나머지 0"
                  aria-label={showRemainder ? "나머지 0" : "남김없이"}
                  onMouseEnter={() => setShowRemainder(true)}
                  onMouseLeave={() => setShowRemainder(false)}
                  onFocus={() => setShowRemainder(true)}
                  onBlur={() => setShowRemainder(false)}
                  className="inline-flex border-b border-dashed border-current text-[var(--statistics-series-2)] outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--statistics-series-2)]"
                >
                  {showRemainder ? "나머지 0" : "남김없이"}
                </span>{" "}
                다 같이 먹을 수 있을까?
              </p>

              <div className="mt-5" role="group" aria-label="피자를 먹을 사람 수 선택">
                <p className="mb-2 text-xs font-black text-[var(--muted)]">사람 수</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
                  {PEOPLE_OPTIONS.filter((option) => option <= pizzaSlices).map((option) => {
                    const selected = people === option;
                    const valid = pizzaSlices % option === 0;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPeople(option)}
                        aria-pressed={selected}
                        className={`min-h-12 rounded-xl border px-2 py-2 font-mono text-base font-black shadow-[0_3px_0_rgba(99,77,125,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5] active:translate-y-0 ${
                          selected
                            ? valid
                              ? "border-[#4a9b68] bg-[var(--lesson-marker-complete-background)] text-[var(--foreground)]"
                              : "border-[#d95b67] bg-[var(--surface)] text-[var(--foreground)]"
                            : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] hover:border-[#8068c5]"
                        }`}
                      >
                        {option}명
                      </button>
                    );
                  })}
                </div>
              </div>

              {people === null ? (
                <p className="mt-4 rounded-xl border border-dashed border-[var(--control-border)] bg-[var(--control-background)] px-4 py-3 text-sm font-black text-[var(--control-foreground)]">
                  몇 명을 골라 볼까요?
                </p>
              ) : isDivisor ? (
                <div aria-live="polite">
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#4a9b68] bg-[var(--lesson-marker-complete-background)] px-4 py-3 font-mono text-lg font-black text-[var(--foreground)]">
                    {pizzaSlices} ÷ {people} = {pizzaSlices / people}
                    <span className="font-sans text-sm text-[var(--statistics-series-2)]">나머지 0</span>
                  </p>
                  <PeopleGroups people={people} sliceCount={pizzaSlices} />
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[var(--control-background-active)] px-4 py-3">
                    <span className="text-sm font-black text-[var(--control-foreground)]">{pizzaSlices}의 약수</span>
                    <span className="font-mono text-lg font-black tracking-[0.12em] text-[var(--foreground)]">
                      {divisors.join(" · ")}
                    </span>
                  </div>
                </div>
              ) : (
                <p aria-live="polite" className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-[#d95b67] bg-[var(--surface)] px-4 py-3 font-black text-[var(--foreground)]">
                  <span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#d95b67]" />
                  {remainder}조각 남아요
                </p>
              )}
            </>
          )}

          {activePart === "common" ? (
            <section className="mt-5 border-t border-[var(--border)] pt-4" aria-label="공약수와 최대공약수">
            <form onSubmit={submitCommonDivisorValue} noValidate className="flex flex-wrap items-end gap-2">
              <span className="pb-2 text-sm font-black text-[var(--control-foreground)]">공약수</span>
              <label className="flex w-24 flex-col gap-1">
                <span className="text-xs font-black text-[var(--muted)]">둘째 수</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={MAX_PIZZA_SLICES}
                  step="1"
                  value={commonDivisorInput}
                  onChange={(event) => {
                    setCommonDivisorInput(event.target.value);
                    setCommonDivisorError(null);
                  }}
                  aria-label="공약수를 찾을 둘째 수"
                  aria-describedby="common-divisor-input-range"
                  className="h-10 w-full rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-2 text-center font-mono text-lg font-black text-[var(--foreground)] outline-none transition focus:border-[#8068c5] focus-visible:ring-2 focus-visible:ring-[#8068c5]"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-xl bg-[var(--control-background-active)] px-4 font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5]"
              >
                적용
              </button>
              <span id="common-divisor-input-range" aria-live="polite" className="pb-2 text-xs font-black text-[var(--muted)]">
                {commonDivisorError ?? `1–${MAX_PIZZA_SLICES}`}
              </span>
            </form>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <DivisorChips value={pizzaSlices} divisors={divisors} commonDivisors={commonDivisors} />
              <DivisorChips
                value={commonDivisorValue}
                divisors={comparisonDivisors}
                commonDivisors={commonDivisors}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--control-background-active)] px-4 py-3">
                <span className="text-sm font-black text-[var(--control-foreground)]">공약수</span>
                <p className="mt-1 break-words font-mono text-lg font-black text-[var(--foreground)]">
                  {commonDivisors.join(" · ")}
                </p>
              </div>
              <div className="rounded-xl border-2 border-[var(--statistics-series-1)] bg-[var(--control-background-active)] px-4 py-3">
                <span className="text-sm font-black text-[var(--control-foreground)]">최대공약수</span>
                <p className="mt-1 font-mono text-2xl font-black text-[var(--foreground)]">
                  {greatestCommonDivisor}
                </p>
              </div>
            </div>
            </section>
          ) : null}
        </div>
      </div>

      <footer className="relative z-20 flex justify-center gap-3 px-5 pb-5 pt-1">
        <button
          type="button"
          disabled={activePart === "divisors"}
          onClick={() =>
            setActivePart((current) =>
              current === "common" ? "division" : "divisors",
            )
          }
          className="min-w-28 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-6 py-3 text-base font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() =>
            setActivePart((current) =>
              current === "divisors" ? "division" : current === "division" ? "common" : "divisors",
            )
          }
          className="min-w-28 rounded-xl bg-[var(--statistics-series-2)] px-6 py-3 text-base font-black text-[var(--control-background)] shadow-[0_4px_0_color-mix(in_srgb,var(--statistics-series-2)_65%,black)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--statistics-series-2)] focus-visible:ring-offset-2 active:translate-y-0"
        >
          {activePart === "common" ? "처음" : "다음"}
        </button>
      </footer>
    </section>
  );
}
