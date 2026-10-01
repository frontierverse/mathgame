import { connection } from "next/server";
import MathVault from "./MathVault";

export default async function Home() {
  await connection();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return <MathVault today={today} />;
}
