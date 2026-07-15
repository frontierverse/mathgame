import Link from "next/link";
import { getStudentNames } from "../data/students";
import MineralEvolutionLegend from "./MineralEvolutionLegend";
import StudentRoster from "./StudentRoster";

export const dynamic = "force-dynamic";

const HIDDEN_STUDENT_NAMES = new Set(["하늘", "지민"]);

export default async function ProgressPage() {
  let students: string[] = [];
  let errorMessage: string | null = null;

  try {
    students = (await getStudentNames()).filter((name) => {
      const displayName = name.slice(1).trim();
      return !HIDDEN_STUDENT_NAMES.has(name) && !HIDDEN_STUDENT_NAMES.has(displayName);
    });
  } catch {
    errorMessage = "학생 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  return (
    <main className="min-h-screen bg-[#fbf4e7] px-4 py-4 text-[#443b50] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px]">
        <header className="flex items-center justify-between border-b border-[#e7dccb] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#9edce3] text-lg font-black text-[#3f4358] shadow-[0_8px_22px_rgba(100,175,185,0.22)]">
              ∑
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#8f78ff]" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-[-0.03em]">수학 공간</p>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#95899a]">
                움직이는 수학 연구소
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#cfc1e5] bg-[#f8f4ff] px-3.5 py-2.5 text-sm font-bold text-[#68578b] shadow-[0_4px_12px_rgba(111,92,130,0.1)] transition hover:-translate-y-0.5 hover:border-[#a795d8] hover:bg-[#f1ecfb] active:translate-y-0"
          >
            ← 학습으로 돌아가기
          </Link>
        </header>

        <section className="mt-8 rounded-3xl border border-[#e7dccb] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="shrink-0 text-3xl font-bold">
              학생 진도 체크하기
            </h1>
            <MineralEvolutionLegend />
          </div>

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
              <p className="text-sm font-bold text-[#665c6f]">등록된 학생이 아직 없어요.</p>
            </div>
          ) : (
            <StudentRoster students={students} />
          )}
        </section>
      </div>
    </main>
  );
}
