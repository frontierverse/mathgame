"use client";

import { RoundedBox, Text } from "@react-three/drei";

import { Button3D } from "./Button3D";
import type { ExpressionDisplayToken } from "../mathLogic";
import { FONT_BOLD, FONT_REGULAR, layout, palette } from "./theme";

const tileColorByValue: Record<string, { color: string; text: string }> = {
  "0": { color: palette.purple, text: "#ffffff" },
  "1": { color: palette.pink, text: "#ffffff" },
  "2": { color: "#ff7a7a", text: "#ffffff" },
  "3": { color: palette.yellowSolid, text: palette.ink },
  "4": { color: palette.orange, text: palette.ink },
  "5": { color: palette.purple, text: "#ffffff" },
  "6": { color: palette.teal, text: "#ffffff" },
  "7": { color: palette.blue, text: "#ffffff" },
  "8": { color: palette.red, text: "#ffffff" },
  "9": { color: palette.green, text: "#ffffff" },
};

export function ExpressionTray3D({
  tokens,
  preview,
  showApply,
  applyLabel,
  canApply,
  onApply,
}: {
  tokens: ExpressionDisplayToken[];
  preview: string;
  showApply: boolean;
  applyLabel: string;
  canApply: boolean;
  onApply: () => void;
}) {
  const y = layout.bottom + 0.95;
  const centerX = (layout.stageLeft + layout.stageRight) / 2;
  const trayWidth = layout.stageRight - layout.stageLeft - (showApply ? 1.9 : 0.2);
  const trayLeft = layout.stageLeft + 0.1;
  const visibleTokens = tokens.slice(-18);
  const tileSize = Math.min(0.5, (trayWidth - 0.4) / Math.max(visibleTokens.length, 1));

  return (
    <group>
      <RoundedBox
        args={[trayWidth, 1.05, 0.4]}
        radius={0.5}
        smoothness={4}
        position={[trayLeft + trayWidth / 2, y, 0]}
      >
        <meshStandardMaterial color={palette.cardBg} />
      </RoundedBox>

      {visibleTokens.length === 0 ? (
        <Text
          font={FONT_BOLD}
          fontSize={0.26}
          color={palette.inkFaint}
          anchorX="center"
          anchorY="middle"
          position={[trayLeft + trayWidth / 2, y, 0.22]}
        >
          식을 입력해보세요
        </Text>
      ) : (
        visibleTokens.map((token, index) => {
          const x =
            trayLeft + trayWidth - 0.35 - (visibleTokens.length - 1 - index) * (tileSize + 0.08) - tileSize / 2;

          if (token.kind === "digit") {
            const style = tileColorByValue[token.value] ?? tileColorByValue["0"];

            return (
              <group key={`${token.value}-${index}`} position={[x, y, 0]}>
                <RoundedBox args={[tileSize, tileSize, 0.32]} radius={tileSize * 0.32} smoothness={4} position={[0, 0, 0.05]}>
                  <meshStandardMaterial color={style.color} />
                </RoundedBox>
                <Text
                  font={FONT_BOLD}
                  fontSize={tileSize * 0.55}
                  color={style.text}
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0, 0.24]}
                >
                  {token.value}
                </Text>
              </group>
            );
          }

          return (
            <Text
              key={`${token.value}-${index}`}
              font={FONT_BOLD}
              fontSize={tileSize * (token.kind === "operator" ? 0.6 : 0.4)}
              color={token.kind === "operator" ? palette.ink : palette.inkFaint}
              anchorX="center"
              anchorY="middle"
              position={[x, y, 0.22]}
            >
              {token.value}
            </Text>
          );
        })
      )}

      {showApply && (
        <Button3D
          label={applyLabel}
          width={1.7}
          height={1.05}
          radius={0.5}
          color={palette.orange}
          shadowColor={palette.orangeShadow}
          textColor={palette.ink}
          fontSize={0.22}
          disabled={!canApply}
          position={[layout.stageRight - 0.95, y, 0]}
          onClick={onApply}
        />
      )}

      <Text
        font={FONT_REGULAR}
        fontSize={0.17}
        color={palette.inkSoft}
        anchorX="center"
        anchorY="middle"
        maxWidth={layout.stageRight - layout.stageLeft - 0.6}
        position={[centerX, y - 0.75, 0.05]}
      >
        {preview}
      </Text>
    </group>
  );
}
