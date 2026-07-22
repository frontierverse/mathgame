"use client";

import { useState } from "react";

const PIZZA_SLICES = 6;
const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const DIVISORS = [1, 2, 3, 6] as const;
const GROUP_COLORS = ["#ef9a65", "#72b9c4", "#9a84d4", "#e4b653", "#e8849c", "#71b989"];
const DIVISION_RESULTS = Array.from({ length: PIZZA_SLICES }, (_, index) => {
  const divisor = index + 1;

  return {
    divisor,
    quotient: Math.floor(PIZZA_SLICES / divisor),
    remainder: PIZZA_SLICES % divisor,
  };
});

function pointOnCircle(angle: number, radius: number, center = 130) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
}

function pizzaSlicePath(index: number) {
  const start = pointOnCircle(-90 + index * 60, 108);
  const end = pointOnCircle(-90 + (index + 1) * 60, 108);

  return `M 130 130 L ${start.x} ${start.y} A 108 108 0 0 1 ${end.x} ${end.y} Z`;
}

function toppingPosition(index: number, offset: number) {
  return pointOnCircle(-90 + index * 60 + offset, offset === 20 ? 70 : 80);
}

function PizzaGraphic({ people }: { people: number | null }) {
  const isDivisor = people !== null && PIZZA_SLICES % people === 0;
  const groupSize = isDivisor && people !== null ? PIZZA_SLICES / people : 0;

  return (
    <div
      role="img"
      aria-label={
        people === null
          ? "피자 6조각"
          : isDivisor
            ? `피자 6조각을 ${people}명이 ${groupSize}조각씩 나누어 먹는 모습`
            : `피자 6조각을 ${people}명이 나누어 먹으면 남는 조각이 생기는 모습`
      }
      className="relative flex min-h-[280px] items-center justify-center sm:min-h-[320px]"
    >
      <svg
        viewBox="0 0 260 260"
        className={`h-full max-h-[310px] w-full max-w-[310px] overflow-visible transition-transform duration-500 ${isDivisor ? "scale-[1.02]" : ""}`}
        aria-hidden="true"
      >
        <circle cx="130" cy="137" r="112" fill="#c9a36a" opacity="0.2" />
        <circle cx="130" cy="130" r="112" fill="#d99348" stroke="#a8642e" strokeWidth="5" />
        <circle cx="130" cy="130" r="103" fill="#f6ca6b" stroke="#f8e3a8" strokeWidth="5" />

        {Array.from({ length: PIZZA_SLICES }, (_, index) => {
          const groupIndex = isDivisor ? Math.floor(index / groupSize) : 0;
          const color = isDivisor ? GROUP_COLORS[groupIndex] : "#f6ca6b";
          const firstTopping = toppingPosition(index, 20);
          const secondTopping = toppingPosition(index, 40);

          return (
            <g key={index} className="transition-opacity duration-300">
              <path d={pizzaSlicePath(index)} fill={color} stroke="#a8642e" strokeWidth="2.5" />
              <circle cx={firstTopping.x} cy={firstTopping.y} r="8" fill="#d95b57" stroke="#b74642" strokeWidth="2" />
              <circle cx={secondTopping.x} cy={secondTopping.y} r="6" fill="#d95b57" stroke="#b74642" strokeWidth="2" />
            </g>
          );
        })}

        <circle cx="130" cy="130" r="8" fill="#a8642e" />
        <text x="130" y="126" textAnchor="middle" className="fill-[#5d3928] font-mono text-[28px] font-black">
          6
        </text>
        <text x="130" y="151" textAnchor="middle" className="fill-[#7c4b31] text-[12px] font-black">
          조각
        </text>
      </svg>
    </div>
  );
}

function MiniSlice() {
  return <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-[4px] bg-[#f6ca6b] shadow-[inset_0_0_0_2px_#a8642e] [clip-path:polygon(50%_50%,100%_0,100%_100%)]" />;
}

function PeopleGroups({ people }: { people: number }) {
  const slicesPerPerson = PIZZA_SLICES / people;

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

export default function DivisorsLesson2D() {
  const [people, setPeople] = useState<number | null>(null);
  const [showRemainder, setShowRemainder] = useState(false);
  const [showDivisions, setShowDivisions] = useState(false);
  const isDivisor = people !== null && PIZZA_SLICES % people === 0;
  const remainder = people === null ? 0 : PIZZA_SLICES % people;

  return (
    <section className="relative flex min-h-[620px] min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#d9c8e9] bg-[#fffefa] shadow-[0_12px_30px_rgba(111,92,130,0.09)] sm:min-h-[680px] lg:min-h-0">
      <header className="relative z-20 flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#8068c5]">CHAPTER 12</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">약수</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setPeople(null);
            setShowRemainder(false);
            setShowDivisions(false);
          }}
          aria-label="약수 활동 다시 시작"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5]"
        >
          ↻
        </button>
      </header>

      <div className="relative z-10 grid flex-1 gap-3 px-4 pb-5 sm:px-7 lg:grid-cols-[minmax(280px,0.9fr)_minmax(360px,1.1fr)] lg:items-center lg:gap-8">
        <PizzaGraphic people={showDivisions ? null : people} />

        <div className="flex min-w-0 flex-col justify-center">
          {showDivisions ? (
            <div className="grid gap-2" aria-label="6을 1부터 6까지 나눈 결과">
              {DIVISION_RESULTS.map((division) => {
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
                      6 ÷ {division.divisor} = {division.quotient}
                    </span>
                    <span className="text-sm text-[var(--control-foreground)]">나머지 {division.remainder}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <p className="max-w-xl text-lg font-black leading-relaxed tracking-[-0.03em] text-[var(--foreground)] sm:text-xl">
                피자 6조각이 있어요.<br />
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
                  {PEOPLE_OPTIONS.map((option) => {
                    const selected = people === option;
                    const valid = PIZZA_SLICES % option === 0;

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
                    6 ÷ {people} = {PIZZA_SLICES / people}
                    <span className="font-sans text-sm text-[var(--statistics-series-2)]">나머지 0</span>
                  </p>
                  <PeopleGroups people={people} />
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[var(--control-background-active)] px-4 py-3">
                    <span className="text-sm font-black text-[var(--control-foreground)]">6의 약수</span>
                    <span className="font-mono text-lg font-black tracking-[0.12em] text-[var(--foreground)]">
                      {DIVISORS.join(" · ")}
                    </span>
                  </div>
                </div>
              ) : (
                <p aria-live="polite" className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-[#d95b67] bg-[var(--surface)] px-4 py-3 font-black text-[var(--foreground)]">
                  {remainder}조각 남아요
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="relative z-20 flex justify-center px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={() => setShowDivisions((current) => !current)}
          className="min-w-28 rounded-xl bg-[var(--statistics-series-2)] px-6 py-3 text-base font-black text-[var(--control-background)] shadow-[0_4px_0_color-mix(in_srgb,var(--statistics-series-2)_65%,black)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--statistics-series-2)] focus-visible:ring-offset-2 active:translate-y-0"
        >
          {showDivisions ? "이전" : "다음"}
        </button>
      </footer>
    </section>
  );
}
