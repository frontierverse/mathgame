"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import useQuizAttemptRecorder, {
  QUIZ_ATTEMPT_RECENT_STORAGE_KEY,
  getPendingQuizAttemptCount,
} from "../progress/useQuizAttemptRecorder";

function pendingAttemptCount() {
  return getPendingQuizAttemptCount();
}

function hasRecentAttempt() {
  try {
    return window.sessionStorage.getItem(QUIZ_ATTEMPT_RECENT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function clearRecentAttempt() {
  try {
    window.sessionStorage.removeItem(QUIZ_ATTEMPT_RECENT_STORAGE_KEY);
  } catch {
    // The refresh guard is best-effort when session storage is unavailable.
  }
}

export default function AttemptSyncStatus() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const refreshRequestedRef = useRef(false);
  const sawPendingAttemptRef = useRef(false);

  useQuizAttemptRecorder();

  useEffect(() => {
    const checkPendingAttempts = () => {
      const pendingCount = pendingAttemptCount();
      if (pendingCount > 0) {
        sawPendingAttemptRef.current = true;
        setSyncing(true);
        return;
      }
      if (!sawPendingAttemptRef.current && !hasRecentAttempt()) {
        setSyncing(false);
        return;
      }
      if (refreshRequestedRef.current) return;

      refreshRequestedRef.current = true;
      clearRecentAttempt();
      setSyncing(false);
      router.refresh();
    };

    checkPendingAttempts();
    const timer = window.setInterval(checkPendingAttempts, 250);
    return () => window.clearInterval(timer);
  }, [router]);

  return syncing ? (
    <p
      className="mt-3 text-xs font-bold text-[var(--muted)]"
      role="status"
      aria-live="polite"
    >
      기록 저장 중…
    </p>
  ) : null;
}
