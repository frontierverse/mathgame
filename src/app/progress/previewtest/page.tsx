import StudentRoster from "../StudentRoster";

export default function PreviewPage() {
  return <StudentRoster students={[{ name: "1가나다", age: null }, { name: "2라마바", age: null }, { name: "3사아자", age: null }]} />;
}
