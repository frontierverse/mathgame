import Link from "next/link";
import { getStudents } from "../data/students";
import MineralEvolutionLegend from "./MineralEvolutionLegend";
import StudentRoster from "./StudentRoster";

export const dynamic = "force-dynamic";

const HIDDEN_STUDENT_NAMES = ["하늘", "지민", "예담"] as const;

export default async function ProgressPage() {
  let students: { name: string; age: number | null }[] = [];
  let errorMessage: string | null = null;

  try {
    students = await getStudents();
  } catch {
    errorMessage = "명단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  const showStaticHeading = errorMessage !== null || students.length === 0;

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-[var(--background)] px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="mt-4 rounded-3xl border border-[#e7dccb] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
          {showStaticHeading ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h1 className="shrink-0 text-3xl font-bold">진도 체크하기</h1>
              <MineralEvolutionLegend />
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-8 rounded-2xl border border-[#efd0d5] bg-[#fff4f5] p-5">
              <p className="text-sm font-bold text-[#9e5260]">{errorMessage}</p>
              <Link
                href="/progress"
                className="mt-4 inline-flex rounded-xl bg-[#9b84d9] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#8a72cb]"
              >
                다시 시도
              </Link>
            </div>
          ) : students.length === 0 ? (
            <div className="mt-8 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#ddd1c1] bg-[#fffefa] text-center">
              <p className="text-sm font-bold text-[#665c6f]">등록된 이름이 아직 없어요.</p>
            </div>
          ) : (
            <StudentRoster
              students={students}
              hiddenStudentNames={HIDDEN_STUDENT_NAMES}
            />
          )}
        </section>
      </div>
    </main>
  );
}
