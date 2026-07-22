"use client";

import { useState } from "react";

import MathScene from "../MathScene";
import {
  factorConcepts,
  type FactorConceptExample,
  type FactorConceptExampleVisual,
  type FactorConceptLessonId,
} from "../shared/factorConcepts";

type FactorConceptLessonProps = {
  lessonId: FactorConceptLessonId;
  sceneExpression: string;
};

const phaseCount = 5;
const nextButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#6d559e] bg-[#8068c5] px-5 py-2 text-sm font-black text-white shadow-[0_4px_0_#5b477f] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5] focus-visible:ring-offset-2 active:translate-y-0 active:shadow-none";

function restartAnimation() {
  window.dispatchEvent(new Event("math-scene:replay"));
}

function ArrayVisual({
  count,
  columns,
}: Extract<FactorConceptExampleVisual, { kind: "array" }>) {
  return (
    <div
      className="grid w-fit gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="h-3.5 w-3.5 rounded-[4px] border border-[#6d559e]/30 bg-[#9b84d9] shadow-[0_2px_0_#6d559e]"
        />
      ))}
    </div>
  );
}

function FactorizationVisual({
  value,
  factors,
}: Extract<FactorConceptExampleVisual, { kind: "factorization" }>) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono font-black" aria-hidden="true">
      <span className="rounded-lg bg-[#d9d4de] px-2 py-1 text-[#5f5964]">{value}</span>
      <span>→</span>
      {factors.map((factor, index) => (
        <span key={`${factor}-${index}`} className="contents">
          {index > 0 ? <span className="text-[#95899a]">×</span> : null}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#53aebb] bg-[#e7f8fa] text-[#287c89]">
            {factor}
          </span>
        </span>
      ))}
    </div>
  );
}

function JumpsVisual({
  step,
  stops,
}: Extract<FactorConceptExampleVisual, { kind: "jumps" }>) {
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden="true">
      <span className="rounded-full bg-[#e7f8fa] px-2 py-0.5 text-[10px] font-black text-[#287c89]">
        {step}의 배수
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-xs font-black">
        {stops.map((stop, index) => (
          <span key={stop} className="contents">
            {index > 0 ? <span className="text-[#53aebb]">→</span> : null}
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-[#53aebb] bg-white px-1 text-[#287c89]">
              {stop}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 font-mono text-[10px] font-black text-[#7258b1]">
        {stops.map((stop, index) => (
          <span key={`${step}-product-${stop}`}>
            {step} × {index + 1} = {stop}
          </span>
        ))}
      </div>
    </div>
  );
}

function MeetingRow({
  values,
  hits,
  tone,
}: {
  values: readonly number[];
  hits: readonly number[];
  tone: "blue" | "red";
}) {
  const palette =
    tone === "blue"
      ? "border-[#53aebb] bg-[#e7f8fa] text-[#287c89]"
      : "border-[#e85b76] bg-[#fff0f3] text-[#b83f58]";

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {values.map((value) => (
        <span
          key={value}
          className={`flex h-6 min-w-6 items-center justify-center rounded-full border px-1 font-mono text-[10px] font-black ${palette} ${
            hits.includes(value) ? "ring-2 ring-[#9b84d9] ring-offset-1" : ""
          }`}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function MeetingVisual({
  first,
  second,
  hits,
}: Extract<FactorConceptExampleVisual, { kind: "meeting" }>) {
  return (
    <div className="grid gap-2" aria-hidden="true">
      <MeetingRow values={first} hits={hits} tone="blue" />
      <MeetingRow values={second} hits={hits} tone="red" />
    </div>
  );
}

function GroupRow({ total, groupSize }: { total: number; groupSize: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 font-mono text-[10px] font-black text-[#6f6574]">{total}</span>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: total / groupSize }, (_, groupIndex) => (
          <span
            key={groupIndex}
            className="flex gap-0.5 rounded-md border border-[#9b84d9]/50 bg-[#f1edff] p-1"
          >
            {Array.from({ length: groupSize }, (_, blockIndex) => (
              <span
                key={blockIndex}
                className="h-2 w-2 rounded-[2px] bg-[#9b84d9]"
              />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function GroupsVisual({
  totals,
  groupSize,
}: Extract<FactorConceptExampleVisual, { kind: "groups" }>) {
  return (
    <div className="grid gap-1.5" aria-hidden="true">
      <GroupRow total={totals[0]} groupSize={groupSize} />
      <GroupRow total={totals[1]} groupSize={groupSize} />
    </div>
  );
}

function MiniConceptVisual({ visual }: { visual: FactorConceptExampleVisual }) {
  switch (visual.kind) {
    case "array":
      return <ArrayVisual {...visual} />;
    case "factorization":
      return <FactorizationVisual {...visual} />;
    case "jumps":
      return <JumpsVisual {...visual} />;
    case "meeting":
      return <MeetingVisual {...visual} />;
    case "groups":
      return <GroupsVisual {...visual} />;
  }
}

function ExampleCard({ example }: { example: FactorConceptExample }) {
  return (
    <article
      aria-label={example.ariaLabel}
      className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
    >
      <MiniConceptVisual visual={example.visual} />
      <p className="font-mono text-sm font-black text-[var(--foreground)]">
        {example.label}
      </p>
    </article>
  );
}

export default function FactorConceptLesson({
  lessonId,
  sceneExpression,
}: FactorConceptLessonProps) {
  const concept = factorConcepts[lessonId];
  const [phase, setPhase] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const problem = concept.problems[problemIndex];
  const solved = choiceIndex === problem?.correctIndex;

  const advancePhase = () => {
    setPhase((current) => Math.min(current + 1, phaseCount - 1));
  };

  const restartLesson = () => {
    setPhase(0);
    setProblemIndex(0);
    setChoiceIndex(null);
    restartAnimation();
  };

  const advanceProblem = () => {
    if (problemIndex < concept.problems.length - 1) {
      setProblemIndex((current) => current + 1);
      setChoiceIndex(null);
      return;
    }
    restartLesson();
  };

  return (
    <section className="relative flex min-h-[560px] min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_12px_30px_rgba(111,92,130,0.09)] sm:min-h-[720px] lg:min-h-0">
      <header className="relative z-20 flex items-center justify-between gap-4 px-5 pb-1 pt-5 sm:px-6">
        <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
          {concept.title}
        </h2>
        <div className="flex items-center gap-3">
          <ol className="flex gap-1.5" aria-label={`학습 단계 ${phase + 1}/${phaseCount}`}>
            {Array.from({ length: phaseCount }, (_, index) => (
              <li
                key={index}
                aria-current={index === phase ? "step" : undefined}
                className={`h-2 rounded-full transition-all ${
                  index === phase
                    ? "w-6 bg-[#6d559e]"
                    : index < phase
                      ? "w-2 bg-[#9fd8b8]"
                      : "w-2 bg-[var(--border)]"
                }`}
              />
            ))}
          </ol>
          <button
            type="button"
            onClick={restartAnimation}
            aria-label="애니메이션 다시 보기"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5]"
          >
            ↻
          </button>
        </div>
      </header>

      <div
        role="img"
        aria-label={concept.sceneAriaLabel}
        className="relative h-[360px] min-h-[360px] flex-none sm:h-auto sm:min-h-[330px] sm:flex-1 lg:min-h-0"
      >
        <MathScene
          key={`factor-concept-scene-${lessonId}`}
          expression={sceneExpression}
          lessonId={lessonId}
        />
      </div>

      <div className="relative z-20 border-t border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5">
        {phase === 0 ? (
          <div className="flex min-h-28 flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-black text-[var(--foreground)]">규칙을 찾아봐</p>
            <button type="button" onClick={advancePhase} className={nextButtonClassName}>
              찾았어요
            </button>
          </div>
        ) : null}

        {phase === 1 ? (
          <div className="flex min-h-28 flex-col items-center justify-center gap-4 text-center">
            <p className="text-xl font-black text-[var(--foreground)] sm:text-2xl">
              {concept.question}
            </p>
            <button type="button" onClick={advancePhase} className={nextButtonClassName}>
              확인
            </button>
          </div>
        ) : null}

        {phase === 2 ? (
          <div className="flex min-h-28 flex-col items-center justify-center gap-3 text-center">
            <div className="space-y-1 text-xl font-black text-[var(--foreground)] sm:text-2xl">
              {concept.answer.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {concept.note ? (
              <p className="rounded-full border border-[var(--control-border)] bg-[var(--control-background)] px-3 py-1 text-xs font-black text-[var(--control-foreground)]">
                {concept.note}
              </p>
            ) : null}
            <button type="button" onClick={advancePhase} className={nextButtonClassName}>
              예시
            </button>
          </div>
        ) : null}

        {phase === 3 ? (
          <div className="grid min-h-28 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            {concept.examples.map((example) => (
              <ExampleCard key={example.label} example={example} />
            ))}
            <button
              type="button"
              onClick={advancePhase}
              className={`${nextButtonClassName} sm:ml-1`}
            >
              해보기
            </button>
          </div>
        ) : null}

        {phase === 4 && problem ? (
          <div className="mx-auto flex min-h-28 w-full max-w-3xl flex-col items-center justify-center gap-3 text-center">
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-[11px] font-black tracking-[0.16em] text-[#8068c5]">
                QUIZ
              </span>
              <span className="font-mono text-xs font-black text-[#95899a]">
                {problemIndex + 1}/{concept.problems.length}
              </span>
            </div>
            <p className="text-lg font-black text-[var(--foreground)] sm:text-xl">{problem.prompt}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {problem.choices.map((choice, index) => {
                const selected = choiceIndex === index;
                const correct = index === problem.correctIndex;
                const stateClass = selected
                  ? correct
                    ? "border-[#4a9b68] bg-[#eaf7ee] text-[#287245]"
                    : "border-[#d95b67] bg-[#fff0f1] text-[#ad3440]"
                  : "border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] hover:border-[#8068c5]";

                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setChoiceIndex(index)}
                    className={`min-h-11 min-w-16 rounded-xl border px-4 py-2 font-mono text-sm font-black shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8068c5] ${stateClass}`}
                  >
                    {choice}
                    {selected ? <span aria-hidden="true"> {correct ? "✓" : "×"}</span> : null}
                  </button>
                );
              })}
            </div>
            <p className="sr-only" aria-live="polite">
              {choiceIndex === null
                ? ""
                : solved
                  ? "정답입니다."
                  : "다시 골라 보세요."}
            </p>
            {solved ? (
              <button type="button" onClick={advanceProblem} className={nextButtonClassName}>
                {problemIndex < concept.problems.length - 1 ? "다음" : "다시 보기"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
