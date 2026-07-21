import type { Metadata } from "next";
import Link from "next/link";

import type { QuizSolveAttempt } from "../data/quizAttempts";
import type { QuizProgressEntry } from "../data/quizProgress";
import { getQuizStatisticsSnapshot } from "../data/quizStatisticsSnapshot";
import QuizQuestionText from "../progress/QuizQuestionText";
import {
  getQuizForIndex,
  getQuizRoundById,
} from "../shared/curriculumQuizzes";
import AttemptSyncStatus from "./AttemptSyncStatus";
import {
  buildQuizStatisticsRecords,
  type QuizStatisticsRecord,
} from "./quizStatistics";
import StudentSolveTimeChart from "./StudentSolveTimeChart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "통계 · 수학 공간",
  description: "학생별 퀴즈 풀이 시간과 결과를 확인합니다.",
};

const RECORDS_PER_PAGE = 10;

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

function averageDuration(records: readonly QuizStatisticsRecord[]) {
  if (records.length === 0) return 0;
  return Math.round(
    records.reduce((sum, record) => sum + record.durationMs, 0) /
      records.length,
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
  let progressEntries: QuizProgressEntry[] = [];
  let errorMessage: string | null = null;

  try {
    const snapshot = await getQuizStatisticsSnapshot();
    attempts = snapshot.attempts;
    progressEntries = snapshot.progressEntries;
  } catch {
    errorMessage = "통계를 불러오지 못했습니다.";
  }

  const records = buildQuizStatisticsRecords(attempts, progressEntries);
  const recordsByStudent = new Map<string, QuizStatisticsRecord[]>();
  records.forEach((record) => {
    const studentRecords = recordsByStudent.get(record.studentName) ?? [];
    studentRecords.push(record);
    recordsByStudent.set(record.studentName, studentRecords);
  });

  const studentSummaries = Array.from(
    recordsByStudent,
    ([studentName, rows]) => {
      const measuredRecords = rows.filter(
        ({ timingSource }) => timingSource === "measured",
      );
      return {
        studentName,
        records: rows,
        measuredCount: measuredRecords.length,
        legacyCount: rows.length - measuredRecords.length,
        correctCount: measuredRecords.filter(({ outcome }) => outcome === "yar")
          .length,
        averageDurationMs: averageDuration(rows),
        latestAnsweredAt:
          measuredRecords.find(({ answeredAt }) => answeredAt !== null)
            ?.answeredAt ?? null,
      };
    },
  ).sort((a, b) =>
    displayName(a.studentName).localeCompare(displayName(b.studentName), "ko"),
  );
  const measuredRecords = records.filter(
    ({ timingSource }) => timingSource === "measured",
  );
  const legacyCount = records.length - measuredRecords.length;
  const correctCount = measuredRecords.filter(({ outcome }) => outcome === "yar").length;
  const correctPercent =
    measuredRecords.length === 0
      ? null
      : Math.round((correctCount / measuredRecords.length) * 100);
  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const recordStartIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const visibleRecords = records.slice(
    recordStartIndex,
    recordStartIndex + RECORDS_PER_PAGE,
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
          ) : records.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] px-4 py-10 text-center text-sm font-bold text-[var(--muted)]">
              아직 기록 없음
            </p>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard
                  label="풀이"
                  value={`${records.length}회`}
                  note={`측정 ${measuredRecords.length} · 미측정 ${legacyCount}`}
                />
                <StatCard label="학생" value={`${studentSummaries.length}명`} />
                <StatCard
                  label="정답(측정)"
                  value={correctPercent === null ? "—" : `${correctPercent}%`}
                  note={`${correctCount}/${measuredRecords.length}`}
                />
                <StatCard
                  label="평균"
                  value={formatDuration(averageDuration(records))}
                  note={legacyCount > 0 ? "미측정 0초 포함" : "측정"}
                />
              </div>

              <section className="mt-8" aria-labelledby="student-summary-heading">
                <h2 id="student-summary-heading" className="text-lg font-black">
                  학생별
                </h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border)]">
                  <table className="w-full min-w-[660px] border-collapse text-left text-sm">
                    <thead className="bg-[var(--surface-raised)] text-xs text-[var(--muted)]">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-black">학생</th>
                        <th scope="col" className="px-4 py-3 font-black">풀이</th>
                        <th scope="col" className="px-4 py-3 font-black">정답(측정)</th>
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
                            <span className="block">{summary.records.length}회</span>
                            {summary.legacyCount > 0 ? (
                              <span className="mt-0.5 block text-[11px] font-bold">
                                미측정 {summary.legacyCount}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                            {summary.measuredCount > 0
                              ? `${summary.correctCount}/${summary.measuredCount}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 font-black tabular-nums">
                            {formatDuration(summary.averageDurationMs)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-[var(--muted)]">
                            {formatAnsweredAt(summary.latestAnsweredAt ?? "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <StudentSolveTimeChart records={records} />

              <section className="mt-8" aria-labelledby="attempt-list-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="attempt-list-heading" className="text-lg font-black">
                    풀이 기록
                  </h2>
                  <span className="text-xs font-bold tabular-nums text-[var(--muted)]">
                    {recordStartIndex + 1}–
                    {Math.min(recordStartIndex + visibleRecords.length, records.length)} / {records.length}
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
                      {visibleRecords.map((record) => {
                        const attempt = record.attempt;
                        const currentQuiz = getQuizForIndex(record.quizIndex);
                        const quiz =
                          !attempt || currentQuiz?.id === attempt.quizId
                            ? currentQuiz
                            : null;
                        const legacy = record.timingSource === "legacy";
                        const correct = record.outcome === "yar";
                        return (
                          <tr key={record.id} className="border-t border-[var(--border)] align-top">
                            <th scope="row" className="whitespace-nowrap px-4 py-3 font-black">
                              {displayName(record.studentName)}
                            </th>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className="block font-black tabular-nums">
                                {record.quizIndex + 1}번
                              </span>
                              <span className="mt-0.5 block text-[11px] font-bold text-[var(--muted)]">
                                {attempt
                                  ? roundLabel(attempt.roundId)
                                  : quiz?.subunitTitle ?? "미측정"}
                              </span>
                            </td>
                            <td className="max-w-xl px-4 py-3">
                              {attempt ? (
                                <QuizQuestionText
                                  text={attempt.questionText}
                                  className="font-bold leading-6"
                                />
                              ) : (
                                <span className="font-bold text-[var(--muted)]">
                                  미측정
                                </span>
                              )}
                              {attempt && quiz ? (
                                <span className="mt-1 block text-[11px] font-bold text-[var(--muted)]">
                                  {quiz.subunitTitle}
                                </span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={
                                  legacy
                                    ? "inline-flex min-w-[4.5rem] justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm font-black text-[var(--muted)]"
                                    : `quiz-result-badge inline-flex min-w-[4.5rem] justify-center rounded-full border px-3 py-1.5 text-sm font-black ${
                                        correct
                                          ? "quiz-result-yar"
                                          : "quiz-result-shagal"
                                      }`
                                }
                              >
                                {legacy ? "— 미기록" : correct ? "✓ 야르" : "× 샤갈"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-black tabular-nums">
                              <span className="block">{formatDuration(record.durationMs)}</span>
                              {legacy ? (
                                <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                                  미측정
                                </span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--muted)]">
                              {formatAnsweredAt(record.answeredAt ?? "")}
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

function StatCard({
  label,
  note,
  value,
}: {
  label: string;
  note?: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4">
      <p className="text-xs font-black text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums">{value}</p>
      {note ? (
        <p className="mt-1 text-[11px] font-bold tabular-nums text-[var(--muted)]">
          {note}
        </p>
      ) : null}
    </div>
  );
}
