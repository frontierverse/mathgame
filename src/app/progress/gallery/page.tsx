import MineralObject from "../MineralObject";
import type { BlobVariant } from "../mineralData";

const MINERALS: { variant: BlobVariant; label: string }[] = [
  { variant: "rock", label: "레벨 1 · 샤갈" },
  { variant: "crystal", label: "레벨 2 · 수정" },
  { variant: "ruby", label: "레벨 3 · 야르" },
  { variant: "diamond", label: "레벨 4 · 다이아몬드" },
];

export default function BlobGalleryPage() {
  return (
    <main className="min-h-0 flex-1 bg-[var(--background)] px-6 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-[900px]">
        <h1 className="text-2xl font-bold tracking-[-0.04em]">광물 진화 단계 미리보기</h1>
        <p className="mt-2 text-sm text-[#766b7d]">샤갈 → 수정 → 야르 → 다이아몬드 (가치 낮은 순 → 높은 순)</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {MINERALS.map((mineral) => (
            <div
              key={mineral.label}
              className="flex flex-col items-center gap-3 rounded-3xl border border-[#eee4d7] bg-[#fffefa] p-5"
            >
              <MineralObject variant={mineral.variant} className="h-24 w-24" />
              <span className="text-xs font-bold text-[#665c6f]">{mineral.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
