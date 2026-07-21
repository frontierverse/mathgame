"use client";

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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`다이아몬드 ${diamondIndex + 1}, 사용된 야르 ${rubyCount}개 보기`}
      className={`diamond-reward-circle flex items-center justify-center rounded-full border transition duration-200 hover:border-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ec2f0] focus-visible:ring-offset-1 ${
        compact ? "h-14 w-14" : "h-16 w-16 2xl:h-[72px] 2xl:w-[72px]"
      }`}
    >
      <MineralObject
        variant="diamond"
        className={compact ? "h-12 w-12" : "h-14 w-14 2xl:h-16 2xl:w-16"}
      />
    </button>
  );
}
