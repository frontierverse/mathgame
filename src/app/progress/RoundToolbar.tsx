"use client";

import { useId } from "react";

import {
  MAX_SOLVES,
  type CurriculumQuizRound,
} from "./quizData";
import type { QuizProgress } from "./quizProgress";
import { getRoundProgress } from "./roundProgress";

export type RoundAssignments = Readonly<Record<string, readonly string[]>>;

const RAINBOW_PROGRESS_BACKGROUND =
  "linear-gradient(90deg, #ff375f 0%, #ff9f0a 16%, #ffd60a 31%, #30d158 47%, #64d2ff 63%, #0a84ff 78%, #5e5ce6 90%, #bf5af2 100%)";

type RoundToolbarProps = {
  rounds: readonly CurriculumQuizRound[];
  selectedRoundId: string;
  assignments: RoundAssignments;
  progress: QuizProgress;
  onSelectRound: (roundId: string) => void;
  onOpenSettings: () => void;
};

function uniqueNames(names: readonly string[] | undefined) {
  return Array.from(new Set(names ?? []));
}

export function isRoundComplete(
  round: CurriculumQuizRound,
  assignedNames: readonly string[],
  progress: QuizProgress,
) {
  const participants = uniqueNames(assignedNames);
  return (
    participants.length > 0 &&
    round.quizIndexes.length > 0 &&
    participants.every((studentName) =>
      round.quizIndexes.every(
        (quizIndex) => (progress[studentName]?.[quizIndex] ?? 0) === MAX_SOLVES,
      ),
    )
  );
}

function roundOptionLabel(round: CurriculumQuizRound) {
  return `ROUND ${round.roundNumber} · ${round.gradeLabel} · ${round.semesterLabel} · ${round.curriculumLabel} · 퀴즈 ${round.quizIndexes.length}개`;
}

export default function RoundToolbar({
  rounds,
  selectedRoundId,
  assignments,
  progress,
  onSelectRound,
  onOpenSettings,
}: RoundToolbarProps) {
  const selectId = useId();
  const selectedRound =
    rounds.find(({ id }) => id === selectedRoundId) ?? rounds[0] ?? null;
  const assignedNames = selectedRound
    ? uniqueNames(assignments[selectedRound.id])
    : [];
  const roundProgress = selectedRound
    ? getRoundProgress(selectedRound, assignedNames, progress)
    : null;
  const complete = roundProgress?.complete ?? false;

  return (
    <section
      aria-label="퀴즈 라운드"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5"
    >
      <label htmlFor={selectId} className="sr-only">
        라운드 선택
      </label>

      <div className="flex min-w-0 items-stretch gap-2.5">
        <div className="relative min-w-0 flex-1">
          <select
            id={selectId}
            value={selectedRound?.id ?? ""}
            disabled={rounds.length === 0}
            onChange={(event) => onSelectRound(event.target.value)}
            className="h-12 w-full min-w-0 appearance-auto rounded-xl border border-[var(--control-border)] bg-[var(--surface)] px-3.5 pr-8 text-sm font-black text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--lesson-accent)] focus:ring-2 focus:ring-[var(--lesson-accent)]/20 disabled:cursor-not-allowed disabled:opacity-55 sm:text-base"
          >
            {rounds.length === 0 ? <option value="">라운드 없음</option> : null}
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {roundOptionLabel(round)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="라운드 및 퀴즈 설정"
          title="라운드 및 퀴즈 설정"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] focus-visible:ring-offset-2 active:translate-y-0"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.4V9.55h.1A1.7 1.7 0 0 0 4 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.46 3.8l.06.06A1.7 1.7 0 0 0 8.4 4.2a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 9.8 2.5v-.1h4.05v.1A1.7 1.7 0 0 0 14.8 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.2 8.4a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.05h-.1a1.7 1.7 0 0 0-1.5 1.15Z" />
          </svg>
        </button>
      </div>

      {selectedRound && roundProgress ? (
        <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-center">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black sm:text-xs">
            <span className="rounded-full bg-[var(--control-background-active)] px-2.5 py-1 text-[var(--control-foreground)]">
              ROUND {selectedRound.roundNumber}
            </span>
            <span className="rounded-full border border-[var(--control-border)] bg-[var(--surface)] px-2.5 py-1 text-[var(--muted)]">
              {selectedRound.gradeLabel}
            </span>
            <span className="rounded-full border border-[var(--control-border)] bg-[var(--surface)] px-2.5 py-1 text-[var(--muted)]">
              {selectedRound.semesterLabel}
            </span>
            <span className="rounded-full border border-[var(--control-border)] bg-[var(--surface)] px-2.5 py-1 text-[var(--muted)]">
              퀴즈 {selectedRound.quizIndexes.length}개
            </span>
            <span className="rounded-full border border-[var(--control-border)] bg-[var(--surface)] px-2.5 py-1 text-[var(--muted)]">
              {assignedNames.length}명
            </span>
            {complete ? (
              <span className="round-complete-badge rounded-full border border-[#b9dec5] bg-[#ecf8ef] px-2.5 py-1 text-[#287245]">
                ✓ 완료
              </span>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-black text-[var(--lesson-text)]">
              <span>
                <span className="text-transparent">야르</span>{" "}
                {roundProgress.rubyCount}/{roundProgress.rubyTarget}
              </span>
              <span>
                {roundProgress.completedStudentCount}/
                {roundProgress.participantCount}명 통과
              </span>
            </div>
            <div
              className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--border)]"
              role={roundProgress.rubyTarget > 0 ? "progressbar" : undefined}
              aria-hidden={roundProgress.rubyTarget === 0 || undefined}
              aria-label={
                roundProgress.rubyTarget > 0
                  ? `${selectedRound.roundNumber}라운드 야르 진행도`
                  : undefined
              }
              aria-valuemin={roundProgress.rubyTarget > 0 ? 0 : undefined}
              aria-valuemax={
                roundProgress.rubyTarget > 0
                  ? roundProgress.rubyTarget
                  : undefined
              }
              aria-valuenow={
                roundProgress.rubyTarget > 0
                  ? roundProgress.rubyCount
                  : undefined
              }
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${roundProgress.progressPercent}%`,
                  backgroundImage: RAINBOW_PROGRESS_BACKGROUND,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
