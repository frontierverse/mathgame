export const MOODS = [
  { score: 0, label: "많이 힘들어요", color: "#a8b8e8" },
  { score: 1, label: "힘들어요", color: "#bfb2df" },
  { score: 2, label: "조금 힘들어요", color: "#b2d8dc" },
  { score: 3, label: "괜찮아요", color: "#b9ddbe" },
  { score: 4, label: "좋아요", color: "#f4d894" },
  { score: 5, label: "아주 좋아요", color: "#f6baad" },
] as const;

export type MoodScore = (typeof MOODS)[number]["score"];
export type CareStatus = "pending" | "scheduled" | "done";
export type LifeStudent = { id: string; name: string };
export type MoodEntry = {
  studentId: string;
  recordedOn: string;
  score: MoodScore;
  wantsTalk: boolean;
  careStatus: CareStatus;
  updatedAt: string;
};
export type LifeSnapshot = {
  role: "admin" | "student";
  today: string;
  students: LifeStudent[];
  entries: MoodEntry[];
  hasRecordedToday?: boolean;
  expiresAt?: number;
};

export function isMoodScore(value: unknown): value is MoodScore {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 5
  );
}

export function koreanDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function recentDates(today: string, days: number) {
  return Array.from({ length: days }, (_, index) =>
    shiftDate(today, index - days + 1),
  );
}

export function studentEntries(entries: MoodEntry[], studentId: string) {
  return entries
    .filter((entry) => entry.studentId === studentId)
    .sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
}

// These are transparent follow-up suggestions, never a diagnosis or a ranking.
export function careReasons(entries: MoodEntry[], today: string): string[] {
  const sorted = [...entries]
    .filter((entry) => entry.recordedOn <= today)
    .sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  const reasons: string[] = [];
  if (sorted.some((entry) => entry.wantsTalk && entry.careStatus !== "done")) {
    reasons.push("대화 요청");
  }
  const latest = sorted.at(-1);
  // Old records remain visible but do not masquerade as a current mood.
  if (
    !latest ||
    latest.recordedOn < shiftDate(today, -1) ||
    latest.careStatus === "done"
  )
    return reasons;
  if (latest.score <= 1) reasons.push("최근 0~1점");
  const lastThree = sorted.slice(-3);
  if (
    lastThree.length === 3 &&
    lastThree.every(
      (entry, index) =>
        entry.score <= 2 &&
        entry.recordedOn === shiftDate(latest.recordedOn, index - 2),
    )
  ) {
    reasons.push("3일 연속 2점 이하");
  }
  const previous = sorted.at(-2);
  if (
    previous &&
    previous.recordedOn >= shiftDate(latest.recordedOn, -7) &&
    previous.score - latest.score >= 2
  )
    reasons.push("이전 기록보다 2점 이상 하락");
  return reasons;
}

export function isMoodEntry(value: unknown): value is MoodEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<MoodEntry>;
  return (
    typeof entry.studentId === "string" &&
    typeof entry.recordedOn === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.recordedOn) &&
    isMoodScore(entry.score) &&
    typeof entry.wantsTalk === "boolean" &&
    ["pending", "scheduled", "done"].includes(entry.careStatus ?? "") &&
    typeof entry.updatedAt === "string"
  );
}
