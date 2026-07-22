"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import QuizQuestionText from "../progress/QuizQuestionText";
import {
  MAX_REVIEW_WORKSHEET_QUESTIONS,
  type ReviewQuestionCatalog,
  type ReviewWorksheetStudentOption,
} from "./reviewWorksheetProtocol";

const controlClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-4 text-sm font-bold text-[var(--control-foreground)] transition hover:-translate-y-0.5 hover:border-[var(--control-border-active)] hover:bg-[var(--control-background-active)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";

type LoadState = "idle" | "loading" | "ready" | "error";

function isCatalog(value: unknown): value is ReviewQuestionCatalog {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.studentName === "string" &&
    typeof record.displayName === "string" &&
    Number.isSafeInteger(record.totalCount) &&
    (record.totalCount as number) >= 0 &&
    Array.isArray(record.units)
  );
}

function questionIdsForUnit(catalogUnit: ReviewQuestionCatalog["units"][number]) {
  return catalogUnit.subunits.flatMap((subunit) =>
    subunit.questions.map(({ reviewQuestionId }) => reviewQuestionId),
  );
}

function addWithinLimit(
  current: ReadonlySet<string>,
  reviewQuestionIds: readonly string[],
) {
  const next = new Set(current);
  let reachedLimit = false;
  for (const reviewQuestionId of reviewQuestionIds) {
    if (next.has(reviewQuestionId)) continue;
    if (next.size >= MAX_REVIEW_WORKSHEET_QUESTIONS) {
      reachedLimit = true;
      break;
    }
    next.add(reviewQuestionId);
  }
  return { next, reachedLimit };
}

type ReviewQuestionModalProps = {
  studentName: string;
  displayName: string;
  catalog: ReviewQuestionCatalog | null;
  loadState: LoadState;
  selectedIds: ReadonlySet<string>;
  selectionNotice: string;
  onClose: () => void;
  onRetry: () => void;
  onClearSelection: () => void;
  onToggleQuestion: (reviewQuestionId: string) => void;
  onToggleGroup: (reviewQuestionIds: readonly string[]) => void;
};

function ReviewQuestionModal({
  studentName,
  displayName,
  catalog,
  loadState,
  selectedIds,
  selectionNotice,
  onClose,
  onRetry,
  onClearSelection,
  onToggleQuestion,
  onToggleGroup,
}: ReviewQuestionModalProps) {
  const dialogRef = useRef<HTMLFormElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const allQuestionIds = useMemo(
    () =>
      catalog?.units.flatMap((unit) =>
        unit.subunits.flatMap((subunit) =>
          subunit.questions.map(({ reviewQuestionId }) => reviewQuestionId),
        ),
      ) ?? [],
    [catalog],
  );
  const clearAtLimit =
    selectedIds.size > 0 &&
    (selectedIds.size === allQuestionIds.length ||
      selectedIds.size === MAX_REVIEW_WORKSHEET_QUESTIONS);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <form
        ref={dialogRef}
        id="review-question-modal"
        action="/api/worksheets/review/pdf"
        method="post"
        target="_blank"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-question-modal-title"
        aria-describedby="review-question-modal-count"
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--control-border-active)] bg-[var(--surface)] shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <input type="hidden" name="student" value={studentName} />

        <header className="flex items-start justify-between gap-5 border-b border-[var(--border)] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--lesson-accent)]">
              샤갈 복습
            </p>
            <h2
              id="review-question-modal-title"
              className="mt-1 truncate text-2xl font-black tracking-[-0.04em] sm:text-3xl"
            >
              {displayName} 복습
            </h2>
            <p
              id="review-question-modal-count"
              className="mt-1 text-xs font-bold text-[var(--muted)]"
            >
              {catalog?.totalCount ?? 0}문항
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="복습 문제 선택 닫기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--control-border)] bg-[var(--control-background)] text-lg font-black text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)]"
          >
            ✕
          </button>
        </header>

        {loadState === "ready" && catalog && catalog.totalCount > 0 ? (
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3 sm:px-7">
            <p className="text-sm font-black tabular-nums" aria-live="polite">
              {selectedIds.size}개 선택
            </p>
            <button
              type="button"
              onClick={() =>
                clearAtLimit
                  ? onClearSelection()
                  : onToggleGroup(allQuestionIds)
              }
              className="min-h-10 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-3 text-xs font-black text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)]"
            >
              {clearAtLimit ? "해제" : "전체"}
            </button>
          </div>
        ) : null}

        <div className="progress-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
          {loadState === "loading" ? (
            <div
              role="status"
              className="flex min-h-56 items-center justify-center text-sm font-bold text-[var(--muted)]"
            >
              불러오는 중
            </div>
          ) : null}

          {loadState === "error" ? (
            <div
              role="alert"
              className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"
            >
              <p className="text-sm font-black text-[#9e5260]">불러오기 실패</p>
              <button type="button" onClick={onRetry} className={controlClassName}>
                다시 시도
              </button>
            </div>
          ) : null}

          {loadState === "ready" && catalog?.totalCount === 0 ? (
            <div className="flex min-h-56 items-center justify-center text-sm font-bold text-[var(--muted)]">
              복습 0문항
            </div>
          ) : null}

          {loadState === "ready" && catalog && catalog.totalCount > 0 ? (
            <div className="space-y-4">
              {catalog.units.map((unit, unitIndex) => {
                const unitQuestionIds = questionIdsForUnit(unit);
                const unitSelected = unitQuestionIds.every((reviewQuestionId) =>
                  selectedIds.has(reviewQuestionId),
                );
                const unitHeadingId = `review-unit-${unitIndex}`;

                return (
                  <section
                    key={unit.id}
                    aria-labelledby={unitHeadingId}
                    className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                      <h3
                        id={unitHeadingId}
                        className="min-w-0 text-sm font-black tracking-[-0.02em]"
                      >
                        {[unit.gradeLabel, unit.semesterLabel, unit.unitTitle]
                          .filter(Boolean)
                          .join(" · ")}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onToggleGroup(unitQuestionIds)}
                        className="min-h-9 shrink-0 rounded-lg border border-[var(--control-border)] bg-[var(--control-background)] px-2.5 text-[11px] font-black text-[var(--control-foreground)] transition hover:bg-[var(--control-background-active)]"
                      >
                        {unitSelected ? "해제" : "단원 전체"}
                      </button>
                    </div>

                    <div className="space-y-4 p-3 sm:p-4">
                      {unit.subunits.map((subunit) => {
                        const subunitQuestionIds = subunit.questions.map(
                          ({ reviewQuestionId }) => reviewQuestionId,
                        );
                        const subunitSelected = subunitQuestionIds.every(
                          (reviewQuestionId) =>
                            selectedIds.has(reviewQuestionId),
                        );

                        return (
                          <div key={subunit.id} className="min-w-0">
                            <div className="mb-2 flex items-center justify-between gap-3 px-1">
                              <h4 className="text-xs font-black text-[var(--lesson-accent)]">
                                {subunit.subunitTitle}
                              </h4>
                              <button
                                type="button"
                                onClick={() => onToggleGroup(subunitQuestionIds)}
                                className="min-h-8 rounded-lg px-2 text-[11px] font-black text-[var(--muted)] transition hover:bg-[var(--control-background-active)] hover:text-[var(--control-foreground)]"
                              >
                                {subunitSelected ? "해제" : "전체"}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {subunit.questions.map((question) => (
                                <label
                                  key={question.reviewQuestionId}
                                  className="grid min-h-12 cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--control-border-active)]"
                                >
                                  <input
                                    type="checkbox"
                                    name="reviewQuestionId"
                                    value={question.reviewQuestionId}
                                    checked={selectedIds.has(
                                      question.reviewQuestionId,
                                    )}
                                    onChange={() =>
                                      onToggleQuestion(question.reviewQuestionId)
                                    }
                                    className="mt-1 h-5 w-5 shrink-0 accent-[#8068c5]"
                                  />
                                  <span className="mt-0.5 rounded-lg bg-[var(--control-background-active)] px-2 py-1 text-[10px] font-black tabular-nums text-[var(--control-foreground)]">
                                    Q{question.quizNumber}
                                  </span>
                                  <QuizQuestionText
                                    text={question.questionText}
                                    className="min-w-0 break-words text-sm font-bold leading-6 text-[var(--foreground)]"
                                  />
                                  {question.occurrenceCount > 1 ? (
                                    <span className="mt-1 text-[10px] font-black tabular-nums text-[var(--muted)]">
                                      ×{question.occurrenceCount}
                                    </span>
                                  ) : null}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-7 sm:py-4">
          <div className="mb-2 flex min-h-5 items-center justify-between gap-3 text-xs font-bold">
            <span className="tabular-nums" aria-live="polite">
              {selectedIds.size}개 선택
            </span>
            <span className="text-[#9e5260]" aria-live="polite">
              {selectionNotice}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={loadState !== "ready" || selectedIds.size === 0}
              className={controlClassName}
            >
              PDF 열기
            </button>
            <button
              type="submit"
              name="download"
              value="1"
              disabled={loadState !== "ready" || selectedIds.size === 0}
              className={controlClassName}
            >
              다운로드
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

type ReviewWorksheetPickerProps = {
  students: ReviewWorksheetStudentOption[];
};

export default function ReviewWorksheetPicker({
  students,
}: ReviewWorksheetPickerProps) {
  const firstStudent = students.find(({ questionCount }) => questionCount > 0);
  const [selectedStudentName, setSelectedStudentName] = useState(
    firstStudent?.studentName ?? "",
  );
  const [activeStudentName, setActiveStudentName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [catalog, setCatalog] = useState<ReviewQuestionCatalog | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [retryCount, setRetryCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionNotice, setSelectionNotice] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedStudent = students.find(
    ({ studentName }) => studentName === selectedStudentName,
  );
  const activeStudent = students.find(
    ({ studentName }) => studentName === activeStudentName,
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const openModal = () => {
    if (!selectedStudent || selectedStudent.questionCount === 0) return;
    setActiveStudentName(selectedStudent.studentName);
    setCatalog(null);
    setSelectedIds(new Set());
    setSelectionNotice("");
    setLoadState("loading");
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen || !activeStudentName) return;

    const controller = new AbortController();

    void fetch(
      `/api/worksheets/review/questions?student=${encodeURIComponent(activeStudentName)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value: unknown = await response.json();
        if (!response.ok || !isCatalog(value)) throw new Error("catalog");
        return value;
      })
      .then((value) => {
        setCatalog(value);
        setSelectedIds(new Set());
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalog(null);
        setLoadState("error");
      });

    return () => controller.abort();
  }, [activeStudentName, isOpen, retryCount]);

  const toggleQuestion = useCallback(
    (reviewQuestionId: string) => {
      const next = new Set(selectedIds);
      if (next.has(reviewQuestionId)) {
        next.delete(reviewQuestionId);
        setSelectionNotice("");
      } else if (next.size < MAX_REVIEW_WORKSHEET_QUESTIONS) {
        next.add(reviewQuestionId);
        setSelectionNotice("");
      } else {
        setSelectionNotice(`최대 ${MAX_REVIEW_WORKSHEET_QUESTIONS}개`);
      }
      setSelectedIds(next);
    },
    [selectedIds],
  );

  const toggleGroup = useCallback(
    (reviewQuestionIds: readonly string[]) => {
      const allSelected = reviewQuestionIds.every((reviewQuestionId) =>
        selectedIds.has(reviewQuestionId),
      );
      if (allSelected) {
        const next = new Set(selectedIds);
        reviewQuestionIds.forEach((reviewQuestionId) =>
          next.delete(reviewQuestionId),
        );
        setSelectedIds(next);
        setSelectionNotice("");
        return;
      }

      const { next, reachedLimit } = addWithinLimit(
        selectedIds,
        reviewQuestionIds,
      );
      setSelectedIds(next);
      setSelectionNotice(
        reachedLimit ? `최대 ${MAX_REVIEW_WORKSHEET_QUESTIONS}개` : "",
      );
    },
    [selectedIds],
  );

  return (
    <>
      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor="review-student">
          복습지 학생 선택
        </label>
        <select
          id="review-student"
          value={selectedStudentName}
          onChange={(event) => setSelectedStudentName(event.target.value)}
          disabled={!firstStudent}
          className="min-h-11 min-w-0 rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] px-3 text-sm font-bold text-[var(--control-foreground)] outline-none focus:border-[var(--control-border-active)] focus:ring-2 focus:ring-[#b5a3f0]"
        >
          {!firstStudent ? <option value="">복습 0문항</option> : null}
          {students.map((student) => (
            <option
              key={student.studentName}
              value={student.studentName}
              disabled={student.questionCount === 0}
            >
              {student.displayName} · {student.questionCount}문항
            </option>
          ))}
        </select>
        <button
          ref={triggerRef}
          type="button"
          onClick={openModal}
          disabled={!selectedStudent || selectedStudent.questionCount === 0}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="review-question-modal"
          className={controlClassName}
        >
          문제 선택
        </button>
      </div>

      {isOpen && activeStudent ? (
        <ReviewQuestionModal
          studentName={activeStudent.studentName}
          displayName={activeStudent.displayName}
          catalog={catalog}
          loadState={loadState}
          selectedIds={selectedIds}
          selectionNotice={selectionNotice}
          onClose={closeModal}
          onRetry={() => {
            setLoadState("loading");
            setSelectionNotice("");
            setRetryCount((count) => count + 1);
          }}
          onClearSelection={() => {
            setSelectedIds(new Set());
            setSelectionNotice("");
          }}
          onToggleQuestion={toggleQuestion}
          onToggleGroup={toggleGroup}
        />
      ) : null}
    </>
  );
}
