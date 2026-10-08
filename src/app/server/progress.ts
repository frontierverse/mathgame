import "server-only";
import { emptyStudentProgress, type ProgressAction, type StudentProgress } from "../studentProgress";
import { databaseRequest, DataError } from "./database";
import { applyProgressAction, isStudentProgress, ProgressRuleError } from "./progressRules";

type ProgressRow = { progress: StudentProgress; version: number };

async function readProgressRow(studentId: string): Promise<ProgressRow | null> {
  const rows = await databaseRequest("MathLearningProgress", { select: "progress,version", studentId: `eq.${studentId}`, limit: "1" });
  if (!Array.isArray(rows)) throw new DataError("학습 기록을 확인하지 못했습니다.");
  if (rows.length === 0) return null;
  const row = rows[0];
  if (!isStudentProgress(row.progress) || !Number.isSafeInteger(row.version) || row.version < 0) throw new DataError("학습 기록을 확인하지 못했습니다.");
  return row;
}

export async function getProgress(studentId: string) { return (await readProgressRow(studentId))?.progress ?? emptyStudentProgress(); }

export async function saveProgressAction(studentId: string, action: ProgressAction, today: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await readProgressRow(studentId);
    const result = applyProgressAction(row?.progress ?? emptyStudentProgress(), action, today);
    if (result.progress === row?.progress || (action.type === "practice" && !result.correct)) return result;
    if (!row) {
      const inserted = await databaseRequest("MathLearningProgress", { on_conflict: "studentId", select: "progress,version" }, {
        method: "POST", prefer: "resolution=ignore-duplicates,return=representation", body: { studentId, progress: result.progress, version: 1 },
      });
      if (Array.isArray(inserted) && inserted.length === 1 && isStudentProgress(inserted[0].progress)) return { ...result, progress: inserted[0].progress };
    } else {
      const updated = await databaseRequest("MathLearningProgress", { studentId: `eq.${studentId}`, version: `eq.${row.version}`, select: "progress,version" }, {
        method: "PATCH", prefer: "return=representation", body: { progress: result.progress, version: row.version + 1, updatedAt: new Date().toISOString() },
      });
      if (Array.isArray(updated) && updated.length === 1 && isStudentProgress(updated[0].progress)) return { ...result, progress: updated[0].progress };
    }
  }
  throw new ProgressRuleError("다른 화면에서 기록이 바뀌었습니다. 다시 시도해 주세요.", 409);
}
