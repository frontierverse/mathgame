import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildFallbackScene({ maxVisible, parsed, helpers }: LessonSceneContext): LessonScene {
  const { addRow, createOrb } = helpers;

  if (parsed.operator === "÷") {
    const total = Math.min(parsed.left, maxVisible);
    const groups = Math.max(1, Math.min(parsed.right, 6));
    const colors = [0x9edce3, 0xb9a9e3, 0xf2cf8d, 0xf2a6b1, 0x9fd8b8, 0x9fc4f2];
    for (let index = 0; index < total; index += 1) {
      const groupIndex = index % groups;
      const itemIndex = Math.floor(index / groups);
      createOrb(
        new THREE.Vector3(
          (groupIndex - (groups - 1) / 2) * 1.85,
          1.5 - itemIndex * 1.08,
          groupIndex % 2 === 0 ? 0.2 : -0.2,
        ),
        colors[groupIndex],
        index,
        0.9,
      );
    }
    return {};
  }

  addRow(parsed.left, 0.4, 0x9edce3, parsed.right > 0 ? -2.3 : 0, 0);
  if (parsed.right > 0) {
    addRow(parsed.right, 0.4, parsed.operator === "+" ? 0xb9a9e3 : 0xf2a6b1, 2.3, parsed.left);
  }
  return {};
}
