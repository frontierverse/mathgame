"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { type CurriculumQuizRound } from "./quizData";
import type { QuizProgress } from "./quizProgress";
import {
  isRoundComplete,
  type RoundAssignments,
} from "./RoundToolbar";

type RoundStudent = {
  name: string;
  originalIndex: number;
};

type RoundSettingsModalProps = {
  open: boolean;
  rounds: readonly CurriculumQuizRound[];
  selectedRoundId: string;
  assignments: RoundAssignments;
  students: readonly RoundStudent[];
  progress: QuizProgress;
  onSelectRound?: (roundId: string) => void;
  onChangeAssignment: (roundId: string, names: string[]) => void;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function uniqueNames(names: readonly string[] | undefined) {
  return Array.from(new Set(names ?? []));
}

function displayName(name: string) {
  return name.slice(1).trim() || name;
}

function roundMeta(round: CurriculumQuizRound) {
  return `${round.gradeLabel} · ${round.semesterLabel} · ${round.unitTitle} · ${round.subunitTitle}`;
}

export default function RoundSettingsModal({
  open,
  rounds,
  selectedRoundId,
  assignments,
  students,
  progress,
  onSelectRound,
  onChangeAssignment,
  onClose,
}: RoundSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState(selectedRoundId);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const studentOptions = useMemo(() => {
    const byName = new Map<string, RoundStudent>();
    students.forEach((student) => {
      if (!byName.has(student.name)) byName.set(student.name, student);
    });
    return Array.from(byName.values());
  }, [students]);

  const activeRound =
    rounds.find(({ id }) => id === editingRoundId) ??
    rounds.find(({ id }) => id === selectedRoundId) ??
    rounds[0] ??
    null;
  const activeAssignedNames = activeRound
    ? uniqueNames(assignments[activeRound.id])
    : [];
  const activeAssignedNameSet = new Set(activeAssignedNames);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setEditingRoundId(
        rounds.some(({ id }) => id === selectedRoundId)
          ? selectedRoundId
          : (rounds[0]?.id ?? ""),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, rounds, selectedRoundId]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose, open]);

  const selectRound = (roundId: string) => {
    setEditingRoundId(roundId);
    onSelectRound?.(roundId);
  };

  const toggleStudent = (studentName: string) => {
    if (!activeRound) return;

    const nextNames = activeAssignedNameSet.has(studentName)
      ? activeAssignedNames.filter((name) => name !== studentName)
      : [...activeAssignedNames, studentName];
    onChangeAssignment(activeRound.id, nextNames);
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-[#312a38]/45 p-3 backdrop-blur-[2px] sm:p-4"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="round-settings-title"
        tabIndex={-1}
        className="flex h-[min(680px,calc(100dvh-1.5rem))] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_90px_rgba(46,37,57,0.3)] sm:h-[min(680px,calc(100dvh-2rem))]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black text-[var(--lesson-accent)]">QUIZ ROUND</p>
            <h2
              id="round-settings-title"
              className="mt-0.5 truncate text-xl font-black tracking-[-0.04em] text-[var(--foreground)]"
            >
              라운드 설정
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-bold text-[var(--muted)] transition hover:bg-[var(--control-background)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)]"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] md:grid-rows-1">
          <div className="min-h-0 overflow-y-auto border-b border-[var(--border)] p-3 md:border-b-0 md:border-r sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <h3 className="text-xs font-black text-[var(--muted)]">라운드</h3>
              <span className="text-[11px] font-black tabular-nums text-[var(--muted)]">
                {rounds.length}
              </span>
            </div>

            <ol className="space-y-2" aria-label="라운드 목록">
              {rounds.map((round) => {
                const assignedNames = uniqueNames(assignments[round.id]);
                const complete = isRoundComplete(round, assignedNames, progress);
                const selected = activeRound?.id === round.id;

                return (
                  <li key={round.id}>
                    <button
                      type="button"
                      onClick={() => selectRound(round.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] focus-visible:ring-offset-1 ${
                        selected
                          ? "border-[var(--control-border-active)] bg-[var(--control-background-active)] shadow-sm"
                          : complete
                            ? "border-[#c6e3ce] bg-[#f2faf4] hover:border-[#9fceb0]"
                            : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--control-border-active)]"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-[var(--foreground)]">
                          ROUND {round.roundNumber}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full border border-[var(--control-border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-black tabular-nums text-[var(--muted)]">
                            {assignedNames.length}명
                          </span>
                          {complete ? (
                            <span className="rounded-full border border-[#b9dec5] bg-[#eaf7ee] px-2 py-0.5 text-[10px] font-black text-[#287245]">
                              ✓ 완료
                            </span>
                          ) : null}
                        </span>
                      </span>

                      <span className="mt-1.5 block text-[11px] font-bold leading-4 text-[var(--muted)]">
                        {roundMeta(round)}
                      </span>

                      <span className="mt-2 flex flex-wrap gap-1">
                        {assignedNames.length > 0 ? (
                          assignedNames.map((studentName) => (
                            <span
                              key={studentName}
                              className="max-w-full truncate rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-black text-[var(--control-foreground)]"
                            >
                              {displayName(studentName)}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-dashed border-[var(--control-border)] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">
                            미배정
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden">
            {activeRound ? (
              <>
                <div className="shrink-0 border-b border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-[var(--lesson-accent)]">
                        ROUND {activeRound.roundNumber}
                      </p>
                      <h3 className="mt-0.5 text-lg font-black text-[var(--foreground)]">
                        학생 배정
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-[var(--muted)]">
                        {roundMeta(activeRound)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--control-border)] bg-[var(--control-background)] px-2.5 py-1 text-xs font-black tabular-nums text-[var(--control-foreground)]">
                      {activeAssignedNames.length}명
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeAssignment(
                          activeRound.id,
                          studentOptions.map(({ name }) => name),
                        )
                      }
                      disabled={studentOptions.length === 0}
                      className="rounded-lg border border-[var(--control-border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-black text-[var(--control-foreground)] transition hover:bg-[var(--control-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeAssignment(activeRound.id, [])}
                      disabled={activeAssignedNames.length === 0}
                      className="rounded-lg border border-[var(--control-border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-black text-[var(--muted)] transition hover:bg-[var(--control-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      해제
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  <fieldset>
                    <legend className="sr-only">
                      ROUND {activeRound.roundNumber} 참여 학생
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {studentOptions.map((student) => {
                        const checked = activeAssignedNameSet.has(student.name);

                        return (
                          <label
                            key={`${student.name}-${student.originalIndex}`}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                              checked
                                ? "border-[var(--control-border-active)] bg-[var(--control-background-active)]"
                                : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--control-border)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStudent(student.name)}
                              className="h-5 w-5 shrink-0 accent-[#8f78c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)]"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-black text-[var(--foreground)]">
                              {displayName(student.name)}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {studentOptions.length === 0 ? (
                      <p className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-[var(--control-border)] text-sm font-bold text-[var(--muted)]">
                        학생 없음
                      </p>
                    ) : null}
                  </fieldset>
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-sm font-bold text-[var(--muted)]">
                라운드 없음
              </div>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
