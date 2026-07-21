import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "../../data/supabaseAdmin";
import {
  getQuizForIndex,
  getQuizRoundById,
} from "../../shared/curriculumQuizzes";
import {
  MAX_QUIZ_ATTEMPT_DURATION_MS,
  QUIZ_ATTEMPT_PROTOCOL,
} from "../../shared/quizAttemptProtocol";
import {
  quizHasRandomVariant,
  resolveQuizContent,
} from "../../shared/randomQuizVariants";
import {
  MAX_QUIZ_TIME_LIMIT_SECONDS,
  MIN_QUIZ_TIME_LIMIT_SECONDS,
  timeoutStageFor,
} from "../../progress/quizTimer";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AttemptRow = {
  id?: unknown;
  solveCount?: unknown;
  resetGeneration?: unknown;
  studentResetGeneration?: unknown;
};

type CompletionMode = "random" | "direct";
type CompletionReason = "answer" | "timeout";

function isValidTransition(stageBefore: number, stageAfter: number) {
  return (
    (stageBefore === 0 && (stageAfter === 1 || stageAfter === 3)) ||
    (stageBefore === 1 && (stageAfter === 1 || stageAfter === 2)) ||
    (stageBefore === 2 && (stageAfter === 2 || stageAfter === 3))
  );
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 풀이 시간 요청입니다." }, { status: 400 });
  }

  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  if (!record || record.attemptProtocol !== QUIZ_ATTEMPT_PROTOCOL) {
    return Response.json({ error: "새로고침이 필요합니다." }, { status: 409 });
  }

  const id = typeof record.id === "string" ? record.id.trim() : "";
  const studentName =
    typeof record.studentName === "string" ? record.studentName.trim() : "";
  const quizId = typeof record.quizId === "string" ? record.quizId.trim() : "";
  const quizIndex = record.quizIndex;
  const roundId = typeof record.roundId === "string" ? record.roundId.trim() : "";
  const rawVariantSeed = record.variantSeed;
  const variantSeed =
    rawVariantSeed === null
      ? null
      : Number.isInteger(rawVariantSeed) &&
          (rawVariantSeed as number) >= 0 &&
          (rawVariantSeed as number) <= 0xffff_ffff
        ? (rawVariantSeed as number)
        : undefined;
  const questionText =
    typeof record.questionText === "string" ? record.questionText.trim() : "";
  const stageBefore = record.stageBefore;
  const stageAfter = record.stageAfter;
  const durationMs = record.durationMs;
  const startedAt = typeof record.startedAt === "string" ? record.startedAt : "";
  const answeredAt = typeof record.answeredAt === "string" ? record.answeredAt : "";
  const completionMode = record.completionMode;
  const completionReason = record.completionReason;
  const timeLimitSeconds = record.timeLimitSeconds;
  const resetGeneration = record.resetGeneration;
  const studentResetGeneration = record.studentResetGeneration;
  const startedAtMs = Date.parse(startedAt);
  const answeredAtMs = Date.parse(answeredAt);

  if (
    !UUID_PATTERN.test(id) ||
    !studentName ||
    studentName.length > 200 ||
    !quizId ||
    !Number.isInteger(quizIndex) ||
    !roundId ||
    variantSeed === undefined ||
    !questionText ||
    questionText.length > 2000 ||
    !Number.isInteger(stageBefore) ||
    !Number.isInteger(stageAfter) ||
    !isValidTransition(stageBefore as number, stageAfter as number) ||
    !Number.isInteger(durationMs) ||
    (durationMs as number) < 0 ||
    (durationMs as number) > MAX_QUIZ_ATTEMPT_DURATION_MS ||
    !Number.isFinite(startedAtMs) ||
    !Number.isFinite(answeredAtMs) ||
    answeredAtMs < startedAtMs ||
    (completionMode !== "random" && completionMode !== "direct") ||
    (completionReason !== "answer" && completionReason !== "timeout") ||
    !Number.isInteger(timeLimitSeconds) ||
    (timeLimitSeconds as number) < MIN_QUIZ_TIME_LIMIT_SECONDS ||
    (timeLimitSeconds as number) > MAX_QUIZ_TIME_LIMIT_SECONDS ||
    !Number.isSafeInteger(resetGeneration) ||
    (resetGeneration as number) < 0 ||
    !Number.isSafeInteger(studentResetGeneration) ||
    (studentResetGeneration as number) < 0 ||
    (durationMs as number) > (timeLimitSeconds as number) * 1000 ||
    (completionReason === "timeout" &&
      ((durationMs as number) !== (timeLimitSeconds as number) * 1000 ||
        (stageAfter as number) !== timeoutStageFor(stageBefore as number)))
  ) {
    return Response.json({ error: "잘못된 풀이 시간 요청입니다." }, { status: 400 });
  }

  const quiz = getQuizForIndex(quizIndex as number);
  const round = getQuizRoundById(roundId);
  if (
    !quiz ||
    quiz.id !== quizId ||
    !round ||
    !round.quizIndexes.includes(quizIndex as number)
  ) {
    return Response.json({ error: "현재 퀴즈 정보와 일치하지 않습니다." }, { status: 409 });
  }

  if ((completionMode as CompletionMode) === "random") {
    if (quizHasRandomVariant(quiz.quizIndex) !== (variantSeed !== null)) {
      return Response.json(
        { error: "현재 퀴즈 변형과 일치하지 않습니다." },
        { status: 409 },
      );
    }

    const resolvedQuiz = resolveQuizContent(quizIndex as number, variantSeed);
    if (resolvedQuiz.question.trim() !== questionText) {
      return Response.json(
        { error: "현재 퀴즈 문항과 일치하지 않습니다." },
        { status: 409 },
      );
    }
  } else {
    if (variantSeed !== null) {
      return Response.json(
        { error: "직접 풀이에는 퀴즈 변형을 사용할 수 없습니다." },
        { status: 409 },
      );
    }
    if (quiz.question.trim() !== questionText) {
      return Response.json(
        { error: "현재 퀴즈 문항과 일치하지 않습니다." },
        { status: 409 },
      );
    }
  }

  try {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (!(await studentExists(studentName, url, serviceRoleKey))) {
      return Response.json({ error: "등록되지 않은 이름입니다." }, { status: 404 });
    }

    const endpoint = new URL("/rest/v1/rpc/complete_quiz_attempt", url);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: createSupabaseAdminHeaders(serviceRoleKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        p_id: id,
        p_student_name: studentName,
        p_quiz_id: quizId,
        p_quiz_index: quizIndex,
        p_round_id: roundId,
        p_variant_seed: variantSeed,
        p_question_text: questionText,
        p_stage_before: stageBefore,
        p_stage_after: stageAfter,
        p_duration_ms: durationMs,
        p_started_at: startedAt,
        p_answered_at: answeredAt,
        p_completion_mode: completionMode as CompletionMode,
        p_completion_reason: completionReason as CompletionReason,
        p_time_limit_seconds: timeLimitSeconds,
        p_expected_reset_generation: resetGeneration,
        p_expected_student_reset_generation: studentResetGeneration,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorPayload: unknown = await response.json().catch(() => null);
      const errorCode =
        errorPayload &&
        typeof errorPayload === "object" &&
        !Array.isArray(errorPayload) &&
        typeof (errorPayload as Record<string, unknown>).code === "string"
          ? (errorPayload as Record<string, unknown>).code
          : null;
      console.error("Quiz attempt recording failed", {
        status: response.status,
        code: errorCode,
      });
      const status =
        errorCode === "40001" || errorCode === "23505"
          ? 409
          : errorCode === "22023"
            ? 400
            : 502;
      return Response.json(
        { error: "풀이 시간을 저장하지 못했습니다." },
        { status },
      );
    }

    const rows: unknown = await response.json();
    const row = Array.isArray(rows) ? (rows[0] as AttemptRow | undefined) : undefined;
    if (
      row?.id !== id ||
      !Number.isInteger(row.solveCount) ||
      (row.solveCount as number) < 0 ||
      (row.solveCount as number) > 3 ||
      !Number.isSafeInteger(row.resetGeneration) ||
      (row.resetGeneration as number) < 0 ||
      !Number.isSafeInteger(row.studentResetGeneration) ||
      (row.studentResetGeneration as number) < 0
    ) {
      return Response.json({ error: "풀이 시간 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({
      attemptId: id,
      solveCount: row.solveCount as number,
      resetGeneration: row.resetGeneration as number,
      studentResetGeneration: row.studentResetGeneration as number,
    });
  } catch {
    return Response.json({ error: "풀이 시간을 저장하지 못했습니다." }, { status: 500 });
  }
}
