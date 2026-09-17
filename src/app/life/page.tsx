import type { Metadata } from "next";
import LifeSpace from "./LifeSpace";

export const metadata: Metadata = { title: "학생 생활 · 마음 쉼터" };

export default function LifePage() {
  return <LifeSpace />;
}
