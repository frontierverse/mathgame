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

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AttemptRow = {
  id?: unknown;
};

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
    answeredAtMs < startedAtMs
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

  if (quizHasRandomVariant(quiz.quizIndex) !== (variantSeed !== null)) {
    return Response.json({ error: "현재 퀴즈 변형과 일치하지 않습니다." }, { status: 409 });
  }

  const resolvedQuiz = resolveQuizContent(quizIndex as number, variantSeed);
  if (resolvedQuiz.question.trim() !== questionText) {
    return Response.json({ error: "현재 퀴즈 문항과 일치하지 않습니다." }, { status: 409 });
  }

  try {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();
    if (!(await studentExists(studentName, url, serviceRoleKey))) {
      return Response.json({ error: "등록되지 않은 이름입니다." }, { status: 404 });
    }

    const endpoint = new URL("/rest/v1/rpc/record_quiz_solve_attempt", url);
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
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Quiz attempt recording failed", { status: response.status });
      return Response.json(
        { error: "풀이 시간을 저장하지 못했습니다." },
        { status: response.status === 409 ? 409 : 502 },
      );
    }

    const rows: unknown = await response.json();
    const row = Array.isArray(rows) ? (rows[0] as AttemptRow | undefined) : undefined;
    if (row?.id !== id) {
      return Response.json({ error: "풀이 시간 응답이 올바르지 않습니다." }, { status: 502 });
    }

    return Response.json({ attemptId: id });
  } catch {
    return Response.json({ error: "풀이 시간을 저장하지 못했습니다." }, { status: 500 });
  }
}
