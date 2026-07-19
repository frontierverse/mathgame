import { createSupabaseAdminHeaders, getSupabaseAdminConfig } from "../../data/supabaseAdmin";
import { CURRICULUM_QUIZ_ROUNDS } from "../../progress/quizData";

export const dynamic = "force-dynamic";

type RoundAssignmentRow = {
  roundId?: unknown;
  studentNames?: unknown;
};

const knownRoundIds = new Set(CURRICULUM_QUIZ_ROUNDS.map((round) => round.id));

function normalizeStudentNames(value: unknown) {
  if (!Array.isArray(value)) return null;

  const seen = new Set<string>();
  const studentNames: string[] = [];
  for (const valueEntry of value) {
    if (typeof valueEntry !== "string" || !valueEntry.trim()) return null;
    const studentName = valueEntry.trim();
    if (seen.has(studentName)) continue;
    seen.add(studentName);
    studentNames.push(studentName);
  }
  return studentNames;
}

function parseAssignments(rows: unknown) {
  const assignments: Record<string, string[]> = {};
  if (!Array.isArray(rows)) return assignments;

  rows.forEach((row) => {
    const { roundId, studentNames } = row as RoundAssignmentRow;
    if (typeof roundId !== "string" || !knownRoundIds.has(roundId)) return;
    const normalizedStudentNames = normalizeStudentNames(studentNames);
    if (normalizedStudentNames === null) return;
    assignments[roundId] = normalizedStudentNames;
  });

  return assignments;
}

async function getRegisteredStudentNames(url: string, serviceRoleKey: string) {
  const endpoint = new URL("/rest/v1/Youth", url);
  endpoint.searchParams.set("select", "name");

  const response = await fetch(endpoint, {
    headers: createSupabaseAdminHeaders(serviceRoleKey),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return null;

  return new Set(
    rows.flatMap((row) => {
      const name = (row as { name?: unknown })?.name;
      return typeof name === "string" && name.trim() ? [name.trim()] : [];
    }),
  );
}

export async function GET() {
  try {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    const endpoint = new URL("/rest/v1/QuizRoundAssignment", url);
    endpoint.searchParams.set("select", "roundId,studentNames");
    endpoint.searchParams.set("order", "roundId.asc");

    const response = await fetch(endpoint, {
      headers: createSupabaseAdminHeaders(serviceRoleKey),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz round assignment request failed", { status: response.status });
      return Response.json({ error: "라운드 배정을 불러오지 못했습니다." }, { status: 502 });
    }

    return Response.json({ assignments: parseAssignments(await response.json()) });
  } catch {
    return Response.json({ error: "라운드 배정 서버 설정이 없습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 라운드 배정 요청입니다." }, { status: 400 });
  }

  const bodyRecord =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { roundId?: unknown; studentNames?: unknown })
      : null;
  const roundId = typeof bodyRecord?.roundId === "string" ? bodyRecord.roundId.trim() : "";
  const studentNames = normalizeStudentNames(bodyRecord?.studentNames);

  if (!knownRoundIds.has(roundId) || studentNames === null) {
    return Response.json({ error: "잘못된 라운드 배정 요청입니다." }, { status: 400 });
  }

  try {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (studentNames.length > 0) {
      const registeredStudentNames = await getRegisteredStudentNames(url, serviceRoleKey);
      if (registeredStudentNames === null) {
        return Response.json({ error: "학생 명단을 확인하지 못했습니다." }, { status: 502 });
      }

      const unknownStudentName = studentNames.find(
        (studentName) => !registeredStudentNames.has(studentName),
      );
      if (unknownStudentName) {
        return Response.json({ error: "등록되지 않은 학생이 있습니다." }, { status: 404 });
      }
    }

    const endpoint = new URL("/rest/v1/QuizRoundAssignment", url);
    endpoint.searchParams.set("on_conflict", "roundId");
    endpoint.searchParams.set("select", "roundId,studentNames");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify({
        roundId,
        studentNames,
        updatedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz round assignment update failed", { status: response.status });
      return Response.json({ error: "라운드 배정을 저장하지 못했습니다." }, { status: 502 });
    }

    const assignments = parseAssignments(await response.json());
    if (!Object.hasOwn(assignments, roundId)) {
      return Response.json({ error: "라운드 배정 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({ assignment: { roundId, studentNames: assignments[roundId] } });
  } catch {
    return Response.json({ error: "라운드 배정을 저장하지 못했습니다." }, { status: 500 });
  }
}
