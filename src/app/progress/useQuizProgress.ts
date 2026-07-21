"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  QUIZ_PROGRESS_CACHE_VERSION,
  QUIZ_PROGRESS_PROTOCOL,
} from "../shared/quizProgressProtocol";
import {
  QUIZ_COMPLETION_SYNC_EVENT,
  loadPendingQuizAttempts,
  type QuizCompletionSyncDetail,
} from "./useQuizAttemptRecorder";
import {
  type CurriculumQuizRound,
  MAX_QUIZ_COUNT,
  MAX_SOLVES,
  type QuizMineralStage,
} from "./quizData";
import type { QuizProgress } from "./quizProgress";

const STORAGE_KEY = `math-space-quiz-progress-${QUIZ_PROGRESS_CACHE_VERSION}`;
const RESET_STORAGE_KEYS = [
  "math-space-quiz-progress-v12",
  "math-space-quiz-progress-v11",
  "math-space-quiz-progress-v10",
  "math-space-quiz-progress-v9",
  "math-space-quiz-progress-v8",
  "math-space-quiz-progress-v7",
  "math-space-quiz-progress-v6",
  "math-space-quiz-progress-v5",
  "math-space-quiz-progress-v4",
] as const;

type ResetGenerations = Record<number, number>;
type StudentResetGenerations = Record<string, ResetGenerations>;
type QuizProgressSnapshot = {
  progress: QuizProgress;
  resetGenerations: ResetGenerations;
  studentResetGenerations: StudentResetGenerations;
};
type AwardOptions = { persist?: boolean };

function parseResetGeneration(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^(0|[1-9]\d*)$/.test(value)
        ? Number(value)
        : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

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

function normalizeResetGenerations(value: unknown): ResetGenerations {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const generations: ResetGenerations = {};
  Object.entries(value).forEach(([rawQuizIndex, rawGeneration]) => {
    const quizIndex = Number(rawQuizIndex);
    const generation = parseResetGeneration(rawGeneration);
    if (
      Number.isInteger(quizIndex) &&
      quizIndex >= 0 &&
      quizIndex < MAX_QUIZ_COUNT &&
      generation !== null
    ) {
      generations[quizIndex] = generation;
    }
  });
  return generations;
}

function normalizeStudentResetGenerations(
  value: unknown,
): StudentResetGenerations {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([studentName, generations]) => {
      if (!studentName.trim()) return [];
      return [[studentName, normalizeResetGenerations(generations)]];
    }),
  );
}

function loadLocalSnapshot(): QuizProgressSnapshot {
  const emptySnapshot: QuizProgressSnapshot = {
    progress: {},
    resetGenerations: {},
    studentResetGenerations: {},
  };
  if (typeof window === "undefined") return emptySnapshot;

  try {
    RESET_STORAGE_KEYS.forEach((storageKey) =>
      window.localStorage.removeItem(storageKey),
    );
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) return emptySnapshot;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return emptySnapshot;
    }
    return {
      progress: normalizeProgress(
        (parsed as { progress?: unknown }).progress,
      ),
      resetGenerations: normalizeResetGenerations(
        (parsed as { resetGenerations?: unknown }).resetGenerations,
      ),
      studentResetGenerations: normalizeStudentResetGenerations(
        (parsed as { studentResetGenerations?: unknown })
          .studentResetGenerations,
      ),
    };
  } catch {
    return emptySnapshot;
  }
}

function saveLocalSnapshot(snapshot: QuizProgressSnapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Local storage is only a fallback cache.
  }
}

function overlayPendingAttempts(snapshot: QuizProgressSnapshot) {
  try {
    let merged = snapshot.progress;
    loadPendingQuizAttempts().forEach((attempt) => {
      const { studentName } = attempt;
      const quizIndex = attempt.quizIndex;
      const stageAfter = attempt.stageAfter;
      const resetGeneration = parseResetGeneration(attempt.resetGeneration);
      const studentResetGeneration = parseResetGeneration(
        attempt.studentResetGeneration,
      );
      if (
        !studentName ||
        !Number.isInteger(quizIndex) ||
        (quizIndex as number) < 0 ||
        (quizIndex as number) >= MAX_QUIZ_COUNT ||
        !Number.isInteger(stageAfter) ||
        (stageAfter as number) < 1 ||
        (stageAfter as number) > MAX_SOLVES ||
        resetGeneration === null ||
        resetGeneration !==
          (snapshot.resetGenerations[quizIndex as number] ?? 0) ||
        studentResetGeneration === null ||
        studentResetGeneration !==
          (snapshot.studentResetGenerations[studentName]?.[
            quizIndex as number
          ] ?? 0)
      ) {
        return;
      }

      const counts = [...(merged[studentName] ?? [])];
      while (counts.length <= (quizIndex as number)) counts.push(0);
      if ((counts[quizIndex as number] ?? 0) >= (stageAfter as number)) return;
      counts[quizIndex as number] = stageAfter as number;
      merged = { ...merged, [studentName]: counts };
    });
    return merged;
  } catch {
    return snapshot.progress;
  }
}

async function requestProgressSnapshot(signal?: AbortSignal) {
  const response = await fetch("/api/quiz-progress", {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Quiz progress request failed.");

  const data: unknown = await response.json();
  const snapshot = {
    progress: normalizeProgress((data as { progress?: unknown })?.progress),
    resetGenerations: normalizeResetGenerations(
      (data as { resetGenerations?: unknown })?.resetGenerations,
    ),
    studentResetGenerations: normalizeStudentResetGenerations(
      (data as { studentResetGenerations?: unknown })
        ?.studentResetGenerations,
    ),
  };
  return { ...snapshot, progress: overlayPendingAttempts(snapshot) };
}

async function persistQuizProgress(
  studentName: string,
  quizIndex: number,
  solveCount: number,
  expectedResetGeneration: number,
  expectedStudentResetGeneration: number,
) {
  const response = await fetch("/api/quiz-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progressProtocol: QUIZ_PROGRESS_PROTOCOL,
      studentName,
      quizIndex,
      solveCount,
      expectedResetGeneration,
      expectedStudentResetGeneration,
    }),
  });
  if (!response.ok) throw new Error("Quiz progress persistence failed.");

  const data: unknown = await response.json();
  const serverCount = (data as { solveCount?: unknown })?.solveCount;
  const resetGeneration = parseResetGeneration(
    (data as { resetGeneration?: unknown })?.resetGeneration,
  );
  const studentResetGeneration = parseResetGeneration(
    (data as { studentResetGeneration?: unknown })?.studentResetGeneration,
  );
  if (
    !Number.isInteger(serverCount) ||
    resetGeneration === null ||
    studentResetGeneration === null
  ) {
    throw new Error("Quiz progress response is invalid.");
  }
  return {
    solveCount: serverCount as number,
    resetGeneration,
    studentResetGeneration,
  };
}

async function decrementQuizProgress(
  studentName: string,
  quizIndex: number,
  expectedResetGeneration: number,
  expectedStudentResetGeneration: number,
) {
  const response = await fetch("/api/quiz-progress", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progressProtocol: QUIZ_PROGRESS_PROTOCOL,
      studentName,
      quizIndex,
      expectedResetGeneration,
      expectedStudentResetGeneration,
    }),
  });
  if (!response.ok) throw new Error("Quiz progress decrement failed.");

  const data: unknown = await response.json();
  const serverCount = (data as { solveCount?: unknown })?.solveCount;
  const resetGeneration = parseResetGeneration(
    (data as { resetGeneration?: unknown })?.resetGeneration,
  );
  const studentResetGeneration = parseResetGeneration(
    (data as { studentResetGeneration?: unknown })?.studentResetGeneration,
  );
  if (
    !Number.isInteger(serverCount) ||
    resetGeneration === null ||
    studentResetGeneration === null
  ) {
    throw new Error("Quiz progress response is invalid.");
  }
  return {
    solveCount: serverCount as number,
    resetGeneration,
    studentResetGeneration,
  };
}

async function resetQuizRoundProgress(
  round: CurriculumQuizRound,
  expectedResetGenerations: readonly number[],
) {
  const response = await fetch("/api/quiz-progress/reset-round", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progressProtocol: QUIZ_PROGRESS_PROTOCOL,
      roundId: round.id,
      expectedResetGenerations,
    }),
  });
  if (!response.ok) throw new Error("Quiz round reset failed.");

  const data: unknown = await response.json();
  if ((data as { roundId?: unknown })?.roundId !== round.id) {
    throw new Error("Quiz round reset response is invalid.");
  }
  if (
    !Number.isInteger(
      (data as { progressResetCount?: unknown }).progressResetCount,
    ) ||
    !Number.isInteger(
      (data as { attemptResetCount?: unknown }).attemptResetCount,
    )
  ) {
    throw new Error("Quiz round reset response is invalid.");
  }
  const resetGenerations = normalizeResetGenerations(
    (data as { resetGenerations?: unknown }).resetGenerations,
  );
  if (
    round.quizIndexes.some(
      (quizIndex) => resetGenerations[quizIndex] === undefined,
    )
  ) {
    throw new Error("Quiz round reset response is invalid.");
  }
  return resetGenerations;
}

export default function useQuizProgress() {
  const [progress, setProgress] = useState<QuizProgress>({});
  const [resetGenerations, setResetGenerations] =
    useState<ResetGenerations>({});
  const [studentResetGenerations, setStudentResetGenerations] =
    useState<StudentResetGenerations>({});
  const [isReady, setIsReady] = useState(false);
  const progressRef = useRef<QuizProgress>({});
  const resetGenerationsRef = useRef<ResetGenerations>({});
  const studentResetGenerationsRef = useRef<StudentResetGenerations>({});
  const mutationVersionsRef = useRef<Record<string, number>>({});
  const pendingMutationsByQuizRef = useRef<Map<number, Set<Promise<void>>>>(
    new Map(),
  );
  const resetPromisesByRoundRef = useRef<Map<string, Promise<void>>>(new Map());
  const resettingQuizIndexesRef = useRef<Set<number>>(new Set());

  const replaceSnapshot = useCallback((snapshot: QuizProgressSnapshot) => {
    progressRef.current = snapshot.progress;
    resetGenerationsRef.current = snapshot.resetGenerations;
    studentResetGenerationsRef.current = snapshot.studentResetGenerations;
    setProgress(snapshot.progress);
    setResetGenerations(snapshot.resetGenerations);
    setStudentResetGenerations(snapshot.studentResetGenerations);
    saveLocalSnapshot(snapshot);
  }, []);

  const replaceProgress = useCallback((next: QuizProgress) => {
    progressRef.current = next;
    setProgress(next);
    saveLocalSnapshot({
      progress: next,
      resetGenerations: resetGenerationsRef.current,
      studentResetGenerations: studentResetGenerationsRef.current,
    });
  }, []);

  const refreshRemoteProgress = useCallback(
    async (signal?: AbortSignal) => {
      const snapshot = await requestProgressSnapshot(signal);
      replaceSnapshot(snapshot);
      return snapshot;
    },
    [replaceSnapshot],
  );

  const trackQuizMutation = useCallback(
    (quizIndex: number, mutation: Promise<void>) => {
      const pendingMutations =
        pendingMutationsByQuizRef.current.get(quizIndex) ??
        new Set<Promise<void>>();
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
    const local = loadLocalSnapshot();

    const load = async () => {
      try {
        const snapshot = await requestProgressSnapshot(controller.signal);
        if (active) replaceSnapshot(snapshot);
      } catch (error) {
        if (
          !active ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        replaceSnapshot({
          ...local,
          progress: overlayPendingAttempts(local),
        });
      } finally {
        if (active) setIsReady(true);
      }
    };
    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [replaceSnapshot]);

  useEffect(() => {
    const reconcile = () => {
      void refreshRemoteProgress().catch(() => undefined);
    };
    const reconcileWhenVisible = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    const reconcileCrossTab = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === STORAGE_KEY) {
        reconcile();
      }
    };
    window.addEventListener("focus", reconcile);
    window.addEventListener("storage", reconcileCrossTab);
    document.addEventListener("visibilitychange", reconcileWhenVisible);
    return () => {
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("storage", reconcileCrossTab);
      document.removeEventListener("visibilitychange", reconcileWhenVisible);
    };
  }, [refreshRemoteProgress]);

  useEffect(() => {
    const handleCompletionSync = (event: Event) => {
      const detail = (event as CustomEvent<QuizCompletionSyncDetail>).detail;
      if (!detail?.attempt) return;
      if (detail.status === "discarded") {
        void refreshRemoteProgress().catch(() => undefined);
        return;
      }

      const generation = parseResetGeneration(detail.resetGeneration);
      const studentGeneration = parseResetGeneration(
        detail.studentResetGeneration,
      );
      const solveCount = detail.solveCount;
      const { studentName, quizIndex } = detail.attempt;
      if (
        generation === null ||
        studentGeneration === null ||
        !Number.isInteger(solveCount) ||
        (solveCount as number) < 0 ||
        (solveCount as number) > MAX_SOLVES ||
        generation < (resetGenerationsRef.current[quizIndex] ?? 0) ||
        studentGeneration <
          (studentResetGenerationsRef.current[studentName]?.[quizIndex] ?? 0)
      ) {
        return;
      }

      const nextGenerations = {
        ...resetGenerationsRef.current,
        [quizIndex]: generation,
      };
      const nextStudentGenerations = {
        ...studentResetGenerationsRef.current,
        [studentName]: {
          ...studentResetGenerationsRef.current[studentName],
          [quizIndex]: studentGeneration,
        },
      };
      const counts = [...(progressRef.current[studentName] ?? [])];
      while (counts.length <= quizIndex) counts.push(0);
      counts[quizIndex] = Math.max(
        counts[quizIndex] ?? 0,
        solveCount as number,
      );
      replaceSnapshot({
        progress: { ...progressRef.current, [studentName]: counts },
        resetGenerations: nextGenerations,
        studentResetGenerations: nextStudentGenerations,
      });
    };

    window.addEventListener(QUIZ_COMPLETION_SYNC_EVENT, handleCompletionSync);
    return () =>
      window.removeEventListener(
        QUIZ_COMPLETION_SYNC_EVENT,
        handleCompletionSync,
      );
  }, [refreshRemoteProgress, replaceSnapshot]);

  const awardQuizStage = useCallback(
    (
      studentName: string,
      quizIndex: number,
      targetStage: QuizMineralStage,
      options: AwardOptions = {},
    ) => {
      if (
        !Number.isInteger(quizIndex) ||
        quizIndex < 0 ||
        quizIndex >= MAX_QUIZ_COUNT ||
        resettingQuizIndexesRef.current.has(quizIndex)
      ) {
        return false;
      }

      const current = progressRef.current;
      const counts = [...(current[studentName] ?? [])];
      while (counts.length <= quizIndex) counts.push(0);
      const currentStage = counts[quizIndex] ?? 0;
      const validTransition =
        (currentStage === 0 &&
          (targetStage === 1 || targetStage === MAX_SOLVES)) ||
        (currentStage === 1 &&
          (targetStage === 1 || targetStage === 2)) ||
        (currentStage === 2 &&
          (targetStage === 2 || targetStage === MAX_SOLVES));
      if (!validTransition) return false;

      const expectedResetGeneration =
        resetGenerationsRef.current[quizIndex] ?? 0;
      const expectedStudentResetGeneration =
        studentResetGenerationsRef.current[studentName]?.[quizIndex] ?? 0;
      counts[quizIndex] = targetStage;
      const next = { ...current, [studentName]: counts };
      replaceProgress(next);

      if (options.persist === false) return true;

      const mutationKey = `${studentName}:${quizIndex}`;
      const mutationVersion =
        (mutationVersionsRef.current[mutationKey] ?? 0) + 1;
      mutationVersionsRef.current[mutationKey] = mutationVersion;

      trackQuizMutation(
        quizIndex,
        persistQuizProgress(
          studentName,
          quizIndex,
          targetStage,
          expectedResetGeneration,
          expectedStudentResetGeneration,
        )
          .then(
            ({ solveCount, resetGeneration, studentResetGeneration }) => {
              if (
                mutationVersionsRef.current[mutationKey] !== mutationVersion
              ) {
                return;
              }
              const latestCounts = [
                ...(progressRef.current[studentName] ?? []),
              ];
              latestCounts[quizIndex] = solveCount;
              replaceSnapshot({
                progress: {
                  ...progressRef.current,
                  [studentName]: latestCounts,
                },
                resetGenerations: {
                  ...resetGenerationsRef.current,
                  [quizIndex]: resetGeneration,
                },
                studentResetGenerations: {
                  ...studentResetGenerationsRef.current,
                  [studentName]: {
                    ...studentResetGenerationsRef.current[studentName],
                    [quizIndex]: studentResetGeneration,
                  },
                },
              });
            },
          )
          .catch(() => {
            if (
              mutationVersionsRef.current[mutationKey] === mutationVersion
            ) {
              void refreshRemoteProgress().catch(() => undefined);
            }
          }),
      );

      return true;
    },
    [
      refreshRemoteProgress,
      replaceProgress,
      replaceSnapshot,
      trackQuizMutation,
    ],
  );

  const undoQuiz = useCallback(
    (studentName: string, quizIndex: number) => {
      if (
        !Number.isInteger(quizIndex) ||
        quizIndex < 0 ||
        quizIndex >= MAX_QUIZ_COUNT ||
        resettingQuizIndexesRef.current.has(quizIndex)
      ) {
        return Promise.resolve(false);
      }

      const current = progressRef.current;
      const counts = [...(current[studentName] ?? [])];
      const currentCount = counts[quizIndex] ?? 0;
      if (currentCount <= 0) return Promise.resolve(false);
      const expectedResetGeneration =
        resetGenerationsRef.current[quizIndex] ?? 0;
      const expectedStudentResetGeneration =
        studentResetGenerationsRef.current[studentName]?.[quizIndex] ?? 0;

      counts[quizIndex] = currentCount - 1;
      replaceProgress({ ...current, [studentName]: counts });

      const mutationKey = `${studentName}:${quizIndex}`;
      const mutationVersion =
        (mutationVersionsRef.current[mutationKey] ?? 0) + 1;
      mutationVersionsRef.current[mutationKey] = mutationVersion;

      const pendingMutations = Array.from(
        pendingMutationsByQuizRef.current.get(quizIndex) ?? [],
      );
      const mutation = Promise.all(pendingMutations)
        .then(() =>
          decrementQuizProgress(
            studentName,
            quizIndex,
            expectedResetGeneration,
            expectedStudentResetGeneration,
          ),
        )
        .then(({ solveCount, resetGeneration, studentResetGeneration }) => {
          if (mutationVersionsRef.current[mutationKey] !== mutationVersion) {
            return true;
          }
          const latestCounts = [
            ...(progressRef.current[studentName] ?? []),
          ];
          latestCounts[quizIndex] = solveCount;
          replaceSnapshot({
            progress: {
              ...progressRef.current,
              [studentName]: latestCounts,
            },
            resetGenerations: {
              ...resetGenerationsRef.current,
              [quizIndex]: resetGeneration,
            },
            studentResetGenerations: {
              ...studentResetGenerationsRef.current,
              [studentName]: {
                ...studentResetGenerationsRef.current[studentName],
                [quizIndex]: studentResetGeneration,
              },
            },
          });
          return true;
        })
        .catch(() => {
          if (mutationVersionsRef.current[mutationKey] === mutationVersion) {
            void refreshRemoteProgress().catch(() => undefined);
          }
          return false;
        });

      trackQuizMutation(quizIndex, mutation.then(() => undefined));
      return mutation;
    },
    [
      refreshRemoteProgress,
      replaceProgress,
      replaceSnapshot,
      trackQuizMutation,
    ],
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
            Array.from(
              pendingMutationsByQuizRef.current.get(quizIndex) ?? [],
            ),
          );
          await Promise.all(pendingMutations);
          const expectedResetGenerations = round.quizIndexes.map(
            (quizIndex) => resetGenerationsRef.current[quizIndex] ?? 0,
          );
          const nextResetGenerations = await resetQuizRoundProgress(
            round,
            expectedResetGenerations,
          );

          const nextProgress = Object.fromEntries(
            Object.entries(progressRef.current).map(
              ([studentName, studentCounts]) => {
                const nextCounts = [...studentCounts];
                round.quizIndexes.forEach((quizIndex) => {
                  if (quizIndex < nextCounts.length) nextCounts[quizIndex] = 0;
                });
                return [studentName, nextCounts];
              },
            ),
          );
          replaceSnapshot({
            progress: nextProgress,
            resetGenerations: {
              ...resetGenerationsRef.current,
              ...nextResetGenerations,
            },
            studentResetGenerations: studentResetGenerationsRef.current,
          });
        } catch (error) {
          void refreshRemoteProgress().catch(() => undefined);
          throw error;
        } finally {
          round.quizIndexes.forEach((quizIndex) =>
            resettingQuizIndexesRef.current.delete(quizIndex),
          );
        }
      })();

      resetPromisesByRoundRef.current.set(round.id, reset);
      const clearResetPromise = () => {
        if (resetPromisesByRoundRef.current.get(round.id) === reset) {
          resetPromisesByRoundRef.current.delete(round.id);
        }
      };
      void reset.then(clearResetPromise, clearResetPromise);
      return reset;
    },
    [refreshRemoteProgress, replaceSnapshot],
  );

  return {
    progress,
    resetGenerations,
    studentResetGenerations,
    isReady,
    awardQuizStage,
    undoQuiz,
    resetQuizRound,
  };
}
