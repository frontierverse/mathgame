"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text, useCursor } from "@react-three/drei";
import type * as THREE from "three";

import { FONT_BOLD, palette } from "./theme";

export function Button3D({
  label,
  width,
  height,
  depth = 0.42,
  radius,
  color,
  shadowColor,
  textColor = "#ffffff",
  fontSize = 0.34,
  position = [0, 0, 0] as [number, number, number],
  disabled = false,
  selected = false,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
}: {
  label: string;
  width: number;
  height: number;
  depth?: number;
  radius?: number;
  color: string;
  shadowColor: string;
  textColor?: string;
  fontSize?: number;
  position?: [number, number, number];
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const shadowOffset = 0.14;
  const resolvedRadius = radius ?? Math.min(width, height) * 0.28;

  useCursor(hovered && !disabled);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const targetY = pressed && !disabled ? -shadowOffset * 0.75 : 0;
    const targetScale = disabled ? 1 : pressed ? 0.97 : hovered ? 1.05 : 1;
    const lerpSpeed = Math.min(1, delta * 14);

    groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpSpeed;
    const currentScale = groupRef.current.scale.x;
    const nextScale = currentScale + (targetScale - currentScale) * lerpSpeed;
    groupRef.current.scale.setScalar(nextScale);
  });

  return (
    <group position={position}>
      <RoundedBox args={[width, height, depth * 0.6]} radius={resolvedRadius} smoothness={4} position={[0, -shadowOffset, -depth * 0.15]}>
        <meshStandardMaterial color={disabled ? palette.cardShadow : shadowColor} />
      </RoundedBox>
      <group
        ref={groupRef}
        onPointerOver={(event) => {
          event.stopPropagation();

          if (!disabled) {
            setHovered(true);
          }
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
          setPressed(false);
          onPointerLeave?.();
        }}
        onPointerDown={(event) => {
          event.stopPropagation();

          if (disabled) {
            return;
          }

          setPressed(true);
          onPointerDown?.();
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          setPressed(false);
          onPointerUp?.();
        }}
        onClick={(event) => {
          event.stopPropagation();

          if (!disabled) {
            onClick?.();
          }
        }}
      >
        <RoundedBox args={[width, height, depth]} radius={resolvedRadius} smoothness={4} castShadow>
          <meshStandardMaterial
            color={selected ? palette.green : color}
            opacity={disabled ? 0.55 : 1}
            transparent={disabled}
          />
        </RoundedBox>
        <Text
          font={FONT_BOLD}
          fontSize={fontSize}
          color={selected ? "#ffffff" : textColor}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, depth / 2 + 0.02]}
          maxWidth={width * 0.9}
          textAlign="center"
        >
          {label}
        </Text>
      </group>
    </group>
  );
}
