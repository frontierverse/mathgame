import { createSupabaseAdminHeaders, getSupabaseAdminConfig } from "../../../data/supabaseAdmin";
import { getQuizRoundById } from "../../../shared/curriculumQuizzes";
import { QUIZ_PROGRESS_PROTOCOL } from "../../../shared/quizProgressProtocol";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    const progressProtocol = (body as { progressProtocol?: unknown })?.progressProtocol;
    if (progressProtocol !== QUIZ_PROGRESS_PROTOCOL) {
      return Response.json({ error: "새로고침이 필요합니다." }, { status: 409 });
    }

    const roundId =
      typeof (body as { roundId?: unknown })?.roundId === "string"
        ? ((body as { roundId: string }).roundId).trim()
        : "";
    const round = getQuizRoundById(roundId);
    if (!round) {
      return Response.json({ error: "존재하지 않는 라운드입니다." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    const endpoint = new URL("/rest/v1/QuizProgress", url);
    endpoint.searchParams.set("quizIndex", `in.(${round.quizIndexes.join(",")})`);

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        Prefer: "return=representation",
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Quiz round reset failed", { roundId, status: response.status });
      return Response.json(
        { error: "라운드 진행도를 초기화하지 못했습니다." },
        { status: 502 },
      );
    }

    const rows: unknown = await response.json();
    return Response.json({
      roundId,
      resetCount: Array.isArray(rows) ? rows.length : 0,
    });
  } catch {
    return Response.json(
      { error: "라운드 진행도를 초기화하지 못했습니다." },
      { status: 500 },
    );
  }
}
