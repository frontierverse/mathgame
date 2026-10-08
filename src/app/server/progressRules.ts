import { concept, practiceQuestions, testQuestions } from "../curriculum";
import { hasLesson, type ProgressAction, type StudentProgress } from "../studentProgress";

export class ProgressRuleError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function parseStudentProgressRequest(value: unknown, studentId: string) {
  const body = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  if (body?.studentId !== studentId) throw new ProgressRuleError("학생이 바뀌었습니다. 다시 선택해 주세요.", 409);
  return parseProgressAction(body.action);
}

export function parseProgressAction(value: unknown): ProgressAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProgressRuleError("잘못된 학습 요청입니다.");
  const action = value as Record<string, unknown>;
  if (action.type === "coupon") return { type: "coupon" };
  if (action.type === "reflection" && typeof action.value === "string" && action.value.length <= 300) return { type: "reflection", value: action.value };
  if ((action.type === "practice" || action.type === "test") && typeof action.index === "number" && Number.isInteger(action.index) && typeof action.answer === "string") {
    const questions = action.type === "practice" ? practiceQuestions : testQuestions;
    if (!questions[action.index]?.choices.some(choice => choice.id === action.answer)) throw new ProgressRuleError("답을 확인해 주세요.");
    if (action.type === "test") return { type: "test", index: action.index, answer: action.answer };
    if (typeof action.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(action.date) && hasLesson(action.date)) return { type: "practice", index: action.index, answer: action.answer, date: action.date };
  }
  throw new ProgressRuleError("잘못된 학습 요청입니다.");
}

export function applyProgressAction(current: StudentProgress, action: ProgressAction, today: string): { progress: StudentProgress; correct?: boolean } {
  if (action.type === "practice") {
    if (action.index > current.stars) throw new ProgressRuleError("앞 문제부터 풀어 주세요.", 409);
    const correct = action.answer === practiceQuestions[action.index].answer;
    if (!correct || action.index < current.stars) return { progress: current, correct };
    const stars = current.stars + 1;
    return { correct, progress: { ...current, stars, practiceDate: action.date, completedDays: stars === concept.practiceCount ? [...new Set([...current.completedDays, action.date])].sort() : current.completedDays } };
  }
  if (current.stars !== concept.practiceCount) throw new ProgressRuleError("연습 6문제 완료 후 열립니다.", 409);
  if (action.type === "coupon") return { progress: current.couponClaimed ? current : { ...current, couponClaimed: true } };
  if (action.type === "reflection") return { progress: action.value === current.reflection ? current : { ...current, reflection: action.value } };
  const saved = current.testAnswers[action.index];
  if (saved !== null) {
    if (saved !== action.answer) throw new ProgressRuleError("제출한 답은 변경할 수 없습니다.", 409);
    return { progress: current };
  }
  if (action.index !== current.testAnswers.findIndex(answer => answer === null)) throw new ProgressRuleError("앞 문제부터 제출해 주세요.", 409);
  return { progress: { ...current, testAnswers: current.testAnswers.map((answer, index) => index === action.index ? action.answer : answer), testDate: today } };
}

export function isStudentProgress(value: unknown): value is StudentProgress {
  if (!value || typeof value !== "object") return false;
  const row = value as StudentProgress;
  const validDate = (date: unknown) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  return Number.isInteger(row.stars) && row.stars >= 0 && row.stars <= 6 && typeof row.couponClaimed === "boolean" && (!row.couponClaimed || row.stars === 6) && typeof row.reflection === "string" && row.reflection.length <= 300 &&
    Array.isArray(row.testAnswers) && row.testAnswers.length === 3 && row.testAnswers.every((answer, index) => answer === null || (row.stars === 6 && testQuestions[index].choices.some(choice => choice.id === answer) && row.testAnswers.slice(0, index).every(previous => previous !== null))) &&
    Array.isArray(row.completedDays) && row.completedDays.every(validDate) && new Set(row.completedDays).size === row.completedDays.length &&
    (row.practiceDate === null || validDate(row.practiceDate)) && (row.testDate === null || validDate(row.testDate));
}
