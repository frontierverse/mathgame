"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type CurriculumQuizRound,
  MAX_QUIZ_COUNT,
  MAX_SOLVES,
  type QuizMineralStage,
} from "./quizData";
import type { QuizProgress } from "./quizProgress";
import {
  QUIZ_PROGRESS_CACHE_VERSION,
  QUIZ_PROGRESS_PROTOCOL,
} from "../shared/quizProgressProtocol";

const STORAGE_KEY = `math-space-quiz-progress-${QUIZ_PROGRESS_CACHE_VERSION}`;
const RESET_STORAGE_KEYS = [
  "math-space-quiz-progress-v10",
  "math-space-quiz-progress-v9",
  "math-space-quiz-progress-v8",
  "math-space-quiz-progress-v7",
  "math-space-quiz-progress-v6",
  "math-space-quiz-progress-v5",
  "math-space-quiz-progress-v4",
] as const;

function normalizeProgress(value: unknown): QuizProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const progress: QuizProgress = {};
  Object.entries(value).forEach(([studentName, rawCounts]) => {
    if (!Array.isArray(rawCounts)) return;
    progress[studentName] = rawCounts.slice(0, MAX_QUIZ_COUNT).map((count) =>
      typeof count === "number" && Number.isInteger(count)
        ? Math.min(MAX_SOLVES, Math.max(0, count))
        : 0,
    );
  });
  return progress;
}

function loadLocalProgress() {
  if (typeof window === "undefined") return {};
  try {
    RESET_STORAGE_KEYS.forEach((storageKey) => window.localStorage.removeItem(storageKey));
    const savedProgress = window.localStorage.getItem(STORAGE_KEY);
    return savedProgress === null ? {} : normalizeProgress(JSON.parse(savedProgress));
  } catch {
    return {};
  }
}

function saveLocalProgress(progress: QuizProgress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Local storage is only a fallback cache.
  }
}

async function persistQuizProgress(studentName: string, quizIndex: number, solveCount: number) {
  const response = await fetch("/api/quiz-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progressProtocol: QUIZ_PROGRESS_PROTOCOL,
      studentName,
      quizIndex,
      solveCount,
    }),
  });
  if (!response.ok) throw new Error("Quiz progress persistence failed.");

  const data: unknown = await response.json();
  const serverCount = (data as { solveCount?: unknown })?.solveCount;
  if (!Number.isInteger(serverCount)) throw new Error("Quiz progress response is invalid.");
  return serverCount as number;
}

async function decrementQuizProgress(studentName: string, quizIndex: number) {
  const response = await fetch("/api/quiz-progress", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progressProtocol: QUIZ_PROGRESS_PROTOCOL,
      studentName,
      quizIndex,
    }),
  });
  if (!response.ok) throw new Error("Quiz progress decrement failed.");

  const data: unknown = await response.json();
  const serverCount = (data as { solveCount?: unknown })?.solveCount;
  if (!Number.isInteger(serverCount)) throw new Error("Quiz progress response is invalid.");
  return serverCount as number;
}

async function resetQuizRoundProgress(roundId: string) {
  const response = await fetch("/api/quiz-progress/reset-round", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progressProtocol: QUIZ_PROGRESS_PROTOCOL,
      roundId,
    }),
  });
  if (!response.ok) throw new Error("Quiz round reset failed.");

  const data: unknown = await response.json();
  if ((data as { roundId?: unknown })?.roundId !== roundId) {
    throw new Error("Quiz round reset response is invalid.");
  }
}

export default function useQuizProgress() {
  const [progress, setProgress] = useState<QuizProgress>({});
  const [isReady, setIsReady] = useState(false);
  const progressRef = useRef<QuizProgress>({});
  const mutationVersionsRef = useRef<Record<string, number>>({});
  const pendingMutationsByQuizRef = useRef<Map<number, Set<Promise<void>>>>(
    new Map(),
  );
  const resetPromisesByRoundRef = useRef<Map<string, Promise<void>>>(new Map());
  const resettingQuizIndexesRef = useRef<Set<number>>(new Set());

  const replaceProgress = useCallback((next: QuizProgress) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  const trackQuizMutation = useCallback(
    (quizIndex: number, mutation: Promise<void>) => {
      const pendingMutations =
        pendingMutationsByQuizRef.current.get(quizIndex) ?? new Set<Promise<void>>();
      const trackedMutation = mutation.then(
        () => undefined,
        () => undefined,
      );
      pendingMutations.add(trackedMutation);
      pendingMutationsByQuizRef.current.set(quizIndex, pendingMutations);
      void trackedMutation.then(() => {
        pendingMutations.delete(trackedMutation);
        if (pendingMutations.size === 0) {
          pendingMutationsByQuizRef.current.delete(quizIndex);
        }
      });
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      const local = loadLocalProgress();
      try {
        const response = await fetch("/api/quiz-progress", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Quiz progress request failed.");

        const data: unknown = await response.json();
        const remote = normalizeProgress((data as { progress?: unknown })?.progress);
        if (!active) return;
        replaceProgress(remote);
        saveLocalProgress(remote);
        setIsReady(true);
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        replaceProgress(local);
        setIsReady(true);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [replaceProgress]);

  const awardQuizStage = useCallback(
    (studentName: string, quizIndex: number, targetStage: QuizMineralStage) => {
      if (!Number.isInteger(quizIndex) || quizIndex < 0 || quizIndex >= MAX_QUIZ_COUNT) {
        return false;
      }
      if (resettingQuizIndexesRef.current.has(quizIndex)) return false;

      const current = progressRef.current;
      const counts = [...(current[studentName] ?? [])];
      while (counts.length <= quizIndex) counts.push(0);
      const currentStage = counts[quizIndex] ?? 0;
      const validTransition =
        (currentStage === 0 && (targetStage === 1 || targetStage === MAX_SOLVES)) ||
        (currentStage === 1 && (targetStage === 1 || targetStage === 2)) ||
        (currentStage === 2 && (targetStage === 2 || targetStage === MAX_SOLVES));
      if (!validTransition) return false;

      counts[quizIndex] = targetStage;
      const next = { ...current, [studentName]: counts };
      replaceProgress(next);
      saveLocalProgress(next);

      const mutationKey = `${studentName}:${quizIndex}`;
      const mutationVersion = (mutationVersionsRef.current[mutationKey] ?? 0) + 1;
      mutationVersionsRef.current[mutationKey] = mutationVersion;

      trackQuizMutation(
        quizIndex,
        persistQuizProgress(studentName, quizIndex, counts[quizIndex])
          .then((serverCount) => {
            if (mutationVersionsRef.current[mutationKey] !== mutationVersion) return;
            const latest = progressRef.current;
            const latestCounts = [...(latest[studentName] ?? [])];
            latestCounts[quizIndex] = serverCount;
            const reconciled = { ...latest, [studentName]: latestCounts };
            replaceProgress(reconciled);
            saveLocalProgress(reconciled);
          })
          .catch(() => undefined),
      );

      return true;
    },
    [replaceProgress, trackQuizMutation],
  );

  const undoQuiz = useCallback(
    (studentName: string, quizIndex: number) => {
      if (!Number.isInteger(quizIndex) || quizIndex < 0 || quizIndex >= MAX_QUIZ_COUNT) return;
      if (resettingQuizIndexesRef.current.has(quizIndex)) return;

      const current = progressRef.current;
      const counts = [...(current[studentName] ?? [])];
      const currentCount = counts[quizIndex] ?? 0;
      if (currentCount <= 0) return;

      counts[quizIndex] = currentCount - 1;
      const next = { ...current, [studentName]: counts };
      replaceProgress(next);
      saveLocalProgress(next);

      const mutationKey = `${studentName}:${quizIndex}`;
      const mutationVersion = (mutationVersionsRef.current[mutationKey] ?? 0) + 1;
      mutationVersionsRef.current[mutationKey] = mutationVersion;

      trackQuizMutation(
        quizIndex,
        decrementQuizProgress(studentName, quizIndex)
          .then((serverCount) => {
            if (mutationVersionsRef.current[mutationKey] !== mutationVersion) return;
            const latest = progressRef.current;
            const latestCounts = [...(latest[studentName] ?? [])];
            latestCounts[quizIndex] = serverCount;
            const reconciled = { ...latest, [studentName]: latestCounts };
            replaceProgress(reconciled);
            saveLocalProgress(reconciled);
          })
          .catch(() => undefined),
      );
    },
    [replaceProgress, trackQuizMutation],
  );

  const resetQuizRound = useCallback(
    (round: CurriculumQuizRound) => {
      const currentReset = resetPromisesByRoundRef.current.get(round.id);
      if (currentReset) return currentReset;

      const reset = (async () => {
        round.quizIndexes.forEach((quizIndex) =>
          resettingQuizIndexesRef.current.add(quizIndex),
        );
        try {
          const currentBeforeReset = progressRef.current;
          Object.keys(currentBeforeReset).forEach((studentName) => {
            round.quizIndexes.forEach((quizIndex) => {
              const mutationKey = `${studentName}:${quizIndex}`;
              mutationVersionsRef.current[mutationKey] =
                (mutationVersionsRef.current[mutationKey] ?? 0) + 1;
            });
          });

          const pendingMutations = round.quizIndexes.flatMap((quizIndex) =>
            Array.from(pendingMutationsByQuizRef.current.get(quizIndex) ?? []),
          );
          await Promise.all(pendingMutations);
          await resetQuizRoundProgress(round.id);

          const current = progressRef.current;
          const next = Object.fromEntries(
            Object.entries(current).map(([studentName, counts]) => {
              const nextCounts = [...counts];
              round.quizIndexes.forEach((quizIndex) => {
                if (quizIndex < nextCounts.length) nextCounts[quizIndex] = 0;
              });
              return [studentName, nextCounts];
            }),
          );

          replaceProgress(next);
          saveLocalProgress(next);
        } finally {
          round.quizIndexes.forEach((quizIndex) =>
            resettingQuizIndexesRef.current.delete(quizIndex),
          );
        }
      })();

      resetPromisesByRoundRef.current.set(round.id, reset);
      void reset.then(
        () => {
          if (resetPromisesByRoundRef.current.get(round.id) === reset) {
            resetPromisesByRoundRef.current.delete(round.id);
          }
        },
        () => {
          if (resetPromisesByRoundRef.current.get(round.id) === reset) {
            resetPromisesByRoundRef.current.delete(round.id);
          }
        },
      );
      return reset;
    },
    [replaceProgress],
  );

  return { progress, isReady, awardQuizStage, undoQuiz, resetQuizRound };
}
