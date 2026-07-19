"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";

import type { CurriculumGrade } from "../mathLogic";
import { getQuizSetForSubunit } from "../shared/curriculumQuizzes";
import WorksheetQuizModal, { type WorksheetQuizSelection } from "./WorksheetQuizModal";

type WorksheetCurriculumTabsProps = {
  grades: CurriculumGrade[];
  availableWorksheetId: string;
};

export default function WorksheetCurriculumTabs({
  grades,
  availableWorksheetId,
}: WorksheetCurriculumTabsProps) {
  const [activeGradeId, setActiveGradeId] = useState<CurriculumGrade["id"]>(
    grades[0]?.id ?? "middle1",
  );
  const [selectedQuizSubunit, setSelectedQuizSubunit] =
    useState<WorksheetQuizSelection | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const subunitButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const activeGrade = grades.find((grade) => grade.id === activeGradeId) ?? grades[0];
  const closeQuizModal = useCallback(() => {
    const subunitId = selectedQuizSubunit?.subunitId;
    setSelectedQuizSubunit(null);
    if (subunitId) {
      requestAnimationFrame(() => subunitButtonRefs.current.get(subunitId)?.focus());
    }
  }, [selectedQuizSubunit]);

  if (!activeGrade) return null;

  const selectGrade = (grade: CurriculumGrade, index: number) => {
    setActiveGradeId(grade.id);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % grades.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + grades.length) % grades.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = grades.length - 1;

    if (nextIndex === null) return;

    const nextGrade = grades[nextIndex];
    if (!nextGrade) return;

    event.preventDefault();
    selectGrade(nextGrade, nextIndex);
  };

  return (
    <>
      <section aria-labelledby="curriculum-heading" className="space-y-4">
        <h2 id="curriculum-heading" className="sr-only">
          학년별 소단원 목록
        </h2>

        <div
          role="tablist"
          aria-label="학년 선택"
          aria-orientation="horizontal"
          className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2"
        >
          {grades.map((grade, index) => {
            const isActive = grade.id === activeGrade.id;

            return (
              <button
                key={grade.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={`grade-tab-${grade.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`grade-panel-${grade.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectGrade(grade, index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`min-h-12 rounded-xl border px-3 text-sm font-black transition sm:text-base ${
                  isActive
                    ? "border-[var(--control-border-active)] bg-[var(--control-background-active)] text-[var(--control-foreground)] shadow-[0_4px_12px_rgba(111,92,130,0.12)]"
                    : "border-transparent text-[var(--muted)] hover:border-[var(--control-border)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
                }`}
              >
                {grade.label}
              </button>
            );
          })}
        </div>

        <article
          id={`grade-panel-${activeGrade.id}`}
          role="tabpanel"
          aria-labelledby={`grade-tab-${activeGrade.id}`}
          tabIndex={0}
          className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7"
        >
        <div className="border-b border-[var(--border)] pb-5">
          <h2 className="text-2xl font-black tracking-[-0.04em]">{activeGrade.label}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{activeGrade.subtitle}</p>
        </div>

        <div className="mt-6 space-y-8">
          {activeGrade.semesters.map((semester) => (
            <section
              key={semester.id}
              aria-labelledby={`${activeGrade.id}-${semester.id}`}
            >
              <h3
                id={`${activeGrade.id}-${semester.id}`}
                className="text-base font-black text-[var(--lesson-accent)]"
              >
                {semester.label}
              </h3>
              <div className="mt-3 space-y-4">
                {semester.units.map((unit, unitIndex) => (
                  <div
                    key={unit.id}
                    className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]"
                  >
                    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--control-background-active)] text-xs font-black text-[var(--control-foreground)]">
                        {unitIndex + 1}
                      </span>
                      <h4 className="font-bold">{unit.title}</h4>
                    </div>
                    <ol className="divide-y divide-[var(--border)]">
                      {unit.subunits.map((subunit, subunitIndex) => {
                        const subunitId = `${unit.id}-su${subunitIndex + 1}`;
                        const isFeaturedWorksheet = subunitId === availableWorksheetId;
                        const quizCount =
                          getQuizSetForSubunit(subunitId)?.quizzes.length ?? 0;

                        return (
                          <li
                            key={subunitId}
                            className={`text-sm ${
                              isFeaturedWorksheet ? "bg-[var(--lesson-row-selected)]" : ""
                            }`}
                          >
                            <button
                              ref={(element) => {
                                if (element) subunitButtonRefs.current.set(subunitId, element);
                                else subunitButtonRefs.current.delete(subunitId);
                              }}
                              type="button"
                              aria-haspopup="dialog"
                              aria-label={`${subunit} 소단원 퀴즈 목록 보기${quizCount > 0 ? `, ${quizCount}문항` : ", 준비 중"}`}
                              onClick={() =>
                                setSelectedQuizSubunit({
                                  subunitId,
                                  gradeLabel: activeGrade.label,
                                  semesterLabel: semester.label,
                                  unitTitle: unit.title,
                                  subunitTitle: subunit,
                                })
                              }
                              className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-hover)]"
                            >
                              <span className="w-6 shrink-0 text-right font-mono text-xs text-[var(--muted)]">
                                {String(subunitIndex + 1).padStart(2, "0")}
                              </span>
                              <span
                                className={`min-w-0 flex-1 ${
                                  isFeaturedWorksheet ? "font-black" : "font-medium"
                                }`}
                              >
                                {subunit}
                              </span>
                              <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                                    quizCount > 0
                                      ? "bg-[var(--control-background-active)] text-[var(--control-foreground)]"
                                      : "text-[var(--muted)]"
                                  }`}
                                >
                                  {quizCount > 0 ? `퀴즈 ${quizCount}` : "퀴즈 준비 중"}
                                </span>
                                {quizCount > 0 ? (
                                  <span className="rounded-full bg-[#8068c5] px-2.5 py-1 text-[10px] font-black text-white">
                                    PDF 생성
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        </article>
      </section>

      {selectedQuizSubunit ? (
        <WorksheetQuizModal {...selectedQuizSubunit} onClose={closeQuizModal} />
      ) : null}
    </>
  );
}
