"use client";

import { memo } from "react";

import type { QuizProgress } from "./quizProgress";
import { startedQuizCount } from "./quizProgress";

type StudentListProps = {
  students: { name: string; age: number | null }[];
  selectedIndex: number;
  progress: QuizProgress;
  onSelect: (index: number) => void;
};

function StudentList({
  students,
  selectedIndex,
  progress,
  onSelect,
}: StudentListProps) {
  return (
    <aside className="rounded-2xl border border-[#eee4d7] bg-[#fffefa] p-3.5">
      <ol className="grid grid-cols-2 gap-2.5" aria-label="진도 체크 대상 목록">
        {students.map((student, index) => {
          const givenName = student.name.slice(1);
          const started = startedQuizCount(progress[student.name] ?? []);
          const selected = index === selectedIndex;
          return (
            <li key={`${student.name}-${index}`}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-pressed={selected}
                aria-keyshortcuts={`${index + 1}`}
                className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3.5 py-4 text-left transition ${
                  selected
                    ? "bg-[#f1ecfb] text-[#51475c] shadow-[0_4px_12px_rgba(120,96,190,0.12)]"
                    : "text-[#766b7d] hover:bg-[#faf6ef]"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold ${
                    selected ? "bg-[#9b84d9] text-white" : "bg-[#f1ecfb] text-[#8f78c9]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-lg font-bold">{givenName}</span>
                <span className="text-xs font-bold tabular-nums text-[#a99cc0]">{started}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default memo(StudentList);
