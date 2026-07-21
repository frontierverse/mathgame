"use client";

import MineralObject from "./MineralObject";
import { MINERALS, MINERAL_ORDER } from "./mineralData";

export default function MineralEvolutionLegend() {
  return (
    <div
      className="flex max-w-full items-center gap-1 overflow-x-auto px-3 py-2"
      aria-label="광물 진화 순서: 샤갈, 수정, 야르, 다이아몬드"
    >
      {MINERAL_ORDER.map((mineral, index) => (
        <div key={mineral} className="flex shrink-0 items-center gap-1">
          {index > 0 ? (
            <span className="px-0.5 text-sm font-black text-[#b5a9bd]" aria-hidden="true">
              →
            </span>
          ) : null}
          <span className="flex items-center gap-1 text-xs font-black text-[#675d70]">
            <MineralObject variant={mineral} className="h-7 w-7 shrink-0" />
            {MINERALS[mineral].label}
          </span>
        </div>
      ))}
    </div>
  );
}
