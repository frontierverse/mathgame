import type { QuizSolveAttempt } from "../data/quizAttempts";
import type { QuizProgressEntry } from "../data/quizProgress";

export type QuizStatisticsRecord = {
  id: string;
  studentName: string;
  quizIndex: number;
  durationMs: number;
  outcome: QuizSolveAttempt["outcome"] | null;
  answeredAt: string | null;
  timingSource: "measured" | "legacy";
  attempt: QuizSolveAttempt | null;
  solveCount: number | null;
};

function rememberMeasuredQuiz(
  measuredQuizIndexesByStudent: Map<string, Set<number>>,
  studentName: string,
  quizIndex: number,
) {
  const indexes = measuredQuizIndexesByStudent.get(studentName) ?? new Set<number>();
  indexes.add(quizIndex);
  measuredQuizIndexesByStudent.set(studentName, indexes);
}

/**
 * Builds the one display dataset used throughout statistics.
 *
 * A positive progress row without any measured attempt for the same student and
 * quiz is represented once as a legacy 0-second record. Its unknown outcome and
 * unmeasured timing remain explicit instead of being mistaken for an actual 0ms
 * attempt.
 */
export function buildQuizStatisticsRecords(
  attempts: readonly QuizSolveAttempt[],
  progressEntries: readonly QuizProgressEntry[],
): QuizStatisticsRecord[] {
  const measuredQuizIndexesByStudent = new Map<string, Set<number>>();
  const records: QuizStatisticsRecord[] = attempts.map((attempt) => {
    rememberMeasuredQuiz(
      measuredQuizIndexesByStudent,
      attempt.studentName,
      attempt.quizIndex,
    );

    return {
      id: attempt.id,
      studentName: attempt.studentName,
      quizIndex: attempt.quizIndex,
      durationMs: attempt.durationMs,
      outcome: attempt.outcome,
      answeredAt: attempt.answeredAt,
      timingSource: "measured",
      attempt,
      solveCount: null,
    };
  });

  progressEntries.forEach((progress) => {
    if (
      measuredQuizIndexesByStudent
        .get(progress.studentName)
        ?.has(progress.quizIndex)
    ) {
      return;
    }

    records.push({
      id: `legacy:${encodeURIComponent(progress.studentName)}:${progress.quizIndex}`,
      studentName: progress.studentName,
      quizIndex: progress.quizIndex,
      durationMs: 0,
      outcome: null,
      answeredAt: null,
      timingSource: "legacy",
      attempt: null,
      solveCount: progress.solveCount,
    });
  });

  return records;
}
