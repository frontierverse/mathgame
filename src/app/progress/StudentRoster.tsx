"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DiamondModal from "./DiamondModal";
import MineralEvolutionLegend from "./MineralEvolutionLegend";
import QuizBoard from "./QuizBoard";
import QuizPanel from "./QuizPanel";
import RandomQuizPanel from "./RandomQuizPanel";
import RoundSettingsModal from "./RoundSettingsModal";
import RoundToolbar from "./RoundToolbar";
import {
  createRandomQuizVariantSeed,
  CURRICULUM_QUIZ_ROUNDS,
  MAX_SOLVES,
  resolveQuizContent,
  type QuizMineralStage,
} from "./quizData";
import { getMineralInventory } from "./quizProgress";
import {
  canStudentSolveQuiz,
  EMPTY_RANDOM_QUIZ_QUEUE_STATE,
  getRandomQuizRoundQueue,
  normalizeRandomQuizQueueState,
  pickRandomQuizParticipant,
  RANDOM_QUIZ_QUEUE_STORAGE_KEY,
  reconcileQuizOrder,
  RESET_RANDOM_QUIZ_QUEUE_STORAGE_KEYS,
  type RandomQuizQueueState,
} from "./randomQuizQueue";
import useQuizProgress from "./useQuizProgress";
import useRoundAssignments from "./useRoundAssignments";

const EMPTY_HIDDEN_STUDENT_NAMES: readonly string[] = [];
const EMPTY_QUIZ_INDEXES: readonly number[] = [];
const ROUND_IDS = CURRICULUM_QUIZ_ROUNDS.map(({ id }) => id);
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
  const assignableStudentEntries = useMemo(() => {
    const seenStudentNames = new Set<string>();
    return allStudentEntries.filter(({ student }) => {
      if (seenStudentNames.has(student.name)) return false;
      seenStudentNames.add(student.name);
      return true;
    });
  }, [allStudentEntries]);
  const assignableStudentNames = useMemo(
    () => assignableStudentEntries.map(({ student }) => student.name),
    [assignableStudentEntries],
  );
  const roundSettingsStudents = useMemo(
    () =>
      assignableStudentEntries.map(({ student, originalIndex }) => ({
        name: student.name,
        originalIndex,
      })),
    [assignableStudentEntries],
  );
  const [selectedRoundId, setSelectedRoundId] = useState(
    () => CURRICULUM_QUIZ_ROUNDS[0]?.id ?? "round-1",
  );
  const [roundSettingsOpen, setRoundSettingsOpen] = useState(false);
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
    variantSeed: number | null;
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
  const { progress, isReady: progressReady, awardQuizStage, undoQuiz } =
    useQuizProgress();
  const {
    overrides: roundAssignmentOverrides,
    isReady: roundAssignmentsReady,
    saveRoundAssignment,
  } = useRoundAssignments(ROUND_IDS, assignableStudentNames);
  const selectedRound =
    CURRICULUM_QUIZ_ROUNDS.find(({ id }) => id === selectedRoundId) ??
    CURRICULUM_QUIZ_ROUNDS[0];
  const roundAssignments = useMemo(
    () =>
      Object.fromEntries(
        CURRICULUM_QUIZ_ROUNDS.map(({ id }) => [
          id,
          roundAssignmentOverrides[id] ?? teamStudentNames,
        ]),
      ) as Record<string, string[]>,
    [roundAssignmentOverrides, teamStudentNames],
  );
  const currentRoundParticipantNames = selectedRound
    ? roundAssignments[selectedRound.id] ?? EMPTY_HIDDEN_STUDENT_NAMES
    : EMPTY_HIDDEN_STUDENT_NAMES;
  const currentRoundParticipantNameSet = useMemo(
    () => new Set(currentRoundParticipantNames),
    [currentRoundParticipantNames],
  );
  const randomQuizParticipants = useMemo(
    () =>
      assignableStudentEntries.flatMap(({ student, originalIndex }) =>
        currentRoundParticipantNameSet.has(student.name)
          ? [{ name: student.name, originalIndex }]
          : [],
      ),
    [assignableStudentEntries, currentRoundParticipantNameSet],
  );
  const activeQuizIndexes = selectedRound?.quizIndexes ?? EMPTY_QUIZ_INDEXES;
  const selectedRoundQueue = selectedRound
    ? getRandomQuizRoundQueue(randomQueueState, selectedRound.id)
    : getRandomQuizRoundQueue(randomQueueState, "");
  const randomQuizOrder = reconcileQuizOrder(
    selectedRoundQueue.order,
    activeQuizIndexes,
  );
  const validPendingByQuiz = useMemo(() => {
    const pending: Record<string, string> = {};
    const pendingByQuiz = getRandomQuizRoundQueue(
      randomQueueState,
      selectedRound?.id ?? "",
    ).pendingByQuiz;
    activeQuizIndexes.forEach((quizIndex) => {
      const studentName = pendingByQuiz[String(quizIndex)];
      if (
        studentName &&
        currentRoundParticipantNameSet.has(studentName) &&
        canStudentSolveQuiz(progress, studentName, quizIndex)
      ) {
        pending[String(quizIndex)] = studentName;
      }
    });
    return pending;
  }, [
    activeQuizIndexes,
    currentRoundParticipantNameSet,
    progress,
    randomQueueState,
    selectedRound?.id,
  ]);
  const sharedQueueReady = progressReady && randomQueueReady && roundAssignmentsReady;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
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
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
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

  const selectRound = useCallback((roundId: string) => {
    if (!CURRICULUM_QUIZ_ROUNDS.some(({ id }) => id === roundId)) return;
    setSelectedRoundId(roundId);
    setOpenQuizIndex(null);
    setOpenRandomAssignment(null);
    setAutoAdvanceAfterQuizIndex(null);
    setOpenDiamond(null);
    completingRandomQuizRef.current = false;
  }, []);

  const changeRoundAssignment = useCallback(
    (roundId: string, nextStudentNames: string[]) => {
      const uniqueStudentNames = Array.from(new Set(nextStudentNames));
      void saveRoundAssignment(roundId, uniqueStudentNames);

      setRandomQueueState((current) => {
        const roundQueue = getRandomQuizRoundQueue(current, roundId);
        const assignedStudentNameSet = new Set(uniqueStudentNames);
        const pendingByQuiz = Object.fromEntries(
          Object.entries(roundQueue.pendingByQuiz).filter(([, studentName]) =>
            assignedStudentNameSet.has(studentName),
          ),
        );
        const variantSeedByQuiz = Object.fromEntries(
          Object.entries(roundQueue.variantSeedByQuiz).filter(
            ([quizKey]) => pendingByQuiz[quizKey] !== undefined,
          ),
        );
        const lastVariantSeedByQuiz = { ...roundQueue.lastVariantSeedByQuiz };
        Object.entries(roundQueue.variantSeedByQuiz).forEach(
          ([quizKey, variantSeed]) => {
            if (pendingByQuiz[quizKey] === undefined) {
              lastVariantSeedByQuiz[quizKey] = variantSeed;
            }
          },
        );

        return {
          ...current,
          rounds: {
            ...current.rounds,
            [roundId]: {
              ...roundQueue,
              pendingByQuiz,
              variantSeedByQuiz,
              lastVariantSeedByQuiz,
            },
          },
        };
      });

      if (
        selectedRoundId === roundId &&
        openRandomAssignment &&
        !uniqueStudentNames.includes(openRandomAssignment.studentName)
      ) {
        setOpenRandomAssignment(null);
        setAutoAdvanceAfterQuizIndex(null);
        completingRandomQuizRef.current = false;
      }
    },
    [openRandomAssignment, saveRoundAssignment, selectedRoundId],
  );

  const closePanel = useCallback(() => setOpenQuizIndex(null), []);
  const closeRandomPanel = useCallback(() => {
    setAutoAdvanceAfterQuizIndex(null);
    setOpenRandomAssignment(null);
    completingRandomQuizRef.current = false;
  }, []);
  const closeDiamond = useCallback(() => setOpenDiamond(null), []);
  const openRoundSettings = useCallback(() => {
    setOpenQuizIndex(null);
    setOpenRandomAssignment(null);
    setAutoAdvanceAfterQuizIndex(null);
    setOpenDiamond(null);
    completingRandomQuizRef.current = false;
    setRoundSettingsOpen(true);
  }, []);
  const closeRoundSettings = useCallback(() => setRoundSettingsOpen(false), []);
  const navigateQuiz = useCallback((quizIndex: number) => setOpenQuizIndex(quizIndex), []);
  const openStudentQuiz = useCallback(
    (studentIndex: number, quizIndex: number) => {
      const shouldClose =
        selectedStudentIndex === studentIndex && openQuizIndex === quizIndex;
      setSelectedStudentIndex(studentIndex);
      setAutoAdvanceAfterQuizIndex(null);
      setOpenQuizIndex(shouldClose ? null : quizIndex);
      setOpenRandomAssignment(null);
      setOpenDiamond(null);
    },
    [openQuizIndex, selectedStudentIndex],
  );
  const openStudentDiamond = useCallback((studentIndex: number, diamondIndex: number) => {
    setSelectedStudentIndex(studentIndex);
    setAutoAdvanceAfterQuizIndex(null);
    setOpenQuizIndex(null);
    setOpenRandomAssignment(null);
    setOpenDiamond({ studentIndex, diamondIndex });
  }, []);

  const openSharedQuiz = useCallback(
    (quizIndex: number) => {
      if (!selectedRound || !sharedQueueReady || !activeQuizIndexes.includes(quizIndex)) {
        return;
      }

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
          lastSolverName: selectedRoundQueue.lastSolverByQuiz[String(quizIndex)],
        });

      if (!participant) {
        setQueueAnnouncement(`${quizIndex + 1}번 퀴즈는 모두 완료했습니다.`);
        return;
      }

      const quizKey = String(quizIndex);
      const storedVariantSeed = selectedRoundQueue.variantSeedByQuiz[quizKey];
      const variantSeed =
        pendingParticipant && storedVariantSeed !== undefined
          ? storedVariantSeed
          : createRandomQuizVariantSeed(
              quizIndex,
              storedVariantSeed ?? selectedRoundQueue.lastVariantSeedByQuiz[quizKey],
            );

      if (
        !pendingParticipant ||
        (variantSeed !== null && storedVariantSeed !== variantSeed)
      ) {
        setRandomQueueState((current) => {
          const roundQueue = getRandomQuizRoundQueue(current, selectedRound.id);
          const variantSeedByQuiz = { ...roundQueue.variantSeedByQuiz };
          if (variantSeed === null) delete variantSeedByQuiz[quizKey];
          else variantSeedByQuiz[quizKey] = variantSeed;

          return {
            ...current,
            rounds: {
              ...current.rounds,
              [selectedRound.id]: {
                ...roundQueue,
                pendingByQuiz: {
                  ...roundQueue.pendingByQuiz,
                  [quizKey]: participant.name,
                },
                variantSeedByQuiz,
              },
            },
          };
        });
      }

      completingRandomQuizRef.current = false;
      setOpenQuizIndex(null);
      setOpenDiamond(null);
      setOpenRandomAssignment({
        quizIndex,
        studentName: participant.name,
        variantSeed,
      });
      setQueueAnnouncement(
        `${quizIndex + 1}번 퀴즈는 ${participant.name.slice(1).trim()} 학생에게 배정됐습니다.`,
      );
    },
    [
      activeQuizIndexes,
      progress,
      randomQuizParticipants,
      selectedRoundQueue.lastVariantSeedByQuiz,
      selectedRound,
      selectedRoundQueue.lastSolverByQuiz,
      selectedRoundQueue.variantSeedByQuiz,
      sharedQueueReady,
      validPendingByQuiz,
    ],
  );

  const openNextSharedQuiz = useCallback(() => {
    if (!sharedQueueReady) return;

    const pendingQuizIndex = randomQuizOrder.find(
      (quizIndex) => validPendingByQuiz[String(quizIndex)] !== undefined,
    );
    const nextQuizIndex =
      pendingQuizIndex ??
      randomQuizOrder.find((quizIndex) =>
        randomQuizParticipants.some(({ name }) =>
          canStudentSolveQuiz(progress, name, quizIndex),
        ),
      );

    if (nextQuizIndex === undefined) {
      setQueueAnnouncement("현재 퀴즈를 모두 풀었습니다.");
      return;
    }

    openSharedQuiz(nextQuizIndex);
  }, [
    openSharedQuiz,
    progress,
    randomQuizOrder,
    randomQuizParticipants,
    sharedQueueReady,
    validPendingByQuiz,
  ]);

  const completeSharedQuiz = useCallback((targetStage: QuizMineralStage) => {
    if (!selectedRound || !openRandomAssignment || completingRandomQuizRef.current) return;

    const { quizIndex, studentName } = openRandomAssignment;
    if (!canStudentSolveQuiz(progress, studentName, quizIndex)) return;

    completingRandomQuizRef.current = true;
    if (!awardQuizStage(studentName, quizIndex, targetStage)) {
      completingRandomQuizRef.current = false;
      return;
    }

    setRandomQueueState((current) => {
      const roundQueue = getRandomQuizRoundQueue(current, selectedRound.id);
      const pendingByQuiz = { ...roundQueue.pendingByQuiz };
      const variantSeedByQuiz = { ...roundQueue.variantSeedByQuiz };
      const lastVariantSeedByQuiz = { ...roundQueue.lastVariantSeedByQuiz };
      const quizKey = String(quizIndex);
      const reachedRuby = targetStage === MAX_SOLVES;
      if (reachedRuby) {
        delete pendingByQuiz[quizKey];
        const completedVariantSeed = variantSeedByQuiz[quizKey];
        if (completedVariantSeed !== undefined) {
          lastVariantSeedByQuiz[quizKey] = completedVariantSeed;
        }
        delete variantSeedByQuiz[quizKey];
      } else {
        pendingByQuiz[quizKey] = studentName;
      }
      const currentOrder = reconcileQuizOrder(roundQueue.order, activeQuizIndexes);

      return {
        ...current,
        rounds: {
          ...current.rounds,
          [selectedRound.id]: {
            ...roundQueue,
            order: [...currentOrder.filter((index) => index !== quizIndex), quizIndex],
            pendingByQuiz,
            variantSeedByQuiz,
            lastVariantSeedByQuiz,
            lastSolverByQuiz: reachedRuby
              ? { ...roundQueue.lastSolverByQuiz, [quizKey]: studentName }
              : roundQueue.lastSolverByQuiz,
          },
        },
      };
    });
    setAutoAdvanceAfterQuizIndex(quizIndex);
    const rewardLabel =
      targetStage === 1 ? "돌" : targetStage === 2 ? "수정" : "루비";
    setQueueAnnouncement(
      `${quizIndex + 1}번 퀴즈에서 ${rewardLabel}을 획득했습니다. 다음 퀴즈를 추첨합니다.`,
    );
  }, [activeQuizIndexes, awardQuizStage, openRandomAssignment, progress, selectedRound]);

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
  const randomAssignedParticipant = openRandomAssignment
    ? randomQuizParticipants.find(({ name }) => name === openRandomAssignment.studentName) ?? null
    : null;
  const randomAssignedCounts = openRandomAssignment
    ? progress[openRandomAssignment.studentName] ?? []
    : [];
  const randomAssignedContent = openRandomAssignment
    ? resolveQuizContent(
        openRandomAssignment.quizIndex,
        openRandomAssignment.variantSeed,
    )
    : null;
  const diamondStudent = openDiamond ? students[openDiamond.studentIndex] ?? null : null;
  const diamondStudentName = diamondStudent?.name ?? null;
  const diamondStudentCounts = diamondStudentName ? progress[diamondStudentName] ?? [] : [];
  const diamondRubyQuizIndexes = openDiamond
    ? getMineralInventory(diamondStudentCounts).diamondGroups.find(
        ({ diamondIndex }) => diamondIndex === openDiamond.diamondIndex,
      )?.quizIndexes ?? null
    : null;
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

      {selectedRound ? (
        <div className="mt-5">
          <RoundToolbar
            rounds={CURRICULUM_QUIZ_ROUNDS}
            selectedRoundId={selectedRound.id}
            assignments={roundAssignments}
            progress={progress}
            onSelectRound={selectRound}
            onOpenSettings={openRoundSettings}
          />
        </div>
      ) : null}

      <section className="mt-5" aria-label="퀴즈 진행도">
        {visibleStudentEntries.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#ddd1c1] bg-[#fffefa] px-5 text-center">
            <p className="text-sm font-bold text-[#665c6f]">
              현재 표시할 이름이 없어요. 제목 오른쪽 스위치를 켜 주세요.
            </p>
          </div>
        ) : (
          <div
            className={`grid items-start gap-6 ${
              selectedName && openQuizIndex !== null
                ? "xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]"
                : ""
            }`}
          >
            <div className="min-w-0">
              {openRandomAssignment &&
              randomAssignedParticipant &&
              randomAssignedContent ? (
                <RandomQuizPanel
                  key={`${openRandomAssignment.quizIndex}-${openRandomAssignment.studentName}-${randomAssignedContent.variantKey}`}
                  studentName={openRandomAssignment.studentName}
                  quizIndex={openRandomAssignment.quizIndex}
                  variantKey={randomAssignedContent.variantKey}
                  questionText={randomAssignedContent.question}
                  answerText={randomAssignedContent.answer}
                  counts={randomAssignedCounts}
                  onAward={completeSharedQuiz}
                  onClose={closeRandomPanel}
                />
              ) : (
                <section
                  className="rounded-[2rem] border border-[var(--control-border-active)] bg-[var(--surface)] p-6 shadow-[0_16px_40px_rgba(73,53,96,0.10)] sm:p-7"
                  aria-label="랜덤 퀴즈"
                  aria-busy={!sharedQueueReady}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black tracking-[0.16em] text-[var(--lesson-accent)]">
                        QUIZ
                      </p>
                      <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]">
                        랜덤 퀴즈
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--control-border)] bg-[var(--control-background)] px-3 py-1.5 text-xs font-black tabular-nums text-[var(--control-foreground)]">
                      {currentRoundParticipantNames.length}명
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-bold text-[var(--muted)]">
                    {currentRoundParticipantNames.length === 0
                      ? "참여 학생을 배정해 주세요."
                      : queueAnnouncement || "다음 퀴즈를 시작하세요."}
                  </p>
                  <button
                    type="button"
                    onClick={openNextSharedQuiz}
                    disabled={!sharedQueueReady || currentRoundParticipantNames.length === 0}
                    className="mt-6 rounded-xl bg-[var(--lesson-accent)] px-5 py-3 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lesson-accent)] focus-visible:ring-offset-2"
                  >
                    다음 퀴즈
                  </button>
                  <p className="sr-only" role="status" aria-live="polite">
                    {queueAnnouncement}
                  </p>
                </section>
              )}

              <div
                className="mt-10 border-t border-[#e7dccb] pt-8"
                aria-label="전체 진도 체크리스트"
              >
                <h2 className="text-xl font-bold text-[#51475c]">전체 진도 체크리스트</h2>
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-x-12 gap-y-6 2xl:grid-cols-2">
                  {visibleStudentEntries.map(({ student, originalIndex }) => {
                    const counts = progress[student.name] ?? [];
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
                          counts={counts}
                          quizIndexes={activeQuizIndexes}
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

            {selectedName && openQuizIndex !== null ? (
              <div className="order-first min-w-0 xl:order-none xl:col-start-2">
                <div className="xl:sticky xl:top-4">
                  <QuizPanel
                    name={selectedName.slice(1)}
                    quizIndex={openQuizIndex}
                    counts={selectedCounts}
                    navigationQuizIndexes={activeQuizIndexes}
                    onAward={(stage) =>
                      awardQuizStage(selectedName, openQuizIndex, stage)
                    }
                    onUndo={() => undoQuiz(selectedName, openQuizIndex)}
                    onNavigate={navigateQuiz}
                    onClose={closePanel}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <RoundSettingsModal
        open={roundSettingsOpen}
        rounds={CURRICULUM_QUIZ_ROUNDS}
        selectedRoundId={selectedRound?.id ?? selectedRoundId}
        assignments={roundAssignments}
        students={roundSettingsStudents}
        progress={progress}
        onSelectRound={selectRound}
        onChangeAssignment={changeRoundAssignment}
        onClose={closeRoundSettings}
      />

      {openDiamond && diamondStudentName && diamondRubyQuizIndexes ? (
        <DiamondModal
          studentName={diamondStudentName.slice(1)}
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
