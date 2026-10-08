import type { Student } from "./studentProgress";

export default function StudentPicker({ students, pending, error, onLogin, onRetry }: { students: Student[]; pending: boolean; error: string; onLogin: (id: string) => void; onRetry: () => void }) {
  return <section className="student-picker">
    <p className="eyebrow">내 페이지</p><h1>누구예요?</h1>
    {error && <div className="connection-error" role="alert"><p>{error}</p><button className="small-button" onClick={onRetry} disabled={pending}>다시 불러오기</button></div>}
    {!error && students.length === 0 && <p className="no-history">등록된 학생 없음</p>}
    {pending && <p className="connection-status" role="status">불러오는 중</p>}
    <div className="student-grid">{students.map(student => <button key={student.id} disabled={pending} className={`student-card student-color-${student.color}`} aria-label={`${student.name}(으)로 로그인`} onClick={() => onLogin(student.id)}>
      <span className="student-avatar">{student.avatar}</span><strong>{student.name}</strong>
    </button>)}</div>
  </section>;
}
