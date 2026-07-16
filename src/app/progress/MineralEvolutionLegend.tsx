"use client";

import { MINERALS, MINERAL_ORDER } from "./mineralData";
import StudentBlob from "./StudentBlob";

const LEGEND_COLOR = "#9b84d9";

export default function MineralEvolutionLegend() {
  return (
    <div
      className="flex max-w-full items-center gap-1 overflow-x-auto pb-1"
      aria-label="광물 진화 순서: 돌, 수정, 루비, 다이아몬드"
    >
      {MINERAL_ORDER.map((mineral, index) => (
        <div key={mineral} className="flex shrink-0 items-center gap-1">
          {index > 0 ? (
            <span className="px-0.5 text-sm font-black text-[#b5a9bd]" aria-hidden="true">
              →
            </span>
          ) : null}
          <span className="flex items-center gap-1 text-xs font-black text-[#675d70]">
            <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <StudentBlob
                variant={mineral}
                color={LEGEND_COLOR}
                seed={index}
                renderMode="thumbnail"
                thumbnailMotion
                className="h-10 w-10"
              />
            </span>
            {MINERALS[mineral].label}
          </span>
        </div>
      ))}
    </div>
  );
}
