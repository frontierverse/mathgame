import type { BlobVariant } from "./StudentBlob";

export const MINERALS: Record<BlobVariant, { label: string; color: string }> = {
  rock: { label: "돌", color: "#9c948b" },
  crystal: { label: "수정", color: "#b39ddb" },
  ruby: { label: "루비", color: "#e14b63" },
  diamond: { label: "다이아몬드", color: "#7ec2f0" },
};

export const MINERAL_ORDER: BlobVariant[] = ["rock", "crystal", "ruby", "diamond"];

type MineralIconProps = {
  variant: BlobVariant;
  className?: string;
};

// Lightweight flat SVG mineral icons (no WebGL) for collection chips and rewards.
export default function MineralIcon({ variant, className = "h-6 w-6" }: MineralIconProps) {
  const color = MINERALS[variant].color;
  const facet = "rgba(0,0,0,0.18)";

  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={MINERALS[variant].label}>
      {variant === "rock" ? (
        <>
          <polygon points="4,15 6,9 12,6 18,8 20,15 14,20 8,20" fill={color} />
          <g stroke={facet} strokeWidth="0.8" fill="none">
            <path d="M6,9 L12,13 L20,15" />
            <path d="M12,13 L11,20" />
          </g>
        </>
      ) : variant === "crystal" ? (
        <>
          <polygon points="12,2 15,9 13,21 11,21 9,9" fill={color} />
          <polygon points="7,7 9,11 8,20 6,20 5,11" fill={color} />
          <polygon points="17,8 18,12 17,20 15,20 15,12" fill={color} />
          <g stroke={facet} strokeWidth="0.7" fill="none">
            <path d="M9,9 L15,9" />
            <path d="M12,2 L12,21" />
          </g>
        </>
      ) : variant === "ruby" ? (
        <>
          <polygon points="8,3 16,3 21,9 12,21 3,9" fill={color} />
          <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" fill="none">
            <path d="M3,9 L21,9" />
            <path d="M8,3 L12,21" />
            <path d="M16,3 L12,21" />
          </g>
        </>
      ) : (
        <>
          <polygon points="6,4 18,4 22,9 12,22 2,9" fill={color} />
          <g stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" fill="none">
            <path d="M2,9 L22,9" />
            <path d="M6,4 L9,9 L12,22" />
            <path d="M18,4 L15,9 L12,22" />
            <path d="M9,9 L15,9" />
          </g>
        </>
      )}
    </svg>
  );
}
