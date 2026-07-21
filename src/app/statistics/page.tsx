import type { Metadata } from "next";
import Link from "next/link";

import {
  getQuizSolveAttempts,
  type QuizSolveAttempt,
} from "../data/quizAttempts";
import QuizQuestionText from "../progress/QuizQuestionText";
import {
  getQuizForIndex,
  getQuizRoundById,
} from "../shared/curriculumQuizzes";
import AttemptSyncStatus from "./AttemptSyncStatus";
import StudentSolveTimeChart from "./StudentSolveTimeChart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "통계 · 수학 공간",
  description: "학생별 퀴즈 풀이 시간과 결과를 확인합니다.",
};

const ATTEMPTS_PER_PAGE = 10;

type StatisticsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function displayName(name: string) {
  return name.slice(1).trim() || name;
}

function formatDuration(durationMs: number) {
  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1).replace(/\.0$/, "")}초`;
  }

  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  if (seconds === 60) return `${minutes + 1}분`;
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
}

function formatAnsweredAt(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateTimeFormatter.format(date) : "-";
}

function averageDuration(attempts: readonly QuizSolveAttempt[]) {
  if (attempts.length === 0) return 0;
  return Math.round(
    attempts.reduce((sum, attempt) => sum + attempt.durationMs, 0) /
      attempts.length,
  );
}

function roundLabel(roundId: string) {
  const round = getQuizRoundById(roundId);
  return round ? `ROUND ${round.roundNumber}` : roundId.toUpperCase();
}

function readPageNumber(value: string | string[] | undefined) {
  const pageValue = Array.isArray(value) ? value[0] : value;
  const page = Number(pageValue);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function statisticsPageHref(page: number) {
  return `/statistics?page=${page}#attempt-list-heading`;
}

export default async function StatisticsPage({
  searchParams,
}: StatisticsPageProps) {
  const requestedPage = readPageNumber((await searchParams).page);
  let attempts: QuizSolveAttempt[] = [];
  let errorMessage: string | null = null;

  try {
    attempts = await getQuizSolveAttempts();
  } catch {
    errorMessage = "통계를 불러오지 못했습니다.";
  }

  const attemptsByStudent = new Map<string, QuizSolveAttempt[]>();
  attempts.forEach((attempt) => {
    const studentAttempts = attemptsByStudent.get(attempt.studentName) ?? [];
    studentAttempts.push(attempt);
    attemptsByStudent.set(attempt.studentName, studentAttempts);
  });
  const studentSummaries = Array.from(attemptsByStudent, ([studentName, rows]) => ({
    studentName,
    attempts: rows,
    correctCount: rows.filter(({ outcome }) => outcome === "yar").length,
    averageDurationMs: averageDuration(rows),
  })).sort((a, b) =>
    displayName(a.studentName).localeCompare(displayName(b.studentName), "ko"),
  );
  const correctCount = attempts.filter(({ outcome }) => outcome === "yar").length;
  const correctPercent =
    attempts.length === 0 ? 0 : Math.round((correctCount / attempts.length) * 100);
  const totalPages = Math.max(1, Math.ceil(attempts.length / ATTEMPTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const attemptStartIndex = (currentPage - 1) * ATTEMPTS_PER_PAGE;
  const visibleAttempts = attempts.slice(
    attemptStartIndex,
    attemptStartIndex + ATTEMPTS_PER_PAGE,
  );

  return (
    <main className="min-h-0 flex-1 bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
          <p className="text-xs font-black tracking-[0.16em] text-[var(--lesson-accent)]">
            QUIZ TIME
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">통계</h1>
          <AttemptSyncStatus />

          {errorMessage ? (
            <p className="mt-6 rounded-2xl border border-[#efbcc2] bg-[#fdedef] px-4 py-3 text-sm font-bold text-[#a5384a]">
              {errorMessage}
            </p>
          ) : attempts.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] px-4 py-10 text-center text-sm font-bold text-[var(--muted)]">
              아직 기록 없음
            </p>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="풀이" value={`${attempts.length}회`} />
                <StatCard label="학생" value={`${studentSummaries.length}명`} />
                <StatCard label="정답" value={`${correctPercent}%`} />
                <StatCard label="평균" value={formatDuration(averageDuration(attempts))} />
              </div>

              <section className="mt-8" aria-labelledby="student-summary-heading">
                <h2 id="student-summary-heading" className="text-lg font-black">
                  학생별
                </h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border)]">
                  <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                    <thead className="bg-[var(--surface-raised)] text-xs text-[var(--muted)]">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-black">학생</th>
                        <th scope="col" className="px-4 py-3 font-black">풀이</th>
                        <th scope="col" className="px-4 py-3 font-black">정답</th>
                        <th scope="col" className="px-4 py-3 font-black">평균</th>
                        <th scope="col" className="px-4 py-3 font-black">최근</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSummaries.map((summary) => (
                        <tr
                          key={summary.studentName}
                          className="border-t border-[var(--border)]"
                        >
                          <th scope="row" className="px-4 py-3 font-black">
                            {displayName(summary.studentName)}
                          </th>
                          <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                            {summary.attempts.length}회
                          </td>
                          <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                            {summary.correctCount}/{summary.attempts.length}
                          </td>
                          <td className="px-4 py-3 font-black tabular-nums">
                            {formatDuration(summary.averageDurationMs)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                            {formatAnsweredAt(summary.attempts[0]?.answeredAt ?? "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <StudentSolveTimeChart attempts={attempts} />

              <section className="mt-8" aria-labelledby="attempt-list-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="attempt-list-heading" className="text-lg font-black">
                    풀이 기록
                  </h2>
                  <span className="text-xs font-bold tabular-nums text-[var(--muted)]">
                    {attemptStartIndex + 1}–
                    {Math.min(attemptStartIndex + visibleAttempts.length, attempts.length)} / {attempts.length}
                  </span>
                </div>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border)]">
                  <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                    <thead className="bg-[var(--surface-raised)] text-xs text-[var(--muted)]">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-black">학생</th>
                        <th scope="col" className="px-4 py-3 font-black">퀴즈</th>
                        <th scope="col" className="px-4 py-3 font-black">문제</th>
                        <th scope="col" className="px-4 py-3 font-black">결과</th>
                        <th scope="col" className="px-4 py-3 font-black">시간</th>
                        <th scope="col" className="px-4 py-3 font-black">시각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAttempts.map((attempt) => {
                        const currentQuiz = getQuizForIndex(attempt.quizIndex);
                        const quiz =
                          currentQuiz?.id === attempt.quizId ? currentQuiz : null;
                        const correct = attempt.outcome === "yar";
                        return (
                          <tr key={attempt.id} className="border-t border-[var(--border)] align-top">
                            <th scope="row" className="whitespace-nowrap px-4 py-3 font-black">
                              {displayName(attempt.studentName)}
                            </th>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className="block font-black tabular-nums">
                                {attempt.quizIndex + 1}번
                              </span>
                              <span className="mt-0.5 block text-[11px] font-bold text-[var(--muted)]">
                                {roundLabel(attempt.roundId)}
                              </span>
                            </td>
                            <td className="max-w-xl px-4 py-3">
                              <QuizQuestionText
                                text={attempt.questionText}
                                className="font-bold leading-6"
                              />
                              {quiz ? (
                                <span className="mt-1 block text-[11px] font-bold text-[var(--muted)]">
                                  {quiz.subunitTitle}
                                </span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`quiz-result-badge inline-flex min-w-[4.5rem] justify-center rounded-full border px-3 py-1.5 text-sm font-black ${
                                  correct
                                    ? "quiz-result-yar"
                                    : "quiz-result-shagal"
                                }`}
                              >
                                {correct ? "✓ 야르" : "× 샤갈"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-black tabular-nums">
                              {formatDuration(attempt.durationMs)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--muted)]">
                              {formatAnsweredAt(attempt.answeredAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 ? (
                  <nav
                    aria-label="풀이 기록 페이지"
                    className="mt-4 flex items-center justify-center gap-3"
                  >
                    {currentPage > 1 ? (
                      <Link
                        href={statisticsPageHref(currentPage - 1)}
                        prefetch={false}
                        aria-label="이전 풀이 기록 페이지"
                        className="inline-flex min-h-10 items-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 text-sm font-black text-[var(--control-foreground)] transition hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)]"
                      >
                        이전
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-black text-[var(--muted)] opacity-50"
                      >
                        이전
                      </span>
                    )}
                    <span
                      aria-current="page"
                      className="min-w-16 text-center text-sm font-black tabular-nums"
                    >
                      {currentPage} / {totalPages}
                    </span>
                    {currentPage < totalPages ? (
                      <Link
                        href={statisticsPageHref(currentPage + 1)}
                        prefetch={false}
                        aria-label="다음 풀이 기록 페이지"
                        className="inline-flex min-h-10 items-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 text-sm font-black text-[var(--control-foreground)] transition hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)]"
                      >
                        다음
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-black text-[var(--muted)] opacity-50"
                      >
                        다음
                      </span>
                    )}
                  </nav>
                ) : null}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4">
      <p className="text-xs font-black text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}
