"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, BookOpen, Check, Gift, LockKeyhole, Star, UserRound } from "lucide-react";
import { concept, earnedWon, formatWon, nextSteps, practiceQuestions, submitTestAnswer, testQuestions, testScore, type MathToken } from "./curriculum";

type Tab = "study" | "rewards" | "profile";
type StudyView = "map" | "concept" | "practice" | "complete";
type RewardView = "home" | "test" | "result";

const payoutDate = "2027-03-29";
const startDate = "2026-09-29";

function Formula({ tokens, label, question = false }: { tokens: readonly MathToken[]; label: string; question?: boolean }) {
  return (
    <math xmlns="http://www.w3.org/1998/Math/MathML" aria-label={question ? `${label}의 계산 결과를 고르세요.` : label}>
      <mrow>{tokens.map((token, index) => {
        if (Array.isArray(token)) {
          const [numerator, denominator] = token;
          return <mrow key={index}>{numerator < 0 && <mo>−</mo>}<mfrac><mn>{Math.abs(numerator)}</mn><mn>{denominator}</mn></mfrac></mrow>;
        }
        return typeof token === "number" ? <mn key={index}>{token < 0 ? `−${Math.abs(token)}` : token}</mn> : <mo key={index} stretchy="false">{token}</mo>;
      })}{question && <><mo>=</mo><mo className="question-mark">?</mo></>}</mrow>
    </math>
  );
}

function Stars({ count, total }: { count: number; total?: number }) {
  return <span className="star-badge" aria-label={`모은 별 ${count}개${total ? `, 목표 ${total}개` : ""}`}><Star size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" /><span>{count}{total && ` / ${total}`}</span></span>;
}

export default function MathVault({ today }: { today: string }) {
  const [tab, setTab] = useState<Tab>("study");
  const [studyView, setStudyView] = useState<StudyView>("map");
  const [rewardView, setRewardView] = useState<RewardView>("home");
  const [stars, setStars] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
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
  function changeTab(next: Tab) { setTab(next); setNotice(""); setSelected(null); setFeedback(null); if (next === "study") setStudyView("map"); if (next === "rewards") setRewardView("home"); scrollTop(); }
  function showStudy(view: StudyView) { setStudyView(view); setSelected(null); setFeedback(null); setNotice(""); scrollTop(); }
  function startPractice() { setPracticeIndex(Math.min(stars, concept.practiceCount - 1)); showStudy(practiceComplete ? "complete" : "practice"); }
  function startTest() { setNotice(""); setTestIndex(testAnswers.findIndex(answer => answer === null)); setSelected(null); setRewardView(testComplete ? "result" : "test"); scrollTop(); }
  function checkPractice() {
    if (selected === null || feedback !== null) return;
    const correct = selected === practiceQuestions[practiceIndex].answer;
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) setStars(current => Math.max(current, practiceIndex + 1));
  }
  function continuePractice() {
    if (feedback === "incorrect") { setSelected(null); setFeedback(null); return; }
    if (practiceIndex === concept.practiceCount - 1) showStudy("complete");
    else { setPracticeIndex(current => current + 1); setSelected(null); setFeedback(null); scrollTop(); }
  }
  function advanceTest() {
    if (selected === null) return;
    setTestAnswers(current => submitTestAnswer(current, testIndex, selected));
    setSelected(null);
    if (testIndex === concept.testCount - 1) setRewardView("result");
    else setTestIndex(current => current + 1);
    scrollTop();
  }

  function renderQuiz(finalTest: boolean) {
    const index = finalTest ? testIndex : practiceIndex;
    const questions = finalTest ? testQuestions : practiceQuestions;
    const question = questions[Math.max(0, index)];
    const count = questions.length;
    return (
      <section className={`quiz-screen ${finalTest ? "final-test-screen" : ""}`} aria-label={finalTest ? "최종 테스트" : "연습문제"}>
        <header className="compact-header">
          <button className="icon-button" aria-label={finalTest ? "보상 화면으로 돌아가기" : "단계 지도로 돌아가기"} onClick={() => finalTest ? changeTab("rewards") : showStudy("map")}><ArrowLeft size={23} /></button>
          <h1>{finalTest ? "최종 테스트 · 개념 0" : "0. 준비 운동"}</h1>
          {finalTest ? <span className="small-earned">문제당 1,000원</span> : <Stars count={stars} total={6} />}
        </header>
        <div className="question-progress" aria-label={`문제 ${index + 1} / ${count}`}>
          {questions.map((item, position) => <span key={item.id} className={position < index && finalTest ? "completed" : position <= index ? "filled" : ""} />)}
        </div>
        <p className="question-caption">문제 {index + 1} / {count} · 계산하시오.</p>
        <p className="rule-note">{finalTest ? "한 번만 답할 수 있어요. 힌트 없이 풀어 보세요." : "규칙 · 분자에만 곱한다. 음수는 반대 방향."}</p>
        <div className={`question-formula ${question.expression.length > 5 ? "long-formula" : ""}`}><Formula tokens={question.expression} label={question.label} question /></div>
        <div className="answer-grid" role="group" aria-label="정답 선택">
          {question.choices.map(choice => <button key={choice.id} aria-label={`답 ${choice.label}`} aria-pressed={selected === choice.id} disabled={feedback !== null} className={`answer-choice ${selected === choice.id ? "selected" : ""} ${feedback === "correct" && selected === choice.id ? "correct-choice" : ""} ${feedback === "incorrect" && selected === choice.id ? "incorrect-choice" : ""}`} onClick={() => setSelected(choice.id)}><Formula tokens={choice.tokens} label={choice.label} />{selected === choice.id && <Check className="choice-check" size={18} aria-hidden="true" />}</button>)}
        </div>
        {!finalTest && feedback && <div className={`answer-feedback ${feedback}`} role="status"><h2>{feedback === "correct" ? <><Star size={17} fill="currentColor" strokeWidth={0} /> 정답! 별 1개 획득</> : "한 번 더 생각해 봐요"}</h2><p>{feedback === "correct" ? (practiceComplete ? "별 6개를 모았어요. 단기 보상이 열렸어요." : "별 6개를 모으면 단기 보상이 열려요.") : question.hint}</p></div>}
        <div className="quiz-action"><button className={`primary-button ${finalTest ? "green-button" : ""}`} disabled={selected === null} onClick={finalTest ? advanceTest : feedback ? continuePractice : checkPractice}>{finalTest ? (index === count - 1 ? "결과 보기" : "다음 문제") : feedback === "incorrect" ? "다시 풀기" : feedback === "correct" ? "다음 문제" : "확인"}</button></div>
      </section>
    );
  }

  function renderStudy() {
    if (studyView === "practice") return renderQuiz(false);
    if (studyView === "complete") return <section className="completion-screen">
      <div className="six-stars" aria-label="모은 별 6개">{Array.from({ length: 6 }, (_, index) => <Star key={index} size={26} fill="currentColor" strokeWidth={0} aria-hidden="true" />)}</div>
      <p className="eyebrow centered">개념 0 · 분수와 음수</p><h1>연습 6문제 완료</h1><p className="completion-copy">별 6개를 모았어요. 단기 보상이 도착했고,<br />이제 최종 테스트에 도전할 수 있어요.</p>
      <div className="reward-arrived"><span className="gift-tile"><Gift size={24} /></span><div><p className="eyebrow">단기 보상 도착</p><h2>간식 쿠폰 1장</h2></div></div>
      <label className="reflection-label" htmlFor="reflection">이 문제를 만든 사람은 왜 이 문제를 냈을까?</label><textarea id="reflection" value={reflection} onChange={event => setReflection(event.target.value)} placeholder="생각을 한 줄로 적어 보세요" maxLength={300} />
      <button className="primary-button" onClick={() => changeTab("rewards")}>보상받기로 가기</button><button className="text-button" onClick={() => showStudy("map")}>단계 지도로</button>
    </section>;
    if (studyView === "concept") return <section className="concept-screen">
      <header className="compact-header"><button className="icon-button" aria-label="단계 지도로 돌아가기" onClick={() => showStudy("map")}><ArrowLeft size={23} /></button><span className="eyebrow">개념 0</span></header>
      <h1>분수와 음수</h1><p className="concept-subtitle">{concept.subtitle}</p>
      <Image className="concept-illustration" src="/concept-0/fraction-pieces.png" width={1050} height={520} alt="8분의 1 조각 4개를 모으면 8칸 중 4칸. 분자는 조각 개수 4, 분모는 조각 크기 8로 유지된다." priority />
      <Image className="concept-illustration" src="/concept-0/negative-number-line.png" width={1050} height={472} alt="수직선에서 0에서 오른쪽으로 3분의 1, 음수 3분의 1은 반대로 왼쪽으로 이동해 다시 0이 된다." />
      <div className="concept-rule"><p aria-label="자연수와 분수를 곱할 때는 분자에만 곱해요. 음수를 더할 때는 반대로 이동해요."><strong>분자에 곱하기.</strong> 음수는 <strong>반대로.</strong></p><div className="rule-examples"><span className="wrong-example"><span aria-label="틀린 계산">×</span> <Formula tokens={[4, "×", [1, 8]]} label="4 곱하기 8분의 1" /><span>=</span><Formula tokens={[[4, 32]]} label="32분의 4" /></span><span className="right-example"><Check size={17} /><Formula tokens={[4, "×", [1, 8]]} label="4 곱하기 8분의 1" /><span>=</span><Formula tokens={[[4, 8]]} label="8분의 4" /></span></div></div>
      <button className="primary-button" onClick={startPractice}>{practiceComplete ? "모은 보상 보기" : stars ? "연습문제 이어 풀기" : "연습문제 6개 풀기"}</button>
    </section>;
    return <section className="map-screen">
      <p className="eyebrow">지수 기초 · 9단계</p><header className="page-title"><h1>공부</h1><Stars count={stars} /></header>
      <article className="current-concept"><div className="card-topline"><span className="eyebrow">개념 0 · 지금 단계</span><span className={`status-label ${practiceComplete ? "green-text" : ""}`}>{passed ? "통과" : practiceComplete ? "연습 완료" : "연습 중"}</span></div><h2>분수와 음수</h2><p className="card-description">{concept.subtitle}</p><div className="practice-progress-label"><span>연습문제</span><span className="progress-count"><Star size={14} fill="currentColor" strokeWidth={0} /> {stars} / 6</span></div><progress className="practice-progress" max={6} value={stars} aria-label="연습문제 완료" /><button className="primary-button" onClick={() => showStudy(practiceComplete ? "complete" : "concept")}>{practiceComplete ? "모은 보상 확인하기" : stars ? "이어서 공부하기" : "개념 보고 시작하기"}</button></article>
      <h2 className="section-caption">다음 단계</h2><ol className="step-list">{nextSteps.map((title, index) => <li key={title}><span className="step-number">{index + 1}</span><div><h3>{title}</h3><p>{passed ? "문제 준비 중" : "앞 단계 테스트를 통과하면 열려요"}</p></div><LockKeyhole size={17} aria-label="잠김" /></li>)}</ol>
    </section>;
  }

  function renderRewards() {
    if (rewardView === "test") return renderQuiz(true);
    if (rewardView === "result") return <section className="test-result-screen"><div className="test-result-icon"><Banknote size={31} /></div><p className="eyebrow centered">최종 테스트 · 개념 0 분수와 음수</p><h1 className="result-amount">+{formatWon(totalWon)}</h1><p className="result-caption">{score} / 3 정답 · 금고에 적립됐어요</p><div className="result-breakdown">{testQuestions.map((question, index) => <div key={question.id}><span>문제 {index + 1}</span><span className={testAnswers[index] === question.answer ? "green-text" : "muted"}>{testAnswers[index] === question.answer ? "정답 +1,000원" : "오답 · 적립 없음"}</span></div>)}<div className="total-row"><strong>금고 총액</strong><strong>{formatWon(totalWon)}</strong></div></div><p className="payout-note">모은 돈은 지급일(2027.3.29)에 한꺼번에 받아요.</p><p className="prototype-note">적립 예시 · 실제 지급은 연결되지 않았어요.</p><button className="primary-button" onClick={() => changeTab("profile")}>내 금고 보기</button><button className="text-button" onClick={() => changeTab("study")}>공부로 돌아가기</button></section>;
    return <section className="rewards-screen"><p className="eyebrow">{dateLabel} · 시험일은 수·금</p><header className="page-title"><h1>보상받기</h1></header><button className="vault-summary" onClick={() => changeTab("profile")}><span><span className="vault-label">내 적립 금고</span><strong>{formatWon(totalWon)}</strong></span><span className="vault-countdown">D-{daysLeft}<ArrowRight size={16} /></span></button>
      <div className="section-heading"><h2>최종 테스트 · 돈 적립</h2><span>매주 수·금</span></div><article className="final-test-card"><div className="card-topline"><span className="eyebrow">개념 0</span><strong className="max-earned">+3,000원</strong></div><h2>분수와 음수</h2><p className="card-description">3문제 · 1문제 맞힐 때마다 1,000원 적립</p><button className="primary-button green-button" disabled={!practiceComplete} onClick={startTest}>{testComplete ? "테스트 결과 보기" : !practiceComplete ? "연습 6문제를 먼저 풀어 주세요" : testAnswers.some(answer => answer !== null) ? "테스트 이어하기" : isTestDay ? "테스트 시작" : "테스트 미리 체험하기"}</button>{practiceComplete && !isTestDay && !testComplete && <p className="test-day-note">오늘은 시험일이 아니에요. 화면을 미리 체험할 수 있어요.</p>}</article>
      <h2 className="section-heading single-heading">단기 보상</h2><article className={`coupon-card ${couponClaimed ? "claimed" : ""}`}><span className="gift-tile"><Gift size={24} /></span><div><h3>간식 쿠폰</h3><p>개념 0 연습문제 {stars} / 6 완료</p></div><button className="small-button" disabled={!practiceComplete || couponClaimed} onClick={() => { setCouponClaimed(true); setNotice("간식 쿠폰 1장을 받았어요. 내 페이지에서 확인하세요."); }}>{couponClaimed ? <><Check size={14} /> 받음</> : "받기"}</button></article><div className="upcoming-test"><LockKeyhole size={16} /><span>개념 1 거듭제곱 테스트 · 문제 준비 중</span></div><p className="prototype-note">적립·쿠폰은 화면 체험용이에요.</p>
    </section>;
  }

  function renderProfile() {
    return <section className="profile-screen"><header className="profile-header"><span className="profile-avatar"><UserRound size={25} /></span><div><h1>내 페이지</h1><p>지수 기초 · 개념 0 {passed ? "통과" : "진행 중"}</p></div></header><article className="vault-card"><div className="card-topline"><span>적립 금고</span><span className="countdown-pill">D-{daysLeft}</span></div><h2>{formatWon(totalWon)}</h2><progress max={100} value={cycleProgress} aria-label="6개월 적립 기간 경과" /><div className="vault-dates"><span>시작 2026.9.29</span><span>지급 2027.3.29</span></div><p>6개월 뒤, 적립액 전부를 한꺼번에 받아요.</p></article><div className="stats-grid"><div><span>모은 별</span><strong><Star size={19} fill="currentColor" strokeWidth={0} /> {stars}</strong></div><div><span>받은 쿠폰</span><strong>{couponClaimed ? 1 : 0}장</strong></div><div><span>통과 단계</span><strong>{passed ? 1 : 0} / 9</strong></div></div>
      <h2 className="section-heading single-heading">적립 내역</h2>{testComplete ? <div className="ledger-item"><span className="ledger-icon"><Banknote size={23} /></span><div><h3>최종 테스트 · 개념 0</h3><p>{dateLabel} · {score} / 3 정답</p></div><strong>+{formatWon(totalWon)}</strong></div> : <div className="empty-ledger"><Banknote size={25} /><p>아직 적립 내역이 없어요.</p><span>연습을 마치고 최종 테스트에 도전해 보세요.</span></div>}{couponClaimed && <div className="my-coupon"><Gift size={19} /><span>받은 간식 쿠폰</span><strong>1장</strong></div>}<p className="prototype-note">적립 예시 · 실제 지급은 연결되지 않았어요.</p></section>;
  }

  return <div className="app-shell"><div ref={scrollRef} className="app-scroll" id="app-content"><main>{tab === "study" ? renderStudy() : tab === "rewards" ? renderRewards() : renderProfile()}</main></div>{notice && <div className="toast" role="status"><Check size={17} /><span>{notice}</span><button aria-label="알림 닫기" onClick={() => setNotice("")}>닫기</button></div>}<nav className="bottom-nav" aria-label="하단 메뉴">{([{ id: "study", label: "공부", icon: BookOpen }, { id: "rewards", label: "보상받기", icon: Gift }, { id: "profile", label: "내 페이지", icon: UserRound }] as const).map(item => <button key={item.id} className={tab === item.id ? "active" : ""} aria-current={tab === item.id ? "page" : undefined} onClick={() => changeTab(item.id)}><span className="nav-icon"><item.icon size={21} strokeWidth={2} aria-hidden="true" />{item.id === "rewards" && practiceComplete && !couponClaimed && <span className="notification-dot" />}</span><span>{item.label}</span></button>)}</nav></div>;
}
