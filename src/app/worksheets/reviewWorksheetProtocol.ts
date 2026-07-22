export const MAX_REVIEW_WORKSHEET_QUESTIONS = 200;

export type ReviewWorksheetQuestion = {
  reviewQuestionId: string;
  quizNumber: number;
  questionText: string;
  occurrenceCount: number;
};

export type ReviewWorksheetSubunit = {
  id: string;
  subunitTitle: string;
  questions: ReviewWorksheetQuestion[];
};

export type ReviewWorksheetUnit = {
  id: string;
  gradeLabel: string;
  semesterLabel: string;
  unitTitle: string;
  subunits: ReviewWorksheetSubunit[];
};

export type ReviewQuestionCatalog = {
  studentName: string;
  displayName: string;
  totalCount: number;
  units: ReviewWorksheetUnit[];
};

export type ReviewWorksheetStudentOption = {
  studentName: string;
  displayName: string;
  questionCount: number;
};
