"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import StudentBlob from "./StudentBlob";

type DiamondRewardButtonProps = {
  studentColor: string;
  seed: number;
  diamondIndex: number;
  onClick: () => void;
};

type AuraPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function DiamondRewardButton({
  studentColor,
  seed,
  diamondIndex,
  onClick,
}: DiamondRewardButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [auraPosition, setAuraPosition] = useState<AuraPosition | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    let animationFrame = 0;
    const updateAura = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const rect = button.getBoundingClientRect();
        const scrollArea = button.closest<HTMLElement>(".progress-scroll");
        const clipRect = scrollArea?.getBoundingClientRect();
        const visibleInScrollArea =
          !clipRect ||
          (rect.bottom > clipRect.top &&
            rect.top < clipRect.bottom &&
            rect.right > clipRect.left &&
            rect.left < clipRect.right);
        const visibleInViewport =
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          rect.right > 0 &&
          rect.left < window.innerWidth;

        if (!visibleInScrollArea || !visibleInViewport) {
          setAuraPosition(null);
          return;
        }

        setAuraPosition({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      });
    };

    const resizeObserver = new ResizeObserver(updateAura);
    resizeObserver.observe(button);
    window.addEventListener("resize", updateAura);
    window.addEventListener("scroll", updateAura, true);
    updateAura();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateAura);
      window.removeEventListener("scroll", updateAura, true);
    };
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label={`다이아몬드 ${diamondIndex + 1}, 사용된 루비 10개 보기`}
        className="diamond-reward-circle flex h-16 w-16 items-center justify-center rounded-full border transition duration-200 hover:border-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ec2f0] focus-visible:ring-offset-1 2xl:h-[72px] 2xl:w-[72px]"
      >
        <StudentBlob
          variant="diamond"
          color={studentColor}
          seed={seed}
          renderMode="thumbnail"
          thumbnailMotion
          className="h-14 w-14 2xl:h-16 2xl:w-16"
        />
      </button>

      {auraPosition
        ? createPortal(
            <span
              className="diamond-reward-aura"
              style={auraPosition}
              aria-hidden="true"
            />,
            document.body,
          )
        : null}
    </>
  );
}
