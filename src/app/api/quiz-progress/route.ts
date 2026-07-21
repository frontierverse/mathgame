import { createSupabaseAdminHeaders, getSupabaseAdminConfig } from "../../data/supabaseAdmin";
import { MAX_QUIZ_COUNT } from "../../progress/quizData";
import type { QuizProgress } from "../../progress/quizProgress";
import { QUIZ_PROGRESS_PROTOCOL } from "../../shared/quizProgressProtocol";

export const dynamic = "force-dynamic";

type QuizProgressRow = {
  studentName?: unknown;
  quizIndex?: unknown;
  solveCount?: unknown;
  resetGeneration?: unknown;
  studentResetGeneration?: unknown;
};

type QuizResetGenerationRow = {
  quizIndex?: unknown;
  generation?: unknown;
};

type QuizStudentResetGenerationRow = {
  studentName?: unknown;
  quizIndex?: unknown;
  generation?: unknown;
};

type QuizProgressSnapshotRow = {
  progressRows?: unknown;
  resetGenerationRows?: unknown;
  studentResetGenerationRows?: unknown;
};

type SupabaseError = {
  code?: unknown;
};

function parseNonNegativeSafeInteger(value: unknown): number | null {
  const normalized =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof normalized === "number" &&
    Number.isSafeInteger(normalized) &&
    normalized >= 0
    ? normalized
    : null;
}

function isResetGenerationConflict(payload: unknown) {
  return (payload as SupabaseError | null)?.code === "40001";
}

function parseRows(rows: unknown): QuizProgress {
  if (!Array.isArray(rows)) return {};

  const progress: QuizProgress = {};
  rows.forEach((row) => {
    const { studentName, quizIndex, solveCount } = row as QuizProgressRow;
    if (
      typeof studentName !== "string" ||
      !Number.isInteger(quizIndex) ||
      !Number.isInteger(solveCount)
    ) {
      return;
    }

    const index = quizIndex as number;
    const count = solveCount as number;
    if (index < 0 || index >= MAX_QUIZ_COUNT || count < 0 || count > 3) return;

    const counts = progress[studentName] ?? [];
    counts[index] = count;
    progress[studentName] = counts;
  });
  return progress;
}

function parseResetGenerationRows(rows: unknown): Record<number, number> {
  if (!Array.isArray(rows)) return {};

  const resetGenerations: Record<number, number> = {};
  rows.forEach((row) => {
    const { quizIndex, generation } = row as QuizResetGenerationRow;
    const normalizedIndex = parseNonNegativeSafeInteger(quizIndex);
    const normalizedGeneration = parseNonNegativeSafeInteger(generation);
    if (
      normalizedIndex === null ||
      normalizedIndex >= MAX_QUIZ_COUNT ||
      normalizedGeneration === null
    ) {
      return;
    }

    resetGenerations[normalizedIndex] = normalizedGeneration;
  });
  return resetGenerations;
}

function parseStudentResetGenerationRows(
  rows: unknown,
): Record<string, Record<number, number>> {
  if (!Array.isArray(rows)) return {};

  const studentResetGenerations: Record<string, Record<number, number>> = {};
  rows.forEach((row) => {
    const { studentName, quizIndex, generation } =
      row as QuizStudentResetGenerationRow;
    const normalizedIndex = parseNonNegativeSafeInteger(quizIndex);
    const normalizedGeneration = parseNonNegativeSafeInteger(generation);
    if (
      typeof studentName !== "string" ||
      !studentName ||
      normalizedIndex === null ||
      normalizedIndex >= MAX_QUIZ_COUNT ||
      normalizedGeneration === null
    ) {
      return;
    }

    const generations = studentResetGenerations[studentName] ?? {};
    generations[normalizedIndex] = normalizedGeneration;
    studentResetGenerations[studentName] = generations;
  });
  return studentResetGenerations;
}

async function studentExists(studentName: string, url: string, serviceRoleKey: string) {
  const endpoint = new URL("/rest/v1/Youth", url);
  endpoint.searchParams.set("select", "name");
  endpoint.searchParams.set("name", `eq.${studentName}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: createSupabaseAdminHeaders(serviceRoleKey),
    cache: "no-store",
  });
  if (!response.ok) return false;
  const rows: unknown = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

export async function GET() {
  try {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    const endpoint = new URL("/rest/v1/rpc/get_quiz_progress_snapshot", url);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({}),
      cache: "no-store",
    });
    const responsePayload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Quiz progress snapshot request failed", {
        status: response.status,
      });
      return Response.json({ error: "진행도를 불러오지 못했습니다." }, { status: 502 });
    }

    const row =
      Array.isArray(responsePayload) && responsePayload.length === 1
        ? (responsePayload[0] as QuizProgressSnapshotRow | undefined)
        : undefined;
    if (
      !row ||
      !Array.isArray(row.progressRows) ||
      !Array.isArray(row.resetGenerationRows) ||
      !Array.isArray(row.studentResetGenerationRows)
    ) {
      console.error("Quiz progress snapshot returned an invalid response");
      return Response.json({ error: "진행도 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({
      progress: parseRows(row.progressRows),
      resetGenerations: parseResetGenerationRows(row.resetGenerationRows),
      studentResetGenerations: parseStudentResetGenerationRows(
        row.studentResetGenerationRows,
      ),
    });
  } catch {
    return Response.json({ error: "진행도 서버 설정이 없습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const progressProtocol = (body as { progressProtocol?: unknown })?.progressProtocol;
    if (progressProtocol !== QUIZ_PROGRESS_PROTOCOL) {
      return Response.json({ error: "새로고침이 필요합니다." }, { status: 409 });
    }

    const studentName =
      typeof (body as { studentName?: unknown })?.studentName === "string"
        ? ((body as { studentName: string }).studentName).trim()
        : "";
    const quizIndex = (body as { quizIndex?: unknown })?.quizIndex;
    const solveCount = (body as { solveCount?: unknown })?.solveCount;
    const expectedResetGeneration = (body as { expectedResetGeneration?: unknown })
      ?.expectedResetGeneration;
    const expectedStudentResetGeneration = (
      body as { expectedStudentResetGeneration?: unknown }
    )?.expectedStudentResetGeneration;

    if (
      !studentName ||
      !Number.isInteger(quizIndex) ||
      !Number.isInteger(solveCount) ||
      (quizIndex as number) < 0 ||
      (quizIndex as number) >= MAX_QUIZ_COUNT ||
      (solveCount as number) < 0 ||
      (solveCount as number) > 3 ||
      !Number.isSafeInteger(expectedResetGeneration) ||
      (expectedResetGeneration as number) < 0 ||
      !Number.isSafeInteger(expectedStudentResetGeneration) ||
      (expectedStudentResetGeneration as number) < 0
    ) {
      return Response.json({ error: "잘못된 진행도 요청입니다." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (!(await studentExists(studentName, url, serviceRoleKey))) {
      return Response.json({ error: "등록되지 않은 이름입니다." }, { status: 404 });
    }

    const endpoint = new URL("/rest/v1/rpc/save_quiz_progress", url);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        p_student_name: studentName,
        p_quiz_index: quizIndex,
        p_solve_count: solveCount,
        p_progress_protocol: QUIZ_PROGRESS_PROTOCOL,
        p_expected_reset_generation: expectedResetGeneration,
        p_expected_student_reset_generation: expectedStudentResetGeneration,
      }),
      cache: "no-store",
    });
    const responsePayload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const conflict = isResetGenerationConflict(responsePayload);
      console.error("Quiz progress update failed", {
        status: response.status,
        code: (responsePayload as SupabaseError | null)?.code,
      });
      if (conflict) {
        return Response.json({ error: "진행도가 이미 초기화되었습니다." }, { status: 409 });
      }
      return Response.json({ error: "진행도를 저장하지 못했습니다." }, { status: 502 });
    }

    const row = Array.isArray(responsePayload)
      ? (responsePayload[0] as QuizProgressRow | undefined)
      : undefined;
    const responseSolveCount = parseNonNegativeSafeInteger(row?.solveCount);
    const responseResetGeneration = parseNonNegativeSafeInteger(row?.resetGeneration);
    const responseStudentResetGeneration = parseNonNegativeSafeInteger(
      row?.studentResetGeneration,
    );
    if (
      !row ||
      row.studentName !== studentName ||
      row.quizIndex !== quizIndex ||
      responseSolveCount === null ||
      responseSolveCount > 3 ||
      responseResetGeneration === null ||
      responseStudentResetGeneration === null
    ) {
      return Response.json({ error: "진행도 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({
      solveCount: responseSolveCount,
      resetGeneration: responseResetGeneration,
      studentResetGeneration: responseStudentResetGeneration,
    });
  } catch {
    return Response.json({ error: "진행도를 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    const progressProtocol = (body as { progressProtocol?: unknown })?.progressProtocol;
    if (progressProtocol !== QUIZ_PROGRESS_PROTOCOL) {
      return Response.json({ error: "새로고침이 필요합니다." }, { status: 409 });
    }

    const studentName =
      typeof (body as { studentName?: unknown })?.studentName === "string"
        ? ((body as { studentName: string }).studentName).trim()
        : "";
    const quizIndex = (body as { quizIndex?: unknown })?.quizIndex;
    const expectedResetGeneration = (body as { expectedResetGeneration?: unknown })
      ?.expectedResetGeneration;
    const expectedStudentResetGeneration = (
      body as { expectedStudentResetGeneration?: unknown }
    )?.expectedStudentResetGeneration;

    if (
      !studentName ||
      !Number.isInteger(quizIndex) ||
      (quizIndex as number) < 0 ||
      (quizIndex as number) >= MAX_QUIZ_COUNT ||
      !Number.isSafeInteger(expectedResetGeneration) ||
      (expectedResetGeneration as number) < 0 ||
      !Number.isSafeInteger(expectedStudentResetGeneration) ||
      (expectedStudentResetGeneration as number) < 0
    ) {
      return Response.json({ error: "잘못된 진행도 취소 요청입니다." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (!(await studentExists(studentName, url, serviceRoleKey))) {
      return Response.json({ error: "등록되지 않은 이름입니다." }, { status: 404 });
    }

    const endpoint = new URL("/rest/v1/rpc/decrement_quiz_progress", url);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        p_student_name: studentName,
        p_quiz_index: quizIndex,
        p_progress_protocol: QUIZ_PROGRESS_PROTOCOL,
        p_expected_reset_generation: expectedResetGeneration,
        p_expected_student_reset_generation: expectedStudentResetGeneration,
      }),
      cache: "no-store",
    });
    const responsePayload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const conflict = isResetGenerationConflict(responsePayload);
      console.error("Quiz progress decrement failed", {
        status: response.status,
        code: (responsePayload as SupabaseError | null)?.code,
      });
      if (conflict) {
        return Response.json({ error: "진행도가 이미 초기화되었습니다." }, { status: 409 });
      }
      return Response.json({ error: "진행도 취소를 저장하지 못했습니다." }, { status: 502 });
    }

    const row = Array.isArray(responsePayload)
      ? (responsePayload[0] as QuizProgressRow | undefined)
      : undefined;
    const solveCount = parseNonNegativeSafeInteger(row?.solveCount);
    const resetGeneration = parseNonNegativeSafeInteger(row?.resetGeneration);
    const studentResetGeneration = parseNonNegativeSafeInteger(
      row?.studentResetGeneration,
    );
    if (
      !row ||
      row.studentName !== studentName ||
      row.quizIndex !== quizIndex ||
      solveCount === null ||
      solveCount > 3 ||
      resetGeneration === null ||
      studentResetGeneration === null
    ) {
      return Response.json({ error: "진행도 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({ solveCount, resetGeneration, studentResetGeneration });
  } catch {
    return Response.json({ error: "진행도 취소를 저장하지 못했습니다." }, { status: 500 });
  }
}
