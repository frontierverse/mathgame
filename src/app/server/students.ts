import "server-only";
import { cache } from "react";
import { databaseRows } from "./database";
import type { Student } from "../studentProgress";

function dateValue(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

export const getStudents = cache(async (): Promise<Student[]> => {
  const [rows, hiddenRows] = await Promise.all([
    databaseRows("Youth", { select: "id,name,admissionDate,dischargeDate", order: "age.desc.nullslast,birthDate.asc.nullslast,id.asc", purgedAt: "is.null", purgeStartedAt: "is.null", caseClosedDate: "is.null" }),
    databaseRows("StudentLifeHiddenYouth", { select: "studentId", order: "studentId.asc" }),
  ]);
  const hidden = new Set(hiddenRows.map(row => row.studentId));
  return rows.flatMap(row => typeof row.id === "string" && typeof row.name === "string" && row.name.trim() && !hidden.has(row.id)
    ? [{ id: row.id, name: row.name.trim(), admissionDate: dateValue(row.admissionDate), payoutDate: dateValue(row.dischargeDate) }] : [])
    .map((student, index) => ({ ...student, avatar: String(index + 1), color: index % 4 + 1 }));
});
