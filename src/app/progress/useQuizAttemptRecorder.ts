"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  MAX_QUIZ_ATTEMPT_DURATION_MS,
  QUIZ_ATTEMPT_PROTOCOL,
} from "../shared/quizAttemptProtocol";
import { MAX_QUIZ_COUNT, type QuizMineralStage } from "./quizData";
import {
  MAX_QUIZ_TIME_LIMIT_SECONDS,
  MIN_QUIZ_TIME_LIMIT_SECONDS,
} from "./quizTimer";

export const QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY =
  "math-space-quiz-attempt-outbox-item-v3:";
export const QUIZ_ATTEMPT_RECENT_STORAGE_KEY =
  "math-space-quiz-attempt-recent-v3";
export const QUIZ_COMPLETION_SYNC_EVENT = "math-space-quiz-completion-sync";
const LEGACY_ATTEMPT_STORAGE_KEYS = [
  "math-space-quiz-attempt-outbox-v1",
  "math-space-quiz-attempt-recent-v1",
  "math-space-quiz-attempt-outbox-v2",
  "math-space-quiz-attempt-recent-v2",
] as const;
const MAX_PENDING_ATTEMPTS = 5000;

export type QuizCompletionMode = "random" | "direct";
export type QuizCompletionReason = "answer" | "timeout";

export type QuizAttemptDraft = {
  id: string;
  studentName: string;
  quizId: string;
  quizIndex: number;
  roundId: string;
  variantSeed: number | null;
  questionText: string;
  stageBefore: number;
  stageAfter: QuizMineralStage;
  durationMs: number;
  startedAt: string;
  answeredAt: string;
  completionMode: QuizCompletionMode;
  completionReason: QuizCompletionReason;
  timeLimitSeconds: number;
  resetGeneration: number;
  studentResetGeneration: number;
};

export type QuizCompletionSyncDetail = {
  status: "saved" | "discarded";
  attempt: QuizAttemptDraft;
  solveCount?: number;
  resetGeneration?: number;
  studentResetGeneration?: number;
};

export type QuizAttemptResetScope = {
  quizIndexes: readonly number[];
  roundId?: string;
  studentName?: string;
};

type ActiveResetScope = QuizAttemptResetScope & {
  id: symbol;
};

function isValidDate(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function normalizeAttempt(value: unknown): QuizAttemptDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const attempt = value as Partial<QuizAttemptDraft>;
  const validVariantSeed =
    attempt.variantSeed === null ||
    (Number.isInteger(attempt.variantSeed) &&
      (attempt.variantSeed as number) >= 0 &&
      (attempt.variantSeed as number) <= 0xffff_ffff);

  if (
    typeof attempt.id !== "string" ||
    !attempt.id ||
    typeof attempt.studentName !== "string" ||
    !attempt.studentName.trim() ||
    typeof attempt.quizId !== "string" ||
    !attempt.quizId ||
    !Number.isInteger(attempt.quizIndex) ||
    (attempt.quizIndex as number) < 0 ||
    (attempt.quizIndex as number) >= MAX_QUIZ_COUNT ||
    typeof attempt.roundId !== "string" ||
    !attempt.roundId ||
    !validVariantSeed ||
    typeof attempt.questionText !== "string" ||
    !attempt.questionText ||
    !Number.isInteger(attempt.stageBefore) ||
    (attempt.stageBefore as number) < 0 ||
    (attempt.stageBefore as number) > 2 ||
    !Number.isInteger(attempt.stageAfter) ||
    (attempt.stageAfter as number) < 1 ||
    (attempt.stageAfter as number) > 3 ||
    !Number.isInteger(attempt.durationMs) ||
    (attempt.durationMs as number) < 0 ||
    (attempt.durationMs as number) > MAX_QUIZ_ATTEMPT_DURATION_MS ||
    !isValidDate(attempt.startedAt) ||
    !isValidDate(attempt.answeredAt) ||
    (attempt.completionMode !== "random" &&
      attempt.completionMode !== "direct") ||
    (attempt.completionReason !== "answer" &&
      attempt.completionReason !== "timeout") ||
    !Number.isInteger(attempt.timeLimitSeconds) ||
    (attempt.timeLimitSeconds as number) < MIN_QUIZ_TIME_LIMIT_SECONDS ||
    (attempt.timeLimitSeconds as number) > MAX_QUIZ_TIME_LIMIT_SECONDS ||
    !Number.isSafeInteger(attempt.resetGeneration) ||
    (attempt.resetGeneration as number) < 0 ||
    !Number.isSafeInteger(attempt.studentResetGeneration) ||
    (attempt.studentResetGeneration as number) < 0
  ) {
    return null;
  }

  return attempt as QuizAttemptDraft;
}

function pendingAttemptStorageKey(attemptId: string) {
  return `${QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY}${attemptId}`;
}

function mergeAttempts(...attemptLists: readonly QuizAttemptDraft[][]) {
  const byId = new Map<string, QuizAttemptDraft>();
  attemptLists.flat().forEach((attempt) => byId.set(attempt.id, attempt));
  return Array.from(byId.values()).sort(
    (left, right) =>
      Date.parse(left.answeredAt) - Date.parse(right.answeredAt) ||
      left.id.localeCompare(right.id),
  );
}

export function loadPendingQuizAttempts() {
  try {
    const attempts: QuizAttemptDraft[] = [];
    const invalidKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey?.startsWith(QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY)) continue;

      try {
        const attempt = normalizeAttempt(
          JSON.parse(window.localStorage.getItem(storageKey) ?? "null"),
        );
        if (attempt) attempts.push(attempt);
        else invalidKeys.push(storageKey);
      } catch {
        invalidKeys.push(storageKey);
      }
    }
    invalidKeys.forEach((storageKey) =>
      window.localStorage.removeItem(storageKey),
    );
    return mergeAttempts(attempts);
  } catch {
    return [];
  }
}

export function getPendingQuizAttemptCount() {
  return loadPendingQuizAttempts().length;
}

function savePendingAttempt(attempt: QuizAttemptDraft) {
  try {
    window.localStorage.setItem(
      pendingAttemptStorageKey(attempt.id),
      JSON.stringify(attempt),
    );
  } catch {
    // The current request can still be sent when local storage is unavailable.
  }
}

function removePendingAttempt(attemptId: string) {
  try {
    window.localStorage.removeItem(pendingAttemptStorageKey(attemptId));
  } catch {
    // The in-memory queue can still finish during this visit.
  }
}

async function persistAttempt(attempt: QuizAttemptDraft) {
  try {
    const response = await fetch("/api/quiz-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptProtocol: QUIZ_ATTEMPT_PROTOCOL,
        ...attempt,
      }),
      keepalive: true,
    });

    if (response.ok) {
      const data: unknown = await response.json();
      const solveCount = (data as { solveCount?: unknown })?.solveCount;
      const resetGeneration = (data as { resetGeneration?: unknown })
        ?.resetGeneration;
      const studentResetGeneration = (
        data as { studentResetGeneration?: unknown }
      )?.studentResetGeneration;
      if (
        Number.isInteger(solveCount) &&
        (solveCount as number) >= 0 &&
        (solveCount as number) <= 3 &&
        Number.isSafeInteger(resetGeneration) &&
        (resetGeneration as number) >= 0 &&
        Number.isSafeInteger(studentResetGeneration) &&
        (studentResetGeneration as number) >= 0
      ) {
        return {
          status: "saved" as const,
          solveCount: solveCount as number,
          resetGeneration: resetGeneration as number,
          studentResetGeneration: studentResetGeneration as number,
        };
      }
      return { status: "discard" as const };
    }
    if (response.status === 408 || response.status === 429 || response.status >= 500) {
      return { status: "retry" as const };
    }
    return { status: "discard" as const };
  } catch {
    return { status: "retry" as const };
  }
}

function dispatchCompletionSync(detail: QuizCompletionSyncDetail) {
  window.dispatchEvent(
    new CustomEvent<QuizCompletionSyncDetail>(QUIZ_COMPLETION_SYNC_EVENT, {
      detail,
    }),
  );
}

function attemptMatchesResetScope(
  attempt: QuizAttemptDraft,
  scope: QuizAttemptResetScope,
) {
  return (
    scope.quizIndexes.includes(attempt.quizIndex) &&
    (!scope.roundId || attempt.roundId === scope.roundId) &&
    (!scope.studentName || attempt.studentName === scope.studentName)
  );
}

export default function useQuizAttemptRecorder() {
  const pendingAttemptsRef = useRef<QuizAttemptDraft[]>([]);
  const flushPromiseRef = useRef<Promise<void> | null>(null);
  const activeResetScopesRef = useRef<ActiveResetScope[]>([]);

  const isBlockedByReset = useCallback(
    (attempt: QuizAttemptDraft) =>
      activeResetScopesRef.current.some((scope) =>
        attemptMatchesResetScope(attempt, scope),
      ),
    [],
  );

  const flushPendingAttempts = useCallback(() => {
    if (flushPromiseRef.current) return flushPromiseRef.current;

    const flushPromise = (async () => {
      pendingAttemptsRef.current = mergeAttempts(
        pendingAttemptsRef.current,
        loadPendingQuizAttempts(),
      );
      while (pendingAttemptsRef.current.length > 0) {
        const attempt = pendingAttemptsRef.current.find(
          (pendingAttempt) => !isBlockedByReset(pendingAttempt),
        );
        if (!attempt) return;

        const result = await persistAttempt(attempt);
        if (result.status === "retry") return;

        pendingAttemptsRef.current = pendingAttemptsRef.current.filter(
          ({ id }) => id !== attempt.id,
        );
        removePendingAttempt(attempt.id);
        dispatchCompletionSync(
          result.status === "saved"
            ? {
                status: "saved",
                attempt,
                solveCount: result.solveCount,
                resetGeneration: result.resetGeneration,
                studentResetGeneration: result.studentResetGeneration,
              }
            : { status: "discarded", attempt },
        );
      }
    })();

    flushPromiseRef.current = flushPromise;
    void flushPromise.finally(() => {
      if (flushPromiseRef.current === flushPromise) {
        flushPromiseRef.current = null;
      }
    });
    return flushPromise;
  }, [isBlockedByReset]);

  useEffect(() => {
    LEGACY_ATTEMPT_STORAGE_KEYS.forEach((storageKey) => {
      try {
        window.localStorage.removeItem(storageKey);
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Legacy queues cannot satisfy the reset-generation contract.
      }
    });
    pendingAttemptsRef.current = loadPendingQuizAttempts();
    void flushPendingAttempts();

    const retryWhenOnline = () => void flushPendingAttempts();
    const syncCrossTabAttempt = (event: StorageEvent) => {
      if (
        event.storageArea !== window.localStorage ||
        !event.key?.startsWith(QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY)
      ) {
        return;
      }
      if (event.newValue === null) {
        const removedId = event.key.slice(QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY.length);
        pendingAttemptsRef.current = pendingAttemptsRef.current.filter(
          ({ id }) => id !== removedId,
        );
        return;
      }
      try {
        const attempt = normalizeAttempt(JSON.parse(event.newValue));
        if (!attempt || isBlockedByReset(attempt)) return;
        pendingAttemptsRef.current = mergeAttempts(
          pendingAttemptsRef.current,
          [attempt],
        );
        void flushPendingAttempts();
      } catch {
        // Invalid entries are removed by the next queue scan.
      }
    };
    const retryTimer = window.setInterval(
      () => void flushPendingAttempts(),
      15_000,
    );
    window.addEventListener("online", retryWhenOnline);
    window.addEventListener("storage", syncCrossTabAttempt);
    return () => {
      window.clearInterval(retryTimer);
      window.removeEventListener("online", retryWhenOnline);
      window.removeEventListener("storage", syncCrossTabAttempt);
    };
  }, [flushPendingAttempts, isBlockedByReset]);

  const recordQuizAttempt = useCallback(
    (attempt: QuizAttemptDraft) => {
      const normalized = normalizeAttempt(attempt);
      if (!normalized) return false;
      if (isBlockedByReset(normalized)) return false;
      const storedAttempts = loadPendingQuizAttempts();
      if (
        storedAttempts.some(({ id }) => id === normalized.id) ||
        pendingAttemptsRef.current.some(({ id }) => id === normalized.id) ||
        storedAttempts.length >= MAX_PENDING_ATTEMPTS
      ) {
        return false;
      }

      pendingAttemptsRef.current = mergeAttempts(
        pendingAttemptsRef.current,
        storedAttempts,
        [normalized],
      );
      savePendingAttempt(normalized);
      try {
        window.sessionStorage.setItem(
          QUIZ_ATTEMPT_RECENT_STORAGE_KEY,
          normalized.id,
        );
      } catch {
        // Statistics still load normally when session storage is unavailable.
      }
      const activeFlush = flushPendingAttempts();
      void activeFlush.finally(() => {
        if (pendingAttemptsRef.current.some(({ id }) => id === normalized.id)) {
          void flushPendingAttempts();
        }
      });
      return true;
    },
    [flushPendingAttempts, isBlockedByReset],
  );

  const withQuizAttemptReset = useCallback(
    async <Result,>(
      scope: QuizAttemptResetScope,
      reset: () => Promise<Result>,
    ) => {
      const normalizedScope: ActiveResetScope = {
        id: Symbol("quiz-attempt-reset"),
        quizIndexes: Array.from(
          new Set(
            scope.quizIndexes.filter(
              (quizIndex) =>
                Number.isInteger(quizIndex) &&
                quizIndex >= 0 &&
                quizIndex < MAX_QUIZ_COUNT,
            ),
          ),
        ),
        ...(scope.roundId ? { roundId: scope.roundId } : {}),
        ...(scope.studentName ? { studentName: scope.studentName } : {}),
      };

      if (normalizedScope.quizIndexes.length === 0) {
        throw new Error("Quiz attempt reset scope is empty.");
      }

      activeResetScopesRef.current = [
        ...activeResetScopesRef.current,
        normalizedScope,
      ];

      let removedAttempts: QuizAttemptDraft[] = [];
      try {
        const activeFlush = flushPromiseRef.current;
        if (activeFlush) await activeFlush;

        pendingAttemptsRef.current = mergeAttempts(
          pendingAttemptsRef.current,
          loadPendingQuizAttempts(),
        );
        removedAttempts = pendingAttemptsRef.current.filter((attempt) =>
          attemptMatchesResetScope(attempt, normalizedScope),
        );
        pendingAttemptsRef.current = pendingAttemptsRef.current.filter(
          (attempt) => !attemptMatchesResetScope(attempt, normalizedScope),
        );
        removedAttempts.forEach(({ id }) => removePendingAttempt(id));

        try {
          const result = await reset();
          try {
            const recentAttemptId = window.sessionStorage.getItem(
              QUIZ_ATTEMPT_RECENT_STORAGE_KEY,
            );
            if (removedAttempts.some(({ id }) => id === recentAttemptId)) {
              window.sessionStorage.removeItem(QUIZ_ATTEMPT_RECENT_STORAGE_KEY);
            }
          } catch {
            // Statistics still load normally when session storage is unavailable.
          }
          return result;
        } catch (error) {
          const storedAttempts = loadPendingQuizAttempts();
          const queuedIds = new Set(storedAttempts.map(({ id }) => id));
          const restored = removedAttempts.filter(({ id }) => !queuedIds.has(id));
          restored.forEach(savePendingAttempt);
          pendingAttemptsRef.current = mergeAttempts(
            pendingAttemptsRef.current,
            storedAttempts,
            restored,
          ).slice(-MAX_PENDING_ATTEMPTS);
          throw error;
        }
      } finally {
        activeResetScopesRef.current = activeResetScopesRef.current.filter(
          ({ id }) => id !== normalizedScope.id,
        );
        void flushPendingAttempts();
      }
    },
    [flushPendingAttempts],
  );

  return { recordQuizAttempt, withQuizAttemptReset };
}
