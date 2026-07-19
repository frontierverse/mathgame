"use client";

type PrintWorksheetButtonProps = {
  subunitId: string;
  className?: string;
};

export default function PrintWorksheetButton({
  subunitId,
  className = "",
}: PrintWorksheetButtonProps) {
  const openPrintableWorksheet = () => {
    const printUrl = `/worksheets/${encodeURIComponent(subunitId)}/print?generated=${Date.now()}`;
    window.open(printUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={openPrintableWorksheet}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#8068c5] px-4 text-sm font-bold text-white shadow-[0_4px_0_#4f3b80] transition hover:-translate-y-0.5 hover:bg-[#725bb8] active:translate-y-0 ${className}`}
    >
      인쇄
    </button>
  );
}
