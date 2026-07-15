"use client";

import { RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";

export function Panel3D({
  width,
  height,
  depth = 0.5,
  radius = 0.22,
  color,
  shadowColor,
  shadowOffset = 0.16,
  position = [0, 0, 0] as [number, number, number],
  children,
}: {
  width: number;
  height: number;
  depth?: number;
  radius?: number;
  color: string;
  shadowColor?: string;
  shadowOffset?: number;
  position?: [number, number, number];
  children?: ReactNode;
}) {
  return (
    <group position={position}>
      {shadowColor && (
        <RoundedBox
          args={[width, height, depth * 0.7]}
          radius={radius}
          smoothness={4}
          position={[0, -shadowOffset, -depth * 0.2]}
        >
          <meshStandardMaterial color={shadowColor} />
        </RoundedBox>
      )}
      <RoundedBox args={[width, height, depth]} radius={radius} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      <group position={[0, 0, depth / 2]}>{children}</group>
    </group>
  );
}
