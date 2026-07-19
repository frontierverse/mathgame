export const STUDENT_COLORS = [
  "#f6a5b8",
  "#9edce3",
  "#b5a3f0",
  "#f7c67a",
  "#8fd8a0",
  "#f2907e",
  "#7ec2f0",
  "#e2a0e0",
];

export {
  CURRICULUM_QUIZ_ROUNDS,
  getQuizForIndex,
  getQuizRoundById,
  getQuizSetForSubunit,
  MAX_QUIZ_COUNT,
  migrateLegacyQuizCounts,
  QUIZZES_PER_ROUND,
  QUIZZES,
  quizAnswerForIndex,
  quizTextForIndex,
  REGISTERED_QUIZ_COUNT,
} from "../shared/curriculumQuizzes";

export type { CurriculumQuizRound } from "../shared/curriculumQuizzes";

export const MAX_SOLVES = 3;

export type QuizMineralStage = 1 | 2 | 3;
