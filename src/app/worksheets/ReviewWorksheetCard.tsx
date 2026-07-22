import { getQuizShagalReviewSummaries } from "../data/quizShagalReviews";
import { getStudents } from "../data/students";
import ReviewWorksheetPicker from "./ReviewWorksheetPicker";

function displayName(name: string) {
  return name.slice(1).trim() || name;
}

export function ReviewWorksheetCardFallback() {
  return (
    <section
      aria-label="학생별 샤갈 복습지 준비 중"
      className="mt-5 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
    >
      <div className="h-4 w-20 rounded bg-[var(--surface-raised)]" />
      <div className="mt-3 h-7 w-36 rounded bg-[var(--surface-raised)]" />
      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="h-11 rounded-xl bg-[var(--surface-raised)]" />
        <div className="h-11 w-24 rounded-xl bg-[var(--surface-raised)]" />
      </div>
    </section>
  );
}

function ReviewWorksheetError() {
  return (
    <section className="mt-5 rounded-3xl border border-[#efd0d5] bg-[var(--surface)] p-5 sm:p-6">
      <p className="text-xs font-black text-[#9e5260]">맞춤 복습지</p>
      <p className="mt-2 text-sm font-bold text-[#9e5260]">복습 기록 오류</p>
    </section>
  );
}

export default async function ReviewWorksheetCard() {
  let students: Awaited<ReturnType<typeof getStudents>>;
  let summaries: Awaited<ReturnType<typeof getQuizShagalReviewSummaries>>;

  try {
    [students, summaries] = await Promise.all([
      getStudents(),
      getQuizShagalReviewSummaries(),
    ]);
  } catch {
    return <ReviewWorksheetError />;
  }

  const countByStudent = new Map(
    summaries.map(({ studentName, questionCount }) => [studentName, questionCount]),
  );
  const selectableStudents = students
    .map((student) => ({
      studentName: student.name,
      displayName: displayName(student.name),
      questionCount: countByStudent.get(student.name) ?? 0,
    }))
    .sort(
      (left, right) =>
        Number(right.questionCount > 0) - Number(left.questionCount > 0),
    );
  const readyStudentCount = selectableStudents.filter(
    ({ questionCount }) => questionCount > 0,
  ).length;

  return (
    <section
      aria-labelledby="review-worksheet-heading"
      className="mt-5 rounded-3xl border border-[var(--control-border-active)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(111,92,130,0.1)] sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[var(--lesson-accent)]">샤갈 복습</p>
          <h2
            id="review-worksheet-heading"
            className="mt-1 text-xl font-black tracking-[-0.03em]"
          >
            맞춤 복습지
          </h2>
        </div>
        <span className="rounded-full bg-[var(--control-background-active)] px-3 py-1.5 text-xs font-black text-[var(--control-foreground)]">
          {readyStudentCount}명
        </span>
      </div>

      <ReviewWorksheetPicker students={selectableStudents} />
    </section>
  );
}
