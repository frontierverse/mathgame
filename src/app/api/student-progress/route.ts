import { DataError } from "../../server/database";
import { getStudentSession, requireSameOrigin, dataErrorResponse } from "../../server/session";
import { saveProgressAction } from "../../server/progress";
import { parseStudentProgressRequest, ProgressRuleError } from "../../server/progressRules";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const session = await getStudentSession();
    if (!session) throw new DataError("학생을 다시 선택해 주세요.", 401);
    const action = parseStudentProgressRequest(await request.json().catch(() => null), session.student.id);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const result = await saveProgressAction(session.student.id, action, today);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return dataErrorResponse(error instanceof ProgressRuleError ? new DataError(error.message, error.status) : error);
  }
}
