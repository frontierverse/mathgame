import {
  koreanDate,
  shiftDate,
  type LifeSnapshot,
  type MoodEntry,
  type MoodScore,
} from "./mood";

export function createLifeDemo(): LifeSnapshot {
  const today = koreanDate();
  const students = [
    { id: "demo-1", name: "구름" },
    { id: "demo-2", name: "나무" },
    { id: "demo-3", name: "바다" },
    { id: "demo-4", name: "별이" },
  ];
  const scores: MoodScore[][] = [
    [3, 4, 3, 2, 3, 4],
    [4, 3, 4, 3, 2, 1, 1],
    [2, 2, 3, 3, 4, 4, 5],
    [3, 3, 2, 3, 3],
  ];
  const entries: MoodEntry[] = students.flatMap((student, index) =>
    scores[index].map((score, day) => ({
      studentId: student.id,
      recordedOn: shiftDate(today, day - 6),
      score,
      wantsTalk: index === 1 && day === 6,
      careStatus: "pending",
      updatedAt: new Date().toISOString(),
    })),
  );
  return { role: "admin", today, students, entries };
}
