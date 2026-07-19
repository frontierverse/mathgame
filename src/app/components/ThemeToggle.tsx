"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  isDocumentUsingLightTheme,
  setLightTheme,
  subscribeToTheme,
} from "../themeClient";

export default function ThemeToggle() {
  const isLightTheme = useSyncExternalStore(
    subscribeToTheme,
    isDocumentUsingLightTheme,
    () => false,
  );

  const toggleTheme = useCallback(() => {
    setLightTheme(!isLightTheme);
  }, [isLightTheme]);

  return (
    <button
      type="button"
      role="switch"
      aria-label="라이트 테마"
      aria-checked={isLightTheme}
      onClick={toggleTheme}
      className="theme-toggle flex h-11 shrink-0 items-center gap-2 rounded-xl px-2 transition"
    >
      <span aria-hidden="true" className="theme-toggle-icon relative h-5 w-5">
        <span className="theme-toggle-sun absolute inset-0 flex items-center justify-center text-lg leading-none">
          ☀
        </span>
        <span className="theme-toggle-moon absolute inset-0 flex items-center justify-center text-lg leading-none">
          ☾
        </span>
      </span>
      <span
        aria-hidden="true"
        className="theme-toggle-track relative block h-7 w-12 rounded-full p-1 transition-colors"
      >
        <span
          className="theme-toggle-thumb block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
        />
      </span>
    </button>
  );
}
