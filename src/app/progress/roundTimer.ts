export const ROUND_TIMER_STORAGE_KEY = "math-space-round-timer-v1";

export type RoundTimerEntry = {
  startedAtMs: number;
  completedAtMs?: number;
};

export type RoundTimerState = {
  version: 1;
  rounds: Record<string, RoundTimerEntry>;
};

export const EMPTY_ROUND_TIMER_STATE: RoundTimerState = {
  version: 1,
  rounds: {},
};

function isSafeTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function normalizeRoundTimerState(value: unknown): RoundTimerState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_ROUND_TIMER_STATE;
  }

  const source = value as { rounds?: unknown };
  if (
    !source.rounds ||
    typeof source.rounds !== "object" ||
    Array.isArray(source.rounds)
  ) {
    return EMPTY_ROUND_TIMER_STATE;
  }

  const rounds: Record<string, RoundTimerEntry> = {};
  Object.entries(source.rounds).forEach(([roundId, value]) => {
    if (!roundId || !value || typeof value !== "object" || Array.isArray(value)) {
      return;
    }

    const entry = value as Partial<RoundTimerEntry>;
    const startedAtMs = entry.startedAtMs;
    const completedAtMs = entry.completedAtMs;
    if (!isSafeTimestamp(startedAtMs)) return;
    if (
      completedAtMs !== undefined &&
      (!isSafeTimestamp(completedAtMs) || completedAtMs < startedAtMs)
    ) {
      return;
    }

    rounds[roundId] = {
      startedAtMs,
      ...(completedAtMs === undefined
        ? {}
        : { completedAtMs }),
    };
  });

  return { version: 1, rounds };
}

export function readStoredRoundTimerState() {
  if (typeof window === "undefined") return EMPTY_ROUND_TIMER_STATE;

  try {
    const stored = window.localStorage.getItem(ROUND_TIMER_STORAGE_KEY);
    return stored
      ? normalizeRoundTimerState(JSON.parse(stored))
      : EMPTY_ROUND_TIMER_STATE;
  } catch {
    return EMPTY_ROUND_TIMER_STATE;
  }
}

export function storeRoundTimerState(state: RoundTimerState) {
  try {
    window.localStorage.setItem(ROUND_TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The timer remains available for this visit when local storage is unavailable.
  }
}

export function formatRoundElapsedTime(
  startedAtMs: number,
  nowMs: number,
  completedAtMs?: number,
) {
  const elapsedSeconds = Math.max(
    0,
    Math.floor(((completedAtMs ?? nowMs) - startedAtMs) / 1000),
  );
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const minuteText = String(minutes).padStart(2, "0");
  const secondText = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${minuteText}:${secondText}`
    : `${minuteText}:${secondText}`;
}
