import { createSupabaseAdminHeaders, getSupabaseAdminConfig } from "../../data/supabaseAdmin";
import { QUIZZES } from "../../progress/quizData";
import type { QuizProgress } from "../../progress/quizProgress";

export const dynamic = "force-dynamic";

type QuizProgressRow = {
  studentName?: unknown;
  quizIndex?: unknown;
  solveCount?: unknown;
};

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
    if (index < 0 || index >= QUIZZES.length || count < 0 || count > 3) return;

    const counts = progress[studentName] ?? [];
    counts[index] = count;
    progress[studentName] = counts;
  });
  return progress;
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
    const endpoint = new URL("/rest/v1/QuizProgress", url);
    endpoint.searchParams.set("select", "studentName,quizIndex,solveCount");
    endpoint.searchParams.set("order", "studentName.asc,quizIndex.asc");

    const response = await fetch(endpoint, {
      headers: createSupabaseAdminHeaders(serviceRoleKey),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz progress request failed", { status: response.status });
      return Response.json({ error: "진행도를 불러오지 못했습니다." }, { status: 502 });
    }

    return Response.json({ progress: parseRows(await response.json()) });
  } catch {
    return Response.json({ error: "진행도 서버 설정이 없습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const studentName =
      typeof (body as { studentName?: unknown })?.studentName === "string"
        ? ((body as { studentName: string }).studentName).trim()
        : "";
    const quizIndex = (body as { quizIndex?: unknown })?.quizIndex;
    const solveCount = (body as { solveCount?: unknown })?.solveCount;

    if (
      !studentName ||
      !Number.isInteger(quizIndex) ||
      !Number.isInteger(solveCount) ||
      (quizIndex as number) < 0 ||
      (quizIndex as number) >= QUIZZES.length ||
      (solveCount as number) < 0 ||
      (solveCount as number) > 3
    ) {
      return Response.json({ error: "잘못된 진행도 요청입니다." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (!(await studentExists(studentName, url, serviceRoleKey))) {
      return Response.json({ error: "등록되지 않은 학생입니다." }, { status: 404 });
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
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz progress update failed", { status: response.status });
      return Response.json({ error: "진행도를 저장하지 못했습니다." }, { status: 502 });
    }

    const rows: unknown = await response.json();
    const row = Array.isArray(rows) ? (rows[0] as QuizProgressRow | undefined) : undefined;
    if (!row || !Number.isInteger(row.solveCount)) {
      return Response.json({ error: "진행도 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({ solveCount: row.solveCount });
  } catch {
    return Response.json({ error: "진행도를 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    const studentName =
      typeof (body as { studentName?: unknown })?.studentName === "string"
        ? ((body as { studentName: string }).studentName).trim()
        : "";
    const quizIndex = (body as { quizIndex?: unknown })?.quizIndex;

    if (
      !studentName ||
      !Number.isInteger(quizIndex) ||
      (quizIndex as number) < 0 ||
      (quizIndex as number) >= QUIZZES.length
    ) {
      return Response.json({ error: "잘못된 진행도 취소 요청입니다." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (!(await studentExists(studentName, url, serviceRoleKey))) {
      return Response.json({ error: "등록되지 않은 학생입니다." }, { status: 404 });
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
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz progress decrement failed", { status: response.status });
      return Response.json({ error: "진행도 취소를 저장하지 못했습니다." }, { status: 502 });
    }

    const rows: unknown = await response.json();
    const row = Array.isArray(rows) ? (rows[0] as QuizProgressRow | undefined) : undefined;
    const solveCount = row?.solveCount ?? 0;
    if (!Number.isInteger(solveCount)) {
      return Response.json({ error: "진행도 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({ solveCount });
  } catch {
    return Response.json({ error: "진행도 취소를 저장하지 못했습니다." }, { status: 500 });
  }
}
