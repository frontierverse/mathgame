"use client";

import { useEffect, useRef, useState } from "react";

type QuizCountdownProps = {
  durationSeconds: number;
  startedAtPerformanceMs: number;
  onExpire?: () => void;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function QuizCountdown({
  durationSeconds,
  startedAtPerformanceMs,
  onExpire,
}: QuizCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const deadline = startedAtPerformanceMs + durationSeconds * 1000;
    let expiryNotified = false;

    const updateRemainingTime = () => {
      const nextRemainingSeconds = Math.max(
        0,
        Math.ceil((deadline - performance.now()) / 1000),
      );
      setRemainingSeconds((current) =>
        current === nextRemainingSeconds ? current : nextRemainingSeconds,
      );

      if (nextRemainingSeconds === 0 && !expiryNotified) {
        expiryNotified = true;
        onExpireRef.current?.();
      }
    };

    const initialTimer = window.setTimeout(updateRemainingTime, 0);
    const interval = window.setInterval(updateRemainingTime, 100);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [durationSeconds, startedAtPerformanceMs]);

  const urgent = remainingSeconds <= 5;
  const warning = remainingSeconds <= 10;

  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={
        remainingSeconds === 0
          ? "제한 시간 종료"
          : `남은 시간 ${remainingSeconds}초`
      }
      title="남은 시간"
      className={`inline-flex h-8 min-w-[4.25rem] items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-black tabular-nums shadow-sm transition-colors ${
        urgent
          ? "border-[#efb6bd] bg-[#fff0f2] text-[#a5384a]"
          : warning
            ? "border-[#edd29f] bg-[#fff8e8] text-[#9a6517]"
            : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 1.5M9 2h6" />
      </svg>
      {formatTime(remainingSeconds)}
    </span>
  );
}
