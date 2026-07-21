import { createSupabaseAdminHeaders, getSupabaseAdminConfig } from "../../../data/supabaseAdmin";
import { getQuizRoundById } from "../../../shared/curriculumQuizzes";
import { QUIZ_PROGRESS_PROTOCOL } from "../../../shared/quizProgressProtocol";

export const dynamic = "force-dynamic";

type QuizRoundResetRow = {
  roundId?: unknown;
  progressResetCount?: unknown;
  attemptResetCount?: unknown;
  resetGenerations?: unknown;
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

function parseResetGenerations(
  value: unknown,
  quizIndexes: readonly number[],
): Record<number, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const resetGenerations: Record<number, number> = {};
  for (const quizIndex of quizIndexes) {
    const generation = parseNonNegativeSafeInteger(source[String(quizIndex)]);
    if (generation === null) return null;
    resetGenerations[quizIndex] = generation;
  }
  return resetGenerations;
}

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
    const expectedResetGenerations = (body as { expectedResetGenerations?: unknown })
      ?.expectedResetGenerations;
    if (
      !Array.isArray(expectedResetGenerations) ||
      expectedResetGenerations.length !== round.quizIndexes.length ||
      expectedResetGenerations.some(
        (generation) => !Number.isSafeInteger(generation) || generation < 0,
      )
    ) {
      return Response.json({ error: "잘못된 초기화 상태입니다." }, { status: 400 });
    }

    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    const endpoint = new URL("/rest/v1/rpc/reset_quiz_round_data", url);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        p_round_id: round.id,
        p_quiz_indexes: round.quizIndexes,
        p_progress_protocol: QUIZ_PROGRESS_PROTOCOL,
        p_expected_reset_generations: expectedResetGenerations,
      }),
      cache: "no-store",
    });
    const responsePayload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const conflict = isResetGenerationConflict(responsePayload);
      console.error("Quiz round reset failed", {
        roundId,
        status: response.status,
        code: (responsePayload as SupabaseError | null)?.code,
      });
      if (conflict) {
        return Response.json(
          { error: "라운드가 이미 초기화되었습니다." },
          { status: 409 },
        );
      }
      return Response.json(
        { error: "라운드 진행도를 초기화하지 못했습니다." },
        { status: 502 },
      );
    }

    const row = Array.isArray(responsePayload)
      ? (responsePayload[0] as QuizRoundResetRow | undefined)
      : undefined;
    const progressResetCount = parseNonNegativeSafeInteger(row?.progressResetCount);
    const attemptResetCount = parseNonNegativeSafeInteger(row?.attemptResetCount);
    const resetGenerations = parseResetGenerations(
      row?.resetGenerations,
      round.quizIndexes,
    );
    if (
      row?.roundId !== round.id ||
      progressResetCount === null ||
      attemptResetCount === null ||
      resetGenerations === null
    ) {
      console.error("Quiz round reset returned an invalid response", { roundId });
      return Response.json(
        { error: "라운드 기록 초기화 응답이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    return Response.json({
      roundId,
      progressResetCount,
      attemptResetCount,
      resetGenerations,
    });
  } catch {
    return Response.json(
      { error: "라운드 진행도를 초기화하지 못했습니다." },
      { status: 500 },
    );
  }
}
