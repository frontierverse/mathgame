"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, BookOpen, Check, ChevronDown, ChevronRight, Circle, Gift, Lightbulb, LockKeyhole, RotateCcw, Star, UserRound, X } from "lucide-react";
import { concept, earnedWon, formatWon, practiceQuestions, testQuestions, testScore } from "./curriculum";
import { compactDate, dateLabel, hasLesson, learningStatus, weekDates, type Student, type StudentSession, type StudentProgress, type ProgressAction } from "./studentProgress";
import StudyCalendar, { DayMarker } from "./StudyCalendar";
import StudentPicker from "./StudentPicker";
import ConceptLesson from "./ConceptLesson";
import Formula from "./Formula";
import MeaningChoice from "./MeaningChoice";

type Tab = "study" | "rewards" | "profile";
type StudyView = "calendar" | "concept" | "practice" | "complete";
type RewardView = "home" | "test" | "result";

const emptyAnswers = [null, null, null] as const;

async function requestJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, { method, credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(typeof data?.error === "string" ? data.error : "연결을 확인하고 다시 시도해 주세요.");
  return data as T;
}

function Stars({ count, total }: { count: number; total?: number }) {
  return <span className="star-badge" aria-label={`모은 별 ${count}개${total ? `, 목표 ${total}개` : ""}`}>
    <Star size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
    <span>{count}{total && ` / ${total}`}</span>
  </span>;
}

function DemoLabel() {
  return <span className="demo-label" aria-label="화면 체험용 보상이며 실제 지급이나 쿠폰 발급은 연결되지 않았습니다.">체험</span>;
}

export default function MathVault({ today, initialStudents, initialSession, initialError = "" }: { today: string; initialStudents: Student[]; initialSession: StudentSession | null; initialError?: string }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [studyView, setStudyView] = useState<StudyView>("calendar");
  const [rewardView, setRewardView] = useState<RewardView>("home");
  const [students, setStudents] = useState(initialStudents);
  const [session, setSession] = useState(initialSession);
  const [pending, setPending] = useState(false);
  const [connectionError, setConnectionError] = useState(initialError);
  const [reflectionDraft, setReflectionDraft] = useState(initialSession?.progress.reflection ?? "");
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [testIndex, setTestIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeStudent = session?.student;
  const progress = session?.progress;
  const stars = progress?.stars ?? 0;
  const couponClaimed = progress?.couponClaimed ?? false;
  const testAnswers = progress?.testAnswers ?? emptyAnswers;
  const payoutDate = activeStudent?.payoutDate;
  const startDate = activeStudent?.admissionDate;

  const practiceComplete = stars === concept.practiceCount;
  const testComplete = testAnswers.every(answer => answer !== null);
  const score = testScore(testAnswers);
  const totalWon = earnedWon(testAnswers);
  const daysLeft = payoutDate ? Math.max(0, Math.ceil((Date.parse(`${payoutDate}T00:00:00+09:00`) - Date.parse(`${today}T00:00:00+09:00`)) / 86400000)) : null;
  const cycleProgress = payoutDate && startDate && payoutDate > startDate ? Math.min(100, Math.max(0, (Date.parse(today) - Date.parse(startDate)) / (Date.parse(payoutDate) - Date.parse(startDate)) * 100)) : 0;
  const isTestDay = [3, 5].includes(new Date(`${today}T12:00:00+09:00`).getUTCDay());

  function scrollTop() { scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); }
  function clearAnswer() { setSelected(null); setFeedback(null); setHintOpen(false); }
  async function updateProgress(action: ProgressAction) {
    if (!session || pending) return null;
    setPending(true); setConnectionError("");
    try {
      const result = await requestJson<{ progress: StudentProgress; correct?: boolean }>("/api/student-progress", "POST", { studentId: session.student.id, action });
      setSession({ ...session, progress: result.progress });
      return result;
    } catch (error) { setConnectionError(error instanceof Error ? error.message : "저장하지 못했습니다."); return null; }
    finally { setPending(false); }
  }
  async function loginStudent(id: string) {
    if (pending) return;
    setPending(true); setConnectionError("");
    try {
      const { session: next } = await requestJson<{ session: StudentSession }>("/api/student-session", "POST", { studentId: id });
      setSession(next); setReflectionDraft(next.progress.reflection); setTab("profile"); setStudyView("calendar"); setRewardView("home");
      setSelectedDate(today); setMonth(today.slice(0, 7)); clearAnswer(); setNotice(""); scrollTop();
    } catch (error) { setConnectionError(error instanceof Error ? error.message : "학생을 불러오지 못했습니다."); }
    finally { setPending(false); }
  }
  async function switchStudent() {
    if (pending) return;
    setPending(true); setConnectionError("");
    try {
      await requestJson("/api/student-session", "DELETE");
      setSession(null); setTab("profile"); clearAnswer(); setNotice(""); scrollTop();
      const { students: next } = await requestJson<{ students: Student[] }>("/api/students", "GET");
      setStudents(next);
    } catch (error) { setConnectionError(error instanceof Error ? error.message : "명단을 불러오지 못했습니다."); }
    finally { setPending(false); }
  }
  async function refreshStudents() {
    if (pending) return;
    setPending(true); setConnectionError("");
    try { const { students: next } = await requestJson<{ students: Student[] }>("/api/students", "GET"); setStudents(next); }
    catch (error) { setConnectionError(error instanceof Error ? error.message : "명단을 불러오지 못했습니다."); }
    finally { setPending(false); }
  }
  function changeTab(next: Tab) {
    if (pending) return;
    setTab(activeStudent ? next : "profile"); setNotice(""); clearAnswer();
    if (next === "study") setStudyView("calendar");
    if (next === "rewards") setRewardView("home");
    scrollTop();
  }
  function showStudy(view: StudyView) { if (pending) return; setStudyView(view); clearAnswer(); setNotice(""); scrollTop(); }
  function selectDate(date: string) {
    setSelectedDate(date); setMonth(date.slice(0, 7)); setTab("study");
    showStudy(hasLesson(date) ? "concept" : "calendar");
  }
  function showCalendar(date?: string) {
    if (date) { setSelectedDate(date); setMonth(date.slice(0, 7)); }
    changeTab("study");
  }
  function startPractice() { setPracticeIndex(Math.min(stars, concept.practiceCount - 1)); showStudy(practiceComplete ? "complete" : "practice"); }
  function startTest() {
    setNotice(""); clearAnswer();
    setTestIndex(Math.max(0, testAnswers.findIndex(answer => answer === null)));
    setRewardView(testComplete ? "result" : "test"); scrollTop();
  }
  async function checkPractice() {
    if (selected === null || feedback !== null || pending) return;
    const result = await updateProgress({ type: "practice", index: practiceIndex, answer: selected, date: selectedDate });
    if (result) { setHintOpen(false); setFeedback(result.correct ? "correct" : "incorrect"); }
  }
  function continuePractice() {
    if (feedback === "incorrect") { clearAnswer(); return; }
    if (practiceIndex === concept.practiceCount - 1) showStudy("complete");
    else { setPracticeIndex(current => current + 1); clearAnswer(); scrollTop(); }
  }
  async function advanceTest() {
    if (selected === null || pending) return;
    const result = await updateProgress({ type: "test", index: testIndex, answer: selected });
    if (!result) return;
    clearAnswer();
    if (testIndex === concept.testCount - 1) setRewardView("result");
    else setTestIndex(current => current + 1);
    scrollTop();
  }

  function renderQuiz(finalTest: boolean) {
    const index = finalTest ? testIndex : practiceIndex;
    const questions = finalTest ? testQuestions : practiceQuestions;
    const question = questions[index];
    const count = questions.length;
    const movements = question.choices.every(choice => choice.kind === "movement");
    return <section className={`quiz-screen meaning-quiz ${finalTest ? "final-test-screen" : ""}`} aria-label={finalTest ? "최종 테스트" : "연습문제"}>
      <header className="compact-header">
        <button className="icon-button" aria-label={finalTest ? "보상 화면으로 돌아가기" : "달력으로 돌아가기"} onClick={() => finalTest ? changeTab("rewards") : showStudy("calendar")}><ArrowLeft size={23} /></button>
        <h1>{finalTest ? "최종 테스트" : "연습"}</h1>
        {finalTest ? <span className="small-earned">+1,000원 / 문제</span> : <Stars count={stars} total={6} />}
      </header>
      <div className="question-progress" aria-label={`문제 ${index + 1} / ${count}`}>
        {questions.map((item, position) => <span key={item.id} className={position < index || (!finalTest && feedback === "correct" && position === index) ? "completed" : position === index ? "filled" : ""} />)}
      </div>
      <div className="question-toolbar">
        <p className="question-caption" aria-label={`문제 ${index + 1} / ${count}`}>{index + 1} / {count}</p>
        {!finalTest && !feedback && <button className={`hint-button ${hintOpen ? "active" : ""}`} aria-expanded={hintOpen} aria-controls="question-hint" onClick={() => setHintOpen(open => !open)}><Lightbulb size={17} aria-hidden="true" />힌트</button>}
        {finalTest && <span className="test-caution">제출 후 변경 불가</span>}
      </div>
      {!finalTest && hintOpen && <p id="question-hint" className="rule-note">{question.hint}</p>}
      <div className={`question-formula ${question.expression.length > 5 ? "long-formula" : ""}`}><Formula tokens={question.expression} label={question.label} question /></div>
      <p className="choice-instruction">{question.instruction}</p>
      <div className={`answer-grid meaning-answer-grid ${movements ? "movement-answer-grid" : ""}`} role="group" aria-label="풀이 선택">
        {question.choices.map(choice => <button key={choice.id} aria-label={`풀이 ${choice.label}`} aria-pressed={selected === choice.id} disabled={pending || feedback !== null}
          className={`answer-choice meaning-answer-choice ${movements ? "movement-answer-choice" : ""} ${selected === choice.id ? "selected" : ""} ${feedback === "correct" && selected === choice.id ? "correct-choice" : ""} ${feedback === "incorrect" && selected === choice.id ? "incorrect-choice" : ""}`}
          onClick={() => setSelected(choice.id)}>
          <MeaningChoice choice={choice} />
          {selected === choice.id && (feedback === "incorrect" ? <X className="choice-check" size={18} aria-hidden="true" /> : <Check className="choice-check" size={18} aria-hidden="true" />)}
        </button>)}
      </div>
      <div className={`quiz-action ${!finalTest && feedback ? `feedback-action ${feedback}` : ""}`}>
        {!finalTest && feedback && <div className="answer-feedback" role="status">
          {feedback === "correct" ? <><Star size={23} fill="currentColor" strokeWidth={0} aria-hidden="true" /><strong>+1</strong><span className="sr-only">정답! 별 1개 획득. 모은 별 {stars} / 6.</span></> : <><RotateCcw size={20} aria-hidden="true" /><strong>{question.hint}</strong><span className="sr-only">오답입니다. 힌트를 보고 다시 풀어 보세요.</span></>}
        </div>}
        <button className={`primary-button ${finalTest || feedback === "correct" ? "green-button" : ""} ${feedback === "incorrect" ? "retry-button" : ""}`}
          disabled={pending || selected === null} onClick={finalTest ? advanceTest : feedback ? continuePractice : checkPractice}>
          {finalTest ? (index === count - 1 ? "결과 보기" : "다음 문제") : feedback === "incorrect" ? "다시 풀기" : feedback === "correct" ? "다음 문제" : "확인"}
        </button>
      </div>
    </section>;
  }

  function renderStudy() {
    if (studyView === "practice") return renderQuiz(false);
    if (studyView === "concept") return <ConceptLesson date={selectedDate} onBack={() => showStudy("calendar")} onPractice={startPractice} onResetScroll={scrollTop} continuing={stars > 0} />;
    if (studyView === "complete") return <section className="completion-screen">
      <div className="six-stars" aria-label="모은 별 6개">{Array.from({ length: 6 }, (_, index) => <Star key={index} size={26} fill="currentColor" strokeWidth={0} aria-hidden="true" />)}</div>
      <p className="eyebrow centered">개념 0 · 분수와 음수</p><h1>6 / 6 완료</h1>
      <div className="reward-arrived"><span className="gift-tile"><Gift size={24} aria-hidden="true" /></span><div><p className="eyebrow">보상</p><h2>간식 쿠폰 1장</h2></div></div>
      <button className="primary-button" onClick={() => changeTab("rewards")}>보상받기</button>
      <button className="text-button" onClick={() => showStudy("calendar")}>달력으로</button>
      <details className="optional-reflection"><summary>한 줄 기록 <span>선택</span><ChevronDown size={18} aria-hidden="true" /></summary>
        <label className="sr-only" htmlFor="reflection">이 문제를 만든 사람은 왜 이 문제를 냈을까? 생각을 한 줄로 적어 보세요. 기록은 선택 사항입니다.</label>
        <textarea id="reflection" value={reflectionDraft} disabled={pending} onChange={event => setReflectionDraft(event.target.value)} placeholder="한 줄" maxLength={300} />
        <button className="small-button" disabled={pending || reflectionDraft === progress?.reflection} onClick={async () => { if (await updateProgress({ type: "reflection", value: reflectionDraft })) setNotice("저장됨"); }}>저장</button>
      </details>
    </section>;
    if (!activeStudent || !progress) return null;
    return <StudyCalendar student={activeStudent} progress={progress} totalWon={totalWon} today={today} month={month} selectedDate={selectedDate}
      onMonthChange={setMonth} onDate={selectDate} onConcept={() => showStudy("concept")} onProfile={() => changeTab("profile")} />;
  }

  function renderRewards() {
    if (rewardView === "test") return renderQuiz(true);
    if (rewardView === "result") return <section className="test-result-screen">
      <div className="test-result-icon"><Banknote size={31} aria-hidden="true" /></div>
      <p className="eyebrow centered">개념 0 · 적립 완료</p><h1 className="result-amount">+{formatWon(totalWon)}</h1>
      <p className="result-caption">{score} / 3 정답</p>
      <div className="result-breakdown">{testQuestions.map((question, index) => <div key={question.id}><span>문제 {index + 1}</span>
        <span className={testAnswers[index] === question.answer ? "green-text" : "muted"}>{testAnswers[index] === question.answer ? <><Check size={16} aria-label="정답" /> +1,000원</> : <><X size={16} aria-label="오답" /> 0원</>}</span>
      </div>)}<div className="total-row"><strong>금고 총액</strong><strong>{formatWon(totalWon)}</strong></div></div>
      <p className="payout-note">지급 {payoutDate ? compactDate(payoutDate) : "—"} · 체험</p>
      <button className="primary-button" onClick={() => changeTab("profile")}>내 금고 보기</button><button className="text-button" onClick={() => changeTab("study")}>공부로</button>
    </section>;
    return <section className="rewards-screen">
      <p className="eyebrow">{dateLabel(today)}</p><header className="page-title"><h1>보상받기</h1><DemoLabel /></header>
      <button className="vault-summary" onClick={() => changeTab("profile")}><span><span className="vault-label">내 적립 금고</span><strong>{formatWon(totalWon)}</strong></span><span className="vault-countdown">{daysLeft === null ? "—" : `D-${daysLeft}`}<ArrowRight size={16} aria-hidden="true" /></span></button>
      <div className="section-heading"><h2>최종 테스트</h2><span>수 · 금</span></div>
      <article className="final-test-card"><div className="card-topline"><span className="eyebrow">개념 0</span><strong className="max-earned"><span>최대</span> 3,000원</strong></div><h2>분수와 음수</h2>
        <p className="card-description">3문제 · 정답 +1,000원</p>
        <button className="primary-button green-button" disabled={!practiceComplete} onClick={startTest} aria-label={!practiceComplete ? "연습 6문제를 완료하면 최종 테스트가 열립니다." : undefined}>
          {testComplete ? "결과 보기" : !practiceComplete ? "연습 6문제 완료 후" : testAnswers.some(answer => answer !== null) ? "테스트 이어하기" : isTestDay ? "테스트 시작" : "미리 체험"}
        </button>
      </article>
      <h2 className="section-heading single-heading">단기 보상</h2>
      <article className={`coupon-card ${couponClaimed ? "claimed" : ""}`}><span className="gift-tile"><Gift size={24} aria-hidden="true" /></span><div><h3>간식 쿠폰</h3><p>연습 {stars} / 6</p></div>
        <button className="small-button" disabled={pending || !practiceComplete || couponClaimed} onClick={async () => { if (await updateProgress({ type: "coupon" })) setNotice("쿠폰 +1"); }}>{couponClaimed ? <><Check size={14} aria-hidden="true" /> 받음</> : "받기"}</button>
      </article>
      <div className="upcoming-test"><LockKeyhole size={16} aria-hidden="true" /><span>개념 1 · 준비 중</span></div>
    </section>;
  }

  function renderProfile() {
    if (!activeStudent || !progress) return null;
    return <section className={`profile-screen student-color-${activeStudent.color}`}>
      <header className="profile-header"><span className="student-avatar is-active">{activeStudent.avatar}</span><div><h1>{activeStudent.name}</h1><p className="login-status"><Circle size={7} fill="currentColor" strokeWidth={0} aria-hidden="true" />로그인됨</p></div><button className="student-switch" disabled={pending} onClick={switchStudent}>학생 바꾸기</button></header>
      <article className="vault-card"><div className="card-topline"><span>적립 금고</span><span className="countdown-pill">{daysLeft === null ? "—" : `D-${daysLeft}`}</span></div><h2>{formatWon(totalWon)}</h2>
        <progress max={100} value={cycleProgress} aria-label="적립 기간 경과" /><div className="vault-dates"><span>{startDate ? compactDate(startDate) : "—"}</span><span>퇴소 {payoutDate ? compactDate(payoutDate) : "—"}</span></div>
      </article>
      <div className="stats-grid"><div><span>별</span><strong><Star size={19} fill="currentColor" strokeWidth={0} aria-hidden="true" /> {stars}</strong></div><div><span>쿠폰</span><strong>{couponClaimed ? 1 : 0}장</strong></div><div><span>학습일</span><strong>{progress.completedDays.length}일</strong></div></div>
      <div className="week-heading"><h2>이번 주</h2><button onClick={() => showCalendar()}>달력<ChevronRight size={15} aria-hidden="true" /></button></div>
      <div className="week-progress">{weekDates(today).map((date, index) => <button key={date} className={date === today ? "today" : ""} onClick={() => showCalendar(date)} aria-label={`${dateLabel(date)} 달력에서 보기`}>
        <span>{["월", "화", "수", "목", "금"][index]}</span><strong>{Number(date.slice(8))}</strong><DayMarker status={learningStatus(date, today, progress.completedDays)} />
      </button>)}</div>
      <h2 className="section-heading single-heading">내역</h2>
      {testComplete && <div className="ledger-item"><span className="ledger-icon"><Banknote size={23} aria-hidden="true" /></span><div><h3>최종 테스트 · 개념 0</h3><p>{dateLabel(progress.testDate ?? today)} · {score} / 3</p></div><strong>+{formatWon(totalWon)}</strong></div>}
      {couponClaimed && <div className="ledger-item"><span className="ledger-icon coupon-ledger-icon"><Gift size={21} aria-hidden="true" /></span><div><h3>간식 쿠폰</h3><p>개념 0 · 별 6</p></div><strong className="coupon-ledger-amount">1장</strong></div>}
      {stars > 0 ? <div className="ledger-item"><span className="ledger-icon practice-ledger-icon"><Star size={21} fill="currentColor" strokeWidth={0} aria-hidden="true" /></span><div><h3>연습 · 개념 0</h3><p>분수와 음수</p></div><strong className="practice-ledger-amount">{stars}/6</strong></div> : <p className="no-history">아직 0</p>}
    </section>;
  }

  return <div className="app-shell">
    <div ref={scrollRef} className="app-scroll" id="app-content"><main>
      {activeStudent && connectionError && <div className="connection-error" role="alert">{connectionError}</div>}
      {activeStudent && pending && <p className="connection-status" role="status">저장 중</p>}
      {!activeStudent ? <StudentPicker students={students} pending={pending} error={connectionError} onLogin={loginStudent} onRetry={refreshStudents} /> : tab === "study" ? renderStudy() : tab === "rewards" ? renderRewards() : renderProfile()}
    </main></div>
    {notice && <div className="toast" role="status"><Check size={17} aria-hidden="true" /><span>{notice}</span><button aria-label="알림 닫기" onClick={() => setNotice("")}><X size={18} aria-hidden="true" /></button></div>}
    <nav className="bottom-nav" aria-label="하단 메뉴">{([{ id: "study", label: "공부", icon: BookOpen }, { id: "rewards", label: "보상받기", icon: Gift }, { id: "profile", label: "내 페이지", icon: UserRound }] as const).map(item =>
      <button key={item.id} disabled={pending} className={tab === item.id ? "active" : ""} aria-current={tab === item.id ? "page" : undefined} aria-label={item.label} onClick={() => changeTab(item.id)}>
        <span className="nav-icon"><item.icon size={23} strokeWidth={2} aria-hidden="true" />{item.id === "rewards" && practiceComplete && !couponClaimed && <span className="notification-dot" />}</span>
      </button>)}
    </nav>
  </div>;
}
