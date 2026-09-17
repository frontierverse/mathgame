import type { Metadata } from "next";
import LifeSpace from "../LifeSpace";
import { createLifeDemo } from "../demo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "마음 쉼터 체험 · 학생 생활" };

export default function LifeDemoPage() {
  return <LifeSpace demoSnapshot={createLifeDemo()} />;
}
