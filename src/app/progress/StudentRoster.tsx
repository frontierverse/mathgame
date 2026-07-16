"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DiamondModal from "./DiamondModal";
import QuizBoard from "./QuizBoard";
import QuizPanel from "./QuizPanel";
import { STUDENT_COLORS } from "./quizData";
import { getMineralInventory } from "./quizProgress";
import StudentList from "./StudentList";
import useQuizProgress from "./useQuizProgress";

type StudentRosterProps = {
  students: { name: string; age: number | null }[];
};

export default function StudentRoster({ students }: StudentRosterProps) {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [openQuizIndex, setOpenQuizIndex] = useState<number | null>(null);
  const [openDiamond, setOpenDiamond] = useState<{
    studentIndex: number;
    diamondIndex: number;
  } | null>(null);
  const studentNames = useMemo(() => students.map((student) => student.name), [students]);
  const { progress, solveQuiz, undoQuiz } = useQuizProgress(studentNames);

  const selectStudent = useCallback((index: number) => {
    setSelectedStudentIndex(index);
    setOpenQuizIndex(null);
    setOpenDiamond(null);
  }, []);

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

      const studentIndex = Number(event.key) - 1;
      if (!Number.isInteger(studentIndex) || studentIndex < 0 || studentIndex >= students.length) {
        return;
      }

      event.preventDefault();
      selectStudent(studentIndex);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectStudent, students.length]);

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
  const selectedName = selectedStudent?.name ?? null;
  const selectedAge = selectedStudent?.age ?? null;
  const selectedCounts = selectedName ? progress[selectedName] ?? [] : [];
  const selectedColor = STUDENT_COLORS[selectedStudentIndex % STUDENT_COLORS.length];
  const diamondStudent = openDiamond ? students[openDiamond.studentIndex] ?? null : null;
  const diamondStudentName = diamondStudent?.name ?? null;
  const diamondStudentCounts = diamondStudentName ? progress[diamondStudentName] ?? [] : [];
  const diamondRubyQuizIndexes = openDiamond
    ? getMineralInventory(diamondStudentCounts).diamondGroups[openDiamond.diamondIndex] ?? null
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
      <section className="mt-5" aria-label="학생별 퀴즈 진행도">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
        <div className="min-w-0">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,400px)_minmax(516px,1fr)] 2xl:grid-cols-[minmax(360px,480px)_minmax(596px,1fr)]">
            <StudentList
              students={students}
              selectedIndex={selectedStudentIndex}
              progress={progress}
              onSelect={selectStudent}
            />

            {selectedName ? (
              <QuizBoard
                key={selectedName}
                studentName={selectedName}
                studentAge={selectedAge}
                studentIndex={selectedStudentIndex}
                studentColor={selectedColor}
                counts={selectedCounts}
                onOpenQuiz={openStudentQuiz}
                onOpenDiamond={openStudentDiamond}
                selectedQuizIndex={openQuizIndex}
              />
            ) : null}
          </div>

          <div className="mt-10 border-t border-[#e7dccb] pt-8" aria-label="전체 학생 체크리스트">
            <h2 className="text-xl font-bold text-[#51475c]">전체 학생 체크리스트</h2>
            <div className="mt-5 grid min-w-0 grid-cols-2 gap-x-12 gap-y-6">
              {students.map((student, studentIndex) => {
                const counts = progress[student.name] ?? [];
                const color = STUDENT_COLORS[studentIndex % STUDENT_COLORS.length];
                const isSelected = studentIndex === selectedStudentIndex;

                return (
                  <div
                    key={`${student.name}-${studentIndex}`}
                    className="min-w-0 border-b border-[#eee4d7] pb-6"
                  >
                    <QuizBoard
                      studentName={student.name}
                      studentAge={student.age}
                      studentIndex={studentIndex}
                      studentColor={color}
                      counts={counts}
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
