"use client";

import { useEffect, useRef } from "react";

import QuizQuestionText from "../progress/QuizQuestionText";
import { getQuizSetForSubunit } from "../shared/curriculumQuizzes";
import PrintWorksheetButton from "./PrintWorksheetButton";

export type WorksheetQuizSelection = {
  subunitId: string;
  gradeLabel: string;
  semesterLabel: string;
  unitTitle: string;
  subunitTitle: string;
};

type WorksheetQuizModalProps = WorksheetQuizSelection & {
  onClose: () => void;
};

export default function WorksheetQuizModal({
  subunitId,
  gradeLabel,
  semesterLabel,
  unitTitle,
  subunitTitle,
  onClose,
}: WorksheetQuizModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const quizSet = getQuizSetForSubunit(subunitId);
  const quizzes = quizSet?.quizzes ?? [];
  const firstQuiz = quizzes[0] ?? null;
  const lastQuiz = quizzes[quizzes.length - 1] ?? null;
  const pdfUrl = `/api/worksheets/${encodeURIComponent(subunitId)}/pdf`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worksheet-quiz-modal-title"
      aria-describedby="worksheet-quiz-modal-description"
    >
      <button
        type="button"
        aria-label="퀴즈 목록 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />

      <section className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[var(--control-border-active)] bg-[var(--surface)] shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:max-h-[calc(100dvh-3rem)]">
        <header className="flex items-start justify-between gap-5 border-b border-[var(--border)] px-5 py-5 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--lesson-accent)]">
              {gradeLabel} · {semesterLabel} · {unitTitle}
            </p>
            <h2
              id="worksheet-quiz-modal-title"
              className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl"
            >
              {subunitTitle} 퀴즈
            </h2>
            <p
              id="worksheet-quiz-modal-description"
              className="mt-2 text-sm leading-6 text-[var(--muted)]"
            >
              이 목록은 진도 체크 화면에서 사용하는 퀴즈와 동일합니다.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="퀴즈 목록 닫기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)]"
          >
            ✕
          </button>
        </header>

        <div className="progress-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {quizzes.length > 0 && firstQuiz && lastQuiz ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--control-border)] bg-[var(--control-background)] px-3 py-1.5 text-xs font-black text-[var(--control-foreground)]">
                  {quizzes.length}문항
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]">
                  진도 체크 QUIZ {firstQuiz.globalNumber}~{lastQuiz.globalNumber}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 text-sm font-bold text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)]"
                >
                  PDF 열기
                </a>
                <a
                  href={`${pdfUrl}?download=1`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 text-sm font-bold text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)]"
                >
                  다운로드
                </a>
                <PrintWorksheetButton subunitId={subunitId} className="w-full" />
              </div>

              <ol className="mt-5 space-y-3">
                {quizzes.map((quiz) => (
                  <li
                    key={quiz.id}
                    className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5"
                  >
                    <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--control-background-active)] px-2 text-xs font-black tabular-nums text-[var(--control-foreground)]">
                      {quiz.globalNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black tracking-[0.12em] text-[var(--lesson-accent)]">
                        QUIZ {quiz.globalNumber} · 소단원 {quiz.numberInSubunit}번
                      </p>
                      <QuizQuestionText
                        text={quiz.question}
                        className="mt-1 break-words text-sm font-bold leading-6 text-[var(--foreground)] sm:text-base"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--control-border)] bg-[var(--surface-raised)] px-6 text-center">
              <span className="text-3xl" aria-hidden="true">
                ?
              </span>
              <p className="mt-3 text-base font-black">연결된 퀴즈를 준비 중입니다.</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                퀴즈가 등록되면 학습지와 진도 체크 화면에 동시에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
