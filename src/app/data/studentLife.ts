import "server-only";

import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "./supabaseAdmin";
import { isMoodEntry, type LifeStudent, type MoodEntry } from "../life/mood";

export class LifeDataError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

async function getHiddenLifeStudentIds() {
  const hidden = new Set<string>();
  for (let offset = 0; offset < 50000; offset += 1000) {
    const rows = await databaseRequest("StudentLifeHiddenYouth", {
      select: "studentId",
      order: "studentId.asc",
      limit: "1000",
      offset: String(offset),
    });
    if (!Array.isArray(rows))
      throw new LifeDataError("숨김 학생 목록을 불러오지 못했어요.");
    for (const row of rows) {
      if (typeof row?.studentId === "string" && row.studentId) {
        hidden.add(row.studentId);
      }
    }
    if (rows.length < 1000) return hidden;
  }
  throw new LifeDataError("숨김 학생 목록을 모두 불러오지 못했어요.");
}

async function databaseRequest(
  path: string,
  params: Record<string, string>,
  body?: unknown,
) {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const endpoint = new URL(`/rest/v1/${path}`, url);
  Object.entries(params).forEach(([key, value]) =>
    endpoint.searchParams.set(key, value),
  );
  const response = await fetch(endpoint, {
    method: body === undefined ? "GET" : "POST",
    headers: createSupabaseAdminHeaders(serviceRoleKey, {
      "Content-Type": "application/json",
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = (payload as { code?: string } | null)?.code;
    if (code === "P0001")
      throw new LifeDataError(
        "날짜가 바뀌었어요. 새로고침 후 다시 기록해 주세요.",
        409,
      );
    if (code === "P0002")
      throw new LifeDataError("기록을 찾을 수 없습니다.", 404);
    throw new LifeDataError(
      "기록을 불러오거나 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  }
  return payload;
}

export async function getLifeStudents(
  studentId?: string,
): Promise<LifeStudent[]> {
  const hidden = await getHiddenLifeStudentIds();
  if (studentId && hidden.has(studentId)) return [];
  const students: LifeStudent[] = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const rows = await databaseRequest("Youth", {
      select: "id,name",
      order: "name.asc,id.asc",
      limit: "1000",
      offset: String(offset),
      ...(studentId ? { id: `eq.${studentId}` } : {}),
    });
    if (!Array.isArray(rows))
      throw new LifeDataError("학생 명단을 불러오지 못했어요.");
    for (const row of rows) {
      if (
        typeof row?.id === "string" &&
        typeof row?.name === "string" &&
        row.name.trim() &&
        !hidden.has(row.id)
      ) {
        students.push({ id: row.id, name: row.name.trim() });
      }
    }
    if (rows.length < 1000) return students;
  }
  throw new LifeDataError("학생 명단을 모두 불러오지 못했어요.");
}

export async function getMoodEntries(studentId?: string): Promise<MoodEntry[]> {
  const entries: MoodEntry[] = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const rows = await databaseRequest("StudentMood", {
      select: "studentId,recordedOn,score,wantsTalk,careStatus,updatedAt",
      order: "recordedOn.asc,studentId.asc",
      limit: "1000",
      offset: String(offset),
      ...(studentId ? { studentId: `eq.${studentId}` } : {}),
    });
    if (!Array.isArray(rows) || !rows.every(isMoodEntry))
      throw new LifeDataError("기록 응답을 확인하지 못했어요.");
    entries.push(...rows);
    if (rows.length < 1000) return entries;
  }
  throw new LifeDataError("기록을 모두 불러오지 못했어요.");
}

export async function mutateMood(
  functionName: "save_student_mood" | "update_student_mood_care",
  body: Record<string, unknown>,
) {
  const rows = await databaseRequest(`rpc/${functionName}`, {}, body);
  if (!Array.isArray(rows) || rows.length !== 1 || !isMoodEntry(rows[0])) {
    throw new LifeDataError(
      "저장 결과를 확인하지 못했어요. 새로고침해 주세요.",
    );
  }
  return rows[0];
}
