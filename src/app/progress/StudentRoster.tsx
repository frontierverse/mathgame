"use client";

import { useCallback, useEffect, useState } from "react";

import QuizBoard from "./QuizBoard";
import QuizModal from "./QuizModal";
import { STUDENT_COLORS } from "./quizData";
import StudentList from "./StudentList";
import useQuizProgress from "./useQuizProgress";

type StudentRosterProps = {
  students: string[];
};

export default function StudentRoster({ students }: StudentRosterProps) {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [openQuizIndex, setOpenQuizIndex] = useState<number | null>(null);
  const { progress, solveQuiz, undoQuiz } = useQuizProgress(students);

  const selectStudent = useCallback((index: number) => {
    setSelectedStudentIndex(index);
    setOpenQuizIndex(null);
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

  const closeModal = useCallback(() => setOpenQuizIndex(null), []);
  const navigateQuiz = useCallback((quizIndex: number) => setOpenQuizIndex(quizIndex), []);

  const selectedName = students[selectedStudentIndex] ?? null;
  const selectedCounts = selectedName ? progress[selectedName] ?? [] : [];
  const selectedColor = STUDENT_COLORS[selectedStudentIndex % STUDENT_COLORS.length];

  return (
    <section className="mt-5" aria-label="학생별 퀴즈 진행도">
      <div className="grid gap-4 lg:grid-cols-[500px_minmax(0,1fr)]">
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
            studentIndex={selectedStudentIndex}
            studentColor={selectedColor}
            counts={selectedCounts}
            onOpenQuiz={setOpenQuizIndex}
          />
        ) : null}
      </div>

      {openQuizIndex !== null && selectedName ? (
        <QuizModal
          name={selectedName.slice(1)}
          quizIndex={openQuizIndex}
          counts={selectedCounts}
          color={selectedColor}
          onSolve={() => solveQuiz(selectedName, openQuizIndex)}
          onUndo={() => undoQuiz(selectedName, openQuizIndex)}
          onNavigate={navigateQuiz}
          onClose={closeModal}
        />
      ) : null}
    </section>
  );
}
