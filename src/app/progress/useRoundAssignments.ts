"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CURRICULUM_QUIZ_ROUNDS } from "./quizData";

export type RoundAssignmentOverrides = Record<string, string[]>;

const STORAGE_KEY = "math-space-round-assignment-overrides-v1";
const PENDING_STORAGE_KEY = "math-space-round-assignment-pending-v1";
const KNOWN_ROUND_IDS = new Set(CURRICULUM_QUIZ_ROUNDS.map((round) => round.id));

function uniqueTrimmedStrings(values: readonly string[]) {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [normalized];
  });
}

function normalizeCurrentRoundIds(roundIds: readonly string[]) {
  return uniqueTrimmedStrings(roundIds).filter((roundId) => KNOWN_ROUND_IDS.has(roundId));
}

function normalizeOverrides(
  value: unknown,
  currentRoundIds: ReadonlySet<string>,
  currentStudentNames: ReadonlySet<string>,
) {
  const normalized: RoundAssignmentOverrides = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return normalized;

  Object.entries(value).forEach(([roundId, rawStudentNames]) => {
    if (!currentRoundIds.has(roundId) || !Array.isArray(rawStudentNames)) return;

    const seen = new Set<string>();
    normalized[roundId] = rawStudentNames.flatMap((valueEntry) => {
      if (typeof valueEntry !== "string") return [];
      const studentName = valueEntry.trim();
      if (!studentName || !currentStudentNames.has(studentName) || seen.has(studentName)) return [];
      seen.add(studentName);
      return [studentName];
    });
  });

  return normalized;
}

function loadLocalOverrides(
  currentRoundIds: ReadonlySet<string>,
  currentStudentNames: ReadonlySet<string>,
) {
  if (typeof window === "undefined") return {};
  try {
    const savedOverrides = window.localStorage.getItem(STORAGE_KEY);
    return savedOverrides === null
      ? {}
      : normalizeOverrides(JSON.parse(savedOverrides), currentRoundIds, currentStudentNames);
  } catch {
    return {};
  }
}

function saveLocalOverrides(overrides: RoundAssignmentOverrides) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Local storage is only a fallback cache.
  }
}

function loadPendingRoundIds(currentRoundIds: ReadonlySet<string>) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const savedRoundIds: unknown = JSON.parse(
      window.localStorage.getItem(PENDING_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(savedRoundIds)) return new Set<string>();
    return new Set(
      savedRoundIds.filter(
        (roundId): roundId is string =>
          typeof roundId === "string" && currentRoundIds.has(roundId),
      ),
    );
  } catch {
    return new Set<string>();
  }
}

function savePendingRoundIds(roundIds: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify([...roundIds]));
  } catch {
    // The pending marker is only used to retry local fallback writes.
  }
}

async function persistRoundAssignment(roundId: string, studentNames: readonly string[]) {
  const response = await fetch("/api/round-assignments", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roundId, studentNames }),
  });
  if (!response.ok) throw new Error("Round assignment persistence failed.");

  const data: unknown = await response.json();
  return (data as { assignment?: unknown })?.assignment;
}

export default function useRoundAssignments(
  roundIds: readonly string[],
  studentNames: readonly string[],
) {
  const roundIdsKey = JSON.stringify(normalizeCurrentRoundIds(roundIds));
  const studentNamesKey = JSON.stringify(uniqueTrimmedStrings(studentNames).sort());
  const currentRoundIds = useMemo(
    () => new Set(JSON.parse(roundIdsKey) as string[]),
    [roundIdsKey],
  );
  const currentStudentNames = useMemo(
    () => new Set(JSON.parse(studentNamesKey) as string[]),
    [studentNamesKey],
  );
  const [overrides, setOverrides] = useState<RoundAssignmentOverrides>({});
  const [isReady, setIsReady] = useState(false);
  const overridesRef = useRef<RoundAssignmentOverrides>({});
  const mutationVersionsRef = useRef<Record<string, number>>({});
  const pendingRoundIdsRef = useRef(new Set<string>());
  const persistChainsRef = useRef<Record<string, Promise<void>>>({});

  const replaceOverrides = useCallback((next: RoundAssignmentOverrides) => {
    overridesRef.current = next;
    setOverrides(next);
  }, []);

  const enqueuePersist = useCallback(
    (
      roundId: string,
      studentNamesForRequest: readonly string[],
      mutationVersion: number,
    ) => {
      const persist = async () => {
        const assignment = await persistRoundAssignment(
          roundId,
          studentNamesForRequest,
        );
        if (mutationVersionsRef.current[roundId] !== mutationVersion) return;

        const normalizedResponse = normalizeOverrides(
          assignment && typeof assignment === "object"
            ? {
                [roundId]: (assignment as { studentNames?: unknown }).studentNames,
              }
            : null,
          currentRoundIds,
          currentStudentNames,
        );
        if (!Object.hasOwn(normalizedResponse, roundId)) {
          throw new Error("Invalid round assignment response.");
        }

        const reconciled = {
          ...overridesRef.current,
          [roundId]: normalizedResponse[roundId],
        };
        pendingRoundIdsRef.current.delete(roundId);
        replaceOverrides(reconciled);
        saveLocalOverrides(reconciled);
        savePendingRoundIds(pendingRoundIdsRef.current);
      };

      const previous = persistChainsRef.current[roundId] ?? Promise.resolve();
      const queued = previous
        .catch(() => undefined)
        .then(persist)
        .catch(() => undefined);
      persistChainsRef.current[roundId] = queued;
    },
    [currentRoundIds, currentStudentNames, replaceOverrides],
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const mutationVersionsAtLoad = { ...mutationVersionsRef.current };

    const load = async () => {
      const local = loadLocalOverrides(currentRoundIds, currentStudentNames);
      const locallyPendingRoundIds = loadPendingRoundIds(currentRoundIds);
      locallyPendingRoundIds.forEach((roundId) =>
        pendingRoundIdsRef.current.add(roundId),
      );

      const applyLoadedOverrides = (base: RoundAssignmentOverrides) => {
        const next = { ...base };
        locallyPendingRoundIds.forEach((roundId) => {
          if (Object.hasOwn(local, roundId)) next[roundId] = local[roundId];
          else pendingRoundIdsRef.current.delete(roundId);
        });
        currentRoundIds.forEach((roundId) => {
          if (
            (mutationVersionsRef.current[roundId] ?? 0) !==
              (mutationVersionsAtLoad[roundId] ?? 0) &&
            Object.hasOwn(overridesRef.current, roundId)
          ) {
            next[roundId] = overridesRef.current[roundId];
          }
        });
        replaceOverrides(next);
        saveLocalOverrides(next);
        savePendingRoundIds(pendingRoundIdsRef.current);

        locallyPendingRoundIds.forEach((roundId) => {
          const mutationVersion = mutationVersionsAtLoad[roundId] ?? 0;
          if (
            (mutationVersionsRef.current[roundId] ?? 0) === mutationVersion &&
            Object.hasOwn(next, roundId)
          ) {
            enqueuePersist(roundId, next[roundId], mutationVersion);
          }
        });
      };

      try {
        const response = await fetch("/api/round-assignments", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Round assignment request failed.");

        const data: unknown = await response.json();
        const remote = normalizeOverrides(
          (data as { assignments?: unknown })?.assignments,
          currentRoundIds,
          currentStudentNames,
        );
        if (!active) return;
        applyLoadedOverrides(remote);
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        applyLoadedOverrides(local);
      } finally {
        if (active) setIsReady(true);
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [currentRoundIds, currentStudentNames, enqueuePersist, replaceOverrides]);

  const saveRoundAssignment = useCallback(
    (roundId: string, nextStudentNames: readonly string[]) => {
      const normalizedRoundId = roundId.trim();
      if (!currentRoundIds.has(normalizedRoundId)) return false;

      const normalizedStudentNames = uniqueTrimmedStrings(nextStudentNames).filter((studentName) =>
        currentStudentNames.has(studentName),
      );
      const next = {
        ...overridesRef.current,
        [normalizedRoundId]: normalizedStudentNames,
      };
      replaceOverrides(next);
      saveLocalOverrides(next);

      const mutationVersion = (mutationVersionsRef.current[normalizedRoundId] ?? 0) + 1;
      mutationVersionsRef.current[normalizedRoundId] = mutationVersion;
      pendingRoundIdsRef.current.add(normalizedRoundId);
      savePendingRoundIds(pendingRoundIdsRef.current);
      enqueuePersist(normalizedRoundId, normalizedStudentNames, mutationVersion);

      return true;
    },
    [currentRoundIds, currentStudentNames, enqueuePersist, replaceOverrides],
  );

  return { overrides, isReady, saveRoundAssignment };
}
