export type BlobVariant = "rock" | "crystal" | "ruby" | "diamond";

export const MINERALS: Record<BlobVariant, { label: string; color: string }> = {
  rock: { label: "돌", color: "#9c948b" },
  crystal: { label: "수정", color: "#b39ddb" },
  ruby: { label: "루비", color: "#e14b63" },
  diamond: { label: "다이아몬드", color: "#7ec2f0" },
};

export const MINERAL_ORDER: BlobVariant[] = ["rock", "crystal", "ruby", "diamond"];
