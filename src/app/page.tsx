"use client";

import { Suspense, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MathGameLayout from "./components/MathGameLayout";
import { getLessonIdFromQuery, lessons } from "./components/mathGameData";
import { getPreview } from "./components/mathExpression";
import type { CircleAreaStage, TriangleAreaStage } from "./components/types";

const COMPLETED_LESSONS_STORAGE_KEY = "math-space-completed-lessons";
const PROGRESS_CHANGE_EVENT = "math-space-progress-change";

function parseCompletedLessonIds(value: string | null) {
  try {
    const savedLessonIds: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(savedLessonIds)) return [];

    const validLessonIds = new Set(lessons.map((lesson) => lesson.id));
    return savedLessonIds.filter(
      (lessonId): lessonId is string =>
        typeof lessonId === "string" && validLessonIds.has(lessonId),
    );
  } catch {
    return [];
  }
}

function subscribeToProgress(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === COMPLETED_LESSONS_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(PROGRESS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(PROGRESS_CHANGE_EVENT, onStoreChange);
  };
}

function getProgressSnapshot() {
  return window.localStorage.getItem(COMPLETED_LESSONS_STORAGE_KEY) ?? "[]";
}

function getServerProgressSnapshot() {
  return "[]";
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fbf4e7]" />}>
      <MathGame />
    </Suspense>
  );
}

function MathGame() {
  const [expression, setExpression] = useState("");
  const completedLessonIdsSnapshot = useSyncExternalStore(
    subscribeToProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
  const completedLessonIds = useMemo(
    () => parseCompletedLessonIds(completedLessonIdsSnapshot),
    [completedLessonIdsSnapshot],
  );
  const [isCommitted, setIsCommitted] = useState(false);
  const [triangleAreaStageFor, setTriangleAreaStageFor] = useState<{
    lessonId: string;
    stage: TriangleAreaStage;
  } | null>(null);
  const [circleAreaStageFor, setCircleAreaStageFor] = useState<{
    lessonId: string;
    stage: CircleAreaStage;
  } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedLessonId = getLessonIdFromQuery(searchParams.get("lesson"));
  const triangleAreaStage =
    triangleAreaStageFor?.lessonId === selectedLessonId ? triangleAreaStageFor.stage : 0;
  const circleAreaStage = circleAreaStageFor?.lessonId === selectedLessonId ? circleAreaStageFor.stage : 0;
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const preview = useMemo(() => getPreview(expression), [expression]);
  const sceneExpression = expression || selectedLesson.example;

  const updateCompletedLessonIds = useCallback((update: (current: string[]) => string[]) => {
    const current = parseCompletedLessonIds(
      window.localStorage.getItem(COMPLETED_LESSONS_STORAGE_KEY),
    );
    const next = update(current);
    window.localStorage.setItem(
      COMPLETED_LESSONS_STORAGE_KEY,
      JSON.stringify(next),
    );
    window.dispatchEvent(new Event(PROGRESS_CHANGE_EVENT));
  }, []);

  const selectLesson = useCallback((lessonId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lesson", lessonId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsCommitted(false);
    setTriangleAreaStageFor(null);
    setCircleAreaStageFor(null);
  }, [pathname, router, searchParams]);

  const addToken = useCallback((token: string) => {
    setIsCommitted(false);
    setExpression((current) => `${current}${token}`);
  }, []);

  const removeToken = useCallback(() => {
    setIsCommitted(false);
    setExpression((current) => current.slice(0, -1));
  }, []);

  const clearExpression = useCallback(() => {
    setExpression("");
    setIsCommitted(false);
  }, []);

  const commitExpression = useCallback(() => {
    if (!expression || !preview.result) return;
    setIsCommitted(true);
    updateCompletedLessonIds((current) =>
      current.includes(selectedLessonId) ? current : [...current, selectedLessonId],
    );
  }, [expression, preview.result, selectedLessonId, updateCompletedLessonIds]);

  const toggleLessonComplete = useCallback((lessonId: string) => {
    updateCompletedLessonIds((current) =>
      current.includes(lessonId)
        ? current.filter((completedLessonId) => completedLessonId !== lessonId)
        : [...current, lessonId],
    );
    if (lessonId === selectedLessonId) setIsCommitted(false);
  }, [selectedLessonId, updateCompletedLessonIds]);

  const changeTriangleAreaStage = useCallback((stage: TriangleAreaStage) => {
    setTriangleAreaStageFor({ lessonId: selectedLessonId, stage });
  }, [selectedLessonId]);

  const changeCircleAreaStage = useCallback((stage: CircleAreaStage) => {
    setCircleAreaStageFor({ lessonId: selectedLessonId, stage });
  }, [selectedLessonId]);

  return (
    <MathGameLayout
      lessons={lessons}
      selectedLesson={selectedLesson}
      completedLessonIds={completedLessonIds}
      expression={expression}
      sceneExpression={sceneExpression}
      preview={preview}
      isCommitted={isCommitted}
      triangleAreaStage={triangleAreaStage}
      circleAreaStage={circleAreaStage}
      onSelectLesson={selectLesson}
      onToggleLessonComplete={toggleLessonComplete}
      onAddToken={addToken}
      onRemoveToken={removeToken}
      onClearExpression={clearExpression}
      onCommitExpression={commitExpression}
      onTriangleAreaStageChange={changeTriangleAreaStage}
      onCircleAreaStageChange={changeCircleAreaStage}
    />
  );
}
