"use client";

import { RoundedBox, Text } from "@react-three/drei";

import { Button3D } from "./Button3D";
import { FONT_BOLD, FONT_REGULAR, layout, palette } from "./theme";

export function HeaderBar3D({
  title,
  breadcrumb,
  showBack,
  onBack,
}: {
  title: string;
  breadcrumb: string;
  showBack: boolean;
  onBack: () => void;
}) {
  const y = layout.top - 0.55;
  const stageWidth = layout.stageRight - layout.stageLeft;
  const centerX = (layout.stageLeft + layout.stageRight) / 2;

  return (
    <group position={[0, y, 0.6]}>
      <RoundedBox
        args={[0.85, 0.85, 0.5]}
        radius={0.3}
        smoothness={4}
        position={[layout.stageLeft + 0.5, 0, 0]}
        rotation={[0, 0, -0.07]}
      >
        <meshStandardMaterial color={palette.purple} />
      </RoundedBox>

      <Text
        font={FONT_REGULAR}
        fontSize={0.24}
        color={palette.purpleTextDeep}
        anchorX="left"
        anchorY="bottom"
        position={[layout.stageLeft + 1.1, 0.15, 0]}
      >
        목차 탐험
      </Text>
      <Text
        font={FONT_BOLD}
        fontSize={0.42}
        color={palette.ink}
        anchorX="left"
        anchorY="top"
        maxWidth={stageWidth * 0.5}
        position={[layout.stageLeft + 1.1, 0.05, 0]}
      >
        {title}
      </Text>

      <RoundedBox
        args={[Math.min(stageWidth * 0.42, breadcrumb.length * 0.16 + 1), 0.62, 0.4]}
        radius={0.3}
        smoothness={4}
        position={[centerX + stageWidth * 0.16, 0, 0]}
      >
        <meshStandardMaterial color={palette.cardBg} />
      </RoundedBox>
      <Text
        font={FONT_BOLD}
        fontSize={0.19}
        color={palette.blue}
        anchorX="center"
        anchorY="middle"
        maxWidth={stageWidth * 0.4}
        position={[centerX + stageWidth * 0.16, 0, 0.21]}
      >
        {breadcrumb || "중학교 수학"}
      </Text>

      {showBack && (
        <Button3D
          label="뒤"
          width={0.7}
          height={0.7}
          radius={0.35}
          color={palette.cardBg}
          shadowColor={palette.cardShadow}
          textColor={palette.purpleText}
          fontSize={0.32}
          position={[layout.stageRight - 0.15, 0, 0]}
          onClick={onBack}
        />
      )}
    </group>
  );
}
