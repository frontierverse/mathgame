import { useEffect, useRef } from "react";

import type { Lesson } from "./types";

type LessonProgressProps = {
  lessons: Lesson[];
  selectedLessonId: string;
  completedLessonIds: string[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
};

export default function LessonProgress({
  lessons,
  selectedLessonId,
  completedLessonIds,
  isCollapsed,
  onToggleCollapsed,
  onSelectLesson,
  onToggleLessonComplete,
}: LessonProgressProps) {
  const selectedLessonButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedLessonButtonRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedLessonId]);

  return (
    <aside
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_30px_rgba(111,92,74,0.08)] transition-[width] duration-200 ${isCollapsed ? "lg:w-[76px]" : "lg:w-[270px]"}`}
    >
      <div className={`flex items-start gap-3 border-b border-[var(--border)] ${isCollapsed ? "justify-center px-2 py-3" : "justify-between px-5 py-5"}`}>
        {!isCollapsed ? (
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[-0.04em]">학습 진도</h1>
            <p className="mt-1 text-sm text-[#95899a]">
              완료한 학습은 직접 체크할 수 있어요
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-controls="lesson-progress-list"
          aria-label={isCollapsed ? "학습 진도 사이드바 펼치기" : "학습 진도 사이드바 접기"}
          title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d={isCollapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
        </button>
      </div>

      <nav
        id="lesson-progress-list"
        className={`progress-scroll flex-1 overflow-y-auto ${isCollapsed ? "p-2" : "space-y-1 p-3"}`}
        aria-label="학습 진도 목록"
        aria-keyshortcuts="ArrowUp ArrowDown"
      >
        {lessons.map((lesson) => {
          const selected = lesson.id === selectedLessonId;
          const completed = completedLessonIds.includes(lesson.id);

          if (isCollapsed) {
            return (
              <button
                key={lesson.id}
                ref={selected ? selectedLessonButtonRef : undefined}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                aria-current={selected ? "page" : undefined}
                aria-label={`${lesson.index} ${lesson.title}${completed ? " 완료" : ""}`}
                title={lesson.title}
                className={`flex w-full items-center justify-center rounded-xl border p-2.5 transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)] ${
                  selected
                    ? "border-[var(--lesson-border-selected)] bg-[var(--lesson-row-selected)]"
                    : "border-transparent hover:border-[var(--lesson-border-hover)] hover:bg-[var(--lesson-row-hover)]"
                }`}
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
              </button>
            );
          }

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
