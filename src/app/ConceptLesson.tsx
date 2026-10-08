"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import Formula from "./Formula";
import { dateLabel } from "./studentProgress";

const beats = ["분수 곱셈", "양수 더하기", "음수 더하기"] as const;

export default function ConceptLesson({ date, onBack, onPractice, onResetScroll, continuing }: {
  date: string;
  onBack: () => void;
  onPractice: () => void;
  onResetScroll: () => void;
  continuing: boolean;
}) {
  const [beat, setBeat] = useState(0);
  function showBeat(next: number) { setBeat(next); onResetScroll(); }

  return <section className="concept-screen">
    <header className="compact-header">
      <button className="icon-button" aria-label="달력으로 돌아가기" onClick={onBack}><ArrowLeft size={23} /></button>
      <span className="eyebrow">개념 0</span>
      <span className="lesson-date">{dateLabel(date)}</span>
      <span className="lesson-count" aria-label={`설명 ${beat + 1} / ${beats.length}`}>{beat + 1} / {beats.length}</span>
    </header>
    <h1>{beats[beat]}</h1>
    <div className="lesson-beat" key={beat}>
      {beat === 0 ? <>
        <div className="fraction-visual" role="img" aria-label="8분의 1 조각 4개를 모으면 8칸 중 4칸. 조각 크기는 그대로이고 조각 개수만 4개가 됩니다.">
          <Image className="loose-pieces" src="/concept-0/fraction-pieces-row.png" width={315} height={82} alt="" loading="eager" />
          <ArrowDown size={27} aria-hidden="true" />
          <Image className="fraction-board" src="/concept-0/fraction-board.png" width={416} height={82} alt="" loading="eager" />
        </div>
        <p className="lesson-cue">분자에 ×4</p>
        <div className="lesson-formula"><Formula tokens={[4, "×", [1, 8], "=", [4, 8]]} label="4 곱하기 8분의 1은 8분의 4. 분자에 4를 곱하고 분모는 그대로 둡니다." highlight="numerator" /></div>
      </> : <>
        <div className="number-line-visual">
          <Image src={beat === 1 ? "/concept-0/positive-number-line.png" : "/concept-0/negative-number-line.png"}
            width={1050} height={beat === 1 ? 320 : 472}
            alt={beat === 1 ? "0에서 오른쪽으로 3분의 1만큼 이동하면 3분의 1입니다." : "3분의 1에서 음수 3분의 1을 더하면 왼쪽으로 3분의 1만큼 이동해 0이 됩니다."}
            loading="eager" />
        </div>
        {beat === 1 && <p className="lesson-cue positive-number">오른쪽으로</p>}
        <div className="lesson-formula"><Formula
          tokens={beat === 1 ? [0, "+", [1, 3], "=", [1, 3]] : [[1, 3], "+", "(", [-1, 3], ")", "=", 0]}
          label={beat === 1 ? "0 더하기 3분의 1은 3분의 1" : "3분의 1 더하기 음수 3분의 1은 0"}
          highlight="direction" /></div>
      </>}
    </div>
    <div className="lesson-footer">
      <div className="lesson-pagination" aria-label="개념 설명 순서">{beats.map((title, index) => <button key={title} className={beat === index ? "active" : ""} aria-current={beat === index ? "step" : undefined} aria-label={`${index + 1}. ${title}`} onClick={() => showBeat(index)}>{index + 1}</button>)}</div>
      <button className="primary-button" onClick={() => beat < beats.length - 1 ? showBeat(beat + 1) : onPractice()}>
        {beat < beats.length - 1 ? <>다음<ArrowRight size={19} /></> : continuing ? "연습 이어하기" : "연습 6문제"}
      </button>
    </div>
  </section>;
}
