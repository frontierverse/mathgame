import { students } from "./studentProgress";

export default function StudentPicker({ onLogin }: { onLogin: (id: number) => void }) {
  return <section className="student-picker">
    <p className="eyebrow">내 페이지</p><h1>누구예요?</h1>
    <div className="student-grid">{students.map(student => <button key={student.id} className={`student-card student-color-${student.id}`} aria-label={`${student.name}(으)로 로그인`} onClick={() => onLogin(student.id)}>
      <span className="student-avatar">{student.id}</span><strong>{student.name}</strong>
    </button>)}</div>
  </section>;
}
