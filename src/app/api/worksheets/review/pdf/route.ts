import {
  getSelectedStudentQuizShagalReviewQuestions,
  QuizShagalReviewError,
  REVIEW_QUESTION_ID_PATTERN,
} from "../../../../data/quizShagalReviews";
import { getStudents, StudentListError } from "../../../../data/students";
import { MAX_REVIEW_WORKSHEET_QUESTIONS } from "../../../../worksheets/reviewWorksheetProtocol";
import { createReviewWorksheetPdf } from "../../../../worksheets/worksheetPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function displayName(name: string) {
  return name.slice(1).trim() || name;
}

function jsonError(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("PDF 요청을 확인해 주세요.", 400);
  }

  const studentValues = formData.getAll("student");
  const downloadValues = formData.getAll("download");
  const reviewQuestionValues = formData.getAll("reviewQuestionId");
  if (
    studentValues.length !== 1 ||
    typeof studentValues[0] !== "string" ||
    downloadValues.length > 1 ||
    downloadValues.some(
      (value) => typeof value !== "string" || value !== "1",
    ) ||
    reviewQuestionValues.some((value) => typeof value !== "string")
  ) {
    return jsonError("PDF 요청을 확인해 주세요.", 400);
  }

  const studentName = studentValues[0].trim();
  const reviewQuestionIds = reviewQuestionValues as string[];
  if (!studentName || studentName.length > 120) {
    return jsonError("학생을 선택해 주세요.", 400);
  }
  if (
    reviewQuestionIds.length === 0 ||
    reviewQuestionIds.length > MAX_REVIEW_WORKSHEET_QUESTIONS ||
    reviewQuestionIds.some(
      (reviewQuestionId) => !REVIEW_QUESTION_ID_PATTERN.test(reviewQuestionId),
    ) ||
    new Set(reviewQuestionIds).size !== reviewQuestionIds.length
  ) {
    return jsonError("복습 문제 선택을 확인해 주세요.", 400);
  }

  try {
    const students = await getStudents();
    const student = students.find(({ name }) => name === studentName);
    if (!student) {
      return jsonError("등록된 학생이 아닙니다.", 404);
    }

    const questions = await getSelectedStudentQuizShagalReviewQuestions(
      student.name,
      reviewQuestionIds,
    );
    const returnedIds = new Set(
      questions.map(({ reviewQuestionId }) => reviewQuestionId),
    );
    if (
      questions.length !== reviewQuestionIds.length ||
      reviewQuestionIds.some((reviewQuestionId) => !returnedIds.has(reviewQuestionId))
    ) {
      return jsonError("복습 문제가 변경되었습니다. 다시 선택해 주세요.", 409);
    }

    const studentDisplayName = displayName(student.name);
    const pdfBytes = await createReviewWorksheetPdf(studentDisplayName, questions);
    const disposition = downloadValues[0] === "1" ? "attachment" : "inline";
    const encodedFilename = encodeURIComponent(
      `${studentDisplayName}-복습지.pdf`,
    );
    const responseBody = Uint8Array.from(pdfBytes).buffer;

    return new Response(responseBody, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": `${disposition}; filename="review-worksheet.pdf"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": String(responseBody.byteLength),
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (
      error instanceof StudentListError ||
      error instanceof QuizShagalReviewError
    ) {
      return jsonError("복습 기록을 불러오지 못했습니다.", 502);
    }

    console.error("Review worksheet PDF generation failed");
    return jsonError("복습 PDF를 만들지 못했습니다.", 500);
  }
}
