"use client";

import { useEffect, useState } from "react";

import QuizDetail from "./QuizDetail";
import QuizFlipCard from "./QuizFlipCard";
import type { QuizMineralStage } from "./quizData";

type RandomQuizPanelProps = {
  studentName: string;
  quizIndex: number;
  variantKey: string;
  questionText: string;
  answerText: string | null;
  counts: number[];
  onAward: (stage: QuizMineralStage) => void;
  onClose: () => void;
};

export default function RandomQuizPanel({
  studentName,
  quizIndex,
  variantKey,
  questionText,
  answerText,
  counts,
  onAward,
  onClose,
}: RandomQuizPanelProps) {
  const [entered, setEntered] = useState(false);
  const givenName = studentName.slice(1).trim() || studentName;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <QuizFlipCard
      key={`${studentName}-${quizIndex}-${variantKey}`}
      id="random-quiz-panel"
      ariaLabel={`${givenName} ${quizIndex + 1}번 랜덤 퀴즈`}
      quizIndex={quizIndex}
      answerText={answerText}
      entered={entered}
      faceClassName="min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-[var(--control-border-active)] bg-[var(--surface)] p-6 shadow-[0_16px_40px_rgba(73,53,96,0.16)] sm:p-7"
    >
      <div className="min-w-0 pr-10" role="status" aria-live="polite">
        <p className="text-[11px] font-black tracking-[0.16em] text-[var(--lesson-accent)]">
          QUIZ {quizIndex + 1}
        </p>
        <h2 className="mt-1 truncate text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]">
          {givenName}
        </h2>
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <QuizDetail
          name={givenName}
          quizIndex={quizIndex}
          questionText={questionText}
          counts={counts}
          onAward={onAward}
          showIdentity={false}
        />
      </div>
    </QuizFlipCard>
  );
}
