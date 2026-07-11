"use client";

import { useCallback, useEffect, useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { numberKeys, operatorKeys } from "./mathGameData";
import { getKeyboardToken, isEditableTarget } from "./mathExpression";
import type { ExpressionPreview } from "./types";

const buttonRepeatDelay = 360;
const inputRepeatInterval = 120;
const deleteRepeatInterval = 85;

type ExpressionKeypadProps = {
  expression: string;
  preview: ExpressionPreview;
  isCommitted: boolean;
  onAddToken: (token: string) => void;
  onRemoveToken: () => void;
  onClear: () => void;
  onCommit: () => void;
};

export default function ExpressionKeypad({
  expression,
  preview,
  isCommitted,
  onAddToken,
  onRemoveToken,
  onClear,
  onCommit,
}: ExpressionKeypadProps) {
  const repeatDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeatPress = useCallback(() => {
    if (repeatDelayRef.current) clearTimeout(repeatDelayRef.current);
    if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
    repeatDelayRef.current = null;
    repeatIntervalRef.current = null;
  }, []);

  const startRepeatPress = useCallback((action: () => void, interval: number) => {
    stopRepeatPress();
    action();
    repeatDelayRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(action, interval);
    }, buttonRepeatDelay);
  }, [stopRepeatPress]);

  function handleRepeatPointerDown(
    event: PointerEvent<HTMLButtonElement>,
    action: () => void,
    interval: number,
  ) {
    event.preventDefault();
    startRepeatPress(action, interval);
  }

  function handleRepeatKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    action: () => void,
    interval: number,
  ) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) startRepeatPress(action, interval);
  }

  function handleRepeatKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    stopRepeatPress();
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
      const token = getKeyboardToken(event.key, event.code);
      if (token) {
        event.preventDefault();
        onAddToken(token);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        onRemoveToken();
      }
    }

    const stop = () => stopRepeatPress();
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerup", stop);
    window.addEventListener("blur", stop);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("blur", stop);
      stopRepeatPress();
    };
  }, [onAddToken, onRemoveToken, stopRepeatPress]);

  return (
    <aside className="progress-scroll flex min-h-0 flex-col overflow-y-auto rounded-2xl border border-[#e1d6ed] bg-[#faf7ff] p-4 shadow-[0_12px_30px_rgba(111,92,130,0.09)] sm:p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em]">숫자 입력</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b7a6df] bg-[#eee8fa] text-lg font-bold text-[#7c68b8]">=</span>
      </div>

      <div className="mb-4 min-h-[90px] rounded-xl border border-[#dfd5e8] bg-white/80 p-4 shadow-[inset_0_0_30px_rgba(174,145,196,0.04)]">
        <p className="text-[9px] font-bold tracking-[0.18em] text-[#9b909f]">내가 만든 식</p>
        <div className="mt-2 flex min-h-9 items-center justify-end overflow-hidden font-mono text-2xl font-bold tracking-[0.08em] text-[#443b50]">
          {expression || <span className="text-[#c3b8c6]">0</span>}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#eee6ef] pt-2">
          <span className="text-[10px] text-[#9b909f]">{preview.label}</span>
          {preview.result && <span className="font-mono text-sm font-bold text-[#4b9aa6]">{preview.result}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {numberKeys.map((key) => (
          <button
            key={key.value}
            type="button"
            onPointerDown={(event) => handleRepeatPointerDown(event, () => onAddToken(key.value), inputRepeatInterval)}
            onPointerUp={stopRepeatPress}
            onPointerCancel={stopRepeatPress}
            onPointerLeave={stopRepeatPress}
            onKeyDown={(event) => handleRepeatKeyDown(event, () => onAddToken(key.value), inputRepeatInterval)}
            onKeyUp={handleRepeatKeyUp}
            onBlur={stopRepeatPress}
            className={`flex aspect-[1.22] items-center justify-center rounded-xl text-2xl font-black transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 ${key.color} ${key.shadow} ${key.text}`}
            aria-label={`${key.value} 입력`}
          >
            {key.value}
          </button>
        ))}
        <button
          type="button"
          onPointerDown={(event) => handleRepeatPointerDown(event, onRemoveToken, deleteRepeatInterval)}
          onPointerUp={stopRepeatPress}
          onPointerCancel={stopRepeatPress}
          onPointerLeave={stopRepeatPress}
          onKeyDown={(event) => handleRepeatKeyDown(event, onRemoveToken, deleteRepeatInterval)}
          onKeyUp={handleRepeatKeyUp}
          onBlur={stopRepeatPress}
          className="flex aspect-[1.22] items-center justify-center rounded-xl border border-[#ddd3e2] bg-[#eee9f1] text-xl font-bold text-[#766c7d] shadow-[0_5px_0_#d3c8d7] transition hover:-translate-y-0.5 hover:bg-[#e8e0eb] active:translate-y-0"
          aria-label="한 글자 지우기"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={onClear}
          className="flex aspect-[1.22] items-center justify-center rounded-xl border border-[#e7b7bf] bg-[#f8e2e6] text-[11px] font-bold uppercase tracking-wider text-[#a95d6b] shadow-[0_5px_0_#d9bfc4] transition hover:-translate-y-0.5 hover:bg-[#f4d8dd] active:translate-y-0"
          aria-label="전체 지우기"
        >
          모두 지우기
        </button>
      </div>

      <div className="my-4 h-px bg-[#e6ddea]" />

      <div className="grid grid-cols-3 gap-2.5">
        {operatorKeys.map((key) => (
          <button
            key={key.value}
            type="button"
            onPointerDown={(event) => handleRepeatPointerDown(event, () => onAddToken(key.value), inputRepeatInterval)}
            onPointerUp={stopRepeatPress}
            onPointerCancel={stopRepeatPress}
            onPointerLeave={stopRepeatPress}
            onKeyDown={(event) => handleRepeatKeyDown(event, () => onAddToken(key.value), inputRepeatInterval)}
            onKeyUp={handleRepeatKeyUp}
            onBlur={stopRepeatPress}
            className={`flex aspect-[1.45] items-center justify-center rounded-xl text-xl font-black transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 ${key.color} ${key.shadow} ${key.text}`}
            aria-label={`${key.value} 입력`}
          >
            {key.value}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onCommit}
        disabled={!expression || !preview.result}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9edce3] to-[#b9afe8] px-4 text-sm font-black text-[#443b50] shadow-[0_5px_0_#8fadc2] transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-105 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-30"
      >
        <span>{isCommitted ? "탐구 완료" : "입체 공간에 적용"}</span>
        <span aria-hidden="true">→</span>
      </button>

      <p className="mt-3 text-center text-[10px] leading-4 text-[#9b909f]">
        키보드와 숫자 패드를 모두 사용할 수 있습니다
      </p>
    </aside>
  );
}
