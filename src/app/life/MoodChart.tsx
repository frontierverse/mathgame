"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { MOODS, recentDates, type MoodEntry } from "./mood";
import styles from "./life.module.css";

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia("(max-width: 900px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getNarrowViewport() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function getServerViewport() {
  return false;
}

export default function MoodChart({
  entries,
  today,
  compact = false,
}: {
  entries: MoodEntry[];
  today: string;
  compact?: boolean;
}) {
  const [days, setDays] = useState(7);
  const titleId = useId();
  const narrow = useSyncExternalStore(
    subscribeToViewport,
    getNarrowViewport,
    getServerViewport,
  );
  const width = narrow ? 340 : 654;
  const dates = recentDates(today, days);
  const byDate = new Map(entries.map((entry) => [entry.recordedOn, entry]));
  const visible = dates.flatMap((date) =>
    byDate.get(date) ? [byDate.get(date)!] : [],
  );
  const x = (index: number) => 34 + index * ((width - 62) / (days - 1));
  const y = (score: number) => 164 - score * 27;
  const segments: string[] = [];
  let segment = "";
  dates.forEach((date, index) => {
    const entry = byDate.get(date);
    if (!entry) {
      if (segment) segments.push(segment);
      segment = "";
    } else segment += `${segment ? " L" : "M"}${x(index)},${y(entry.score)}`;
  });
  if (segment) segments.push(segment);

  return (
    <section className={styles.chartCard} aria-label="날짜별 마음 기록">
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.eyebrow}>마음 발자국</p>
          <h2>{compact ? "기분 변화" : "내 마음의 흐름"}</h2>
        </div>
        <div className={styles.periods} aria-label="그래프 기간">
          {[7, 30, 90, 365].map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={days === period}
              onClick={() => setDays(period)}
            >
              {period === 365 ? "1년" : `${period}일`}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className={styles.emptyChart}>
          <span aria-hidden="true">✧ · ✧</span>
          <p>첫 마음을 남겨 볼까요?</p>
        </div>
      ) : (
        <>
          <svg
            className={styles.chart}
            viewBox={`0 0 ${width} 208`}
            role="img"
            aria-labelledby={titleId}
          >
            <title
              id={titleId}
            >{`최근 ${days}일 기분 변화, ${visible.length}일 기록. 기록이 없는 날은 선을 잇지 않습니다. 날짜별 점수는 아래 기록 목록에서 확인할 수 있습니다.`}</title>
            {[0, 1, 2, 3, 4, 5].map((score) => (
              <g key={score}>
                <text
                  x="12"
                  y={y(score) + 4}
                  textAnchor="middle"
                  className={styles.axisText}
                >
                  {score}
                </text>
                <line
                  x1="34"
                  x2={width - 28}
                  y1={y(score)}
                  y2={y(score)}
                  className={styles.gridLine}
                />
              </g>
            ))}
            {segments.map((path, index) => (
              <path
                key={index}
                d={path}
                fill="none"
                stroke="var(--life-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {dates.map((date, index) => {
              const entry = byDate.get(date);
              const label =
                days === 7 ||
                index === 0 ||
                index === days - 1 ||
                index === Math.floor(days / 2);
              return (
                <g key={date}>
                  {entry && (
                    <circle
                      cx={x(index)}
                      cy={y(entry.score)}
                      r={days > 30 ? 3 : 6}
                      fill={MOODS[entry.score].color}
                      stroke="var(--life-ink)"
                      strokeWidth="1.4"
                    >
                      <title>{`${date}: ${entry.score}점 · ${MOODS[entry.score].label}`}</title>
                    </circle>
                  )}
                  {label && (
                    <text
                      x={x(index)}
                      y="192"
                      textAnchor="middle"
                      className={styles.axisText}
                    >
                      {date === today
                        ? "오늘"
                        : `${Number(date.slice(5, 7))}.${Number(date.slice(8))}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className={styles.chartFoot}>
            <span>빈 날은 기록이 없어요</span>
            <span>{visible.length}일 기록</span>
          </div>
          <details className={styles.recordList}>
            <summary>날짜별 기록</summary>
            <div>
              {[...visible].reverse().map((entry) => (
                <p key={entry.recordedOn}>
                  <time dateTime={entry.recordedOn}>{entry.recordedOn}</time>
                  <strong>{entry.score}점</strong>
                  <span>{MOODS[entry.score].label}</span>
                </p>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
