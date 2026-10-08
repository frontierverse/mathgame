import "server-only";
import { cookies } from "next/headers";
import { DataError } from "./database";
import { getStudents } from "./students";
import { getProgress } from "./progress";
import { readSessionToken, SESSION_COOKIE } from "./sessionToken";
import { isSameOrigin } from "./requestOrigin";

export async function getStudentSession() {
  const id = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const student = (await getStudents()).find(student => student.id === id);
  return student ? { student, progress: await getProgress(id) } : null;
}

export function requireSameOrigin(request: Request) {
  if (!isSameOrigin(request)) throw new DataError("요청을 확인하지 못했습니다.", 403);
}

export function dataErrorResponse(error: unknown) {
  return Response.json({ error: error instanceof DataError ? error.message : "연결을 확인하고 다시 시도해 주세요." }, { status: error instanceof DataError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
