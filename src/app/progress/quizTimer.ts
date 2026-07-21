export const DEFAULT_QUIZ_TIME_LIMIT_SECONDS = 25;
export const MIN_QUIZ_TIME_LIMIT_SECONDS = 5;
export const MAX_QUIZ_TIME_LIMIT_SECONDS = 300;
export const QUIZ_TIME_LIMIT_STORAGE_KEY =
  "math-space-quiz-time-limit-seconds-v1";

export function normalizeQuizTimeLimitSeconds(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) return DEFAULT_QUIZ_TIME_LIMIT_SECONDS;

  return Math.min(
    MAX_QUIZ_TIME_LIMIT_SECONDS,
    Math.max(MIN_QUIZ_TIME_LIMIT_SECONDS, Math.round(parsed)),
  );
}

export function readStoredQuizTimeLimitSeconds() {
  if (typeof window === "undefined") return DEFAULT_QUIZ_TIME_LIMIT_SECONDS;

  try {
    return normalizeQuizTimeLimitSeconds(
      window.localStorage.getItem(QUIZ_TIME_LIMIT_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_QUIZ_TIME_LIMIT_SECONDS;
  }
}

export function storeQuizTimeLimitSeconds(seconds: number) {
  try {
    window.localStorage.setItem(
      QUIZ_TIME_LIMIT_STORAGE_KEY,
      String(normalizeQuizTimeLimitSeconds(seconds)),
    );
  } catch {
    // The setting still works for this visit when local storage is unavailable.
  }
}

export function timeoutStageFor(currentStage: number): 1 | 2 {
  return currentStage >= 2 ? 2 : 1;
}
