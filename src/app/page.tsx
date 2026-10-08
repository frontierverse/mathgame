import { connection } from "next/server";
import MathVault from "./MathVault";
import { getStudents } from "./server/students";
import { getStudentSession } from "./server/session";
import { DataError } from "./server/database";

export default async function Home() {
  await connection();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const data = await Promise.all([getStudents(), getStudentSession()])
    .then(([students, session]) => ({ students, session, error: "" }))
    .catch(error => ({ students: [], session: null, error: error instanceof DataError ? error.message : "명단을 불러오지 못했습니다." }));
  return <MathVault today={today} initialStudents={data.students} initialSession={data.session} initialError={data.error} />;
}
