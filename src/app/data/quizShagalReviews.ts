import "server-only";

import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "./supabaseAdmin";

export const REVIEW_QUESTION_ID_PATTERN = /^rq1_[0-9a-f]{32}$/;

export type QuizShagalReviewSummary = {
  studentName: string;
  questionCount: number;
};

export type QuizShagalReviewQuestion = {
  reviewQuestionId: string;
  quizId: string;
  quizIndex: number;
  questionText: string;
  receivedAt: string;
  occurrenceCount: number;
};

export class QuizShagalReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizShagalReviewError";
  }
}

function readPositiveSafeInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^[1-9]\d*$/.test(value)
        ? Number(value)
        : Number.NaN;

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

function normalizeStudentName(studentName: string) {
  const normalizedName = studentName.trim();
  if (!normalizedName || normalizedName.length > 120) {
    throw new QuizShagalReviewError("학생 이름을 확인해 주세요.");
  }
  return normalizedName;
}

async function callReviewRpc(pathname: string, body: Record<string, unknown>) {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const endpoint = new URL(`/rest/v1/rpc/${pathname}`, url);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new QuizShagalReviewError("복습 기록을 불러오지 못했습니다.");
  }

  if (!response.ok) {
    console.warn(
      `Quiz shagal review request failed: ${pathname} (${response.status})`,
    );
    throw new QuizShagalReviewError("복습 기록을 불러오지 못했습니다.");
  }

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) {
    throw new QuizShagalReviewError("복습 기록 응답을 처리하지 못했습니다.");
  }
  return rows;
}

function parseQuestionRows(rows: unknown[]) {
  return rows.map((row): QuizShagalReviewQuestion => {
    const record = row as Record<string, unknown>;
    const reviewQuestionId = record.reviewQuestionId;
    const quizId = record.quizId;
    const quizIndex = record.quizIndex;
    const questionText = record.questionText;
    const receivedAt = record.receivedAt;
    const occurrenceCount = readPositiveSafeInteger(record.occurrenceCount);
    if (
      typeof reviewQuestionId !== "string" ||
      !REVIEW_QUESTION_ID_PATTERN.test(reviewQuestionId) ||
      typeof quizId !== "string" ||
      !quizId ||
      !Number.isInteger(quizIndex) ||
      (quizIndex as number) < 0 ||
      (quizIndex as number) > 99 ||
      typeof questionText !== "string" ||
      !questionText ||
      typeof receivedAt !== "string" ||
      !isValidDate(receivedAt) ||
      occurrenceCount === null
    ) {
      throw new QuizShagalReviewError("복습 기록 응답을 처리하지 못했습니다.");
    }

    return {
      reviewQuestionId,
      quizId,
      quizIndex: quizIndex as number,
      questionText,
      receivedAt,
      occurrenceCount,
    };
  });
}

export async function getQuizShagalReviewSummaries() {
  const rows = await callReviewRpc("get_quiz_shagal_review_summary", {});

  return rows.map((row): QuizShagalReviewSummary => {
    const record = row as Record<string, unknown>;
    const studentName = record.studentName;
    const questionCount = readPositiveSafeInteger(record.questionCount);
    if (
      typeof studentName !== "string" ||
      !studentName.trim() ||
      questionCount === null
    ) {
      throw new QuizShagalReviewError("복습 기록 응답을 처리하지 못했습니다.");
    }

    return {
      studentName: studentName.trim(),
      questionCount,
    };
  });
}

export async function getStudentQuizShagalReviewQuestions(studentName: string) {
  const normalizedName = normalizeStudentName(studentName);
  const rows = await callReviewRpc(
    "get_student_quiz_shagal_review_questions_v2",
    { p_student_name: normalizedName },
  );

  return parseQuestionRows(rows);
}

export async function getSelectedStudentQuizShagalReviewQuestions(
  studentName: string,
  reviewQuestionIds: readonly string[],
) {
  const normalizedName = normalizeStudentName(studentName);
  if (
    reviewQuestionIds.length === 0 ||
    reviewQuestionIds.some(
      (reviewQuestionId) => !REVIEW_QUESTION_ID_PATTERN.test(reviewQuestionId),
    )
  ) {
    throw new QuizShagalReviewError("복습 문제 선택을 확인해 주세요.");
  }

  const rows = await callReviewRpc(
    "get_selected_student_quiz_shagal_review_questions",
    {
      p_student_name: normalizedName,
      p_review_question_ids: reviewQuestionIds,
    },
  );

  return parseQuestionRows(rows);
}
