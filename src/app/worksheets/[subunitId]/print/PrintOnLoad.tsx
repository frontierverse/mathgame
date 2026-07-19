"use client";

import { useEffect } from "react";

export default function PrintOnLoad() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main className="worksheet-screen-only flex min-h-[70vh] flex-1 items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-[0_12px_30px_rgba(111,92,74,0.08)]">
        <p className="text-sm font-bold text-[var(--lesson-accent)]">최신 퀴즈 반영 완료</p>
        <h1 className="mt-2 text-2xl font-black">인쇄 창을 여는 중입니다.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          창이 열리지 않으면 아래 버튼을 눌러 다시 인쇄하세요.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#8068c5] px-4 text-sm font-bold text-white"
        >
          다시 인쇄
        </button>
      </section>
    </main>
  );
}
