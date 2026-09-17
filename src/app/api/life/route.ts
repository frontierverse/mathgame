import {
  clearLifeSession,
  createLifeStudentSession,
  loginLifeAdmin,
  LifeAuthError,
  getLifeSession,
  lifeIsConfigured,
  revokeLifeAdminSession,
  verifyLifeAdminPasswordForRequest,
} from "../../data/lifeSession";
import {
  getLifeStudents,
  getMoodEntries,
  LifeDataError,
  mutateMood,
} from "../../data/studentLife";
import { isMoodScore, koreanDate } from "../../life/mood";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}

function failed(error: unknown) {
  return error instanceof LifeDataError || error instanceof LifeAuthError
    ? json({ error: error.message }, error.status)
    : json({ error: "연결하지 못했어요. 잠시 후 다시 시도해 주세요." }, 502);
}

export async function GET() {
  if (!lifeIsConfigured())
    return json({ error: "관리자 접근 설정이 필요합니다.", setup: true }, 503);
  try {
    const session = await getLifeSession();
    if (!session) return json({ error: "관리자 확인이 필요합니다." }, 401);
    const studentId =
      session.role === "student" ? session.studentId : undefined;
    const [students, allEntries] = await Promise.all([
      getLifeStudents(studentId),
      getMoodEntries(studentId),
    ]);
    const visibleStudentIds = new Set(students.map((student) => student.id));
    const entries = allEntries.filter((entry) =>
      visibleStudentIds.has(entry.studentId),
    );
    const today = koreanDate();
    if (session.role === "student") {
      if (!students.length) {
        await clearLifeSession();
        return json({ error: "학생을 찾지 못했어요." }, 401);
      }
      return json({
        role: "student",
        today,
        students,
        entries: [],
        hasRecordedToday: entries.some((entry) => entry.recordedOn === today),
        expiresAt: session.expires,
      });
    }
    return json({
      role: session.role,
      today,
      students,
      entries,
      expiresAt: session.expires,
    });
  } catch (error) {
    return failed(error);
  }
}

export async function POST(request: Request) {
  // All mutations must originate in this app, including the password exchange.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return json({ error: "허용되지 않은 요청입니다." }, 403);
  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value))
      return json({ error: "잘못된 요청입니다." }, 400);
    body = value as Record<string, unknown>;
  } catch {
    return json({ error: "잘못된 요청입니다." }, 400);
  }

  if (body.action === "demoLogin") {
    if (!lifeIsConfigured())
      return json(
        { error: "관리자 접근 설정이 필요합니다.", setup: true },
        503,
      );
    if (typeof body.password !== "string" || !/^\d{4}$/.test(body.password)) {
      return json({ error: "비밀번호를 확인해 주세요." }, 400);
    }
    try {
      await verifyLifeAdminPasswordForRequest(request, body.password);
      return json({ ok: true });
    } catch (error) {
      return failed(error);
    }
  }
  if (!lifeIsConfigured())
    return json({ error: "관리자 접근 설정이 필요합니다.", setup: true }, 503);

  if (body.action === "login") {
    if (typeof body.password !== "string" || !/^\d{4}$/.test(body.password)) {
      return json({ error: "비밀번호를 확인해 주세요." }, 400);
    }
    try {
      await verifyLifeAdminPasswordForRequest(request, body.password);
      await loginLifeAdmin(body.password);
      return json({ ok: true });
    } catch (error) {
      return failed(error);
    }
  }
  if (body.action === "lock") {
    try {
      await clearLifeSession();
      return json({ ok: true });
    } catch (error) {
      return failed(error);
    }
  }
  try {
    const session = await getLifeSession();
    if (!session) return json({ error: "관리자 확인이 필요합니다." }, 401);
    if (body.action === "select") {
      if (session.role !== "admin")
        return json({ error: "관리자 확인이 필요합니다." }, 403);
      if (
        typeof body.studentId !== "string" ||
        !body.studentId ||
        body.studentId.length > 200
      )
        return json({ error: "학생을 선택해 주세요." }, 400);
      // Revoke the administrator capability before any lookup that could fail.
      // Pressing “학생 입력 시작” always closes the administrator view.
      await revokeLifeAdminSession();
      const students = await getLifeStudents(body.studentId);
      if (!students.length)
        return json({ error: "학생을 찾지 못했어요." }, 404);
      await createLifeStudentSession(body.studentId);
      return json({ ok: true });
    }
    if (body.action === "save") {
      if (session.role !== "student")
        return json({ error: "학생 화면에서 기록해 주세요." }, 403);
      if (!isMoodScore(body.score) || typeof body.wantsTalk !== "boolean")
        return json({ error: "0~5점 중 골라 주세요." }, 400);
      if (body.recordedOn !== koreanDate())
        return json({ error: "날짜가 바뀌었어요. 새로고침해 주세요." }, 409);
      if (!(await getLifeStudents(session.studentId)).length)
        return json({ error: "학생을 찾지 못했어요." }, 404);
      await mutateMood("save_student_mood", {
        p_student_id: session.studentId,
        p_score: body.score,
        p_wants_talk: body.wantsTalk,
        p_recorded_on: body.recordedOn,
      });
      return json({ saved: true });
    }
    if (body.action === "care") {
      if (session.role !== "admin")
        return json({ error: "관리자 확인이 필요합니다." }, 403);
      if (
        typeof body.studentId !== "string" ||
        !body.studentId ||
        body.studentId.length > 200 ||
        typeof body.recordedOn !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body.recordedOn) ||
        !["pending", "scheduled", "done"].includes(String(body.careStatus))
      )
        return json({ error: "잘못된 상담 상태입니다." }, 400);
      if (!(await getLifeStudents(body.studentId)).length)
        return json({ error: "학생을 찾지 못했어요." }, 404);
      return json({
        entry: await mutateMood("update_student_mood_care", {
          p_student_id: body.studentId,
          p_recorded_on: body.recordedOn,
          p_care_status: body.careStatus,
        }),
      });
    }
    return json({ error: "잘못된 요청입니다." }, 400);
  } catch (error) {
    return failed(error);
  }
}
