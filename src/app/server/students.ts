import "server-only";
import { cache } from "react";
import { openYouthText, readYouthDataKeys } from "./youthEncryptionCore";
import { databaseRows } from "./database";
import type { Student } from "../studentProgress";

function dateValue(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

export const getStudents = cache(async (): Promise<Student[]> => {
  const [rows, hiddenRows] = await Promise.all([
    databaseRows("Youth", { select: "id,name,admissionDate,dischargeDate,age,ageEncrypted,birthDate", order: "id.asc", purgedAt: "is.null", purgeStartedAt: "is.null", caseClosedDate: "is.null" }),
    databaseRows("StudentLifeHiddenYouth", { select: "studentId", order: "studentId.asc" }),
  ]);
  const hidden = new Set(hiddenRows.map(row => row.studentId));
  const keys = readYouthDataKeys();
  const plain = rows.map(row => {
    const decoded = { ...row };
    for (const field of ["name", "admissionDate", "dischargeDate", "birthDate"]) if (typeof decoded[field] === "string") decoded[field] = openYouthText(decoded[field], `Youth.${field}`, keys);
    if (typeof row.ageEncrypted === "string") {
      const age = openYouthText(row.ageEncrypted, "Youth.age", keys);
      if (!/^-?\d+$/.test(age) || !Number.isSafeInteger(Number(age))) throw new Error("Invalid protected age");
      decoded.age = Number(age);
    } else if (keys && !keys.migrating && row.age != null) throw new Error("Unprotected age");
    return decoded;
  });
  plain.sort((a, b) => {
    if (a.age !== b.age) {
      if (a.age == null) return 1;
      if (b.age == null) return -1;
      return Number(b.age) - Number(a.age);
    }
    const birthA = dateValue(a.birthDate), birthB = dateValue(b.birthDate);
    return birthA === birthB ? String(a.id).localeCompare(String(b.id)) : birthA === null ? 1 : birthB === null ? -1 : birthA.localeCompare(birthB);
  });
  return plain.flatMap(row => typeof row.id === "string" && typeof row.name === "string" && row.name.trim() && !hidden.has(row.id)
    ? [{ id: row.id, name: row.name.trim(), admissionDate: dateValue(row.admissionDate), payoutDate: dateValue(row.dischargeDate) }] : [])
    .map((student, index) => ({ ...student, avatar: String(index + 1), color: index % 4 + 1 }));
});
