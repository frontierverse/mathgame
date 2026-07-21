"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";

import { getQuizForIndex, quizAnswerForIndex } from "./quizData";
import QuizQuestionText from "./QuizQuestionText";

type QuizFlipCardProps = {
  id?: string;
  ariaLabel: string;
  quizIndex: number;
  answerText?: string | null;
  entered: boolean;
  faceClassName: string;
  cornerAccessory?: ReactNode;
  children: ReactNode;
};

type FlipButtonProps = {
  buttonRef: RefObject<HTMLButtonElement | null>;
  showingAnswer: boolean;
  onClick: () => void;
};

function FlipButton({ buttonRef, showingAnswer, onClick }: FlipButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={showingAnswer ? "뒤집어 문제 보기" : "뒤집어 정답 보기"}
      title="뒤집기"
      className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] focus-visible:ring-offset-2 active:translate-y-0"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h10a4 4 0 0 1 4 4v1" />
        <path d="m7 4-3 3 3 3" />
        <path d="M20 17H10a4 4 0 0 1-4-4v-1" />
        <path d="m17 20 3-3-3-3" />
      </svg>
    </button>
  );
}

export default function QuizFlipCard({
  id,
  ariaLabel,
  quizIndex,
  answerText,
  entered,
  faceClassName,
  cornerAccessory,
  children,
}: QuizFlipCardProps) {
  const [showingAnswer, setShowingAnswer] = useState(false);
  const frontFlipButtonRef = useRef<HTMLButtonElement>(null);
  const backFlipButtonRef = useRef<HTMLButtonElement>(null);
  const quiz = getQuizForIndex(quizIndex);
  const answer = (
    answerText === undefined ? quizAnswerForIndex(quizIndex) : answerText
  )?.trim() ?? "";

  const flip = (nextShowingAnswer: boolean) => {
    setShowingAnswer(nextShowingAnswer);
    window.setTimeout(() => {
      const nextButton = nextShowingAnswer
        ? backFlipButtonRef.current
        : frontFlipButtonRef.current;
      nextButton?.focus();
    }, 0);
  };

  const backfaceStyle = {
    backfaceVisibility: "hidden" as const,
    WebkitBackfaceVisibility: "hidden" as const,
  };

  return (
    <aside
      id={id}
      className="relative min-w-0 max-w-full [perspective:1200px]"
      aria-label={`${ariaLabel}${showingAnswer ? " 정답" : ""}`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 300ms, transform 300ms",
      }}
    >
      {cornerAccessory ? (
        <span className="absolute right-16 top-4 z-20">{cornerAccessory}</span>
      ) : null}
      <div
        className="grid transition-transform duration-500 ease-[cubic-bezier(0.22,0.72,0.24,1)] motion-reduce:transition-none"
        style={{
          transform: `rotateY(${showingAnswer ? 180 : 0}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <section
          aria-hidden={showingAnswer}
          inert={showingAnswer}
          className={`relative col-start-1 row-start-1 ${showingAnswer ? "pointer-events-none" : ""} ${faceClassName}`}
          style={backfaceStyle}
        >
          <FlipButton
            buttonRef={frontFlipButtonRef}
            showingAnswer={false}
            onClick={() => flip(true)}
          />
          {children}
        </section>

        <section
          aria-hidden={!showingAnswer}
          inert={!showingAnswer}
          className={`relative col-start-1 row-start-1 ${showingAnswer ? "" : "pointer-events-none"} ${faceClassName}`}
          style={{ ...backfaceStyle, transform: "rotateY(180deg)" }}
        >
          <FlipButton
            buttonRef={backFlipButtonRef}
            showingAnswer
            onClick={() => flip(false)}
          />

          <div className="flex min-h-[360px] flex-col">
            <p
              className={`${cornerAccessory ? "pr-28" : "pr-10"} text-[11px] font-black tracking-[0.16em] text-[var(--lesson-accent)]`}
            >
              QUIZ {quizIndex + 1}
            </p>
            {quiz ? (
              <p
                className={`${cornerAccessory ? "mt-4" : "mt-1"} pr-10 text-xs font-bold text-[var(--muted)]`}
              >
                {quiz.gradeLabel} · {quiz.semesterLabel} · {quiz.unitTitle} ·{" "}
                {quiz.subunitTitle}
              </p>
            ) : null}

            <div
              className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center"
              aria-live="polite"
            >
              <p className="text-xs font-black tracking-[0.18em] text-[var(--lesson-accent)]">
                정답
              </p>
              {answer ? (
                <QuizQuestionText
                  text={answer}
                  className="mt-5 max-w-full text-2xl font-black leading-relaxed text-[var(--foreground)] sm:text-3xl"
                />
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="mt-5 text-5xl font-light text-[var(--muted)]"
                  >
                    —
                  </span>
                  <span className="sr-only">아직 정답이 입력되지 않았습니다.</span>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
