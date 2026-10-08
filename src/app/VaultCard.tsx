"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { MoveHorizontal } from "lucide-react";
import { formatWon } from "./curriculum";
import { compactDate } from "./studentProgress";

export default function VaultCard({ amount, daysLeft, startDate, payoutDate, cycleProgress = 0, onOpen }: {
  amount: number;
  daysLeft: number | null;
  startDate?: string | null;
  payoutDate?: string | null;
  cycleProgress?: number;
  onOpen?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const detailsId = useId();
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const conceal = () => { origin.current = null; setRevealed(false); };
    window.addEventListener("blur", conceal);
    document.addEventListener("visibilitychange", conceal);
    return () => { window.removeEventListener("blur", conceal); document.removeEventListener("visibilitychange", conceal); };
  }, []);

  function start(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    origin.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dragged.current = false;
    setRevealed(false);
  }
  function move(event: PointerEvent<HTMLElement>) {
    const press = origin.current;
    if (!press || press.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - press.x), dy = Math.abs(event.clientY - press.y);
    // Vertical scrolling must never reveal a student's dates.
    if (!dragged.current && dy > 12 && dy >= dx) { origin.current = null; return; }
    if (!dragged.current && dx >= 32 && dx > dy * 1.5) {
      dragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setRevealed(true);
    }
  }
  function hide(event: PointerEvent<HTMLElement>) {
    origin.current = null;
    setRevealed(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setRevealed(true); }
  }
  function keyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setRevealed(false); }
  }
  const gesture = {
    onPointerDown: start, onPointerMove: move, onPointerUp: hide, onPointerCancel: hide,
    onLostPointerCapture: () => { origin.current = null; setRevealed(false); },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) hide(event); },
    onBlurCapture: (event: FocusEvent<HTMLElement>) => {
      setRevealed(false);
      if (!event.currentTarget.contains(event.relatedTarget)) origin.current = null;
    },
    onKeyDownCapture: () => { dragged.current = false; },
    onClickCapture: (event: MouseEvent<HTMLElement>) => { if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; } },
  };
  const handle = <button type="button" className={`vault-reveal-handle ${revealed ? "revealed" : ""}`}
    aria-label={`${revealed ? `${daysLeft === null ? "날짜 미등록" : `D-${daysLeft}`}. ` : ""}금고 일정 보기: 좌우로 끌면 표시, 놓으면 숨김. 키보드는 Enter 또는 Space를 누르고 있는 동안 표시.`}
    aria-expanded={revealed} aria-controls={detailsId} aria-describedby={revealed ? detailsId : undefined}
    onKeyDown={keyDown} onKeyUp={keyUp}>
    {revealed ? <span className="countdown-pill">{daysLeft === null ? "—" : `D-${daysLeft}`}</span> : <MoveHorizontal size={20} aria-hidden="true" />}
  </button>;

  if (onOpen) return <div className="vault-summary vault-gesture" {...gesture}>
    <button type="button" className="vault-open" onClick={onOpen}><span><span className="vault-label">내 적립 금고</span><strong>{formatWon(amount)}</strong></span></button>
    <span id={detailsId} className="vault-summary-timing">{handle}</span>
  </div>;

  return <article className="vault-card vault-gesture" {...gesture}>
    <div className="card-topline"><span>적립 금고</span>{handle}</div><h2>{formatWon(amount)}</h2>
    <div id={detailsId} className="vault-timing-details">{revealed && <>
      <progress max={100} value={cycleProgress} aria-label="적립 기간 경과" />
      <div className="vault-dates"><span>{startDate ? compactDate(startDate) : "—"}</span><span>퇴소 {payoutDate ? compactDate(payoutDate) : "—"}</span></div>
    </>}</div>
  </article>;
}
