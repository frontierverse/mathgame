"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_QUIZ_COUNT,
  MAX_SOLVES,
  type QuizMineralStage,
} from "./quizData";
import type { QuizProgress } from "./quizProgress";

const STORAGE_KEY = "math-space-quiz-progress-v7";
const RESET_STORAGE_KEYS = [
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

function mergeProgress(remote: QuizProgress, local: QuizProgress, students: string[]) {
  const merged: QuizProgress = { ...remote };
  students.forEach((studentName) => {
    const remoteCounts = remote[studentName] ?? [];
    const localCounts = local[studentName] ?? [];
    const length = Math.max(remoteCounts.length, localCounts.length);
    if (length === 0) return;
    merged[studentName] = Array.from({ length }, (_, index) =>
      Math.max(remoteCounts[index] ?? 0, localCounts[index] ?? 0),
    );
  });
  return merged;
}

async function persistQuizProgress(studentName: string, quizIndex: number, solveCount: number) {
  const response = await fetch("/api/quiz-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentName, quizIndex, solveCount }),
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
    body: JSON.stringify({ studentName, quizIndex }),
  });
  if (!response.ok) throw new Error("Quiz progress decrement failed.");

  const data: unknown = await response.json();
  const serverCount = (data as { solveCount?: unknown })?.solveCount;
  if (!Number.isInteger(serverCount)) throw new Error("Quiz progress response is invalid.");
  return serverCount as number;
}

export default function useQuizProgress(students: string[]) {
  const [progress, setProgress] = useState<QuizProgress>({});
  const [isReady, setIsReady] = useState(false);
  const progressRef = useRef<QuizProgress>({});
  const mutationVersionsRef = useRef<Record<string, number>>({});

  const replaceProgress = useCallback((next: QuizProgress) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

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
        const merged = mergeProgress(remote, local, students);
        if (!active) return;
        replaceProgress(merged);
        saveLocalProgress(merged);
        setIsReady(true);

        students.forEach((studentName) => {
          const localCounts = local[studentName] ?? [];
          const remoteCounts = remote[studentName] ?? [];
          localCounts.forEach((count, quizIndex) => {
            if (count > (remoteCounts[quizIndex] ?? 0)) {
              void persistQuizProgress(studentName, quizIndex, count).catch(() => undefined);
            }
          });
        });
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
  }, [replaceProgress, students]);

  const awardQuizStage = useCallback(
    (studentName: string, quizIndex: number, targetStage: QuizMineralStage) => {
      if (!Number.isInteger(quizIndex) || quizIndex < 0 || quizIndex >= MAX_QUIZ_COUNT) {
        return false;
      }

      const current = progressRef.current;
      const counts = [...(current[studentName] ?? [])];
      while (counts.length <= quizIndex) counts.push(0);
      const currentStage = counts[quizIndex] ?? 0;
      const validTransition =
        (currentStage === 0 && (targetStage === 1 || targetStage === MAX_SOLVES)) ||
        (currentStage === 1 && targetStage === 2) ||
        (currentStage === 2 && targetStage === MAX_SOLVES);
      if (!validTransition) return false;

      counts[quizIndex] = targetStage;
      const next = { ...current, [studentName]: counts };
      replaceProgress(next);
      saveLocalProgress(next);

      const mutationKey = `${studentName}:${quizIndex}`;
      const mutationVersion = (mutationVersionsRef.current[mutationKey] ?? 0) + 1;
      mutationVersionsRef.current[mutationKey] = mutationVersion;

      void persistQuizProgress(studentName, quizIndex, counts[quizIndex])
        .then((serverCount) => {
          if (mutationVersionsRef.current[mutationKey] !== mutationVersion) return;
          const latest = progressRef.current;
          const latestCounts = [...(latest[studentName] ?? [])];
          latestCounts[quizIndex] = serverCount;
          const reconciled = { ...latest, [studentName]: latestCounts };
          replaceProgress(reconciled);
          saveLocalProgress(reconciled);
        })
        .catch(() => undefined);

      return true;
    },
    [replaceProgress],
  );

  const undoQuiz = useCallback(
    (studentName: string, quizIndex: number) => {
      if (!Number.isInteger(quizIndex) || quizIndex < 0 || quizIndex >= MAX_QUIZ_COUNT) return;

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

      void decrementQuizProgress(studentName, quizIndex)
        .then((serverCount) => {
          if (mutationVersionsRef.current[mutationKey] !== mutationVersion) return;
          const latest = progressRef.current;
          const latestCounts = [...(latest[studentName] ?? [])];
          latestCounts[quizIndex] = serverCount;
          const reconciled = { ...latest, [studentName]: latestCounts };
          replaceProgress(reconciled);
          saveLocalProgress(reconciled);
        })
        .catch(() => undefined);
    },
    [replaceProgress],
  );

  return { progress, isReady, awardQuizStage, undoQuiz };
}
