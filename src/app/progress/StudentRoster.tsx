"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DiamondModal from "./DiamondModal";
import MineralIcon from "./MineralIcon";
import MineralEvolutionLegend from "./MineralEvolutionLegend";
import QuizBoard from "./QuizBoard";
import QuizPanel from "./QuizPanel";
import { STUDENT_COLORS } from "./quizData";
import { getMineralInventory, getTeamDiamondProgress } from "./quizProgress";
import StudentList from "./StudentList";
import useQuizProgress from "./useQuizProgress";

const EMPTY_HIDDEN_STUDENT_NAMES: readonly string[] = [];

type Student = { name: string; age: number | null };

type StudentRosterProps = {
  students: Student[];
  hiddenStudentNames?: readonly string[];
};

export default function StudentRoster({
  students,
  hiddenStudentNames = EMPTY_HIDDEN_STUDENT_NAMES,
}: StudentRosterProps) {
  const [showAllStudents, setShowAllStudents] = useState(false);
  const hiddenStudentNameSet = useMemo(
    () => new Set(hiddenStudentNames),
    [hiddenStudentNames],
  );
  const allStudentEntries = useMemo(
    () => students.map((student, originalIndex) => ({ student, originalIndex })),
    [students],
  );
  const defaultStudentEntries = useMemo(
    () =>
      allStudentEntries.filter(({ student }) => {
        const displayName = student.name.slice(1).trim();
        return (
          !hiddenStudentNameSet.has(student.name) &&
          !hiddenStudentNameSet.has(displayName)
        );
      }),
    [allStudentEntries, hiddenStudentNameSet],
  );
  const visibleStudentEntries = showAllStudents
    ? allStudentEntries
    : defaultStudentEntries;
  const visibleStudents = useMemo(
    () => visibleStudentEntries.map(({ student }) => student),
    [visibleStudentEntries],
  );
  const teamStudentNames = useMemo(
    () => defaultStudentEntries.map(({ student }) => student.name),
    [defaultStudentEntries],
  );
  const teamStudentNameSet = useMemo(
    () => new Set(teamStudentNames),
    [teamStudentNames],
  );
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(
    () =>
      defaultStudentEntries[0]?.originalIndex ??
      allStudentEntries[0]?.originalIndex ??
      0,
  );
  const [openQuizIndex, setOpenQuizIndex] = useState<number | null>(null);
  const [openDiamond, setOpenDiamond] = useState<{
    studentIndex: number;
    diamondIndex: number;
  } | null>(null);
  const studentNames = useMemo(() => students.map((student) => student.name), [students]);
  const { progress, solveQuiz, undoQuiz } = useQuizProgress(studentNames);
  const teamDiamondProgress = useMemo(
    () => getTeamDiamondProgress(progress, teamStudentNames),
    [progress, teamStudentNames],
  );
  const teamProgressPercent =
    teamDiamondProgress.currentRubyTarget === 0
      ? 0
      : Math.round(
          (teamDiamondProgress.currentRubyCount /
            teamDiamondProgress.currentRubyTarget) *
            100,
        );

  const selectStudent = useCallback((index: number) => {
    setSelectedStudentIndex(index);
    setOpenQuizIndex(null);
    setOpenDiamond(null);
  }, []);

  const toggleShowAllStudents = useCallback(() => {
    const nextShowAllStudents = !showAllStudents;
    const nextStudentEntries = nextShowAllStudents
      ? allStudentEntries
      : defaultStudentEntries;
    const selectedStudentStaysVisible = nextStudentEntries.some(
      ({ originalIndex }) => originalIndex === selectedStudentIndex,
    );

    setShowAllStudents(nextShowAllStudents);
    setSelectedStudentIndex(
      selectedStudentStaysVisible
        ? selectedStudentIndex
        : (nextStudentEntries[0]?.originalIndex ?? 0),
    );
    setOpenQuizIndex(null);
    setOpenDiamond(null);
  }, [allStudentEntries, defaultStudentEntries, selectedStudentIndex, showAllStudents]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const visibleStudentIndex = Number(event.key) - 1;
      const studentEntry = visibleStudentEntries[visibleStudentIndex];
      if (!Number.isInteger(visibleStudentIndex) || !studentEntry) return;

      event.preventDefault();
      selectStudent(studentEntry.originalIndex);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectStudent, visibleStudentEntries]);

  const selectVisibleStudent = useCallback(
    (visibleStudentIndex: number) => {
      const studentEntry = visibleStudentEntries[visibleStudentIndex];
      if (studentEntry) selectStudent(studentEntry.originalIndex);
    },
    [selectStudent, visibleStudentEntries],
  );

  const closePanel = useCallback(() => setOpenQuizIndex(null), []);
  const closeDiamond = useCallback(() => setOpenDiamond(null), []);
  const navigateQuiz = useCallback((quizIndex: number) => setOpenQuizIndex(quizIndex), []);
  const openStudentQuiz = useCallback((studentIndex: number, quizIndex: number) => {
    setSelectedStudentIndex(studentIndex);
    setOpenQuizIndex(quizIndex);
    setOpenDiamond(null);
  }, []);
  const openStudentDiamond = useCallback((studentIndex: number, diamondIndex: number) => {
    setSelectedStudentIndex(studentIndex);
    setOpenQuizIndex(null);
    setOpenDiamond({ studentIndex, diamondIndex });
  }, []);

  const selectedStudent = students[selectedStudentIndex] ?? null;
  const selectedVisibleStudentIndex = visibleStudentEntries.findIndex(
    ({ originalIndex }) => originalIndex === selectedStudentIndex,
  );
  const selectedName = selectedStudent?.name ?? null;
  const selectedAge = selectedStudent?.age ?? null;
  const selectedCounts = selectedName ? progress[selectedName] ?? [] : [];
  const selectedColor = STUDENT_COLORS[selectedStudentIndex % STUDENT_COLORS.length];
  const selectedDiamondCountLimit =
    selectedName && teamStudentNameSet.has(selectedName)
      ? teamDiamondProgress.diamondCount
      : undefined;
  const diamondStudent = openDiamond ? students[openDiamond.studentIndex] ?? null : null;
  const diamondStudentName = diamondStudent?.name ?? null;
  const diamondStudentCounts = diamondStudentName ? progress[diamondStudentName] ?? [] : [];
  const diamondStudentCountLimit =
    diamondStudentName && teamStudentNameSet.has(diamondStudentName)
      ? teamDiamondProgress.diamondCount
      : undefined;
  const diamondRubyQuizIndexes = openDiamond
    ? getMineralInventory(diamondStudentCounts, diamondStudentCountLimit).diamondGroups[
        openDiamond.diamondIndex
      ] ?? null
    : null;
  const diamondStudentColor = openDiamond
    ? STUDENT_COLORS[openDiamond.studentIndex % STUDENT_COLORS.length]
    : STUDENT_COLORS[0];
  const solveDiamondQuiz = useCallback(
    (quizIndex: number) => {
      if (diamondStudentName) solveQuiz(diamondStudentName, quizIndex);
    },
    [diamondStudentName, solveQuiz],
  );
  const undoDiamondQuiz = useCallback(
    (quizIndex: number) => {
      if (diamondStudentName) undoQuiz(diamondStudentName, quizIndex);
    },
    [diamondStudentName, undoQuiz],
  );

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="shrink-0 text-3xl font-bold">진도 체크하기</h1>
          <button
            type="button"
            role="switch"
            aria-label="숨긴 이름 함께 표시"
            aria-checked={showAllStudents}
            onClick={toggleShowAllStudents}
            className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f78c9] focus-visible:ring-offset-2 ${
              showAllStudents ? "bg-[#9b84d9]" : "bg-[#cfc6d5]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                showAllStudents ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <MineralEvolutionLegend />
      </div>

      {teamDiamondProgress.participantCount > 0 ? (
        <section
          aria-label="공동 다이아 진행도"
          aria-live="polite"
          className="mt-5 flex flex-col gap-5 rounded-2xl border border-[var(--control-border-active)] bg-[var(--surface-raised)] p-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--control-border)] bg-[var(--control-background)]">
              <MineralIcon variant="diamond" className="h-10 w-10" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-[var(--lesson-accent)]">
                함께 완성하는 보상
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">
                공동 다이아 {teamDiamondProgress.diamondCount}개
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)] sm:text-sm">
                {teamDiamondProgress.nextDiamondIndex === null
                  ? "모든 공동 다이아 단계를 완성했습니다."
                  : `참여 학생 전원이 ${teamDiamondProgress.nextDiamondIndex * 10 + 1}~${(teamDiamondProgress.nextDiamondIndex + 1) * 10}번 루비를 완성하면 각자의 다이아로 동시에 변환됩니다.`}
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 lg:max-w-[420px]">
            <div className="flex items-center justify-between gap-4 text-xs font-black text-[var(--lesson-text)]">
              <span>
                루비 {teamDiamondProgress.currentRubyCount}/
                {teamDiamondProgress.currentRubyTarget}
              </span>
              <span>
                {teamDiamondProgress.readyStudentCount}/
                {teamDiamondProgress.participantCount}명 준비
              </span>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--border)]"
              role="progressbar"
              aria-label="다음 공동 다이아 루비 진행도"
              aria-valuemin={0}
              aria-valuemax={teamDiamondProgress.currentRubyTarget}
              aria-valuenow={teamDiamondProgress.currentRubyCount}
            >
              <div
                className="h-full rounded-full bg-[#8068c5] transition-[width] duration-500"
                style={{ width: `${teamProgressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
              한 명이라도 루비 10개를 완성하지 못하면 전원의 다이아 변환이 대기합니다.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-5" aria-label="퀴즈 진행도">
        {visibleStudentEntries.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#ddd1c1] bg-[#fffefa] px-5 text-center">
            <p className="text-sm font-bold text-[#665c6f]">
              현재 표시할 이름이 없어요. 제목 오른쪽 스위치를 켜 주세요.
            </p>
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
            <div className="min-w-0">
              <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,400px)_minmax(516px,1fr)] 2xl:grid-cols-[minmax(360px,480px)_minmax(596px,1fr)]">
                <StudentList
                  students={visibleStudents}
                  selectedIndex={selectedVisibleStudentIndex}
                  progress={progress}
                  onSelect={selectVisibleStudent}
                />

                {selectedName ? (
                  <QuizBoard
                    key={selectedName}
                    studentName={selectedName}
                    studentAge={selectedAge}
                    studentIndex={selectedStudentIndex}
                    studentColor={selectedColor}
                    counts={selectedCounts}
                    diamondCountLimit={selectedDiamondCountLimit}
                    onOpenQuiz={openStudentQuiz}
                    onOpenDiamond={openStudentDiamond}
                    selectedQuizIndex={openQuizIndex}
                  />
                ) : null}
              </div>

              <div
                className="mt-10 border-t border-[#e7dccb] pt-8"
                aria-label="전체 진도 체크리스트"
              >
                <h2 className="text-xl font-bold text-[#51475c]">전체 진도 체크리스트</h2>
                <div className="mt-5 grid min-w-0 grid-cols-2 gap-x-12 gap-y-6">
                  {visibleStudentEntries.map(({ student, originalIndex }) => {
                    const counts = progress[student.name] ?? [];
                    const color = STUDENT_COLORS[originalIndex % STUDENT_COLORS.length];
                    const isSelected = originalIndex === selectedStudentIndex;

                    return (
                      <div
                        key={`${student.name}-${originalIndex}`}
                        className="min-w-0 border-b border-[#eee4d7] pb-6"
                      >
                        <QuizBoard
                          studentName={student.name}
                          studentAge={student.age}
                          studentIndex={originalIndex}
                          studentColor={color}
                          counts={counts}
                          diamondCountLimit={
                            teamStudentNameSet.has(student.name)
                              ? teamDiamondProgress.diamondCount
                              : undefined
                          }
                          onOpenQuiz={openStudentQuiz}
                          onOpenDiamond={openStudentDiamond}
                          selectedQuizIndex={isSelected ? openQuizIndex : null}
                          compact
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedName ? (
              <div className="order-first min-w-0 xl:order-none xl:col-start-2">
                {openQuizIndex !== null ? (
                  <div className="xl:sticky xl:top-4">
                    <QuizPanel
                      name={selectedName.slice(1)}
                      quizIndex={openQuizIndex}
                      counts={selectedCounts}
                      diamondCountLimit={selectedDiamondCountLimit}
                      color={selectedColor}
                      onSolve={() => solveQuiz(selectedName, openQuizIndex)}
                      onUndo={() => undoQuiz(selectedName, openQuizIndex)}
                      onNavigate={navigateQuiz}
                      onClose={closePanel}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {openDiamond && diamondStudentName && diamondRubyQuizIndexes ? (
        <DiamondModal
          studentName={diamondStudentName.slice(1)}
          studentColor={diamondStudentColor}
          diamondIndex={openDiamond.diamondIndex}
          rubyQuizIndexes={diamondRubyQuizIndexes}
          counts={diamondStudentCounts}
          onSolveQuiz={solveDiamondQuiz}
          onUndoQuiz={undoDiamondQuiz}
          onClose={closeDiamond}
        />
      ) : null}
    </>
  );
}
