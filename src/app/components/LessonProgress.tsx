import { useEffect, useRef } from "react";

import type { Lesson } from "./types";

type LessonProgressProps = {
  lessons: Lesson[];
  selectedLessonId: string;
  completedLessonIds: string[];
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
};

export default function LessonProgress({
  lessons,
  selectedLessonId,
  completedLessonIds,
  onSelectLesson,
  onToggleLessonComplete,
}: LessonProgressProps) {
  const selectedLessonButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedLessonButtonRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedLessonId]);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_30px_rgba(111,92,74,0.08)]">
      <div className="border-b border-[var(--border)] px-5 py-5">
        <h1 className="text-2xl font-bold tracking-[-0.04em]">학습 진도</h1>
        <p className="mt-1 text-sm text-[#95899a]">
          완료한 학습은 직접 체크할 수 있어요
        </p>
      </div>
      <nav
        className="progress-scroll flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="학습 진도 목록"
        aria-keyshortcuts="ArrowUp ArrowDown"
      >
        {lessons.map((lesson) => {
          const selected = lesson.id === selectedLessonId;
          const completed = completedLessonIds.includes(lesson.id);
          return (
            <div
              key={lesson.id}
              className={`group relative flex w-full items-center rounded-xl border transition ${
                selected
                  ? "border-[var(--lesson-border-selected)] bg-[var(--lesson-row-selected)]"
                  : "border-transparent hover:border-[var(--lesson-border-hover)] hover:bg-[var(--lesson-row-hover)]"
              }`}
            >
              {selected && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-[var(--lesson-accent)]" />}
              <button
                ref={selected ? selectedLessonButtonRef : undefined}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                aria-current={selected ? "page" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl py-3.5 pl-3 pr-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-bold"
                  style={{
                    borderColor:
                      completed || selected
                        ? "var(--lesson-marker-active)"
                        : "var(--lesson-marker-border)",
                    color:
                      completed || selected
                        ? "var(--lesson-marker-active)"
                        : "var(--muted)",
                    background: completed
                      ? "var(--lesson-marker-complete-background)"
                      : "transparent",
                  }}
                >
                  {completed ? "✓" : lesson.index}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${selected ? "text-[var(--lesson-text-selected)]" : "text-[var(--lesson-text)]"}`}>
                    {lesson.title}
                  </span>
                </span>
              </button>
              <label className="mr-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-[var(--surface-hover)]">
                <span className="sr-only">{lesson.title} 완료</span>
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => onToggleLessonComplete(lesson.id)}
                  className="h-5 w-5 cursor-pointer accent-[var(--lesson-accent)]"
                />
              </label>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
