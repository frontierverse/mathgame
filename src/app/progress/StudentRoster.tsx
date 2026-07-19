"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DiamondModal from "./DiamondModal";
import MineralIcon from "./MineralIcon";
import MineralEvolutionLegend from "./MineralEvolutionLegend";
import QuizBoard from "./QuizBoard";
import QuizPanel from "./QuizPanel";
import RandomQuizPanel from "./RandomQuizPanel";
import {
  MAX_QUIZ_COUNT,
  MAX_SOLVES,
  STUDENT_COLORS,
  type QuizMineralStage,
} from "./quizData";
import {
  getMineralInventory,
  getTeamDiamondProgress,
  RUBIES_PER_DIAMOND,
} from "./quizProgress";
import {
  canStudentSolveQuiz,
  EMPTY_RANDOM_QUIZ_QUEUE_STATE,
  normalizeRandomQuizQueueState,
  pickRandomQuizParticipant,
  RANDOM_QUIZ_QUEUE_STORAGE_KEY,
  reconcileQuizOrder,
  RESET_RANDOM_QUIZ_QUEUE_STORAGE_KEYS,
  type RandomQuizQueueState,
} from "./randomQuizQueue";
import SharedQuizQueue from "./SharedQuizQueue";
import useQuizProgress from "./useQuizProgress";

const EMPTY_HIDDEN_STUDENT_NAMES: readonly string[] = [];
const RAINBOW_PROGRESS_BACKGROUND =
  "linear-gradient(90deg, #ff375f 0%, #ff9f0a 16%, #ffd60a 31%, #30d158 47%, #64d2ff 63%, #0a84ff 78%, #5e5ce6 90%, #bf5af2 100%)";

type Student = { name: string; age: number | null };

type StudentRosterProps = {
  students: Student[];
  hiddenStudentNames?: readonly string[];
};

export default function StudentRoster({
  students,
  hiddenStudentNames = EMPTY_HIDDEN_STUDENT_NAMES,
}: StudentRosterProps) {
  const [showAllStudents, setShowAllStudents] = useState(false);
  const hiddenStudentNameSet = useMemo(
    () => new Set(hiddenStudentNames),
    [hiddenStudentNames],
  );
  const allStudentEntries = useMemo(
    () => students.map((student, originalIndex) => ({ student, originalIndex })),
    [students],
  );
  const defaultStudentEntries = useMemo(
    () =>
      allStudentEntries.filter(({ student }) => {
        const displayName = student.name.slice(1).trim();
        return (
          !hiddenStudentNameSet.has(student.name) &&
          !hiddenStudentNameSet.has(displayName)
        );
      }),
    [allStudentEntries, hiddenStudentNameSet],
  );
  const visibleStudentEntries = showAllStudents
    ? allStudentEntries
    : defaultStudentEntries;
  const teamStudentEntries = useMemo(() => {
    const seenStudentNames = new Set<string>();
    return defaultStudentEntries.filter(({ student }) => {
      if (seenStudentNames.has(student.name)) return false;
      seenStudentNames.add(student.name);
      return true;
    });
  }, [defaultStudentEntries]);
  const teamStudentNames = useMemo(
    () => teamStudentEntries.map(({ student }) => student.name),
    [teamStudentEntries],
  );
  const teamStudentNameSet = useMemo(
    () => new Set(teamStudentNames),
    [teamStudentNames],
  );
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(
    () =>
      defaultStudentEntries[0]?.originalIndex ??
      allStudentEntries[0]?.originalIndex ??
      0,
  );
  const [openQuizIndex, setOpenQuizIndex] = useState<number | null>(null);
  const [openRandomAssignment, setOpenRandomAssignment] = useState<{
    quizIndex: number;
    studentName: string;
  } | null>(null);
  const [openDiamond, setOpenDiamond] = useState<{
    studentIndex: number;
    diamondIndex: number;
  } | null>(null);
  const [randomQueueState, setRandomQueueState] = useState<RandomQuizQueueState>(
    EMPTY_RANDOM_QUIZ_QUEUE_STATE,
  );
  const [randomQueueReady, setRandomQueueReady] = useState(false);
  const [queueAnnouncement, setQueueAnnouncement] = useState("");
  const [autoAdvanceAfterQuizIndex, setAutoAdvanceAfterQuizIndex] = useState<
    number | null
  >(null);
  const completingRandomQuizRef = useRef(false);
  const studentNames = useMemo(() => students.map((student) => student.name), [students]);
  const { progress, isReady: progressReady, awardQuizStage, undoQuiz } =
    useQuizProgress(studentNames);
  const teamDiamondProgress = useMemo(
    () => getTeamDiamondProgress(progress, teamStudentNames),
    [progress, teamStudentNames],
  );
  const randomQuizParticipants = useMemo(
    () =>
      teamStudentEntries.map(({ student, originalIndex }) => ({
        name: student.name,
        originalIndex,
      })),
    [teamStudentEntries],
  );
  const activeQuizIndexes = useMemo(() => {
    const batchStart = teamDiamondProgress.diamondCount * RUBIES_PER_DIAMOND;
    const batchEnd = Math.min(MAX_QUIZ_COUNT, batchStart + RUBIES_PER_DIAMOND);
    return Array.from({ length: Math.max(0, batchEnd - batchStart) }, (_, index) =>
      batchStart + index,
    );
  }, [teamDiamondProgress.diamondCount]);
  const randomQuizOrder = useMemo(
    () => reconcileQuizOrder(randomQueueState.order, activeQuizIndexes),
    [activeQuizIndexes, randomQueueState.order],
  );
  const validPendingByQuiz = useMemo(() => {
    const pending: Record<string, string> = {};
    activeQuizIndexes.forEach((quizIndex) => {
      const studentName = randomQueueState.pendingByQuiz[String(quizIndex)];
      if (
        studentName &&
        teamStudentNameSet.has(studentName) &&
        canStudentSolveQuiz(progress, studentName, quizIndex)
      ) {
        pending[String(quizIndex)] = studentName;
      }
    });
    return pending;
  }, [activeQuizIndexes, progress, randomQueueState.pendingByQuiz, teamStudentNameSet]);
  const pendingQuizIndexes = useMemo(
    () => new Set(Object.keys(validPendingByQuiz).map(Number)),
    [validPendingByQuiz],
  );
  const sharedQueueReady = progressReady && randomQueueReady;
  const teamProgressPercent =
    teamDiamondProgress.currentRubyTarget === 0
      ? 0
      : Math.round(
          (teamDiamondProgress.currentRubyCount /
            teamDiamondProgress.currentRubyTarget) *
            100,
        );

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        RESET_RANDOM_QUIZ_QUEUE_STORAGE_KEYS.forEach((storageKey) =>
          window.localStorage.removeItem(storageKey),
        );
        const savedState = window.localStorage.getItem(RANDOM_QUIZ_QUEUE_STORAGE_KEY);
        if (savedState) {
          setRandomQueueState(normalizeRandomQuizQueueState(JSON.parse(savedState)));
        }
      } catch {
        // A fresh in-memory queue is still usable when local storage is unavailable.
      }
      setRandomQueueReady(true);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!randomQueueReady) return;
    try {
      window.localStorage.setItem(
        RANDOM_QUIZ_QUEUE_STORAGE_KEY,
        JSON.stringify(randomQueueState),
      );
    } catch {
      // The current browser session keeps working without persistence.
    }
  }, [randomQueueReady, randomQueueState]);

  const toggleShowAllStudents = useCallback(() => {
    const nextShowAllStudents = !showAllStudents;
    const nextStudentEntries = nextShowAllStudents
      ? allStudentEntries
      : defaultStudentEntries;
    const selectedStudentStaysVisible = nextStudentEntries.some(
      ({ originalIndex }) => originalIndex === selectedStudentIndex,
    );

    setShowAllStudents(nextShowAllStudents);
    setSelectedStudentIndex(
      selectedStudentStaysVisible
        ? selectedStudentIndex
        : (nextStudentEntries[0]?.originalIndex ?? 0),
    );
    setOpenQuizIndex(null);
    setOpenRandomAssignment(null);
    setAutoAdvanceAfterQuizIndex(null);
    setOpenDiamond(null);
  }, [allStudentEntries, defaultStudentEntries, selectedStudentIndex, showAllStudents]);

  const closePanel = useCallback(() => setOpenQuizIndex(null), []);
  const closeRandomPanel = useCallback(() => {
    setAutoAdvanceAfterQuizIndex(null);
    setOpenRandomAssignment(null);
    completingRandomQuizRef.current = false;
  }, []);
  const closeDiamond = useCallback(() => setOpenDiamond(null), []);
  const navigateQuiz = useCallback((quizIndex: number) => setOpenQuizIndex(quizIndex), []);
  const openStudentQuiz = useCallback((studentIndex: number, quizIndex: number) => {
    setSelectedStudentIndex(studentIndex);
    setAutoAdvanceAfterQuizIndex(null);
    setOpenQuizIndex(quizIndex);
    setOpenRandomAssignment(null);
    setOpenDiamond(null);
  }, []);
  const openStudentDiamond = useCallback((studentIndex: number, diamondIndex: number) => {
    setSelectedStudentIndex(studentIndex);
    setAutoAdvanceAfterQuizIndex(null);
    setOpenQuizIndex(null);
    setOpenRandomAssignment(null);
    setOpenDiamond({ studentIndex, diamondIndex });
  }, []);

  const openSharedQuiz = useCallback(
    (quizIndex: number) => {
      if (!sharedQueueReady || !activeQuizIndexes.includes(quizIndex)) return;

      const pendingStudentName = validPendingByQuiz[String(quizIndex)];
      const pendingParticipant = randomQuizParticipants.find(
        ({ name }) =>
          name === pendingStudentName && canStudentSolveQuiz(progress, name, quizIndex),
      );
      const participant =
        pendingParticipant ??
        pickRandomQuizParticipant({
          quizIndex,
          participants: randomQuizParticipants,
          progress,
          pendingByQuiz: validPendingByQuiz,
          lastSolverName: randomQueueState.lastSolverByQuiz[String(quizIndex)],
        });

      if (!participant) {
        setQueueAnnouncement(`${quizIndex + 1}번 퀴즈는 모두 완료했습니다.`);
        return;
      }

      if (!pendingParticipant) {
        setRandomQueueState((current) => ({
          ...current,
          pendingByQuiz: {
            ...current.pendingByQuiz,
            [String(quizIndex)]: participant.name,
          },
        }));
      }

      completingRandomQuizRef.current = false;
      setOpenQuizIndex(null);
      setOpenDiamond(null);
      setOpenRandomAssignment({ quizIndex, studentName: participant.name });
      setQueueAnnouncement(
        `${quizIndex + 1}번 퀴즈는 ${participant.name.slice(1).trim()} 학생에게 배정됐습니다.`,
      );
    },
    [
      activeQuizIndexes,
      progress,
      randomQuizParticipants,
      randomQueueState.lastSolverByQuiz,
      sharedQueueReady,
      validPendingByQuiz,
    ],
  );

  const completeSharedQuiz = useCallback((targetStage: QuizMineralStage) => {
    if (!openRandomAssignment || completingRandomQuizRef.current) return;

    const { quizIndex, studentName } = openRandomAssignment;
    if (!canStudentSolveQuiz(progress, studentName, quizIndex)) return;

    completingRandomQuizRef.current = true;
    if (!awardQuizStage(studentName, quizIndex, targetStage)) {
      completingRandomQuizRef.current = false;
      return;
    }

    setRandomQueueState((current) => {
      const pendingByQuiz = { ...current.pendingByQuiz };
      const quizKey = String(quizIndex);
      const reachedRuby = targetStage === MAX_SOLVES;
      if (reachedRuby) delete pendingByQuiz[quizKey];
      else pendingByQuiz[quizKey] = studentName;
      const currentOrder = reconcileQuizOrder(current.order, activeQuizIndexes);

      return {
        version: 1,
        order: [...currentOrder.filter((index) => index !== quizIndex), quizIndex],
        pendingByQuiz,
        lastSolverByQuiz: reachedRuby
          ? { ...current.lastSolverByQuiz, [quizKey]: studentName }
          : current.lastSolverByQuiz,
      };
    });
    setAutoAdvanceAfterQuizIndex(quizIndex);
    const rewardLabel =
      targetStage === 1 ? "돌" : targetStage === 2 ? "수정" : "루비";
    setQueueAnnouncement(
      `${quizIndex + 1}번 퀴즈에서 ${rewardLabel}을 획득했습니다. 다음 퀴즈를 추첨합니다.`,
    );
  }, [activeQuizIndexes, awardQuizStage, openRandomAssignment, progress]);

  useEffect(() => {
    if (autoAdvanceAfterQuizIndex === null || !sharedQueueReady) return;

    const timer = window.setTimeout(() => {
      const nextQuizIndex = randomQuizOrder.find((quizIndex) =>
        randomQuizParticipants.some(({ name }) =>
          canStudentSolveQuiz(progress, name, quizIndex),
        ),
      );

      setAutoAdvanceAfterQuizIndex(null);
      setOpenRandomAssignment(null);

      if (nextQuizIndex === undefined) {
        completingRandomQuizRef.current = false;
        setQueueAnnouncement(
          `${autoAdvanceAfterQuizIndex + 1}번 퀴즈를 완료했습니다. 현재 퀴즈를 모두 풀었습니다.`,
        );
        return;
      }

      openSharedQuiz(nextQuizIndex);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    autoAdvanceAfterQuizIndex,
    openSharedQuiz,
    progress,
    randomQuizOrder,
    randomQuizParticipants,
    sharedQueueReady,
  ]);

  const selectedStudent = students[selectedStudentIndex] ?? null;
  const selectedName = selectedStudent?.name ?? null;
  const selectedCounts = selectedName ? progress[selectedName] ?? [] : [];
  const selectedColor = STUDENT_COLORS[selectedStudentIndex % STUDENT_COLORS.length];
  const selectedDiamondCountLimit =
    selectedName && teamStudentNameSet.has(selectedName)
      ? teamDiamondProgress.diamondCount
      : undefined;
  const randomAssignedParticipant = openRandomAssignment
    ? randomQuizParticipants.find(({ name }) => name === openRandomAssignment.studentName) ?? null
    : null;
  const randomAssignedCounts = openRandomAssignment
    ? progress[openRandomAssignment.studentName] ?? []
    : [];
  const randomAssignedColor = randomAssignedParticipant
    ? STUDENT_COLORS[randomAssignedParticipant.originalIndex % STUDENT_COLORS.length]
    : STUDENT_COLORS[0];
  const diamondStudent = openDiamond ? students[openDiamond.studentIndex] ?? null : null;
  const diamondStudentName = diamondStudent?.name ?? null;
  const diamondStudentCounts = diamondStudentName ? progress[diamondStudentName] ?? [] : [];
  const diamondStudentCountLimit =
    diamondStudentName && teamStudentNameSet.has(diamondStudentName)
      ? teamDiamondProgress.diamondCount
      : undefined;
  const diamondRubyQuizIndexes = openDiamond
    ? getMineralInventory(diamondStudentCounts, diamondStudentCountLimit).diamondGroups[
        openDiamond.diamondIndex
      ] ?? null
    : null;
  const diamondStudentColor = openDiamond
    ? STUDENT_COLORS[openDiamond.studentIndex % STUDENT_COLORS.length]
    : STUDENT_COLORS[0];
  const awardDiamondQuiz = useCallback(
    (quizIndex: number, stage: QuizMineralStage) => {
      if (diamondStudentName) awardQuizStage(diamondStudentName, quizIndex, stage);
    },
    [awardQuizStage, diamondStudentName],
  );
  const undoDiamondQuiz = useCallback(
    (quizIndex: number) => {
      if (diamondStudentName) undoQuiz(diamondStudentName, quizIndex);
    },
    [diamondStudentName, undoQuiz],
  );

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="shrink-0 text-3xl font-bold">진도 체크하기</h1>
          <button
            type="button"
            role="switch"
            aria-label="숨긴 이름 함께 표시"
            aria-checked={showAllStudents}
            onClick={toggleShowAllStudents}
            className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f78c9] focus-visible:ring-offset-2 ${
              showAllStudents ? "bg-[#9b84d9]" : "bg-[#cfc6d5]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                showAllStudents ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <MineralEvolutionLegend />
      </div>

      {teamDiamondProgress.participantCount > 0 ? (
        <section
          aria-label="공동 다이아 진행도"
          aria-live="polite"
          className="mt-5 flex flex-col gap-5 rounded-2xl border border-[var(--control-border-active)] bg-[var(--surface-raised)] p-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--control-border)] bg-[var(--control-background)]">
              <MineralIcon variant="diamond" className="h-10 w-10" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-[var(--lesson-accent)]">
                함께 완성하는 보상
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">
                공동 다이아 {teamDiamondProgress.diamondCount}개
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)] sm:text-sm">
                {teamDiamondProgress.nextDiamondIndex === null
                  ? "모든 공동 다이아 단계를 완성했습니다."
                  : `참여 학생 전원이 ${teamDiamondProgress.nextDiamondIndex * 10 + 1}~${(teamDiamondProgress.nextDiamondIndex + 1) * 10}번 루비를 완성하면 각자의 다이아로 동시에 변환됩니다.`}
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 lg:max-w-[420px]">
            <div className="flex items-center justify-between gap-4 text-xs font-black text-[var(--lesson-text)]">
              <span>
                루비 {teamDiamondProgress.currentRubyCount}/
                {teamDiamondProgress.currentRubyTarget}
              </span>
              <span>
                {teamDiamondProgress.readyStudentCount}/
                {teamDiamondProgress.participantCount}명 준비
              </span>
            </div>
            <div
              className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--border)]"
              role="progressbar"
              aria-label="다음 공동 다이아 루비 진행도"
              aria-valuemin={0}
              aria-valuemax={teamDiamondProgress.currentRubyTarget}
              aria-valuenow={teamDiamondProgress.currentRubyCount}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${teamProgressPercent}%`,
                  backgroundImage: RAINBOW_PROGRESS_BACKGROUND,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">
              한 명이라도 루비 10개를 완성하지 못하면 전원의 다이아 변환이 대기합니다.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-5" aria-label="퀴즈 진행도">
        {visibleStudentEntries.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#ddd1c1] bg-[#fffefa] px-5 text-center">
            <p className="text-sm font-bold text-[#665c6f]">
              현재 표시할 이름이 없어요. 제목 오른쪽 스위치를 켜 주세요.
            </p>
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
            <div className="min-w-0">
              <SharedQuizQueue
                quizOrder={randomQuizOrder}
                participantNames={teamStudentNames}
                progress={progress}
                pendingQuizIndexes={pendingQuizIndexes}
                selectedQuizIndex={openRandomAssignment?.quizIndex ?? null}
                isReady={sharedQueueReady}
                announcement={queueAnnouncement}
                onOpenQuiz={openSharedQuiz}
              />

              <div
                className="mt-10 border-t border-[#e7dccb] pt-8"
                aria-label="전체 진도 체크리스트"
              >
                <h2 className="text-xl font-bold text-[#51475c]">전체 진도 체크리스트</h2>
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-x-12 gap-y-6 2xl:grid-cols-2">
                  {visibleStudentEntries.map(({ student, originalIndex }) => {
                    const counts = progress[student.name] ?? [];
                    const color = STUDENT_COLORS[originalIndex % STUDENT_COLORS.length];
                    const isSelected = originalIndex === selectedStudentIndex;

                    return (
                      <div
                        key={`${student.name}-${originalIndex}`}
                        className="min-w-0 border-b border-[#eee4d7] pb-6"
                      >
                        <QuizBoard
                          studentName={student.name}
                          studentAge={student.age}
                          studentIndex={originalIndex}
                          studentColor={color}
                          counts={counts}
                          diamondCountLimit={
                            teamStudentNameSet.has(student.name)
                              ? teamDiamondProgress.diamondCount
                              : undefined
                          }
                          onOpenQuiz={openStudentQuiz}
                          onOpenDiamond={openStudentDiamond}
                          selectedQuizIndex={isSelected ? openQuizIndex : null}
                          compact
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {openRandomAssignment || (selectedName && openQuizIndex !== null) ? (
              <div className="order-first min-w-0 xl:order-none xl:col-start-2">
                {openRandomAssignment && randomAssignedParticipant ? (
                  <div className="xl:sticky xl:top-4">
                    <RandomQuizPanel
                      key={`${openRandomAssignment.quizIndex}-${openRandomAssignment.studentName}`}
                      studentName={openRandomAssignment.studentName}
                      studentColor={randomAssignedColor}
                      quizIndex={openRandomAssignment.quizIndex}
                      counts={randomAssignedCounts}
                      onAward={completeSharedQuiz}
                      onClose={closeRandomPanel}
                    />
                  </div>
                ) : selectedName && openQuizIndex !== null ? (
                  <div className="xl:sticky xl:top-4">
                    <QuizPanel
                      name={selectedName.slice(1)}
                      quizIndex={openQuizIndex}
                      counts={selectedCounts}
                      diamondCountLimit={selectedDiamondCountLimit}
                      color={selectedColor}
                      onAward={(stage) =>
                        awardQuizStage(selectedName, openQuizIndex, stage)
                      }
                      onUndo={() => undoQuiz(selectedName, openQuizIndex)}
                      onNavigate={navigateQuiz}
                      onClose={closePanel}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {openDiamond && diamondStudentName && diamondRubyQuizIndexes ? (
        <DiamondModal
          studentName={diamondStudentName.slice(1)}
          studentColor={diamondStudentColor}
          diamondIndex={openDiamond.diamondIndex}
          rubyQuizIndexes={diamondRubyQuizIndexes}
          counts={diamondStudentCounts}
          onAwardQuiz={awardDiamondQuiz}
          onUndoQuiz={undoDiamondQuiz}
          onClose={closeDiamond}
        />
      ) : null}
    </>
  );
}
