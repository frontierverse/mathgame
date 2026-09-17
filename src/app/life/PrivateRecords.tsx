"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./life.module.css";

export default function PrivateRecords({
  children,
  onReveal,
}: {
  children: ReactNode;
  onReveal: () => Promise<boolean>;
}) {
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);
  const generation = useRef(0);
  const panelId = useId();

  useEffect(() => {
    const conceal = () => {
      generation.current += 1;
      setRevealed(false);
    };
    const onVisibilityChange = () => {
      if (document.hidden) conceal();
    };
    window.addEventListener("blur", conceal);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", conceal);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  async function toggle() {
    const current = ++generation.current;
    if (revealed) {
      setRevealed(false);
      return;
    }
    setPending(true);
    try {
      const authorized = await onReveal();
      if (authorized && current === generation.current && !document.hidden)
        setRevealed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.privateRecords} aria-label="관리자 전용 기록">
      <div className={styles.privacyBar}>
        <span>{revealed ? "관리자만 보는 기록" : "기록이 가려져 있어요"}</span>
        <button
          type="button"
          className={styles.secondary}
          aria-expanded={revealed}
          aria-controls={panelId}
          disabled={pending}
          onClick={() => void toggle()}
        >
          {pending ? "확인 중…" : revealed ? "기록 가리기" : "기록 보기"}
        </button>
      </div>
      <div id={panelId}>
        {revealed ? (
          children
        ) : (
          <p className={styles.concealedRecords}>
            다른 학생이 없는 곳에서 확인해 주세요
          </p>
        )}
      </div>
    </section>
  );
}
