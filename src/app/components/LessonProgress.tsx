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
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e7dccb] bg-[#fffdf8] shadow-[0_12px_30px_rgba(111,92,74,0.08)]">
      <div className="border-b border-[#eee4d7] px-5 py-5">
        <h1 className="text-2xl font-bold tracking-[-0.04em]">학습 진도</h1>
        <p className="mt-1 text-sm text-[#95899a]">
          완료한 학습은 직접 체크할 수 있어요
        </p>
      </div>
      <nav className="progress-scroll flex-1 space-y-1 overflow-y-auto p-3" aria-label="학습 진도 목록">
        {lessons.map((lesson) => {
          const selected = lesson.id === selectedLessonId;
          const completed = completedLessonIds.includes(lesson.id);
          return (
            <div
              key={lesson.id}
              className={`group relative flex w-full items-center rounded-xl border transition ${
                selected
                  ? "border-[#a795d8]/50 bg-[#f1ecfb]"
                  : "border-transparent hover:border-[#eadfce] hover:bg-[#faf6ef]"
              }`}
            >
              {selected && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-[#9b84d9]" />}
              <button
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                aria-current={selected ? "page" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl py-3.5 pl-3 pr-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#8f78c9]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-bold"
                  style={{
                    borderColor: `${lesson.color}55`,
                    color: completed || selected ? lesson.color : "#9b909f",
                    background: completed ? `${lesson.color}16` : "transparent",
                  }}
                >
                  {completed ? "✓" : lesson.index}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${selected ? "text-[#4a4057]" : "text-[#665c6f]"}`}>
                    {lesson.title}
                  </span>
                </span>
              </button>
              <label className="mr-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-white/60">
                <span className="sr-only">{lesson.title} 완료</span>
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => onToggleLessonComplete(lesson.id)}
                  className="h-5 w-5 cursor-pointer accent-[#8f78c9]"
                />
              </label>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
