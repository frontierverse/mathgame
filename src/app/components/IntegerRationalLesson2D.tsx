"use client";

import { useState, type CSSProperties } from "react";
import styles from "./IntegerRationalLesson2D.module.css";

type LessonPart = {
  examples: readonly string[];
  title: string;
};

type NumberLineJump = {
  color: string;
  from: number;
  label: string;
  level?: number;
  to: number;
};

const PARTS: readonly LessonPart[] = [
  { title: "양수 · 음수", examples: ["+7°C  →  ?", "−2°C  →  ?", "0°C  →  ?"] },
  { title: "정수", examples: ["−8  정수?", "0  정수?", "1/2  정수?"] },
  { title: "유리수", examples: ["−3  유리수?", "3/4  유리수?", "−0.25  유리수?"] },
  { title: "수직선", examples: ["−4, ?, −2, −1", "−1, 0, ?, +2", "+3, +2, ?, 0"] },
  { title: "절댓값", examples: ["|−7| = ?", "|+4| = ?", "|0| = ?"] },
  { title: "대소 비교", examples: ["−4  □  −1", "−2  □  0", "+3  □  −5"] },
  { title: "덧셈", examples: ["(−4) + (+6) = ?", "(+2) + (−7) = ?", "(−3) + (−5) = ?"] },
  { title: "뺄셈", examples: ["(+4) − (+7) = ?", "(−2) − (−3) = ?", "(−5) − (+2) = ?"] },
  { title: "곱셈", examples: ["(−3) × (+4) = ?", "(+5) × (−2) = ?", "(−2) × (−3) = ?"] },
  { title: "부호", examples: ["(+3) × (−2) = ?", "(−8) ÷ (+4) = ?", "(−15) ÷ (−3) = ?"] },
] as const;

const BLUE = "#2388d8";
const RED = "#df5b68";
const YELLOW = "#e8b84a";
const MINT = "#46b99c";
const PURPLE = "#9b75cf";
const ORANGE = "#ef9750";
const PART_COLORS = [BLUE, YELLOW, PURPLE, MINT, ORANGE, RED, BLUE, ORANGE, PURPLE, MINT] as const;
const EXAMPLE_COLORS = [BLUE, MINT, ORANGE] as const;

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function ExampleProblems({
  examples,
  activeColor,
}: {
  examples: readonly string[];
  activeColor: string;
}) {
  return (
    <section
      aria-label="예제 문제"
      className="mx-auto w-full max-w-5xl rounded-3xl border border-[var(--border)] bg-[var(--control-background)] p-3 shadow-[0_10px_22px_rgba(42,100,138,0.08)] sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className="rounded-full border bg-[var(--surface)] px-3 py-1 text-xs font-black"
          style={{ borderColor: activeColor, color: activeColor }}
        >
          예제
        </span>
        <span aria-hidden="true" className="font-mono text-lg" style={{ color: activeColor }}>✦</span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-3">
        {examples.map((example, index) => {
          const accent = EXAMPLE_COLORS[index] ?? activeColor;

          return (
            <li
              key={example}
              className={`flex min-h-14 items-center gap-2 rounded-2xl border bg-[var(--surface)] px-3 py-2 shadow-sm ${styles.fadeUp}`}
              style={{ borderColor: accent, boxShadow: `0 7px 14px ${accent}18`, ...delay(900 + index * 120) }}
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black text-white"
                style={{ backgroundColor: accent }}
              >
                {index + 1}
              </span>
              <span className="font-mono text-base font-black tracking-[-0.04em] text-[var(--foreground)]">
                {example}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Thermometer({
  color,
  kind,
  label,
  value,
}: {
  color: string;
  kind: "cold" | "warm";
  label: string;
  value: string;
}) {
  const isWarm = kind === "warm";

  return (
    <article
      className="group relative min-h-44 overflow-hidden rounded-3xl border p-4 transition duration-200 hover:-translate-y-1"
      style={{
        backgroundColor: isWarm ? "rgba(35,136,216,0.13)" : "rgba(223,91,104,0.13)",
        borderColor: color,
        boxShadow: `0 16px 30px ${isWarm ? "rgba(35,136,216,0.12)" : "rgba(223,91,104,0.12)"}`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-7 -top-8 size-28 rounded-full blur-2xl"
        style={{ backgroundColor: color, opacity: 0.22 }}
      />
      <span
        className="relative z-10 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black tracking-[0.12em]"
        style={{ borderColor: color, color }}
      >
        {isWarm ? "양수" : "음수"}
      </span>
      <div className="relative z-10 mt-2 flex items-center gap-3">
        <svg aria-hidden="true" viewBox="0 0 100 122" className="h-28 w-24 shrink-0">
          {isWarm ? (
            <g stroke="#f8d772" strokeWidth="3" strokeLinecap="round">
              <circle cx="73" cy="24" r="10" fill="#f8d772" stroke="none" />
              <path
                className={styles.sunRays}
                d="M73 6v-4 M73 46v-4 M55 24h-4 M95 24h-4 M60 11l-3-3 M86 11l3-3 M60 37l-3 3 M86 37l3 3"
              />
            </g>
          ) : (
            <g className={styles.snowflake} fill="#c5e6ff" stroke="#c5e6ff" strokeLinecap="round">
              <path d="M72 10v28 M60 17l24 14 M60 31l24-14" strokeWidth="2.5" />
              <circle cx="72" cy="24" r="3.5" />
            </g>
          )}
          <path d="M37 23a11 11 0 0 0-22 0v55a22 22 0 1 0 22 0z" fill="var(--control-background)" stroke={color} strokeWidth="4" />
          <path
            className={styles.mercury}
            d="M22 39v39a12 12 0 1 0 8 0V39a4 4 0 0 0-8 0z"
            fill={color}
          />
          <path d="M45 34h10 M45 49h7 M45 64h10" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="min-w-0">
          <p className={`font-mono text-4xl font-black tracking-[-0.08em] ${styles.pop}`} style={{ color, ...delay(480) }}>
            {value}
          </p>
          <p className={`mt-1 text-sm font-black text-[var(--foreground)] ${styles.fadeUp}`} style={delay(640)}>
            {label}
          </p>
        </div>
      </div>
    </article>
  );
}

function ZeroPointCard() {
  return (
    <article className="group relative min-h-44 overflow-hidden rounded-3xl border bg-[#e8b84a]/10 p-4 transition duration-200 hover:-translate-y-1 hover:border-[#e8b84a]">
      <span className="relative z-10 inline-flex rounded-full border border-[#e8b84a] px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-[#e8b84a]">
        기준
      </span>
      <div className="relative z-10 mt-2 flex items-center gap-2">
        <svg aria-hidden="true" viewBox="0 0 154 110" className="h-28 min-w-36 flex-1">
          <path d="M12 76h130" stroke="var(--control-border)" strokeWidth="4" strokeLinecap="round" />
          <path className={styles.zeroDirection} style={delay(350)} pathLength={1} d="M61 76H18" stroke={RED} strokeWidth="7" strokeLinecap="round" />
          <path className={styles.zeroDirection} style={delay(350)} pathLength={1} d="M93 76h43" stroke={BLUE} strokeWidth="7" strokeLinecap="round" />
          <path
            className={styles.svgFade}
            style={delay(900)}
            d="M52 69l10 7-10 7 M102 69l-10 7 10 7"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className={styles.zeroPulse}>
            <circle cx="77" cy="76" r="27" fill="var(--surface)" stroke={YELLOW} strokeWidth="4" />
            <text x="77" y="86" textAnchor="middle" fill={YELLOW} fontSize="32" fontWeight="800">0</text>
          </g>
        </svg>
        <p className={`max-w-20 text-sm font-black leading-5 text-[var(--muted)] ${styles.fadeUp}`} style={delay(700)}>
          양수 · 음수 아님
        </p>
      </div>
    </article>
  );
}

function NumberLine({
  ariaLabel,
  highlightedValues = [],
  id,
  jumps = [],
  maximum,
  minimum,
}: {
  ariaLabel: string;
  highlightedValues?: readonly { color: string; value: number }[];
  id: string;
  jumps?: readonly NumberLineJump[];
  maximum: number;
  minimum: number;
}) {
  const values = Array.from(
    { length: maximum - minimum + 1 },
    (_, index) => minimum + index,
  );
  const startX = 56;
  const endX = 704;
  const lineY = 116;
  const xForValue = (value: number) =>
    startX + ((value - minimum) / (maximum - minimum)) * (endX - startX);
  const zeroX = minimum <= 0 && maximum >= 0 ? xForValue(0) : null;
  const jumpDrawDelay = (index: number) => 500 + index * 700;

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--control-background)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-3">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox="0 0 760 172"
        className="h-auto min-w-[560px] w-full overflow-visible"
      >
      <rect x="14" y="20" width="732" height="128" rx="30" fill="var(--surface)" opacity="0.56" />
      {zeroX !== null ? (
        <>
          <path d={`M ${startX} ${lineY} H ${zeroX}`} stroke={RED} strokeWidth="10" strokeLinecap="round" opacity="0.12" />
          <path d={`M ${zeroX} ${lineY} H ${endX}`} stroke={BLUE} strokeWidth="10" strokeLinecap="round" opacity="0.12" />
          <circle cx={zeroX} cy={lineY} r="21" fill="var(--control-background)" stroke={YELLOW} strokeWidth="3" />
        </>
      ) : null}

      <line
        x1={startX - 16}
        y1={lineY}
        x2={endX + 16}
        y2={lineY}
        stroke="var(--control-border)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d={`M ${startX - 20} ${lineY} l 10 -6 v 12 z`} fill="var(--muted)" />
      <path d={`M ${endX + 20} ${lineY} l -10 -6 v 12 z`} fill="var(--muted)" />

      {jumps.map((jump, index) => {
        const fromX = xForValue(jump.from);
        const toX = xForValue(jump.to);
        const arcY = 84 - (jump.level ?? 0) * 21;
        const labelX = (fromX + toX) / 2;
        const drawDelay = jumpDrawDelay(index);

        return (
          <g key={`${id}-${jump.from}-${jump.to}-${index}`}>
            <path
              className={styles.jumpPath}
              style={delay(drawDelay)}
              pathLength={1}
              d={`M ${fromX} ${lineY - 5} C ${fromX} ${arcY}, ${toX} ${arcY}, ${toX} ${lineY - 5}`}
              fill="none"
              stroke={jump.color}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              className={styles.jumpArrow}
              style={delay(drawDelay + 540)}
              d={`M ${toX - 7} ${lineY - 18} L ${toX + 7} ${lineY - 18} L ${toX} ${lineY - 4} Z`}
              fill={jump.color}
            />
            <text
              className={styles.jumpLabel}
              style={delay(drawDelay + 300)}
              x={labelX}
              y={arcY - 7}
              textAnchor="middle"
              fill={jump.color}
              fontSize="18"
              fontWeight="800"
            >
              {jump.label}
            </text>
          </g>
        );
      })}

      {values.map((value) => {
        const x = xForValue(value);
        const highlightIndex = highlightedValues.findIndex((item) => item.value === value);
        const highlight = highlightIndex >= 0 ? highlightedValues[highlightIndex] : undefined;
        const markerColor = value === 0 ? YELLOW : highlight?.color;

        return (
          <g key={value}>
            <line
              x1={x}
              y1={lineY - 9}
              x2={x}
              y2={lineY + 9}
              stroke="var(--control-foreground)"
              strokeWidth="2"
            />
            {markerColor ? (
              <g className={styles.svgPop} style={delay(180 + Math.max(0, highlightIndex) * 140)}>
                <circle cx={x} cy={lineY} r="17" fill={markerColor} opacity="0.16" />
                <circle cx={x} cy={lineY} r="10" fill={markerColor} stroke="var(--surface)" strokeWidth="3" />
              </g>
            ) : null}
            <text
              x={x}
              y={lineY + 38}
              textAnchor="middle"
              fill={markerColor ?? "var(--control-foreground)"}
              fontSize="17"
              fontWeight="800"
            >
              {signed(value)}
            </text>
          </g>
        );
      })}
      </svg>
    </div>
  );
}

function PositiveNegativePart() {
  return (
    <div className="grid max-w-5xl gap-4 sm:grid-cols-3">
      <div className={styles.fadeUp} style={delay(0)}>
        <Thermometer color={BLUE} kind="warm" value="+5℃" label="영상" />
      </div>
      <div className={styles.fadeUp} style={delay(150)}>
        <Thermometer color={RED} kind="cold" value="−3℃" label="영하" />
      </div>
      <div className={styles.fadeUp} style={delay(300)}>
        <ZeroPointCard />
      </div>
    </div>
  );
}

function IntegerPart() {
  const groups = [
    {
      background: "rgba(35,136,216,0.13)",
      color: BLUE,
      label: "양의 정수",
      symbol: "+",
      values: ["+1", "+2", "+3", "…"],
    },
    {
      background: "rgba(232,184,74,0.13)",
      color: YELLOW,
      label: "0",
      symbol: "0",
      values: ["0"],
    },
    {
      background: "rgba(223,91,104,0.13)",
      color: RED,
      label: "음의 정수",
      symbol: "−",
      values: ["−1", "−2", "−3", "…"],
    },
  ] as const;

  return (
    <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
      {groups.map((group, groupIndex) => (
        <article
          key={group.label}
          className={`group relative min-h-52 overflow-hidden rounded-3xl border p-5 text-center transition duration-200 hover:-translate-y-1 ${styles.fadeUp}`}
          style={{
            background: group.background,
            borderColor: group.color,
            boxShadow: `0 16px 30px ${group.color}22`,
            ...delay(groupIndex * 150),
          }}
        >
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-6 font-mono text-[9rem] font-black leading-none opacity-10"
            style={{ color: group.color }}
          >
            {group.symbol}
          </span>
          <div
            className={`relative mx-auto flex size-16 items-center justify-center rounded-2xl border-2 bg-[var(--surface)] font-mono text-4xl font-black shadow-sm ${styles.pop}`}
            style={{ borderColor: group.color, color: group.color, ...delay(groupIndex * 150 + 200) }}
          >
            {group.symbol}
          </div>
          <p className="relative mt-3 text-sm font-black" style={{ color: group.color }}>
            {group.label}
          </p>
          <div className="relative mt-5 flex flex-wrap justify-center gap-2">
            {group.values.map((value, valueIndex) => (
              <span
                key={value}
                className={`rounded-xl border bg-[var(--surface)] px-3 py-2 font-mono text-lg font-black text-[var(--foreground)] shadow-sm ${styles.pop}`}
                style={{
                  borderColor: group.color,
                  boxShadow: `0 8px 16px ${group.color}18`,
                  ...delay(groupIndex * 150 + 380 + valueIndex * 110),
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </article>
      ))}
      <p
        className={`rounded-2xl border border-[var(--border)] bg-[var(--control-background)] px-5 py-4 text-center font-mono text-xl font-black text-[var(--foreground)] shadow-sm sm:col-span-3 ${styles.fadeUp}`}
        style={delay(1050)}
      >
        정수 = 양의 정수 + 0 + 음의 정수
      </p>
    </div>
  );
}

function RationalPart() {
  const integers = [
    { color: RED, value: "−2" },
    { color: YELLOW, value: "0" },
    { color: BLUE, value: "+3" },
  ] as const;
  const nonIntegerRationals = [
    { color: ORANGE, value: "1/2" },
    { color: PURPLE, value: "−0.7" },
    { color: MINT, value: "2.25" },
  ] as const;

  return (
    <section
      role="img"
      aria-label="유리수 집합 Q 안에 정수 집합 Z가 포함되어 있고, 분수와 소수도 유리수에 포함됩니다."
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2.25rem] border-2 border-[#a980d6] bg-[#a980d6]/10 p-4 shadow-[0_20px_42px_rgba(132,92,181,0.18)] sm:p-7"
    >
      <div aria-hidden="true" className="absolute -left-16 top-20 size-44 rounded-full border-[24px] border-[#68b8e5]/20" />
      <div aria-hidden="true" className="absolute -right-14 -top-20 size-64 rounded-full border-[30px] border-[#e5b45a]/20" />

      <div className="relative flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 ${styles.fadeUp}`} style={delay(0)}>
          <span className="flex size-10 items-center justify-center rounded-2xl border-2 border-[#a980d6] bg-[var(--surface)] font-mono text-2xl font-black text-[#8063af] shadow-sm">Q</span>
          <p className="font-black text-[#8063af]">유리수</p>
        </div>
        <span className={`rounded-full border border-[#a980d6] bg-[var(--surface)]/80 px-3 py-1.5 font-mono text-sm font-black text-[#8063af] ${styles.pop}`} style={delay(120)}>
          Z ⊂ Q
        </span>
      </div>

      <div className="relative mt-4 min-h-[284px] sm:min-h-[304px]">
        <section
          className={`absolute bottom-0 left-0 top-1 z-10 flex w-[53%] flex-col justify-center rounded-[45%] border-2 border-[#5faee0] bg-[#5faee0]/15 p-3 shadow-[0_16px_30px_rgba(55,139,194,0.18)] sm:w-[48%] sm:p-6 ${styles.fadeUp}`}
          style={delay(180)}
        >
          <div className="mx-auto flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl border border-[#5faee0] bg-[var(--surface)] font-mono text-xl font-black text-[#3e88b7]">Z</span>
            <p className="font-black text-[#3e88b7]">정수</p>
          </div>
          <div className="mx-auto mt-5 flex max-w-48 flex-wrap justify-center gap-2">
            {integers.map((item, index) => (
              <span
                key={item.value}
                className={`rounded-2xl border-2 bg-[var(--surface)] px-3 py-2 font-mono text-xl font-black shadow-[0_8px_16px_rgba(55,139,194,0.16)] ${styles.pop}`}
                style={{ borderColor: item.color, color: item.color, ...delay(450 + index * 140) }}
              >
                {item.value}
              </span>
            ))}
          </div>
        </section>

        <section
          className={`absolute bottom-4 right-0 z-10 w-[49%] rounded-[2rem] border-2 border-dashed border-[#b792e2] bg-[var(--surface)]/88 p-3 shadow-[0_12px_26px_rgba(132,92,181,0.13)] sm:bottom-7 sm:w-[45%] sm:p-5 ${styles.fadeUp}`}
          style={delay(320)}
        >
          <p className="text-center text-sm font-black text-[#8063af]">분수 · 소수</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {nonIntegerRationals.map((item, index) => (
              <span
                key={item.value}
                className={`rounded-xl border bg-[var(--surface)] px-2.5 py-2 font-mono text-base font-black shadow-sm sm:px-3 sm:text-xl ${styles.pop}`}
                style={{ borderColor: item.color, color: item.color, ...delay(620 + index * 140) }}
              >
                {item.value}
              </span>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function NumberLinePart() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--control-background)] p-4 shadow-[0_18px_34px_rgba(42,100,138,0.1)] sm:p-7">
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className={`flex items-center gap-2 text-sm font-black ${styles.fadeUp}`} style={{ color: RED, ...delay(350) }}>
          <span className="flex size-8 items-center justify-center rounded-full border" style={{ borderColor: RED }}>←</span>
          <span>음수</span>
        </div>
        <span className={`rounded-full border border-[#e8b84a] bg-[var(--surface)] px-3 py-1.5 font-mono text-sm font-black text-[#e8b84a] ${styles.pop}`} style={delay(120)}>
          0
        </span>
        <div className={`flex items-center justify-end gap-2 text-sm font-black ${styles.fadeUp}`} style={{ color: BLUE, ...delay(500) }}>
          <span>양수</span>
          <span className="flex size-8 items-center justify-center rounded-full border" style={{ borderColor: BLUE }}>→</span>
        </div>
      </div>
      <NumberLine
        id="directions"
        ariaLabel="수직선에서 0의 왼쪽은 음수, 오른쪽은 양수입니다."
        minimum={-3}
        maximum={3}
        highlightedValues={[
          { value: -2, color: RED },
          { value: 0, color: YELLOW },
          { value: 3, color: BLUE },
        ]}
      />
    </div>
  );
}

function AbsoluteValuePart() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--control-background)] p-4 shadow-[0_18px_34px_rgba(42,100,138,0.1)] sm:p-7">
      <div className="mb-4 flex justify-center">
        <span className={`rounded-full border border-[var(--control-border)] bg-[var(--surface)] px-4 py-2 text-sm font-black text-[var(--muted)] ${styles.fadeUp}`}>
          0까지의 거리
        </span>
      </div>
      <NumberLine
        id="absolute"
        ariaLabel="마이너스 3과 플러스 3은 0에서 같은 거리 3만큼 떨어져 있습니다."
        minimum={-4}
        maximum={4}
        highlightedValues={[
          { value: -3, color: RED },
          { value: 0, color: YELLOW },
          { value: 3, color: BLUE },
        ]}
        jumps={[
          { from: 0, to: -3, color: RED, label: "3" },
          { from: 0, to: 3, color: BLUE, label: "3", level: 1 },
        ]}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <article
          className={`relative overflow-hidden rounded-2xl border border-[#df5b68] bg-[#df5b68]/10 px-4 py-4 text-center shadow-sm ${styles.fadeUp}`}
          style={delay(1300)}
        >
          <span aria-hidden="true" className="absolute -right-2 -top-5 text-7xl font-black text-[#df5b68]/10">−</span>
          <p className="relative font-mono text-2xl font-black text-[#df5b68]">|−3| = 3</p>
        </article>
        <article
          className={`relative overflow-hidden rounded-2xl border border-[#2388d8] bg-[#2388d8]/10 px-4 py-4 text-center shadow-sm ${styles.fadeUp}`}
          style={delay(1950)}
        >
          <span aria-hidden="true" className="absolute -right-2 -top-5 text-7xl font-black text-[#2388d8]/10">+</span>
          <p className="relative font-mono text-2xl font-black text-[#2388d8]">|+3| = 3</p>
        </article>
      </div>
    </div>
  );
}

function ComparisonPart() {
  const values = [
    { color: RED, value: "−5" },
    { color: ORANGE, value: "−2" },
    { color: YELLOW, value: "0" },
    { color: MINT, value: "3" },
    { color: BLUE, value: "7" },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--control-background)] p-5 shadow-[0_18px_34px_rgba(42,100,138,0.1)] sm:p-7">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {values.map((item, index) => (
          <span key={item.value} className="contents">
            {index > 0 ? (
              <span className={`text-2xl font-black text-[var(--muted)] ${styles.fadeUp}`} style={delay(760 + index * 180)}>
                &lt;
              </span>
            ) : null}
            <span
              className={`rounded-2xl border bg-[var(--surface)] px-3 py-2 font-mono text-2xl font-black shadow-[0_9px_16px_rgba(0,0,0,0.12)] ${styles.pop}`}
              style={{
                borderColor: item.color,
                color: item.color,
                transform: `translateY(${index === 1 || index === 3 ? "-7px" : "0"})`,
                ...delay(850 + index * 180),
              }}
            >
              {item.value}
            </span>
          </span>
        ))}
      </div>
      <NumberLine
        id="comparison"
        ariaLabel="마이너스 5, 마이너스 2, 0, 3, 7을 작은 수부터 나열한 수직선입니다."
        minimum={-5}
        maximum={7}
        highlightedValues={[
          { value: -5, color: RED },
          { value: -2, color: ORANGE },
          { value: 0, color: YELLOW },
          { value: 3, color: MINT },
          { value: 7, color: BLUE },
        ]}
      />
    </div>
  );
}

function AdditionPart({
  mode,
  onModeChange,
}: {
  mode: "mixed" | "positive";
  onModeChange: (mode: "mixed" | "positive") => void;
}) {
  const mixed = mode === "mixed";
  const formula = mixed ? "(+3) + (−5) = −2" : "(+3) + (+2) = +5";
  const jumps: readonly NumberLineJump[] = mixed
    ? [
        { from: 0, to: 3, color: BLUE, label: "+3" },
        { from: 3, to: -2, color: RED, label: "−5", level: 1 },
      ]
    : [
        { from: 0, to: 3, color: BLUE, label: "+3" },
        { from: 3, to: 5, color: MINT, label: "+2", level: 1 },
      ];
  const result = mixed ? -2 : 5;
  const resultColor = mixed ? RED : MINT;

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--control-background)] p-4 shadow-[0_18px_34px_rgba(42,100,138,0.1)] sm:p-7">
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => onModeChange("positive")}
          className={`rounded-xl border px-4 py-2 font-mono font-black transition ${
            mode === "positive"
              ? "border-[#2388d8] bg-[#2388d8] text-white"
              : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)]"
          }`}
        >
          (+3) + (+2)
        </button>
        <button
          type="button"
          onClick={() => onModeChange("mixed")}
          className={`rounded-xl border px-4 py-2 font-mono font-black transition ${
            mixed
              ? "border-[#df5b68] bg-[#df5b68] text-white"
              : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)]"
          }`}
        >
          (+3) + (−5)
        </button>
      </div>
      <p
        key={`formula-${mode}`}
        className={`mx-auto w-fit rounded-2xl border border-[var(--control-border)] bg-[var(--surface)] px-5 py-3 text-center font-mono text-2xl font-black text-[var(--foreground)] shadow-sm ${styles.fadeUp}`}
      >
        {formula}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
        <span className="size-3 rounded-full bg-[var(--muted)]" />
        <span className="h-0.5 w-10 rounded-full" style={{ backgroundColor: BLUE }} />
        <span className="size-3 rounded-full" style={{ backgroundColor: BLUE }} />
        <span className="h-0.5 w-10 rounded-full" style={{ backgroundColor: resultColor }} />
        <span className="size-3 rounded-full" style={{ backgroundColor: resultColor }} />
      </div>
      <NumberLine
        key={`addition-${mode}`}
        id={`addition-${mode}`}
        ariaLabel={`${formula}을 수직선의 점프로 나타낸 그림입니다.`}
        minimum={-5}
        maximum={5}
        highlightedValues={[
          { value: 0, color: YELLOW },
          { value: 3, color: BLUE },
          { value: result, color: resultColor },
        ]}
        jumps={jumps}
      />
    </div>
  );
}

function SubtractionPart() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[#dfc0c6] bg-[#df5b68]/10 p-4 shadow-[0_18px_34px_rgba(151,61,71,0.12)] sm:p-7">
      <div className="flex flex-wrap items-center justify-center gap-2 text-center font-mono text-xl font-black text-[var(--foreground)] sm:text-2xl">
        <span className={`rounded-xl border border-[var(--control-border)] bg-[var(--surface)] px-3 py-2 ${styles.pop}`} style={delay(0)}>
          (−2) − (+3)
        </span>
        <span className={`flex size-9 items-center justify-center rounded-full bg-[#df5b68] text-white shadow-sm ${styles.pop}`} style={delay(300)}>
          →
        </span>
        <span className={`rounded-xl border border-[#df5b68] bg-[var(--surface)] px-3 py-2 text-[#df5b68] ${styles.pop}`} style={delay(550)}>
          (−2) + (−3)
        </span>
        <span className={`rounded-xl bg-[#df5b68] px-3 py-2 text-white shadow-sm ${styles.pop}`} style={delay(2000)}>
          −5
        </span>
      </div>
      <NumberLine
        id="subtraction"
        ariaLabel="마이너스 2에서 시작해 플러스 3을 빼면 마이너스 3을 더하는 것과 같아서 마이너스 5가 됩니다."
        minimum={-6}
        maximum={2}
        highlightedValues={[
          { value: 0, color: YELLOW },
          { value: -2, color: RED },
          { value: -5, color: RED },
        ]}
        jumps={[
          { from: 0, to: -2, color: RED, label: "−2" },
          { from: -2, to: -5, color: RED, label: "−3", level: 1 },
        ]}
      />
    </div>
  );
}

function MultiplicationPart() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[#dfc0c6] bg-[#df5b68]/10 p-4 shadow-[0_18px_34px_rgba(151,61,71,0.12)] sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        {[RED, PURPLE, ORANGE].map((color, index) => (
          <span
            key={color}
            className={`flex size-12 items-center justify-center rounded-2xl border bg-[var(--surface)] font-mono text-lg font-black shadow-sm ${styles.pop}`}
            style={{ borderColor: color, color, ...delay(index * 200) }}
          >
            −2
          </span>
        ))}
        <span className={`ml-1 font-mono text-2xl font-black text-[var(--muted)] ${styles.fadeUp}`} style={delay(600)}>
          × 3
        </span>
      </div>
      <p
        className={`mx-auto w-fit rounded-2xl bg-[#df5b68] px-5 py-3 text-center font-mono text-2xl font-black text-white shadow-[0_8px_16px_rgba(223,91,104,0.3)] ${styles.pop}`}
        style={delay(2600)}
      >
        (−2) × 3 = −6
      </p>
      <NumberLine
        id="multiplication"
        ariaLabel="마이너스 2를 세 번 점프하면 마이너스 6이 됩니다."
        minimum={-6}
        maximum={2}
        highlightedValues={[
          { value: 0, color: YELLOW },
          { value: -2, color: RED },
          { value: -4, color: PURPLE },
          { value: -6, color: ORANGE },
        ]}
        jumps={[
          { from: 0, to: -2, color: RED, label: "−2" },
          { from: -2, to: -4, color: PURPLE, label: "−2", level: 1 },
          { from: -4, to: -6, color: ORANGE, label: "−2", level: 2 },
        ]}
      />
    </div>
  );
}

function SignRulePart() {
  const rules = [
    { accent: MINT, first: "+", result: "+", second: "+" },
    { accent: ORANGE, first: "+", result: "−", second: "−" },
    { accent: PURPLE, first: "−", result: "−", second: "+" },
    { accent: YELLOW, first: "−", result: "+", second: "−" },
  ] as const;

  const colorForSign = (sign: "+" | "−") => (sign === "+" ? BLUE : RED);

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--control-background)] p-4 shadow-[0_18px_34px_rgba(42,100,138,0.1)] sm:p-7">
      <div className="grid gap-3 sm:grid-cols-2">
      {rules.map((rule, ruleIndex) => (
        <article
          key={`${rule.first}-${rule.second}`}
          className={`flex items-center justify-center gap-2 rounded-3xl border bg-[var(--surface)] px-3 py-4 shadow-[0_10px_20px_rgba(0,0,0,0.08)] ${styles.fadeUp}`}
          style={{ borderColor: rule.accent, boxShadow: `0 12px 24px ${rule.accent}22`, ...delay(ruleIndex * 160) }}
        >
          {[rule.first, rule.second].map((sign, index) => (
            <span key={`${sign}-${index}`} className="contents">
              {index === 1 ? <span className="font-mono text-xl font-black text-[var(--muted)]">×</span> : null}
              <span
                className="flex size-11 items-center justify-center rounded-2xl border-2 bg-[var(--surface)] font-mono text-2xl font-black shadow-sm"
                style={{ borderColor: colorForSign(sign), color: colorForSign(sign) }}
              >
                {sign}
              </span>
            </span>
          ))}
          <span className="font-mono text-xl font-black text-[var(--muted)]">=</span>
          <span
            className={`flex size-11 items-center justify-center rounded-2xl font-mono text-2xl font-black text-white shadow-[0_8px_16px_rgba(0,0,0,0.18)] ${styles.pop}`}
            style={{ backgroundColor: colorForSign(rule.result), ...delay(ruleIndex * 160 + 350) }}
          >
            {rule.result}
          </span>
        </article>
      ))}
      </div>
      <article
        className={`mt-4 flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-[#dfc0c6] bg-[#df5b68]/10 px-4 py-4 shadow-sm ${styles.fadeUp}`}
        style={delay(1050)}
      >
        <span className="rounded-2xl border border-[#2388d8] bg-[var(--surface)] px-3 py-2 font-mono text-xl font-black text-[#2388d8]">+6</span>
        <span className="font-mono text-2xl font-black text-[var(--muted)]">÷</span>
        <span className="rounded-2xl border border-[#df5b68] bg-[var(--surface)] px-3 py-2 font-mono text-xl font-black text-[#df5b68]">−2</span>
        <span className="font-mono text-2xl font-black text-[var(--muted)]">=</span>
        <span className={`rounded-2xl bg-[#df5b68] px-3 py-2 font-mono text-xl font-black text-white shadow-sm ${styles.pop}`} style={delay(1500)}>
          −3
        </span>
      </article>
    </div>
  );
}

export default function IntegerRationalLesson2D() {
  const [activePart, setActivePart] = useState(0);
  const [additionMode, setAdditionMode] = useState<"mixed" | "positive">("mixed");
  const [replayCount, setReplayCount] = useState(0);
  const part = PARTS[activePart] ?? PARTS[0];
  const activeColor = PART_COLORS[activePart] ?? BLUE;

  const content =
    activePart === 0 ? (
      <PositiveNegativePart />
    ) : activePart === 1 ? (
      <IntegerPart />
    ) : activePart === 2 ? (
      <RationalPart />
    ) : activePart === 3 ? (
      <NumberLinePart />
    ) : activePart === 4 ? (
      <AbsoluteValuePart />
    ) : activePart === 5 ? (
      <ComparisonPart />
    ) : activePart === 6 ? (
      <AdditionPart mode={additionMode} onModeChange={setAdditionMode} />
    ) : activePart === 7 ? (
      <SubtractionPart />
    ) : activePart === 8 ? (
      <MultiplicationPart />
    ) : (
      <SignRulePart />
    );

  return (
    <section className="relative flex min-h-[620px] min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-[#bad8eb] bg-[var(--surface-raised)] shadow-[0_12px_30px_rgba(53,119,159,0.12)] sm:min-h-[680px] lg:min-h-0">
      <header className="relative z-20 flex items-start justify-between gap-3 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-[#2b83bb]">CHAPTER 14</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--foreground)] sm:text-3xl">정수와 유리수</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setActivePart(0);
            setAdditionMode("mixed");
            setReplayCount((count) => count + 1);
          }}
          aria-label="정수와 유리수 처음부터 보기"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b83bb]"
        >
          ↻
        </button>
      </header>

      <div className="relative z-10 flex flex-1 flex-col justify-center gap-5 px-4 pb-6 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-black" style={{ color: activeColor }}>{part.title}</p>
          <div className="flex gap-1" role="tablist" aria-label="정수와 유리수 학습 순서">
            {PARTS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={index === activePart}
                aria-label={`${index + 1}. ${item.title}`}
                onClick={() => setActivePart(index)}
                className={`h-2.5 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b83bb] ${
                  index === activePart
                    ? "w-7"
                    : "w-2.5 bg-[var(--control-border)] hover:bg-[#76b8df]"
                }`}
                style={index === activePart ? { backgroundColor: PART_COLORS[index] } : undefined}
              />
            ))}
          </div>
        </div>

        <div role="tabpanel" className="flex min-h-[330px] items-center justify-center sm:min-h-[370px]">
          <div key={`${activePart}-${replayCount}`} className={`flex w-full justify-center ${styles.partIn}`}>
            {content}
          </div>
        </div>

        <ExampleProblems examples={part.examples} activeColor={activeColor} />
      </div>

      <footer className="relative z-20 flex justify-center gap-3 px-5 pb-5 pt-1">
        <button
          type="button"
          disabled={activePart === 0}
          onClick={() => setActivePart((current) => Math.max(0, current - 1))}
          className="min-w-28 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-6 py-3 text-base font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() =>
            setActivePart((current) =>
              current === PARTS.length - 1 ? 0 : current + 1,
            )
          }
          className="min-w-28 rounded-xl px-6 py-3 text-base font-black text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b83bb] focus-visible:ring-offset-2 active:translate-y-0"
          style={{ backgroundColor: activeColor, boxShadow: `0 4px 0 color-mix(in srgb, ${activeColor} 68%, black)` }}
        >
          {activePart === PARTS.length - 1 ? "처음" : "다음"}
        </button>
      </footer>
    </section>
  );
}
