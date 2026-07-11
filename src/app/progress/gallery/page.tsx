import StudentBlob, { type BlobVariant } from "../StudentBlob";

const CHARACTERS: { variant: BlobVariant; color: string; label: string }[] = [
  { variant: "rock", color: "#f6a5b8", label: "레벨 1 · 돌" },
  { variant: "crystal", color: "#9edce3", label: "레벨 2 · 수정" },
  { variant: "ruby", color: "#b5a3f0", label: "레벨 3 · 루비" },
  { variant: "diamond", color: "#f7c67a", label: "레벨 4 · 다이아몬드" },
];

export default function BlobGalleryPage() {
  return (
    <main className="min-h-screen bg-[#fbf4e7] px-6 py-10 text-[#443b50]">
      <div className="mx-auto max-w-[900px]">
        <h1 className="text-2xl font-bold tracking-[-0.04em]">광물 진화 단계 미리보기</h1>
        <p className="mt-2 text-sm text-[#766b7d]">돌 → 수정 → 루비 → 다이아몬드 (가치 낮은 순 → 높은 순)</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CHARACTERS.map((c, index) => (
            <div
              key={c.label}
              className="flex flex-col items-center gap-3 rounded-3xl border border-[#eee4d7] bg-[#fffefa] p-5"
            >
              <StudentBlob
                variant={c.variant}
                color={c.color}
                seed={index * 1.7 + 0.5}
                className="h-32 w-32"
              />
              <span className="text-xs font-bold text-[#665c6f]">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
