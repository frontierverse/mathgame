"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, BookOpen, Check, ChevronDown, Gift, Lightbulb, LockKeyhole, RotateCcw, Star, UserRound, X } from "lucide-react";
import { concept, earnedWon, formatWon, nextSteps, practiceQuestions, submitTestAnswer, testQuestions, testScore } from "./curriculum";
import ConceptLesson from "./ConceptLesson";
import Formula from "./Formula";

type Tab = "study" | "rewards" | "profile";
type StudyView = "map" | "concept" | "practice" | "complete";
type RewardView = "home" | "test" | "result";

const payoutDate = "2027-03-29";
const startDate = "2026-09-29";

function Stars({ count, total }: { count: number; total?: number }) {
  return <span className="star-badge" aria-label={`모은 별 ${count}개${total ? `, 목표 ${total}개` : ""}`}>
    <Star size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
    <span>{count}{total && ` / ${total}`}</span>
  </span>;
}

function DemoLabel() {
  return <span className="demo-label" aria-label="화면 체험용 보상이며 실제 지급이나 쿠폰 발급은 연결되지 않았습니다.">체험</span>;
}

export default function MathVault({ today }: { today: string }) {
  const [tab, setTab] = useState<Tab>("study");
  const [studyView, setStudyView] = useState<StudyView>("map");
  const [rewardView, setRewardView] = useState<RewardView>("home");
  const [stars, setStars] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [couponClaimed, setCouponClaimed] = useState(false);
  const [testAnswers, setTestAnswers] = useState<readonly (string | null)[]>([null, null, null]);
  const [testIndex, setTestIndex] = useState(0);
  const [reflection, setReflection] = useState("");
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const practiceComplete = stars === concept.practiceCount;
  const testComplete = testAnswers.every(answer => answer !== null);
  const score = testScore(testAnswers);
  const totalWon = earnedWon(testAnswers);
  const passed = testComplete && score === concept.testCount;
  const daysLeft = Math.max(0, Math.ceil((Date.parse(`${payoutDate}T00:00:00+09:00`) - Date.parse(`${today}T00:00:00+09:00`)) / 86400000));
  const cycleProgress = Math.min(100, Math.max(0, (Date.parse(today) - Date.parse(startDate)) / (Date.parse(payoutDate) - Date.parse(startDate)) * 100));
  const dateLabel = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${today}T12:00:00+09:00`)).replace(/\s/g, "").replace(".(", " (");
  const isTestDay = [3, 5].includes(new Date(`${today}T12:00:00+09:00`).getUTCDay());

  function scrollTop() { scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); }
  function clearAnswer() { setSelected(null); setFeedback(null); setHintOpen(false); }
  function changeTab(next: Tab) {
    setTab(next); setNotice(""); clearAnswer();
    if (next === "study") setStudyView("map");
    if (next === "rewards") setRewardView("home");
    scrollTop();
  }
  function showStudy(view: StudyView) { setStudyView(view); clearAnswer(); setNotice(""); scrollTop(); }
  function startPractice() { setPracticeIndex(Math.min(stars, concept.practiceCount - 1)); showStudy(practiceComplete ? "complete" : "practice"); }
  function startTest() {
    setNotice(""); clearAnswer();
    setTestIndex(Math.max(0, testAnswers.findIndex(answer => answer === null)));
    setRewardView(testComplete ? "result" : "test"); scrollTop();
  }
  function checkPractice() {
    if (selected === null || feedback !== null) return;
    const correct = selected === practiceQuestions[practiceIndex].answer;
    setHintOpen(false); setFeedback(correct ? "correct" : "incorrect");
    if (correct) setStars(current => Math.max(current, practiceIndex + 1));
  }
  function continuePractice() {
    if (feedback === "incorrect") { clearAnswer(); return; }
    if (practiceIndex === concept.practiceCount - 1) showStudy("complete");
    else { setPracticeIndex(current => current + 1); clearAnswer(); scrollTop(); }
  }
  function advanceTest() {
    if (selected === null) return;
    setTestAnswers(current => submitTestAnswer(current, testIndex, selected));
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
    return <section className={`quiz-screen ${finalTest ? "final-test-screen" : ""}`} aria-label={finalTest ? "최종 테스트" : "연습문제"}>
      <header className="compact-header">
        <button className="icon-button" aria-label={finalTest ? "보상 화면으로 돌아가기" : "단계 지도로 돌아가기"} onClick={() => finalTest ? changeTab("rewards") : showStudy("map")}><ArrowLeft size={23} /></button>
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
      <div className="answer-grid" role="group" aria-label="정답 선택">
        {question.choices.map(choice => <button key={choice.id} aria-label={`답 ${choice.label}`} aria-pressed={selected === choice.id} disabled={feedback !== null}
          className={`answer-choice ${selected === choice.id ? "selected" : ""} ${feedback === "correct" && selected === choice.id ? "correct-choice" : ""} ${feedback === "incorrect" && selected === choice.id ? "incorrect-choice" : ""}`}
          onClick={() => setSelected(choice.id)}>
          <Formula tokens={choice.tokens} label={choice.label} />
          {selected === choice.id && (feedback === "incorrect" ? <X className="choice-check" size={18} aria-hidden="true" /> : <Check className="choice-check" size={18} aria-hidden="true" />)}
        </button>)}
      </div>
      <div className={`quiz-action ${!finalTest && feedback ? `feedback-action ${feedback}` : ""}`}>
        {!finalTest && feedback && <div className="answer-feedback" role="status">
          {feedback === "correct" ? <><Star size={23} fill="currentColor" strokeWidth={0} aria-hidden="true" /><strong>+1</strong><span className="sr-only">정답! 별 1개 획득. 모은 별 {stars} / 6.</span></> : <><RotateCcw size={20} aria-hidden="true" /><strong>{question.hint}</strong><span className="sr-only">오답입니다. 힌트를 보고 다시 풀어 보세요.</span></>}
        </div>}
        <button className={`primary-button ${finalTest || feedback === "correct" ? "green-button" : ""} ${feedback === "incorrect" ? "retry-button" : ""}`}
          disabled={selected === null} onClick={finalTest ? advanceTest : feedback ? continuePractice : checkPractice}>
          {finalTest ? (index === count - 1 ? "결과 보기" : "다음 문제") : feedback === "incorrect" ? "다시 풀기" : feedback === "correct" ? "다음 문제" : "확인"}
        </button>
      </div>
    </section>;
  }

  function renderStudy() {
    if (studyView === "practice") return renderQuiz(false);
    if (studyView === "concept") return <ConceptLesson onBack={() => showStudy("map")} onPractice={startPractice} onResetScroll={scrollTop} continuing={stars > 0} />;
    if (studyView === "complete") return <section className="completion-screen">
      <div className="six-stars" aria-label="모은 별 6개">{Array.from({ length: 6 }, (_, index) => <Star key={index} size={26} fill="currentColor" strokeWidth={0} aria-hidden="true" />)}</div>
      <p className="eyebrow centered">개념 0 · 분수와 음수</p><h1>6 / 6 완료</h1>
      <div className="reward-arrived"><span className="gift-tile"><Gift size={24} aria-hidden="true" /></span><div><p className="eyebrow">보상</p><h2>간식 쿠폰 1장</h2></div></div>
      <button className="primary-button" onClick={() => changeTab("rewards")}>보상받기</button>
      <button className="text-button" onClick={() => showStudy("map")}>단계 지도</button>
      <details className="optional-reflection"><summary>한 줄 기록 <span>선택</span><ChevronDown size={18} aria-hidden="true" /></summary>
        <label className="sr-only" htmlFor="reflection">이 문제를 만든 사람은 왜 이 문제를 냈을까? 생각을 한 줄로 적어 보세요. 기록은 선택 사항입니다.</label>
        <textarea id="reflection" value={reflection} onChange={event => setReflection(event.target.value)} placeholder="한 줄" maxLength={300} />
      </details>
    </section>;
    return <section className="map-screen">
      <p className="eyebrow">지수 기초 · 9단계</p><header className="page-title"><h1>공부</h1><Stars count={stars} /></header>
      <article className="current-concept">
        <div className="card-topline"><span className="eyebrow">개념 0</span><span className={`status-label ${practiceComplete ? "green-text" : ""}`}>{passed ? "통과" : practiceComplete ? "연습 완료" : "연습 중"}</span></div>
        <h2>분수와 음수</h2>
        <div className="practice-progress-label"><span>연습</span><span className="progress-count"><Star size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /> {stars} / 6</span></div>
        <progress className="practice-progress" max={6} value={stars} aria-label="연습문제 완료" />
        <button className="primary-button" onClick={() => showStudy(practiceComplete ? "complete" : "concept")}>{practiceComplete ? "보상 확인" : stars ? "이어하기" : "개념 보기"}</button>
      </article>
      <div className="steps-heading"><h2 className="section-caption">다음 단계</h2><span><LockKeyhole size={13} aria-hidden="true" />{passed ? "문제 준비 중" : "테스트 통과 후"}</span></div>
      <ol className="step-list">{nextSteps.map((title, index) => <li key={title} aria-label={`${index + 1}단계 ${title}, ${passed ? "문제 준비 중" : "앞 단계 테스트 통과 후 열립니다"}`}>
        <span className="step-number">{index + 1}</span><h3>{title}</h3><LockKeyhole size={17} aria-hidden="true" />
      </li>)}</ol>
    </section>;
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
      <p className="payout-note">지급 2027.3.29 · 체험</p>
      <button className="primary-button" onClick={() => changeTab("profile")}>내 금고 보기</button><button className="text-button" onClick={() => changeTab("study")}>공부로</button>
    </section>;
    return <section className="rewards-screen">
      <p className="eyebrow">{dateLabel}</p><header className="page-title"><h1>보상받기</h1><DemoLabel /></header>
      <button className="vault-summary" onClick={() => changeTab("profile")}><span><span className="vault-label">내 적립 금고</span><strong>{formatWon(totalWon)}</strong></span><span className="vault-countdown">D-{daysLeft}<ArrowRight size={16} aria-hidden="true" /></span></button>
      <div className="section-heading"><h2>최종 테스트</h2><span>수 · 금</span></div>
      <article className="final-test-card"><div className="card-topline"><span className="eyebrow">개념 0</span><strong className="max-earned"><span>최대</span> 3,000원</strong></div><h2>분수와 음수</h2>
        <p className="card-description">3문제 · 정답 +1,000원</p>
        <button className="primary-button green-button" disabled={!practiceComplete} onClick={startTest} aria-label={!practiceComplete ? "연습 6문제를 완료하면 최종 테스트가 열립니다." : undefined}>
          {testComplete ? "결과 보기" : !practiceComplete ? "연습 6문제 완료 후" : testAnswers.some(answer => answer !== null) ? "테스트 이어하기" : isTestDay ? "테스트 시작" : "미리 체험"}
        </button>
      </article>
      <h2 className="section-heading single-heading">단기 보상</h2>
      <article className={`coupon-card ${couponClaimed ? "claimed" : ""}`}><span className="gift-tile"><Gift size={24} aria-hidden="true" /></span><div><h3>간식 쿠폰</h3><p>연습 {stars} / 6</p></div>
        <button className="small-button" disabled={!practiceComplete || couponClaimed} onClick={() => { setCouponClaimed(true); setNotice("쿠폰 +1"); }}>{couponClaimed ? <><Check size={14} aria-hidden="true" /> 받음</> : "받기"}</button>
      </article>
      <div className="upcoming-test"><LockKeyhole size={16} aria-hidden="true" /><span>개념 1 · 준비 중</span></div>
    </section>;
  }

  function renderProfile() {
    return <section className="profile-screen">
      <header className="profile-header"><span className="profile-avatar"><UserRound size={25} aria-hidden="true" /></span><div><h1>내 페이지</h1><p>개념 0 · {passed ? "통과" : "진행 중"}</p></div><DemoLabel /></header>
      <article className="vault-card"><div className="card-topline"><span>적립 금고</span><span className="countdown-pill">D-{daysLeft}</span></div><h2>{formatWon(totalWon)}</h2>
        <progress max={100} value={cycleProgress} aria-label="6개월 적립 기간 경과" /><div className="vault-dates"><span>시작 2026.9.29</span><span>지급 2027.3.29</span></div><p>지급일에 한꺼번에</p>
      </article>
      <div className="stats-grid"><div><span>별</span><strong><Star size={19} fill="currentColor" strokeWidth={0} aria-hidden="true" /> {stars}</strong></div><div><span>쿠폰</span><strong>{couponClaimed ? 1 : 0}장</strong></div><div><span>통과 단계</span><strong>{passed ? 1 : 0} / 9</strong></div></div>
      <h2 className="section-heading single-heading">적립 내역</h2>
      {testComplete ? <div className="ledger-item"><span className="ledger-icon"><Banknote size={23} aria-hidden="true" /></span><div><h3>최종 테스트 · 개념 0</h3><p>{dateLabel} · {score} / 3</p></div><strong>+{formatWon(totalWon)}</strong></div>
        : <div className="empty-ledger"><Banknote size={25} aria-hidden="true" /><p>아직 0원</p></div>}
      {couponClaimed && <div className="my-coupon"><Gift size={19} aria-hidden="true" /><span>간식 쿠폰</span><strong>1장</strong></div>}
    </section>;
  }

  return <div className="app-shell">
    <div ref={scrollRef} className="app-scroll" id="app-content"><main>{tab === "study" ? renderStudy() : tab === "rewards" ? renderRewards() : renderProfile()}</main></div>
    {notice && <div className="toast" role="status"><Check size={17} aria-hidden="true" /><span>{notice}</span><button aria-label="알림 닫기" onClick={() => setNotice("")}><X size={18} aria-hidden="true" /></button></div>}
    <nav className="bottom-nav" aria-label="하단 메뉴">{([{ id: "study", label: "공부", icon: BookOpen }, { id: "rewards", label: "보상받기", icon: Gift }, { id: "profile", label: "내 페이지", icon: UserRound }] as const).map(item =>
      <button key={item.id} className={tab === item.id ? "active" : ""} aria-current={tab === item.id ? "page" : undefined} onClick={() => changeTab(item.id)}>
        <span className="nav-icon"><item.icon size={21} strokeWidth={2} aria-hidden="true" />{item.id === "rewards" && practiceComplete && !couponClaimed && <span className="notification-dot" />}</span><span>{item.label}</span>
      </button>)}
    </nav>
  </div>;
}
