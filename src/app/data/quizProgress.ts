import "server-only";

import { MAX_QUIZ_COUNT, MAX_SOLVES } from "../progress/quizData";
import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "./supabaseAdmin";

export type QuizProgressEntry = {
  studentName: string;
  quizIndex: number;
  solveCount: number;
};

type QuizProgressRow = Partial<Record<keyof QuizProgressEntry, unknown>>;

const PAGE_SIZE = 1000;
const MAX_PAGE_COUNT = 50;

export function parseCompletedQuizProgressEntry(
  row: unknown,
): QuizProgressEntry | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const progress = row as QuizProgressRow;

  if (
    typeof progress.studentName !== "string" ||
    !progress.studentName.trim() ||
    !Number.isInteger(progress.quizIndex) ||
    (progress.quizIndex as number) < 0 ||
    (progress.quizIndex as number) >= MAX_QUIZ_COUNT ||
    !Number.isInteger(progress.solveCount) ||
    (progress.solveCount as number) <= 0 ||
    (progress.solveCount as number) > MAX_SOLVES
  ) {
    return null;
  }

  return progress as QuizProgressEntry;
}

export async function getCompletedQuizProgress() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const progressEntries: QuizProgressEntry[] = [];

  for (let page = 0; page < MAX_PAGE_COUNT; page += 1) {
    const endpoint = new URL("/rest/v1/QuizProgress", url);
    endpoint.searchParams.set("select", "studentName,quizIndex,solveCount");
    endpoint.searchParams.set("solveCount", "gt.0");
    endpoint.searchParams.set("order", "studentName.asc,quizIndex.asc");
    endpoint.searchParams.set("limit", String(PAGE_SIZE));
    endpoint.searchParams.set("offset", String(page * PAGE_SIZE));

    const response = await fetch(endpoint, {
      headers: createSupabaseAdminHeaders(serviceRoleKey),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz progress list request failed", { status: response.status });
      throw new Error("진행도를 불러오지 못했습니다.");
    }

    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) {
      throw new Error("진행도 응답을 처리하지 못했습니다.");
    }

    rows.forEach((row) => {
      const progress = parseCompletedQuizProgressEntry(row);
      if (progress) progressEntries.push(progress);
    });
    if (rows.length < PAGE_SIZE) return progressEntries;
  }

  throw new Error("진행도가 너무 많아 모두 불러오지 못했습니다.");
}
