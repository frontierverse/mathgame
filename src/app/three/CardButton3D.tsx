"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text, useCursor } from "@react-three/drei";
import type * as THREE from "three";

import { FONT_BOLD, FONT_REGULAR, palette } from "./theme";

export function CardButton3D({
  width,
  height,
  position = [0, 0, 0] as [number, number, number],
  badgeLabel,
  badgeColor,
  badgeTextColor = "#ffffff",
  title,
  subtitle,
  selected = false,
  onClick,
}: {
  width: number;
  height: number;
  position?: [number, number, number];
  badgeLabel: string;
  badgeColor: string;
  badgeTextColor?: string;
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const depth = 0.36;

  useCursor(hovered);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const targetZ = hovered ? 0.32 : 0;
    const lerpSpeed = Math.min(1, delta * 12);
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * lerpSpeed;
  });

  return (
    <group position={position}>
      <RoundedBox args={[width, height, depth * 0.7]} radius={0.24} smoothness={4} position={[0, -0.12, -depth * 0.25]}>
        <meshStandardMaterial color={palette.cardShadow} />
      </RoundedBox>
      <group
        ref={groupRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <RoundedBox args={[width, height, depth]} radius={0.24} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={selected ? palette.panelBgAlt : palette.cardBg} />
        </RoundedBox>

        <RoundedBox
          args={[height * 0.4, height * 0.4, depth * 0.5]}
          radius={0.14}
          smoothness={4}
          position={[-width / 2 + height * 0.32, height / 2 - height * 0.32, depth / 2]}
        >
          <meshStandardMaterial color={badgeColor} />
        </RoundedBox>
        <Text
          font={FONT_BOLD}
          fontSize={height * 0.15}
          color={badgeTextColor}
          anchorX="center"
          anchorY="middle"
          position={[-width / 2 + height * 0.32, height / 2 - height * 0.32, depth / 2 + 0.19]}
        >
          {badgeLabel}
        </Text>

        <Text
          font={FONT_BOLD}
          fontSize={height * 0.16}
          color={palette.ink}
          anchorX="left"
          anchorY="top"
          maxWidth={width * 0.86}
          position={[-width / 2 + 0.22, height / 2 - height * 0.62, depth / 2 + 0.02]}
        >
          {title}
        </Text>
        <Text
          font={FONT_REGULAR}
          fontSize={height * 0.1}
          color={palette.inkSoft}
          anchorX="left"
          anchorY="top"
          maxWidth={width * 0.86}
          lineHeight={1.35}
          position={[-width / 2 + 0.22, height / 2 - height * 0.78, depth / 2 + 0.02]}
        >
          {subtitle}
        </Text>
      </group>
    </group>
  );
}
