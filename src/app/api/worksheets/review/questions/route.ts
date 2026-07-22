import {
  getStudentQuizShagalReviewQuestions,
  QuizShagalReviewError,
} from "../../../../data/quizShagalReviews";
import { getStudents, StudentListError } from "../../../../data/students";
import { getQuizForIndex } from "../../../../shared/curriculumQuizzes";
import type {
  ReviewQuestionCatalog,
  ReviewWorksheetSubunit,
  ReviewWorksheetUnit,
} from "../../../../worksheets/reviewWorksheetProtocol";

export const dynamic = "force-dynamic";

function displayName(name: string) {
  return name.slice(1).trim() || name;
}

function createCatalog(
  studentName: string,
  questions: Awaited<ReturnType<typeof getStudentQuizShagalReviewQuestions>>,
): ReviewQuestionCatalog {
  const units: ReviewWorksheetUnit[] = [];
  const unitsById = new Map<string, ReviewWorksheetUnit>();
  const subunitsById = new Map<string, ReviewWorksheetSubunit>();

  questions.forEach((question) => {
    const indexedQuiz = getQuizForIndex(question.quizIndex);
    const currentQuiz =
      indexedQuiz?.id === question.quizId ? indexedQuiz : null;
    const unitId = currentQuiz
      ? `${currentQuiz.gradeId}/${currentQuiz.semesterId}/${currentQuiz.unitId}`
      : "previous";
    const subunitId = currentQuiz
      ? currentQuiz.subunitId
      : `previous/${question.quizId}`;

    let unit = unitsById.get(unitId);
    if (!unit) {
      unit = currentQuiz
        ? {
            id: unitId,
            gradeLabel: currentQuiz.gradeLabel,
            semesterLabel: currentQuiz.semesterLabel,
            unitTitle: currentQuiz.unitTitle,
            subunits: [],
          }
        : {
            id: unitId,
            gradeLabel: "이전 기록",
            semesterLabel: "",
            unitTitle: "이전 문제",
            subunits: [],
          };
      unitsById.set(unitId, unit);
      units.push(unit);
    }

    let subunit = subunitsById.get(subunitId);
    if (!subunit) {
      subunit = {
        id: subunitId,
        subunitTitle: currentQuiz
          ? currentQuiz.subunitTitle
          : `QUIZ ${question.quizIndex + 1}`,
        questions: [],
      };
      subunitsById.set(subunitId, subunit);
      unit.subunits.push(subunit);
    }

    subunit.questions.push({
      reviewQuestionId: question.reviewQuestionId,
      quizNumber: currentQuiz
        ? currentQuiz.globalNumber
        : question.quizIndex + 1,
      questionText: question.questionText,
      occurrenceCount: question.occurrenceCount,
    });
  });

  return {
    studentName,
    displayName: displayName(studentName),
    totalCount: questions.length,
    units,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const studentName = requestUrl.searchParams.get("student")?.trim() ?? "";
  if (!studentName || studentName.length > 120) {
    return Response.json(
      { error: "학생을 선택해 주세요." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const students = await getStudents();
    const student = students.find(({ name }) => name === studentName);
    if (!student) {
      return Response.json(
        { error: "등록된 학생이 아닙니다." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const questions = await getStudentQuizShagalReviewQuestions(student.name);
    return Response.json(createCatalog(student.name, questions), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    if (
      error instanceof StudentListError ||
      error instanceof QuizShagalReviewError
    ) {
      return Response.json(
        { error: "복습 기록을 불러오지 못했습니다." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("Review worksheet question catalog failed");
    return Response.json(
      { error: "복습 문제를 불러오지 못했습니다." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
