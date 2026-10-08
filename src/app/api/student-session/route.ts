import { cookies } from "next/headers";
import { getStudents } from "../../server/students";
import { getProgress } from "../../server/progress";
import { DataError } from "../../server/database";
import { dataErrorResponse, getStudentSession, requireSameOrigin } from "../../server/session";
import { createSessionToken, SESSION_COOKIE, SESSION_SECONDS } from "../../server/sessionToken";

export async function GET() {
  try { return Response.json({ session: await getStudentSession() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return dataErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json().catch(() => null);
    if (typeof body?.studentId !== "string" || body.studentId.length > 200) throw new DataError("학생을 선택해 주세요.", 400);
    const student = (await getStudents()).find(student => student.id === body.studentId);
    if (!student) throw new DataError("명단에 없는 학생입니다.", 404);
    const progress = await getProgress(student.id);
    (await cookies()).set(SESSION_COOKIE, createSessionToken(student.id), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
    return Response.json({ session: { student, progress } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return dataErrorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    (await cookies()).delete(SESSION_COOKIE);
    return Response.json({ session: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return dataErrorResponse(error); }
}
