"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { palette } from "./theme";

type Blob = {
  value: number;
  color: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  phase: number;
};

const blobs: Blob[] = [
  { value: 2, color: "#ff9ea0", x: -7.6, y: 3.1, z: -3.5, scale: 1.1, speed: 0.6, phase: 0 },
  { value: 3, color: "#ffd27a", x: -3.2, y: 4.0, z: -4.2, scale: 0.9, speed: 0.5, phase: 1.4 },
  { value: 5, color: "#8fd8a8", x: 6.8, y: 3.3, z: -3.8, scale: 1.2, speed: 0.45, phase: 2.6 },
  { value: 9, color: "#8fb8ff", x: -6.4, y: -3.6, z: -4, scale: 1.05, speed: 0.55, phase: 3.7 },
  { value: 11, color: "#e79ee0", x: 6.9, y: -3.4, z: -3.6, scale: 0.95, speed: 0.5, phase: 4.9 },
];

function BackdropBlob({ blob }: { blob: Blob }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }

    const t = clock.getElapsedTime() * blob.speed + blob.phase;
    ref.current.position.y = blob.y + Math.sin(t) * 0.3;
    ref.current.rotation.z = Math.sin(t * 0.6) * 0.08;
  });

  return (
    <group ref={ref} position={[blob.x, blob.y, blob.z]} scale={blob.scale}>
      <mesh>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={blob.color} transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

export function Backdrop() {
  const dots = useMemo(
    () => [
      { x: -7.9, y: 4.2, color: "#ff9ea0", size: 0.12 },
      { x: 7.6, y: 3.9, color: "#80b8ff", size: 0.1 },
      { x: -8.1, y: 2.2, color: "#e873df", size: 0.08 },
      { x: 7.2, y: -3.4, color: "#54c978", size: 0.1 },
    ],
    [],
  );

  return (
    <group>
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[40, 24]} />
        <meshStandardMaterial color={palette.backdrop} />
      </mesh>
      {blobs.map((blob) => (
        <BackdropBlob key={blob.value} blob={blob} />
      ))}
      {dots.map((dot, index) => (
        <mesh key={index} position={[dot.x, dot.y, -3]}>
          <circleGeometry args={[dot.size, 16]} />
          <meshBasicMaterial color={dot.color} />
        </mesh>
      ))}
    </group>
  );
}
