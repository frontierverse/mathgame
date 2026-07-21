"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  MAX_QUIZ_ATTEMPT_DURATION_MS,
  QUIZ_ATTEMPT_PROTOCOL,
} from "../shared/quizAttemptProtocol";
import { MAX_QUIZ_COUNT, type QuizMineralStage } from "./quizData";

export const QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY =
  "math-space-quiz-attempt-outbox-v1";
export const QUIZ_ATTEMPT_RECENT_STORAGE_KEY =
  "math-space-quiz-attempt-recent-v1";
const MAX_PENDING_ATTEMPTS = 5000;

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
    !isValidDate(attempt.answeredAt)
  ) {
    return null;
  }

  return attempt as QuizAttemptDraft;
}

function loadPendingAttempts() {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(saved)) return [];
    return saved.flatMap((value) => {
      const attempt = normalizeAttempt(value);
      return attempt ? [attempt] : [];
    });
  } catch {
    return [];
  }
}

function savePendingAttempts(attempts: readonly QuizAttemptDraft[]) {
  try {
    window.localStorage.setItem(
      QUIZ_ATTEMPT_OUTBOX_STORAGE_KEY,
      JSON.stringify(attempts),
    );
  } catch {
    // The current request can still be sent when local storage is unavailable.
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

    if (response.ok) return "saved" as const;
    if (response.status === 408 || response.status === 429 || response.status >= 500) {
      return "retry" as const;
    }
    return "discard" as const;
  } catch {
    return "retry" as const;
  }
}

export default function useQuizAttemptRecorder() {
  const pendingAttemptsRef = useRef<QuizAttemptDraft[]>([]);
  const flushPromiseRef = useRef<Promise<void> | null>(null);

  const flushPendingAttempts = useCallback(() => {
    if (flushPromiseRef.current) return flushPromiseRef.current;

    const flushPromise = (async () => {
      while (pendingAttemptsRef.current.length > 0) {
        const attempt = pendingAttemptsRef.current[0];
        const result = await persistAttempt(attempt);
        if (result === "retry") return;

        pendingAttemptsRef.current = pendingAttemptsRef.current.filter(
          ({ id }) => id !== attempt.id,
        );
        savePendingAttempts(pendingAttemptsRef.current);
      }
    })();

    flushPromiseRef.current = flushPromise;
    void flushPromise.finally(() => {
      if (flushPromiseRef.current === flushPromise) {
        flushPromiseRef.current = null;
      }
    });
    return flushPromise;
  }, []);

  useEffect(() => {
    pendingAttemptsRef.current = loadPendingAttempts();
    savePendingAttempts(pendingAttemptsRef.current);
    void flushPendingAttempts();

    const retryWhenOnline = () => void flushPendingAttempts();
    const retryTimer = window.setInterval(
      () => void flushPendingAttempts(),
      15_000,
    );
    window.addEventListener("online", retryWhenOnline);
    return () => {
      window.clearInterval(retryTimer);
      window.removeEventListener("online", retryWhenOnline);
    };
  }, [flushPendingAttempts]);

  return useCallback(
    (attempt: QuizAttemptDraft) => {
      const normalized = normalizeAttempt(attempt);
      if (!normalized) return false;
      if (pendingAttemptsRef.current.some(({ id }) => id === normalized.id)) {
        return false;
      }

      pendingAttemptsRef.current = [
        ...pendingAttemptsRef.current,
        normalized,
      ].slice(-MAX_PENDING_ATTEMPTS);
      savePendingAttempts(pendingAttemptsRef.current);
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
    [flushPendingAttempts],
  );
}
