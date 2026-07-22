import type { Metadata } from "next";
import { Suspense } from "react";

import { curriculum } from "../mathLogic";
import { getQuizSetForSubunit } from "../shared/curriculumQuizzes";
import PrintWorksheetButton from "./PrintWorksheetButton";
import ReviewWorksheetCard, {
  ReviewWorksheetCardFallback,
} from "./ReviewWorksheetCard";
import WorksheetCurriculumTabs from "./WorksheetCurriculumTabs";
import { AVAILABLE_WORKSHEET_ID, availableWorksheet } from "./worksheetData";
import { QUESTIONS_PER_PRINT_PAGE } from "./worksheetLayout";

export const metadata: Metadata = {
  title: "학습지 · 수학 공간",
  description: "중학교 1학년부터 3학년까지 소단원별 수학 학습지를 확인하고 인쇄합니다.",
};

export const dynamic = "force-dynamic";

const semesterCount = curriculum.reduce((count, grade) => count + grade.semesters.length, 0);
const unitCount = curriculum.reduce(
  (count, grade) =>
    count + grade.semesters.reduce((sum, semester) => sum + semester.units.length, 0),
  0,
);
const subunitCount = curriculum.reduce(
  (count, grade) =>
    count +
    grade.semesters.reduce(
      (semesterTotal, semester) =>
        semesterTotal +
        semester.units.reduce((unitTotal, unit) => unitTotal + unit.subunits.length, 0),
      0,
    ),
  0,
);

const lessonCounts = [
  { category: "중등수학", summer: "18회", total: "54회" },
  { category: "고등수학", summer: "12회", total: "36회" },
  { category: "합계", summer: "30회", total: "90회" },
];

const excludedLessonDates = [
  "9월 24일(목), 추석 연휴: 중등수학 1회",
  "9월 25일(금), 추석: 중등수학·고등수학 각 1회",
  "10월 9일(금), 한글날: 중등수학·고등수학 각 1회",
];

const actionClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 text-sm font-bold text-[var(--control-foreground)] transition hover:-translate-y-0.5 hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)] active:translate-y-0";

const availableQuizCount =
  getQuizSetForSubunit(AVAILABLE_WORKSHEET_ID)?.quizzes.length ?? 0;
const availablePrintPageCount = Math.ceil(
  availableQuizCount / QUESTIONS_PER_PRINT_PAGE,
);

export default function WorksheetsPage() {
  return (
    <main className="worksheet-screen-only min-h-0 flex-1 bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.82fr)] xl:items-center xl:gap-10">
              <div>
                <div className="max-w-3xl">
                  <p className="text-sm font-bold text-[var(--lesson-accent)]">
                    중학교 수학 · PDF 문제지
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    학습지
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
                    중1부터 중3까지의 소단원을 순서대로 확인하고, 제공 중인 문제지를 PDF로
                    열거나 바로 인쇄할 수 있습니다.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
                    3개 학년
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
                    {semesterCount}개 학기
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
                    {unitCount}개 대단원
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
                    {subunitCount}개 소단원
                  </span>
                </div>
              </div>

              <section
                aria-labelledby="lesson-count-heading"
                className="min-w-0 border-t border-[var(--border)] pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8"
              >
                <h2 id="lesson-count-heading" className="sr-only">
                  수업 횟수 안내
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                    <caption className="sr-only">중등수학과 고등수학 수업 횟수</caption>
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--foreground)]">
                        <th scope="col" className="w-[28%] px-1 pb-2 font-black">
                          구분
                        </th>
                        <th scope="col" className="px-1 pb-2 font-black">
                          7/20~8/31
                        </th>
                        <th scope="col" className="px-1 pb-2 font-black">
                          7/20~11/30
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonCounts.map((lesson) => (
                        <tr
                          key={lesson.category}
                          className="border-b border-[var(--border)] last:border-b-0"
                        >
                          <th
                            scope="row"
                            className={`px-1 py-2.5 ${lesson.category === "합계" ? "font-black text-[var(--foreground)]" : "font-medium"}`}
                          >
                            {lesson.category}
                          </th>
                          <td
                            className={`px-1 py-2.5 ${lesson.category === "합계" ? "font-black text-[var(--foreground)]" : "text-[var(--muted)]"}`}
                          >
                            {lesson.summer}
                          </td>
                          <td
                            className={`px-1 py-2.5 ${lesson.category === "합계" ? "font-black text-[var(--foreground)]" : "text-[var(--muted)]"}`}
                          >
                            {lesson.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-xs leading-5 text-[var(--foreground)] sm:text-sm">
                  11월까지 기존 95회에서 다음 5회를 제외했습니다.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-[var(--muted)]">
                  {excludedLessonDates.map((date) => (
                    <li key={date}>{date}</li>
                  ))}
                </ul>
              </section>
            </div>
          </section>

          <Suspense fallback={<ReviewWorksheetCardFallback />}>
            <ReviewWorksheetCard />
          </Suspense>

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <WorksheetCurriculumTabs
              grades={curriculum}
              availableWorksheetId={AVAILABLE_WORKSHEET_ID}
            />

            <aside className="rounded-3xl border border-[var(--control-border-active)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(111,92,130,0.12)] xl:sticky xl:top-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[var(--lesson-accent)]">현재 제공 중</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">
                    {availableWorksheet.title}
                  </h2>
                </div>
                <span className="rounded-full bg-[#8068c5] px-2.5 py-1 text-[10px] font-black text-white">
                  실시간 PDF
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-[var(--muted)]">
                {availableWorksheet.grade} · {availableWorksheet.semester} · {availableWorksheet.unit}
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {availableWorksheet.description}
              </p>

              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <p className="text-xs font-black">구성</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--muted)]">
                  <li>
                    문제 {availableQuizCount}문항 · A4 {availablePrintPageCount}쪽
                  </li>
                  <li>공통 퀴즈 카탈로그와 실시간 연동</li>
                  <li>한글 글꼴 포함 PDF</li>
                </ul>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <a
                  href={availableWorksheet.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={actionClassName}
                >
                  PDF 열기
                </a>
                <a
                  href={`${availableWorksheet.pdfUrl}?download=1`}
                  className={actionClassName}
                >
                  다운로드
                </a>
                <div className="col-span-2 [&>button]:w-full">
                  <PrintWorksheetButton subunitId={AVAILABLE_WORKSHEET_ID} />
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">
                버튼을 누를 때마다 현재 퀴즈 {availableQuizCount}문항으로 새 문제지를
                생성합니다.
              </p>
            </aside>
          </div>
        </div>
    </main>
  );
}
