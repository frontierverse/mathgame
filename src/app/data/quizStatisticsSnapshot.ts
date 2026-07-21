import "server-only";

import {
  parseQuizSolveAttempt,
  type QuizSolveAttempt,
} from "./quizAttempts";
import {
  parseCompletedQuizProgressEntry,
  type QuizProgressEntry,
} from "./quizProgress";
import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "./supabaseAdmin";

type QuizStatisticsSnapshotRow = {
  attemptRows: unknown[];
  progressRows: unknown[];
};

export type QuizStatisticsSnapshot = {
  attempts: QuizSolveAttempt[];
  progressEntries: QuizProgressEntry[];
};

export class QuizStatisticsSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizStatisticsSnapshotError";
  }
}

function readSnapshotRow(payload: unknown): QuizStatisticsSnapshotRow | null {
  if (!Array.isArray(payload) || payload.length !== 1) return null;

  const row = payload[0];
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;

  const snapshot = row as Partial<Record<keyof QuizStatisticsSnapshotRow, unknown>>;
  if (
    !Array.isArray(snapshot.attemptRows) ||
    !Array.isArray(snapshot.progressRows)
  ) {
    return null;
  }

  return {
    attemptRows: snapshot.attemptRows,
    progressRows: snapshot.progressRows,
  };
}

export async function getQuizStatisticsSnapshot(): Promise<QuizStatisticsSnapshot> {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const endpoint = new URL("/rest/v1/rpc/get_quiz_statistics_snapshot", url);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({}),
      cache: "no-store",
    });
  } catch {
    throw new QuizStatisticsSnapshotError("통계를 불러오지 못했습니다.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Quiz statistics snapshot request failed", {
      status: response.status,
    });
    throw new QuizStatisticsSnapshotError("통계를 불러오지 못했습니다.");
  }

  const row = readSnapshotRow(payload);
  if (!row) {
    console.error("Quiz statistics snapshot returned an invalid response");
    throw new QuizStatisticsSnapshotError("통계 응답을 처리하지 못했습니다.");
  }

  const parsedAttempts = row.attemptRows.map(parseQuizSolveAttempt);
  const parsedProgressEntries = row.progressRows.map(
    parseCompletedQuizProgressEntry,
  );
  if (
    parsedAttempts.some((attempt) => attempt === null) ||
    parsedProgressEntries.some((progress) => progress === null)
  ) {
    throw new QuizStatisticsSnapshotError(
      "통계 응답을 처리하지 못했습니다.",
    );
  }

  const attempts = parsedAttempts as QuizSolveAttempt[];
  const progressEntries = parsedProgressEntries as QuizProgressEntry[];

  return { attempts, progressEntries };
}
