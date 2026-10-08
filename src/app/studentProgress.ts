import { testQuestions } from "./curriculum";

export const students = [
  { id: 1, name: "학생 1", payoutDate: "2027-03-29" },
  { id: 2, name: "학생 2", payoutDate: "2027-02-26" },
  { id: 3, name: "학생 3", payoutDate: "2027-03-29" },
  { id: 4, name: "학생 4", payoutDate: "2027-01-29" },
] as const;

export type Student = typeof students[number];
export type StudentProgress = {
  stars: number;
  couponClaimed: boolean;
  testAnswers: readonly (string | null)[];
  reflection: string;
  completedDays: readonly string[];
  practiceDate: string | null;
  testDate: string | null;
};

export function createStudentProgress(): Record<number, StudentProgress> {
  return Object.fromEntries(students.map(student => [student.id, {
    stars: student.id === 1 || student.id === 4 ? 6 : student.id === 2 ? 3 : 0,
    couponClaimed: student.id === 1,
    testAnswers: testQuestions.map(question => student.id === 1 ? question.answer : null),
    reflection: "",
    completedDays: student.id === 1
      ? ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07"]
      : student.id === 2 ? ["2026-09-29", "2026-09-30", "2026-10-02", "2026-10-06"]
      : student.id === 4 ? ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07"] : [],
    practiceDate: student.id === 3 ? null : "2026-10-07",
    testDate: student.id === 1 ? "2026-10-07" : null,
  }]));
}

export function hasLesson(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return date >= "2026-09-29" && date <= "2026-10-16" && day > 0 && day < 6;
}

export function learningStatus(date: string, today: string, completed: readonly string[]) {
  if (completed.includes(date)) return "completed";
  if (!hasLesson(date)) return null;
  return date < today ? "missed" : "planned";
}

export function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
}

export function calendarDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const offset = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day < 1 || day > count ? null : `${month}-${String(day).padStart(2, "0")}`;
  });
}

export function weekDates(today: string) {
  const current = new Date(`${today}T00:00:00Z`);
  const monday = current.getUTCDate() - (current.getUTCDay() + 6) % 7;
  return Array.from({ length: 5 }, (_, index) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), monday + index)).toISOString().slice(0, 10));
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", weekday: "short" })
    .format(new Date(`${date}T12:00:00+09:00`)).replace(/\s/g, "").replace(".(", " (");
}

export function compactDate(date: string) {
  return date.split("-").map(Number).join(".");
}
