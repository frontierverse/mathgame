"use client";

import { useMemo, useState, type FormEvent } from "react";

import PrimeFactorizationLesson2D from "./PrimeFactorizationLesson2D";

const DEFAULT_FIRST_VALUE = 3;
const DEFAULT_SECOND_VALUE = 4;
const MIN_VALUE = 1;
const MAX_VALUE = 12;
const TRAVEL_SCHEDULES = [
  { name: "철수", interval: 2, color: "var(--statistics-series-2)" },
  { name: "영희", interval: 3, color: "var(--statistics-series-3)" },
  { name: "민수", interval: 6, color: "var(--statistics-series-4)" },
] as const;
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
const TRAVEL_MONTHS = [
  { label: "1월", firstDay: 1, days: 31, startOffset: 0 },
  { label: "2월", firstDay: 32, days: 28, startOffset: 3 },
  { label: "3월", firstDay: 60, days: 11, startOffset: 3 },
] as const;

function greatestCommonDivisor(first: number, second: number) {
  let left = first;
  let right = second;

  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }

  return left;
}

function leastCommonMultiple(first: number, second: number) {
  return (first * second) / greatestCommonDivisor(first, second);
}

function getMultiples(value: number, limit: number) {
  return Array.from({ length: limit / value }, (_, index) => value * (index + 1));
}

function MultipleRow({
  value,
  multiples,
  leastCommonMultipleValue,
  tone,
}: {
  value: number;
  multiples: number[];
  leastCommonMultipleValue: number;
  tone: "blue" | "red";
}) {
  const toneBorder =
    tone === "blue" ? "var(--statistics-series-2)" : "var(--statistics-series-3)";

  return (
    <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
      <span className="text-sm font-black text-[var(--control-foreground)]">{value}의 배수</span>
      <div className="flex flex-wrap gap-1.5" aria-label={`${value}의 배수`}> 
        {multiples.map((multiple) => {
          const isCommonMultiple = multiple % leastCommonMultipleValue === 0;
          const isLeastCommonMultiple = multiple === leastCommonMultipleValue;

          return (
            <span
              key={multiple}
              style={
                isCommonMultiple ? undefined : { borderColor: toneBorder }
              }
              className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-1.5 font-mono text-sm font-black transition ${
                isLeastCommonMultiple
                  ? "border-[var(--statistics-series-1)] bg-[var(--control-background-active)] text-[var(--foreground)] ring-2 ring-[var(--focus-ring)] ring-offset-2 ring-offset-[var(--surface)]"
                  : isCommonMultiple
                    ? "border-[var(--statistics-series-7)] bg-[var(--control-background-active)] text-[var(--foreground)]"
                    : "bg-[var(--control-background)] text-[var(--control-foreground)]"
              }`}
            >
              {multiple}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TravelQuestion() {
  return (
    <section
      aria-label="철수는 2일마다, 영희는 3일마다, 민수는 6일마다 휴무입니다. 세 사람이 함께 여행할 수 있는 가장 빠른 날은 6일 뒤입니다."
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-[var(--control-foreground)]">휴무 · 여행</span>
        <span className="font-mono text-sm font-black text-[var(--foreground)]">2 · 3 · 6</span>
      </div>
      <div className="mt-3 grid gap-2">
        {TRAVEL_SCHEDULES.map((schedule) => (
          <div
            key={schedule.name}
            className="flex items-center justify-between gap-2 rounded-xl border bg-[var(--control-background)] px-3 py-2"
            style={{ borderColor: schedule.color }}
          >
            <span className="text-sm font-black text-[var(--control-foreground)]">{schedule.name}</span>
            <span className="font-mono text-sm font-black text-[var(--foreground)]">
              {schedule.interval}일마다
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-[var(--control-border)] px-4 py-3">
        <span className="text-lg font-black text-[var(--foreground)]">함께 여행?</span>
      </div>
    </section>
  );
}

function TravelDayCell({ day, date }: { day: number; date: number }) {
  const activeSchedules = TRAVEL_SCHEDULES.filter(
    (schedule) => day % schedule.interval === 0,
  );
  const isTravelDay = activeSchedules.length === TRAVEL_SCHEDULES.length;

  return (
    <div
      aria-label={
        isTravelDay
          ? `${date}일: 철수, 영희, 민수 모두 휴무`
          : activeSchedules.length > 0
            ? `${date}일: ${activeSchedules.map((schedule) => schedule.name).join(", ")} 휴무`
            : `${date}일`
      }
      className={`relative flex h-7 items-start justify-end rounded-md border px-1 pt-0.5 font-mono text-[10px] font-black sm:h-8 sm:text-xs ${
        isTravelDay
          ? "border-[var(--statistics-series-1)] bg-[var(--control-background-active)] text-[var(--foreground)] ring-2 ring-[var(--focus-ring)]"
          : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)]"
      }`}
    >
      {date}
      <span aria-hidden="true" className="absolute bottom-1 left-1 flex gap-0.5">
        {activeSchedules.map((schedule) => (
          <span
            key={schedule.name}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: schedule.color }}
          />
        ))}
      </span>
    </div>
  );
}

function TravelMonth({
  label,
  firstDay,
  days,
  startOffset,
}: (typeof TRAVEL_MONTHS)[number]) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--control-background)] p-2">
      <h3 className="px-1 pb-1 text-center text-sm font-black text-[var(--foreground)]">{label}</h3>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={label}>
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="text-center text-[10px] font-black text-[var(--muted)]">
            {weekday}
          </span>
        ))}
        {Array.from({ length: startOffset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" className="h-7 sm:h-8" />
        ))}
        {Array.from({ length: days }, (_, index) => (
          <TravelDayCell key={index + 1} day={firstDay + index} date={index + 1} />
        ))}
      </div>
    </article>
  );
}

function TravelCalendar() {
  return (
    <section
      aria-label="1월부터 3월까지 70일 일정 달력입니다. 철수의 2일 주기, 영희의 3일 주기, 민수의 6일 주기가 1월 6일인 6일째에 처음 겹칩니다."
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
    >
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <span className="font-mono text-sm font-black text-[var(--control-foreground)]">1–70</span>
        <span className="font-mono text-lg font-black text-[var(--foreground)]">6일</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {TRAVEL_MONTHS.map((month) => (
          <TravelMonth key={month.label} {...month} />
        ))}
      </div>
    </section>
  );
}

export default function MultiplesLcmLesson2D() {
  const [firstValue, setFirstValue] = useState(DEFAULT_FIRST_VALUE);
  const [secondValue, setSecondValue] = useState(DEFAULT_SECOND_VALUE);
  const [firstInput, setFirstInput] = useState(String(DEFAULT_FIRST_VALUE));
  const [secondInput, setSecondInput] = useState(String(DEFAULT_SECOND_VALUE));
  const [inputError, setInputError] = useState<string | null>(null);
  const [activePart, setActivePart] = useState<
    "multiples" | "travel" | "factorization"
  >("multiples");
  const lcm = useMemo(
    () => leastCommonMultiple(firstValue, secondValue),
    [firstValue, secondValue],
  );
  const limit = lcm * 2;
  const firstMultiples = useMemo(() => getMultiples(firstValue, limit), [firstValue, limit]);
  const secondMultiples = useMemo(() => getMultiples(secondValue, limit), [secondValue, limit]);

  function applyValues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFirstValue = Number(firstInput);
    const nextSecondValue = Number(secondInput);
    const valid = [nextFirstValue, nextSecondValue].every(
      (value) => Number.isInteger(value) && value >= MIN_VALUE && value <= MAX_VALUE,
    );

    if (!valid) {
      setInputError(`${MIN_VALUE}–${MAX_VALUE}`);
      return;
    }

    setFirstValue(nextFirstValue);
    setSecondValue(nextSecondValue);
    setFirstInput(String(nextFirstValue));
    setSecondInput(String(nextSecondValue));
    setInputError(null);
  }

  function resetLesson() {
    setFirstValue(DEFAULT_FIRST_VALUE);
    setSecondValue(DEFAULT_SECOND_VALUE);
    setFirstInput(String(DEFAULT_FIRST_VALUE));
    setSecondInput(String(DEFAULT_SECOND_VALUE));
    setInputError(null);
    setActivePart("multiples");
  }

  return (
    <section className="relative flex min-h-[620px] min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-[#ead7ba] bg-[#fffdf8] shadow-[0_12px_30px_rgba(137,101,59,0.09)] sm:min-h-[680px] lg:min-h-0">
      <header className="relative z-20 flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#b5742b]">CHAPTER 13</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">배수 · 공배수 · 최소공배수</h2>
        </div>
        <button
          type="button"
          onClick={resetLesson}
          aria-label="배수 활동 다시 시작"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5742b]"
        >
          ↻
        </button>
      </header>

      <div className="relative z-10 flex flex-1 flex-col justify-center gap-5 px-4 pb-6 sm:px-7">
        {activePart === "travel" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(250px,0.75fr)_minmax(420px,1.25fr)] lg:items-stretch">
            <TravelQuestion />
            <TravelCalendar />
          </div>
        ) : activePart === "factorization" ? (
          <PrimeFactorizationLesson2D />
        ) : (
          <>
        <form onSubmit={applyValues} noValidate className="flex flex-wrap items-end gap-2">
          <label className="flex w-24 flex-col gap-1">
            <span className="text-xs font-black text-[var(--muted)]">첫 수</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_VALUE}
              max={MAX_VALUE}
              step="1"
              value={firstInput}
              onChange={(event) => {
                setFirstInput(event.target.value);
                setInputError(null);
              }}
              aria-label="첫 번째 수"
              aria-describedby="multiples-input-range"
              className="h-11 w-full rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-2 text-center font-mono text-xl font-black text-[var(--foreground)] outline-none transition focus:border-[#b5742b] focus-visible:ring-2 focus-visible:ring-[#b5742b]"
            />
          </label>
          <label className="flex w-24 flex-col gap-1">
            <span className="text-xs font-black text-[var(--muted)]">둘째 수</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_VALUE}
              max={MAX_VALUE}
              step="1"
              value={secondInput}
              onChange={(event) => {
                setSecondInput(event.target.value);
                setInputError(null);
              }}
              aria-label="둘째 수"
              aria-describedby="multiples-input-range"
              className="h-11 w-full rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-2 text-center font-mono text-xl font-black text-[var(--foreground)] outline-none transition focus:border-[#b5742b] focus-visible:ring-2 focus-visible:ring-[#b5742b]"
            />
          </label>
          <button
            type="submit"
            className="h-11 rounded-xl bg-[#b5742b] px-5 font-black text-white shadow-[0_4px_0_#8a541a] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5742b] focus-visible:ring-offset-2 active:translate-y-0"
          >
            보기
          </button>
          <span id="multiples-input-range" aria-live="polite" className="pb-2 text-xs font-black text-[#b5742b]">
            {inputError ?? `${MIN_VALUE}–${MAX_VALUE}`}
          </span>
        </form>

        <div className="grid gap-3" role="img" aria-label={`${firstValue}와 ${secondValue}의 배수와 공배수`}> 
          <MultipleRow
            value={firstValue}
            multiples={firstMultiples}
            leastCommonMultipleValue={lcm}
            tone="blue"
          />
          <MultipleRow
            value={secondValue}
            multiples={secondMultiples}
            leastCommonMultipleValue={lcm}
            tone="red"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--control-background-active)] px-4 py-3">
            <p className="text-sm font-black text-[var(--control-foreground)]">공배수</p>
            <p className="mt-1 font-mono text-2xl font-black text-[var(--foreground)]">{lcm} · {limit}</p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--statistics-series-1)] bg-[var(--control-background-active)] px-4 py-3">
            <p className="text-sm font-black text-[var(--control-foreground)]">최소공배수</p>
            <p className="mt-1 font-mono text-3xl font-black text-[var(--foreground)]">{lcm}</p>
          </div>
        </div>

          </>
        )}
      </div>
      <footer className="relative z-20 flex justify-center gap-3 px-5 pb-5 pt-1">
        <button
          type="button"
          disabled={activePart === "multiples"}
          onClick={() =>
            setActivePart((current) =>
              current === "factorization" ? "travel" : "multiples",
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
              current === "multiples"
                ? "travel"
                : current === "travel"
                  ? "factorization"
                  : "multiples",
            )
          }
          className="min-w-28 rounded-xl bg-[#b5742b] px-6 py-3 text-base font-black text-white shadow-[0_4px_0_#8a541a] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5742b] focus-visible:ring-offset-2 active:translate-y-0"
        >
          {activePart === "factorization" ? "처음" : "다음"}
        </button>
      </footer>
    </section>
  );
}
