"use client";

import { useEffect, useId, useState, type FocusEvent } from "react";

import MineralObject from "./MineralObject";

type DiamondRewardButtonProps = {
  diamondIndex: number;
  rubyCount: number;
  compact?: boolean;
  onClick: () => void;
};

export default function DiamondRewardButton({
  diamondIndex,
  rubyCount,
  compact = false,
  onClick,
}: DiamondRewardButtonProps) {
  const descriptionId = useId();
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const tooltipOpen = (hovered || focusWithin) && !dismissed;

  useEffect(() => {
    if (!tooltipOpen) return;

    const dismissOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setDismissed(true);
    };
    document.addEventListener("keydown", dismissOnEscape, true);
    return () => document.removeEventListener("keydown", dismissOnEscape, true);
  }, [tooltipOpen]);

  const closeFocusTooltip = (event: FocusEvent<HTMLSpanElement>) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setFocusWithin(false);
  };

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={() => {
        setHovered(true);
        setDismissed(false);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => {
        setFocusWithin(true);
        setDismissed(false);
      }}
      onBlur={closeFocusTooltip}
    >
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          onClick();
        }}
        aria-haspopup="dialog"
        aria-label={`다이아몬드 ${diamondIndex + 1} 보기`}
        aria-describedby={descriptionId}
        className={`diamond-reward-circle flex items-center justify-center rounded-full border transition duration-200 hover:border-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ec2f0] focus-visible:ring-offset-1 ${
          compact ? "h-14 w-14" : "h-16 w-16 2xl:h-[72px] 2xl:w-[72px]"
        }`}
      >
        <MineralObject
          variant="diamond"
          className={compact ? "h-12 w-12" : "h-14 w-14 2xl:h-16 2xl:w-16"}
        />
      </button>
      <span id={descriptionId} className="sr-only">
        야르 {rubyCount}개로 완성
      </span>

      {tooltipOpen ? (
        <span
          role="tooltip"
          aria-label={`야르 ${rubyCount}개`}
          className="absolute bottom-full left-0 z-40 w-28 pb-2 motion-reduce:transition-none sm:left-1/2 sm:-translate-x-1/2"
        >
          <span
            aria-hidden="true"
            className="block rounded-xl border border-[#eadce3] bg-[#fffefa] p-2 shadow-[0_10px_24px_rgba(70,45,82,0.2)]"
          >
            <span className="mb-1.5 block text-center text-[10px] font-black leading-none text-[#a33f53]">
              {rubyCount} <span className="text-transparent">야르</span>!
            </span>
            <span className="grid grid-cols-5 gap-1">
              {Array.from({ length: rubyCount }, (_, rubyIndex) => (
                <MineralObject
                  key={rubyIndex}
                  variant="ruby"
                  className="h-4 w-4"
                />
              ))}
            </span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
