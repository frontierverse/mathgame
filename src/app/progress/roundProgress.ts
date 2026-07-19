import type { CurriculumQuizRound } from "./quizData";
import { MAX_SOLVES } from "./quizData";
import type { QuizProgress } from "./quizProgress";

export function isRoundComplete(
  round: CurriculumQuizRound,
  participantNames: readonly string[],
  progress: QuizProgress,
) {
  return (
    participantNames.length > 0 &&
    participantNames.every((studentName) =>
      round.quizIndexes.every(
        (quizIndex) => (progress[studentName]?.[quizIndex] ?? 0) >= MAX_SOLVES,
      ),
    )
  );
}

export function getRoundProgress(
  round: CurriculumQuizRound,
  participantNames: readonly string[],
  progress: QuizProgress,
) {
  const completedStudentCount = participantNames.filter((studentName) =>
    round.quizIndexes.every(
      (quizIndex) => (progress[studentName]?.[quizIndex] ?? 0) >= MAX_SOLVES,
    ),
  ).length;
  const rubyCount = participantNames.reduce(
    (total, studentName) =>
      total +
      round.quizIndexes.filter(
        (quizIndex) => (progress[studentName]?.[quizIndex] ?? 0) >= MAX_SOLVES,
      ).length,
    0,
  );
  const rubyTarget = participantNames.length * round.quizIndexes.length;

  return {
    complete: participantNames.length > 0 && completedStudentCount === participantNames.length,
    participantCount: participantNames.length,
    completedStudentCount,
    rubyCount,
    rubyTarget,
    progressPercent: rubyTarget === 0 ? 0 : Math.round((rubyCount / rubyTarget) * 100),
  };
}
