"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import MoodChart from "./MoodChart";
import MoodFace from "./MoodFace";
import PrivateRecords from "./PrivateRecords";
import {
  careReasons,
  koreanDate,
  MOODS,
  studentEntries,
  type CareStatus,
  type LifeSnapshot,
  type LifeStudent,
  type MoodEntry,
  type MoodScore,
} from "./mood";
import styles from "./life.module.css";

type Gate = "loading" | "login" | "setup" | "error";
type Mutation = { action: string; [key: string]: unknown };

class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public setup = false,
  ) {
    super(message);
  }
}

async function requestLife(body?: Mutation, signal?: AbortSignal) {
  const response = await fetch("/api/life", {
    method: body ? "POST" : "GET",
    cache: "no-store",
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok)
    throw new RequestError(
      payload.error ?? "다시 시도해 주세요.",
      response.status,
      payload.setup === true,
    );
  return payload;
}

function Login({
  onLogin,
  busy,
  error,
  onCancel,
}: {
  onLogin: (password: string) => void;
  busy: boolean;
  error: string;
  onCancel?: () => void;
}) {
  const [password, setPassword] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    onLogin(password);
  }
  return (
    <section className={styles.loginCard}>
      <MoodFace score={3} className={styles.welcomeFace} />
      <p className={styles.eyebrow}>학생 생활</p>
      <h1>마음 쉼터</h1>
      <p className={styles.muted}>하루 한 번, 마음을 만나는 시간</p>
      <form onSubmit={submit} className={styles.loginForm} autoComplete="off">
        <label htmlFor="life-password">관리자 비밀번호</label>
        <input
          id="life-password"
          type="password"
          name="life-admin-password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={password}
          maxLength={4}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoFocus
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button
          className={styles.primary}
          disabled={busy || password.length !== 4}
        >
          {busy ? "확인 중…" : "관리자 입장"}
        </button>
      </form>
      {onCancel ? (
        <button className={styles.textButton} onClick={onCancel}>
          학생 화면으로
        </button>
      ) : (
        <Link className={styles.textButton} href="/life/demo">
          먼저 체험하기 ↗
        </Link>
      )}
    </section>
  );
}

function StudentCheckIn({
  student,
  hasRecordedToday,
  today,
  busy,
  onSave,
  onFinish,
  onAdmin,
}: {
  student: LifeStudent;
  hasRecordedToday: boolean;
  today: string;
  busy: boolean;
  onSave: (score: MoodScore, wantsTalk: boolean) => Promise<boolean>;
  onFinish: () => void;
  onAdmin: () => void;
}) {
  const [score, setScore] = useState<MoodScore | null>(null);
  const [wantsTalk, setWantsTalk] = useState(false);
  const [editing, setEditing] = useState(!hasRecordedToday);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  async function save() {
    if (score === null || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      if (await onSave(score, wantsTalk)) setEditing(false);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  return (
    <div className={styles.studentMode}>
      <div className={styles.studentTop}>
        <span className={styles.wordmark}>
          <span aria-hidden="true">✿</span> 마음 쉼터
        </span>
        <button className={styles.textButton} onClick={onAdmin} disabled={busy}>
          관리자 화면
        </button>
      </div>
      <section className={styles.checkInCard}>
        <time dateTime={today} className={styles.datePill}>
          {Number(today.slice(5, 7))}월 {Number(today.slice(8))}일
        </time>
        {editing ? (
          <>
            <div className={styles.studentGreeting}>
              <span>{student.name}</span>
              <h1>오늘 마음은 어때?</h1>
              <p>어떤 마음이어도 괜찮아</p>
            </div>
            <fieldset className={styles.moodPicker} disabled={busy || saving}>
              <legend className={styles.srOnly}>
                오늘의 기분: 0은 매우 안 좋음, 5는 모든 것이 만족스러운 매우
                좋은 상태입니다.
              </legend>
              {MOODS.map((mood) => (
                <label
                  key={mood.score}
                  className={`${styles.moodOption} ${score === mood.score ? styles.selectedMood : ""}`}
                >
                  <input
                    type="radio"
                    name="mood"
                    value={mood.score}
                    checked={score === mood.score}
                    onChange={() => setScore(mood.score)}
                    aria-label={`${mood.score}점, ${mood.label}`}
                  />
                  <span className={styles.selectionMark} aria-hidden="true">
                    {score === mood.score ? "✓" : ""}
                  </span>
                  <MoodFace score={mood.score} />
                  <strong>
                    {mood.score}
                    <small>점</small>
                  </strong>
                  <span>{mood.label}</span>
                </label>
              ))}
            </fieldset>
            <label className={styles.talkRequest}>
              <input
                type="checkbox"
                aria-label="선생님과 이야기하고 싶어요"
                checked={wantsTalk}
                disabled={busy || saving}
                onChange={(event) => setWantsTalk(event.target.checked)}
              />
              <span>선생님과 이야기하고 싶어요</span>
              <span aria-hidden="true">♡</span>
            </label>
            <button
              className={styles.saveButton}
              disabled={score === null || busy || saving}
              onClick={save}
            >
              {saving
                ? "남기는 중…"
                : hasRecordedToday
                  ? "오늘 기록 바꾸기"
                  : "오늘 마음 남기기"}
              <span aria-hidden="true"> ↗</span>
            </button>
            <p className={styles.privacyNote}>
              내 기록은 나와 선생님이 함께 봐요
            </p>
            <button
              className={styles.textButton}
              disabled={busy || saving}
              onClick={onFinish}
            >
              지금은 건너뛰기
            </button>
          </>
        ) : (
          <div className={styles.savedState} role="status">
            <span className={styles.savedPrivateMark} aria-hidden="true">
              ♡
            </span>
            <span className={styles.savedBadge}>오늘 기록 완료</span>
            <h1>마음을 남겨 줘서 고마워</h1>
            <div className={styles.savedActions}>
              <button
                className={styles.primary}
                disabled={busy}
                onClick={onFinish}
              >
                마치기
              </button>
              <button
                className={styles.secondary}
                disabled={busy}
                onClick={() => {
                  setScore(null);
                  setWantsTalk(false);
                  setEditing(true);
                }}
              >
                오늘 기록 바꾸기
              </button>
            </div>
          </div>
        )}
      </section>
      <section className={styles.studentPrivateRecords}>
        <p>내 기록은 선생님과 함께 봐요</p>
        <button className={styles.secondary} onClick={onAdmin} disabled={busy}>
          기록 보기 · 관리자 로그인
        </button>
      </section>
    </div>
  );
}

function Dashboard({
  snapshot,
  initialStudentId,
  busy,
  onSelect,
  onCare,
  onLock,
  onRefresh,
}: {
  snapshot: LifeSnapshot;
  initialStudentId?: string;
  busy: boolean;
  onSelect: (id: string) => void;
  onCare: (entry: MoodEntry, status: CareStatus) => void;
  onLock: () => void;
  onRefresh: () => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(
    initialStudentId ?? snapshot.students[0]?.id ?? "",
  );
  const [privacyVersion, setPrivacyVersion] = useState(0);
  const rows = snapshot.students.map((student) => {
    const entries = studentEntries(snapshot.entries, student.id);
    return {
      student,
      entries,
      todayEntry: entries.find((entry) => entry.recordedOn === snapshot.today),
      reasons: careReasons(entries, snapshot.today),
    };
  });
  const recorded = rows.filter((row) => row.todayEntry).length;
  const selected = rows.find((row) => row.student.id === selectedId);
  const visible = rows.filter(
    (row) =>
      row.student.name.includes(query.trim()) &&
      (filter === "all" ||
        (filter === "missing" ? !row.todayEntry : row.reasons.length > 0)),
  );
  const careEntries = selected
    ? selected.entries
        .filter(
          (entry) =>
            entry.recordedOn === selected.entries.at(-1)?.recordedOn ||
            (entry.wantsTalk && entry.careStatus !== "done") ||
            entry.careStatus === "scheduled",
        )
        .reverse()
    : [];
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>
            학생 생활 <span> / </span> 관리자
          </p>
          <h1>
            마음 쉼터 <span aria-hidden="true">✿</span>
          </h1>
          <p className={styles.muted}>작은 마음의 변화도, 함께 살펴요.</p>
        </div>
        <div className={styles.headingActions}>
          <time dateTime={snapshot.today}>
            {snapshot.today.replaceAll("-", ".")}
          </time>
          <button
            className={styles.secondary}
            onClick={onRefresh}
            disabled={busy}
          >
            새로고침
          </button>
          <button className={styles.secondary} onClick={onLock} disabled={busy}>
            잠그기
          </button>
        </div>
      </div>
      <section className={styles.overview} aria-label="오늘 기록 현황">
        <div className={styles.overviewIntro}>
          <MoodFace score={3} />
          <div>
            <strong>하루 한 번, 마음 안부</strong>
            <p>이름을 고르고 학생에게 건네주세요.</p>
          </div>
        </div>
        <div className={styles.stat}>
          <span>오늘 기록</span>
          <strong>
            {recorded}
            <small> / {rows.length}명</small>
          </strong>
        </div>
        <div className={styles.stat}>
          <span>아직 미기록</span>
          <strong>
            {rows.length - recorded}
            <small>명</small>
          </strong>
        </div>
        <div className={`${styles.stat} ${styles.careStat}`}>
          <span>개인 기록</span>
          <strong className={styles.privacyStatus}>가림</strong>
        </div>
      </section>
      <div className={styles.dashboardGrid}>
        <section className={styles.rosterCard}>
          <div className={styles.sectionHead}>
            <h2>
              우리 학생 <small>{rows.length}</small>
            </h2>
          </div>
          <label className={styles.search}>
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="학생 이름 검색"
              placeholder="이름 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className={styles.filters} aria-label="학생 목록 필터">
            {[
              ["all", "전체"],
              ["missing", "미기록"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.rosterLabels}>
            <span>학생</span>
            <span>오늘</span>
          </div>
          <div className={styles.roster}>
            {visible.length === 0 ? (
              <p className={styles.emptyRoster}>
                {rows.length ? "해당 학생이 없어요" : "등록된 학생이 없어요"}
              </p>
            ) : (
              visible.map((row, index) => (
                <button
                  key={row.student.id}
                  className={`${styles.studentRow} ${selectedId === row.student.id ? styles.activeRow : ""}`}
                  onClick={() => setSelectedId(row.student.id)}
                  aria-pressed={selectedId === row.student.id}
                >
                  <span className={styles.avatar} data-color={index % 4}>
                    {row.student.name.slice(0, 1)}
                  </span>
                  <span className={styles.studentName}>
                    <strong>{row.student.name}</strong>
                  </span>
                  <span className={styles.todayScore}>
                    {row.todayEntry ? (
                      <span className={styles.recorded}>기록 완료</span>
                    ) : (
                      <span className={styles.missing}>미기록</span>
                    )}
                  </span>
                  <span aria-hidden="true" className={styles.rowArrow}>
                    ›
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
        {selected ? (
          <div className={styles.studentDetail}>
            <section className={styles.detailCard}>
              <div className={styles.detailHead}>
                <div>
                  <p className={styles.eyebrow}>함께 보는 마음</p>
                  <h2>
                    {selected.student.name}
                    <span>의 하루</span>
                  </h2>
                </div>
                <button
                  className={styles.primary}
                  disabled={busy}
                  onClick={() => {
                    setPrivacyVersion((value) => value + 1);
                    onSelect(selected.student.id);
                  }}
                >
                  학생 입력 시작 ↗
                </button>
              </div>
            </section>
            <PrivateRecords
              key={`${selected.student.id}:${privacyVersion}`}
              onReveal={onRefresh}
            >
              <section className={styles.detailCard}>
                <div className={styles.todayDetail}>
                  <MoodFace score={selected.todayEntry?.score ?? 3} />
                  <div>
                    <span>오늘의 마음</span>
                    <strong>
                      {selected.todayEntry ? (
                        <>
                          {selected.todayEntry.score}
                          <small> / 5</small>
                        </>
                      ) : (
                        "아직 만나기 전"
                      )}
                    </strong>
                    <p>
                      {selected.todayEntry
                        ? MOODS[selected.todayEntry.score].label
                        : "점수를 직접 고를 수 있어요"}
                    </p>
                  </div>
                  <div className={styles.detailFlower} aria-hidden="true">
                    ✳
                  </div>
                </div>
                {selected.reasons.length > 0 && (
                  <div className={styles.careNotice}>
                    <span aria-hidden="true">♡</span>
                    <div>
                      <strong>한 번 더 안부를 물어봐 주세요</strong>
                      <p>{selected.reasons.join(" · ")}</p>
                    </div>
                  </div>
                )}
              </section>
              <MoodChart
                key={selected.student.id}
                entries={selected.entries}
                today={snapshot.today}
                compact
              />
              {careEntries.length > 0 && (
                <section className={styles.careCard}>
                  <div className={styles.sectionHead}>
                    <h2>상담 연결</h2>
                    <span className={styles.muted}>관리자에게만 표시</span>
                  </div>
                  {careEntries.map((entry) => (
                    <div className={styles.careRow} key={entry.recordedOn}>
                      <div>
                        <time dateTime={entry.recordedOn}>
                          {entry.recordedOn.slice(5).replace("-", ".")}
                        </time>
                        <span>
                          {entry.wantsTalk ? "대화 요청" : "안부 확인"}
                        </span>
                      </div>
                      <select
                        aria-label={`${entry.recordedOn} 상담 상태`}
                        value={entry.careStatus}
                        disabled={busy}
                        onChange={(event) =>
                          onCare(entry, event.target.value as CareStatus)
                        }
                      >
                        <option value="pending">확인 전</option>
                        <option value="scheduled">상담 예정</option>
                        <option value="done">확인 완료</option>
                      </select>
                    </div>
                  ))}
                </section>
              )}
            </PrivateRecords>
          </div>
        ) : (
          <section className={styles.detailCard}>
            <div className={styles.emptyChart}>
              <MoodFace />
              <p>학생을 선택해 주세요</p>
            </div>
          </section>
        )}
      </div>
      <details className={styles.criteria}>
        <summary>확인 제안 기준</summary>
        <p>
          오늘·어제의 0~1점, 3일 연속 2점 이하, 7일 이내 이전 기록보다 2점 이상
          하락, 또는 미완료 대화 요청을 표시합니다. 미기록은 0점으로 계산하지
          않습니다. 상담 연결을 돕는 표시이며 진단이 아닙니다. 확인 완료한
          기록은 제안에서 제외합니다.
        </p>
      </details>
    </>
  );
}

export default function LifeSpace({
  demoSnapshot,
}: {
  demoSnapshot?: LifeSnapshot;
}) {
  const [snapshot, setSnapshot] = useState<LifeSnapshot | null>(null);
  const [demoData, setDemoData] = useState(demoSnapshot);
  const [gate, setGate] = useState<Gate>(demoSnapshot ? "login" : "loading");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const loadVersion = useRef(0);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>();
  const sessionChannel = useRef<BroadcastChannel | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    const version = ++loadVersion.current;
    return requestLife(undefined, signal)
      .then((data: LifeSnapshot) => {
        if (!signal?.aborted && version === loadVersion.current) {
          setSnapshot(data);
          setError("");
          setShowLogin(false);
          return data.role === "admin";
        }
        return false;
      })
      .catch((caught: unknown) => {
        if (signal?.aborted || version !== loadVersion.current) return false;
        setSnapshot(null);
        if (caught instanceof RequestError && caught.setup) setGate("setup");
        else if (caught instanceof RequestError && caught.status === 401) {
          setGate("login");
          setError("");
        } else {
          setGate("error");
          setError(
            caught instanceof Error ? caught.message : "연결하지 못했어요.",
          );
        }
        return false;
      });
  }, []);

  useEffect(() => {
    if (demoSnapshot) return;
    const controller = new AbortController();
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("life-session-change")
        : null;
    sessionChannel.current = channel;
    if (channel)
      channel.onmessage = () => {
        setSnapshot(null);
        setGate("loading");
        setShowLogin(false);
        void load();
      };
    void load(controller.signal);
    return () => {
      controller.abort();
      channel?.close();
      sessionChannel.current = null;
    };
  }, [demoSnapshot, load]);

  useEffect(() => {
    if (demoSnapshot || !snapshot?.expiresAt) return;
    const timer = window.setTimeout(
      () => {
        loadVersion.current += 1;
        setSnapshot(null);
        setGate("login");
        setShowLogin(false);
      },
      Math.max(0, snapshot.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [demoSnapshot, snapshot?.expiresAt]);

  async function mutate(body: Mutation) {
    if (inFlight.current) return false;
    loadVersion.current += 1;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      if (demoData) {
        let data = { ...demoData, today: koreanDate() };
        if (body.action === "login") {
          await requestLife({ action: "demoLogin", password: body.password });
          setSnapshot(data);
          setShowLogin(false);
        } else if (body.action === "select") {
          // A real administrator session may exist from another tab. Revoke it
          // before this device is handed to a student, even in the demo.
          await requestLife({ action: "lock" });
          if (typeof BroadcastChannel !== "undefined") {
            const channel = new BroadcastChannel("life-session-change");
            channel.postMessage("changed");
            channel.close();
          }
          setSnapshot({
            ...data,
            role: "student",
            students: data.students.filter(
              (student) => student.id === body.studentId,
            ),
            entries: [],
            hasRecordedToday: data.entries.some(
              (entry) =>
                entry.studentId === body.studentId &&
                entry.recordedOn === data.today,
            ),
          });
        } else if (body.action === "save") {
          const studentId = snapshot!.students[0].id;
          const old = data.entries.find(
            (entry) =>
              entry.studentId === studentId && entry.recordedOn === data.today,
          );
          const entry: MoodEntry = {
            studentId,
            recordedOn: data.today,
            score: body.score as MoodScore,
            wantsTalk: body.wantsTalk as boolean,
            careStatus:
              old &&
              old.score === body.score &&
              old.wantsTalk === body.wantsTalk
                ? old.careStatus
                : "pending",
            updatedAt: new Date().toISOString(),
          };
          data = {
            ...data,
            entries: [
              ...data.entries.filter(
                (item) =>
                  item.studentId !== studentId ||
                  item.recordedOn !== data.today,
              ),
              entry,
            ],
          };
          setDemoData(data);
          setSnapshot({
            ...data,
            role: "student",
            students: data.students.filter(
              (student) => student.id === studentId,
            ),
            entries: [],
            hasRecordedToday: true,
          });
        } else if (body.action === "care") {
          data = {
            ...data,
            entries: data.entries.map((entry) =>
              entry.studentId === body.studentId &&
              entry.recordedOn === body.recordedOn
                ? { ...entry, careStatus: body.careStatus as CareStatus }
                : entry,
            ),
          };
          setDemoData(data);
          setSnapshot(data);
        } else if (body.action === "lock") {
          setSnapshot(null);
          setGate("login");
          setShowLogin(false);
        } else {
          setSnapshot(data);
          setShowLogin(false);
        }
        return true;
      }
      if (body.action === "select" || body.action === "lock") {
        setSnapshot(null);
        setGate("loading");
      }
      const result = await requestLife(body);
      if (["login", "select", "lock"].includes(body.action))
        sessionChannel.current?.postMessage("changed");
      if (body.action === "lock") {
        setSnapshot(null);
        setGate("login");
        setShowLogin(false);
      } else if (body.action === "save") {
        setSnapshot((current) =>
          current ? { ...current, entries: [], hasRecordedToday: true } : null,
        );
      } else if (body.action === "care") {
        const entry = result.entry as MoodEntry;
        setSnapshot((current) =>
          current
            ? {
                ...current,
                entries: [
                  ...current.entries.filter(
                    (item) =>
                      item.studentId !== entry.studentId ||
                      item.recordedOn !== entry.recordedOn,
                  ),
                  entry,
                ],
              }
            : null,
        );
      } else {
        setSnapshot(null);
        setGate("loading");
        await load();
      }
      return true;
    } catch (caught) {
      if (body.action === "select" || body.action === "lock") {
        setSnapshot(null);
        setGate("login");
        sessionChannel.current?.postMessage("changed");
      }
      setError(
        caught instanceof RequestError
          ? caught.message
          : "연결하지 못했어요. 다시 시도해 주세요.",
      );
      if (
        caught instanceof RequestError &&
        caught.status === 401 &&
        body.action !== "login"
      ) {
        setSnapshot(null);
        setGate("login");
      }
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function refresh() {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try {
      if (demoData) {
        setSnapshot({ ...demoData, today: koreanDate() });
        return true;
      }
      return await load();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <main className={styles.space}>
      <div className={styles.shell}>
        {demoSnapshot && (
          <div className={styles.demoBanner}>
            <span>체험 화면 · 가상 학생 · 새로고침하면 초기화</span>
            <Link href="/life">실제 공간으로 ↗</Link>
          </div>
        )}
        {error && snapshot && !showLogin && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {showLogin || (!snapshot && gate === "login") ? (
          <Login
            busy={busy}
            error={error}
            onLogin={(password) => void mutate({ action: "login", password })}
            onCancel={
              snapshot
                ? () => {
                    setShowLogin(false);
                    setError("");
                  }
                : undefined
            }
          />
        ) : !snapshot ? (
          <section className={styles.loginCard}>
            <MoodFace className={styles.welcomeFace} />
            <p className={styles.eyebrow}>학생 생활</p>
            <h1>마음 쉼터</h1>
            {gate === "loading" ? (
              <p role="status" className={styles.muted}>
                마음을 만날 준비 중…
              </p>
            ) : gate === "setup" ? (
              <p className={styles.muted}>관리자 접근 설정을 확인해 주세요.</p>
            ) : (
              <>
                <p className={styles.error} role="alert">
                  {error}
                </p>
                <button
                  className={styles.primary}
                  onClick={() => {
                    setGate("loading");
                    void load();
                  }}
                >
                  다시 시도
                </button>
              </>
            )}
          </section>
        ) : snapshot.role === "student" && snapshot.students[0] ? (
          <StudentCheckIn
            key={`${snapshot.students[0].id}:${snapshot.today}`}
            student={snapshot.students[0]}
            hasRecordedToday={snapshot.hasRecordedToday ?? false}
            today={snapshot.today}
            busy={busy}
            onSave={(score, wantsTalk) =>
              mutate({
                action: "save",
                score,
                wantsTalk,
                recordedOn: snapshot.today,
              })
            }
            onFinish={() => void mutate({ action: "lock" })}
            onAdmin={() => {
              setSelectedStudentId(snapshot.students[0].id);
              setShowLogin(true);
            }}
          />
        ) : snapshot.role === "student" ? (
          <section className={styles.loginCard}>
            <p>학생 명단을 확인해 주세요.</p>
            <button
              className={styles.primary}
              onClick={() => void mutate({ action: "lock" })}
            >
              관리자 화면
            </button>
          </section>
        ) : (
          <Dashboard
            snapshot={snapshot}
            initialStudentId={selectedStudentId}
            busy={busy}
            onSelect={(studentId) => {
              setSelectedStudentId(studentId);
              void mutate({ action: "select", studentId });
            }}
            onCare={(entry, careStatus) =>
              void mutate({
                action: "care",
                studentId: entry.studentId,
                recordedOn: entry.recordedOn,
                careStatus,
              })
            }
            onLock={() => void mutate({ action: "lock" })}
            onRefresh={refresh}
          />
        )}
      </div>
    </main>
  );
}
