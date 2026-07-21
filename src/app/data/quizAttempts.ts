import "server-only";

import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "./supabaseAdmin";

export type QuizSolveAttempt = {
  id: string;
  studentName: string;
  quizId: string;
  quizIndex: number;
  roundId: string;
  variantSeed: number | null;
  questionText: string;
  stageBefore: number;
  stageAfter: number;
  outcome: "shagal" | "yar";
  durationMs: number;
  startedAt: string;
  answeredAt: string;
};

type AttemptRow = Partial<Record<keyof QuizSolveAttempt, unknown>>;

const PAGE_SIZE = 1000;
const MAX_PAGE_COUNT = 50;

export class QuizAttemptListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizAttemptListError";
  }
}

export function parseQuizSolveAttempt(row: unknown): QuizSolveAttempt | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const attempt = row as AttemptRow;
  const variantSeed = attempt.variantSeed;

  if (
    typeof attempt.id !== "string" ||
    typeof attempt.studentName !== "string" ||
    typeof attempt.quizId !== "string" ||
    !Number.isInteger(attempt.quizIndex) ||
    typeof attempt.roundId !== "string" ||
    !(
      variantSeed === null ||
      (typeof variantSeed === "number" && Number.isInteger(variantSeed))
    ) ||
    typeof attempt.questionText !== "string" ||
    !Number.isInteger(attempt.stageBefore) ||
    !Number.isInteger(attempt.stageAfter) ||
    (attempt.outcome !== "shagal" && attempt.outcome !== "yar") ||
    !Number.isInteger(attempt.durationMs) ||
    typeof attempt.startedAt !== "string" ||
    typeof attempt.answeredAt !== "string"
  ) {
    return null;
  }

  return attempt as QuizSolveAttempt;
}

export async function getQuizSolveAttempts() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const attempts: QuizSolveAttempt[] = [];

  for (let page = 0; page < MAX_PAGE_COUNT; page += 1) {
    const endpoint = new URL("/rest/v1/QuizSolveAttempt", url);
    endpoint.searchParams.set(
      "select",
      "id,studentName,quizId,quizIndex,roundId,variantSeed,questionText,stageBefore,stageAfter,outcome,durationMs,startedAt,answeredAt",
    );
    endpoint.searchParams.set("order", "answeredAt.desc,id.desc");
    endpoint.searchParams.set("limit", String(PAGE_SIZE));
    endpoint.searchParams.set("offset", String(page * PAGE_SIZE));

    let response: Response;
    try {
      response = await fetch(endpoint, {
        headers: createSupabaseAdminHeaders(serviceRoleKey),
        cache: "no-store",
      });
    } catch {
      throw new QuizAttemptListError("통계를 불러오지 못했습니다.");
    }

    if (!response.ok) {
      console.error("Quiz attempt list request failed", { status: response.status });
      throw new QuizAttemptListError("통계를 불러오지 못했습니다.");
    }

    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) {
      throw new QuizAttemptListError("통계 응답을 처리하지 못했습니다.");
    }

    rows.forEach((row) => {
      const attempt = parseQuizSolveAttempt(row);
      if (attempt) attempts.push(attempt);
    });
    if (rows.length < PAGE_SIZE) return attempts;
  }

  throw new QuizAttemptListError("통계가 너무 많아 모두 불러오지 못했습니다.");
}
