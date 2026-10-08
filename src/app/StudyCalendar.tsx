import { ChevronLeft, ChevronRight, Circle, Star } from "lucide-react";
import { formatWon } from "./curriculum";
import { calendarDays, dateLabel, hasLesson, learningStatus, shiftMonth, type Student, type StudentProgress } from "./studentProgress";
import Formula from "./Formula";

export function DayMarker({ status }: { status: ReturnType<typeof learningStatus> }) {
  return <Circle size={7} className={`day-marker ${status ?? "none"}`} fill={status === "completed" || status === "missed" ? "currentColor" : "none"} strokeWidth={status === "planned" ? 4 : 0} aria-hidden="true" />;
}

export default function StudyCalendar({ student, progress, totalWon, today, month, selectedDate, onMonthChange, onDate, onConcept, onProfile }: {
  student: Student;
  progress: StudentProgress;
  totalWon: number;
  today: string;
  month: string;
  selectedDate: string;
  onMonthChange: (month: string) => void;
  onDate: (date: string) => void;
  onConcept: () => void;
  onProfile: () => void;
}) {
  const [year, number] = month.split("-").map(Number);
  const label = `${year}년 ${number}월`;
  const status = learningStatus(selectedDate, today, progress.completedDays);
  const statusLabels = { completed: "완료", planned: "예정", missed: "못 함" } as const;
  return <section className="calendar-screen">
    <header className="calendar-header">
      <button className={`student-chip student-color-${student.color}`} onClick={onProfile} aria-label={`${student.name} 내 페이지`}><span className="student-avatar">{student.avatar}</span><strong>{student.name}</strong></button>
      <div className="calendar-totals"><span className="star-badge" aria-label={`모은 별 ${progress.stars}개`}><Star size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />{progress.stars}</span><span className="earned-mini">{formatWon(totalWon)}</span></div>
    </header>
    <div className="month-toolbar"><button aria-label="이전 달" onClick={() => onMonthChange(shiftMonth(month, -1))}><ChevronLeft size={22} /></button><h1 aria-live="polite">{label}</h1><button aria-label="다음 달" onClick={() => onMonthChange(shiftMonth(month, 1))}><ChevronRight size={22} /></button></div>
    <div className="calendar-weekdays" aria-hidden="true">{["일", "월", "화", "수", "목", "금", "토"].map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid" role="group" aria-label={`${label} 학습 달력`}>
      {calendarDays(month).map((date, index) => {
        if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
        const dayStatus = learningStatus(date, today, progress.completedDays);
        return <button key={date} className={`calendar-day ${date === selectedDate ? "selected" : ""} ${date === today ? "today" : ""} ${index % 7 === 0 || index % 7 === 6 ? "weekend" : ""}`} aria-label={`${number}월 ${Number(date.slice(8))}일${date === today ? ", 오늘" : ""}${dayStatus ? `, ${statusLabels[dayStatus]}` : ""}`} aria-pressed={date === selectedDate} aria-current={date === today ? "date" : undefined} onClick={() => onDate(date)}>
          <span className="day-number">{Number(date.slice(8))}</span><DayMarker status={dayStatus} />
        </button>;
      })}
    </div>
    <div className="calendar-legend"><span><DayMarker status="completed" />완료</span><span><DayMarker status="planned" />예정</span><span><DayMarker status="missed" />못 함</span><span><Circle size={13} strokeWidth={1.5} aria-hidden="true" />오늘</span></div>
    <div className="selected-lesson"><h2>{dateLabel(selectedDate)}</h2>
      {hasLesson(selectedDate) ? <button className="calendar-lesson-card" onClick={onConcept} aria-label="개념 0 분수와 음수 열기">
        <span className="calendar-lesson-content"><span className="eyebrow">개념 0 · 분수와 음수</span><span className="calendar-preview-formulas"><Formula tokens={[4, "×", [1, 8], "=", [4, 8]]} label="4 곱하기 8분의 1은 8분의 4" /><span>·</span><Formula tokens={[1, "+", "(", -2, ")", "=", -1]} label="1 더하기 음수 2는 음수 1" /></span><span className="calendar-lesson-status"><DayMarker status={status} />{status ? statusLabels[status] : "예정"}<span>·</span><Star size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />{progress.stars}/6</span></span>
        <span className="lesson-open"><ChevronRight size={19} aria-hidden="true" /></span>
      </button> : <p className="no-lesson">— 등록된 개념 없음</p>}
    </div>
  </section>;
}
