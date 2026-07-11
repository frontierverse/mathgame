"use client";

import { useCallback, useEffect, useState } from "react";

import { MINERALS, MINERAL_ORDER } from "./MineralIcon";
import StudentBlob, { type BlobVariant } from "./StudentBlob";

const STUDENT_COLORS = [
  "#f6a5b8",
  "#9edce3",
  "#b5a3f0",
  "#f7c67a",
  "#8fd8a0",
  "#f2907e",
  "#7ec2f0",
  "#e2a0e0",
];

const QUIZZES = Array.from({ length: 100 }, (_, index) => {
  const left = Math.floor(index / 10) + 1;
  const right = (index % 10) + 1;
  return `${left} × ${right} = ?`;
});

// Each quiz can be solved up to 3 times. Its mineral evolves in place:
// 1회 → 돌, 2회 → 수정, 3회 → 루비.
const MAX_SOLVES = 3;

const mineralForStage = (stage: number): BlobVariant =>
  MINERAL_ORDER[Math.min(stage, MINERAL_ORDER.length - 1)];

const mineralForCount = (count: number): BlobVariant | null =>
  count > 0 ? mineralForStage(count - 1) : null;

const STORAGE_KEY = "math-space-quiz-progress-v4";

// progress[studentName][quizIndex] = how many times that quiz has been solved.
function loadProgress(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number[]>) : {};
  } catch {
    return {};
  }
}

const startedQuizCount = (counts: number[]) => counts.filter((count) => count > 0).length;

type StudentRosterProps = {
  students: string[];
};

export default function StudentRoster({ students }: StudentRosterProps) {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [openQuizIndex, setOpenQuizIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(loadProgress()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const selectStudent = useCallback((index: number) => {
    setSelectedStudentIndex(index);
    setOpenQuizIndex(null);
  }, []);

  const closeModal = useCallback(() => setOpenQuizIndex(null), []);

  const solveQuiz = useCallback((name: string, quizIndex: number) => {
    setProgress((previous) => {
      const counts = [...(previous[name] ?? [])];
      while (counts.length < QUIZZES.length) counts.push(0);
      if (counts[quizIndex] >= MAX_SOLVES) return previous;

      counts[quizIndex] += 1;
      const updated = { ...previous, [name]: counts };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage failures in private browsing or restricted environments.
      }
      return updated;
    });
  }, []);

  const selectedName = students[selectedStudentIndex] ?? null;
  const selectedCounts = selectedName ? progress[selectedName] ?? [] : [];

  return (
    <section className="mt-5" aria-label="학생별 퀴즈 진행도">
      <div className="grid gap-4 lg:grid-cols-[500px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#eee4d7] bg-[#fffefa] p-3.5">
          <ol className="grid grid-cols-2 gap-2.5" aria-label="진도 체크할 학생 목록">
            {students.map((name, index) => {
              const givenName = name.slice(1);
              const started = startedQuizCount(progress[name] ?? []);
              const selected = index === selectedStudentIndex;
              return (
                <li key={`${name}-${index}`}>
                  <button
                    type="button"
                    onClick={() => selectStudent(index)}
                    aria-pressed={selected}
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

        {selectedName ? (
          <div className="min-w-0 p-1 sm:p-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.04em] text-[#51475c]">
                  {selectedName.slice(1)}의 퀴즈
                </h3>
              </div>
              <p
                className="text-sm font-bold tabular-nums text-[#68578b]"
                aria-label={`완료 ${startedQuizCount(selectedCounts)}개`}
              >
                완료 {startedQuizCount(selectedCounts)}
              </p>
            </div>

            <ol className="mt-5 flex flex-wrap content-start gap-1" aria-label={`${selectedName.slice(1)}의 퀴즈 100개`}>
              {QUIZZES.map((_, quizIndex) => {
                const count = selectedCounts[quizIndex] ?? 0;
                const mineral = mineralForCount(count);
                return (
                  <li key={quizIndex}>
                    <button
                      type="button"
                      onClick={() => setOpenQuizIndex(quizIndex)}
                      aria-label={`${quizIndex + 1}번 퀴즈${mineral ? ` · ${MINERALS[mineral].label} (${count}/${MAX_SOLVES})` : ""}`}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5a3f0] focus-visible:ring-offset-1 sm:h-14 sm:w-14 ${
                        mineral
                          ? "border-[#d6c8e8] bg-[#f7f2ff] hover:-translate-y-0.5 hover:border-[#9b84d9]"
                          : "border-[#dfd3c3] bg-white text-[#b3a693] hover:-translate-y-0.5 hover:border-[#b6a5df] hover:bg-[#f8f4ff]"
                      }`}
                    >
                      {mineral ? (
                        <StudentBlob
                          variant={mineral}
                          color={STUDENT_COLORS[selectedStudentIndex % STUDENT_COLORS.length]}
                          seed={selectedStudentIndex * 100 + quizIndex}
                          renderMode="thumbnail"
                          className="h-10 w-10 sm:h-12 sm:w-12"
                        />
                      ) : (
                        <span className="text-sm font-bold tabular-nums sm:text-base">{quizIndex + 1}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </div>

      {openQuizIndex !== null && selectedName ? (
        <QuizModal
          name={selectedName.slice(1)}
          quizIndex={openQuizIndex}
          counts={selectedCounts}
          color={STUDENT_COLORS[selectedStudentIndex % STUDENT_COLORS.length]}
          onSolve={() => solveQuiz(selectedName, openQuizIndex)}
          onClose={closeModal}
        />
      ) : null}
    </section>
  );
}

type QuizModalProps = {
  name: string;
  quizIndex: number;
  counts: number[];
  color: string;
  onSolve: () => void;
  onClose: () => void;
};

function QuizModal({ name, quizIndex, counts, color, onSolve, onClose }: QuizModalProps) {
  const [entered, setEntered] = useState(false);

  const requestClose = useCallback(() => {
    setEntered(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [requestClose]);

  const solveCount = counts[quizIndex] ?? 0;
  const currentMineral = mineralForCount(solveCount);
  const maxed = solveCount >= MAX_SOLVES;
  const nextMineral = mineralForStage(solveCount);
  const badgeMineral = currentMineral ?? nextMineral;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} ${quizIndex + 1}번 퀴즈`}
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={requestClose}
        className="absolute inset-0 bg-[#2b2438]/45 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: entered ? 1 : 0 }}
      />

      <div
        className="relative w-full max-w-lg rounded-[2rem] border border-[#ece1f4] bg-[#fffdf8] p-6 shadow-[0_30px_80px_rgba(66,46,90,0.28)] transition-all duration-300 sm:p-7"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0) scale(1)" : "translateY(24px) scale(0.94)",
        }}
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="닫기"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#8a7f95] transition hover:bg-[#f1ecfb] hover:text-[#5f5470]"
        >
          ✕
        </button>

        <p className="text-[11px] font-bold tracking-[0.16em] text-[#8f78c9]">
          {name} · QUIZ {quizIndex + 1}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-3xl font-bold tracking-[-0.05em] text-[#463c56]">
            {QUIZZES[quizIndex]}
          </p>
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#e7dcf3] bg-[#f7f2ff]">
            <StudentBlob
              variant={badgeMineral}
              color={color}
              seed={quizIndex}
              className="h-16 w-16"
            />
          </span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2" aria-label={`풀이 ${solveCount} / ${MAX_SOLVES}`}>
          {Array.from({ length: MAX_SOLVES }, (_, index) => (
            <span
              key={index}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                index < solveCount ? "bg-[#9b84d9]" : "bg-[#e3d9c8]"
              }`}
            />
          ))}
        </div>

        <div className="mt-4">
          {maxed ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#eef9f0] px-4 py-3 text-sm font-bold text-[#3f8a5b]">
              <StudentBlob
                variant={mineralForStage(MAX_SOLVES - 1)}
                color={color}
                seed={quizIndex}
                className="h-8 w-8"
              />
              최고 단계 · {MINERALS[mineralForStage(MAX_SOLVES - 1)].label} 완성!
            </div>
          ) : (
            <button
              type="button"
              onClick={onSolve}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9b84d9] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(120,96,190,0.24)] transition hover:-translate-y-0.5 hover:bg-[#8a72cb] active:translate-y-0"
            >
              <span className="text-base">✓</span>
              {solveCount === 0
                ? `맞았어요 · ${MINERALS[nextMineral].label} 획득!`
                : `또 맞았어요 · ${MINERALS[nextMineral].label}(으)로 진화!`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
