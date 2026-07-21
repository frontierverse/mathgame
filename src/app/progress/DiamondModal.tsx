"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import MineralObject from "./MineralObject";
import QuizDetail from "./QuizDetail";
import { quizTextForIndex, type QuizMineralStage } from "./quizData";

type DiamondModalProps = {
  studentName: string;
  diamondIndex: number;
  rubyQuizIndexes: readonly number[];
  counts: number[];
  onAwardQuiz: (quizIndex: number, stage: QuizMineralStage) => void;
  onUndoQuiz: (quizIndex: number) => void;
  onClose: () => void;
};

export default function DiamondModal({
  studentName,
  diamondIndex,
  rubyQuizIndexes,
  counts,
  onAwardQuiz,
  onUndoQuiz,
  onClose,
}: DiamondModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(
    rubyQuizIndexes[0] ?? null,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const rubyGridRef = useRef<HTMLDivElement>(null);
  const rubyButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusRubyCard = (rubyIndex: number) => {
    const rubyCount = rubyQuizIndexes.length;
    if (rubyCount === 0) return;

    const wrappedRubyIndex = (rubyIndex + rubyCount) % rubyCount;
    setSelectedQuizIndex(rubyQuizIndexes[wrappedRubyIndex]);
    rubyButtonRefs.current[wrappedRubyIndex]?.focus();
  };

  const getRubyGridColumnCount = () => {
    const grid = rubyGridRef.current;
    if (!grid) return 1;

    const gridTemplateColumns = window.getComputedStyle(grid).gridTemplateColumns;
    if (!gridTemplateColumns || gridTemplateColumns === "none") return 1;

    return Math.max(1, gridTemplateColumns.split(/\s+/).filter(Boolean).length);
  };

  const onRubyCardKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    rubyIndex: number,
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const rubyCount = rubyQuizIndexes.length;
    if (rubyCount === 0) return;

    let nextRubyIndex: number | null = null;

    if (event.key === "ArrowLeft") {
      nextRubyIndex = rubyIndex - 1;
    } else if (event.key === "ArrowRight") {
      nextRubyIndex = rubyIndex + 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const columnCount = getRubyGridColumnCount();
      const currentColumn = rubyIndex % columnCount;

      if (event.key === "ArrowUp") {
        nextRubyIndex = rubyIndex - columnCount;
        if (nextRubyIndex < 0) {
          nextRubyIndex = currentColumn;
          while (nextRubyIndex + columnCount < rubyCount) {
            nextRubyIndex += columnCount;
          }
        }
      } else {
        nextRubyIndex = rubyIndex + columnCount;
        if (nextRubyIndex >= rubyCount) nextRubyIndex = currentColumn;
      }
    } else if (event.key === "Home") {
      nextRubyIndex = 0;
    } else if (event.key === "End") {
      nextRubyIndex = rubyCount - 1;
    }

    if (nextRubyIndex === null) return;

    event.preventDefault();
    focusRubyCard(nextRubyIndex);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previouslyFocused = document.activeElement;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const firstRubyButton = rubyButtonRefs.current[0];
    if (firstRubyButton) firstRubyButton.focus();
    else closeButtonRef.current?.focus();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#312a38]/45 p-4 backdrop-blur-[2px]"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="diamond-modal-title"
        className="relative h-[min(640px,calc(100vh-2rem))] w-full max-w-5xl overflow-y-auto rounded-lg border border-[#dce8ef] bg-[#fffefa] p-5 shadow-[0_24px_70px_rgba(46,37,57,0.25)] sm:p-7"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#7a7183] transition hover:bg-[#edf4f8] hover:text-[#4f4658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ec2f0]"
        >
          ×
        </button>

        <div className="flex items-center gap-3 pr-10">
          <span className="diamond-reward-circle flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <MineralObject
              variant="diamond"
              className="h-12 w-12"
            />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6f91a6]">
              {studentName} · 다이아몬드 {diamondIndex + 1}
            </p>
            <h2 id="diamond-modal-title" className="mt-0.5 text-xl font-black text-[#463c56]">
              다이아몬드를 만든 야르 {rubyQuizIndexes.length}개
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <p id="diamond-ruby-navigation-hint" className="sr-only">
            좌우 화살표 키로 앞뒤 야르를, 위아래 화살표 키로 같은 열의 야르를 이동할 수 있습니다.
          </p>
          <div
            ref={rubyGridRef}
            role="group"
            aria-label="다이아몬드를 만든 야르 목록"
            aria-describedby="diamond-ruby-navigation-hint"
            className="grid grid-cols-2 content-start gap-2.5 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5"
          >
            {rubyQuizIndexes.map((quizIndex, rubyIndex) => {
              const selected = quizIndex === selectedQuizIndex;
              return (
                <button
                  key={quizIndex}
                  ref={(button) => {
                    rubyButtonRefs.current[rubyIndex] = button;
                  }}
                  type="button"
                  onClick={() => setSelectedQuizIndex(quizIndex)}
                  onKeyDown={(event) => onRubyCardKeyDown(event, rubyIndex)}
                  tabIndex={selected ? 0 : -1}
                  aria-pressed={selected}
                  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
                  aria-label={`${quizIndex + 1}번 퀴즈 보기: ${quizTextForIndex(quizIndex)}`}
                  title={`${quizIndex + 1}번 퀴즈`}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-[#7d4351] transition hover:-translate-y-0.5 hover:border-[#e99aac] hover:bg-[#fff0f3] hover:shadow-[0_7px_16px_rgba(170,74,97,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e14b63] ${
                    selected
                      ? "border-[#e14b63] bg-[#fff0f3] ring-2 ring-inset ring-[#f0a5b5]"
                      : "border-[#eed4db] bg-[#fff7f8]"
                  }`}
                >
                  <MineralObject
                    variant="ruby"
                    className="h-12 w-12"
                  />
                  <span className="text-xs font-black tabular-nums">{quizIndex + 1}번</span>
                </button>
              );
            })}
          </div>

          <aside
            className="min-h-[280px] border-t border-[#e3e9ec] pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
            aria-live="polite"
          >
            {selectedQuizIndex !== null ? (
              <QuizDetail
                name={studentName}
                quizIndex={selectedQuizIndex}
                counts={counts}
                onAward={(stage) => onAwardQuiz(selectedQuizIndex, stage)}
                onUndo={() => onUndoQuiz(selectedQuizIndex)}
              />
            ) : null}
          </aside>
        </div>
      </section>
    </div>,
    document.body,
  );
}
