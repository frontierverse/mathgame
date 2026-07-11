import * as THREE from "three";

import type { SceneHelpers } from "./types";

export type AnimatedOrb = {
  mesh: THREE.Mesh;
  baseY: number;
  baseTilt: number;
  phase: number;
};

export function createSceneHelpers({
  contentGroup,
  interactiveMeshes,
  animatedOrbs,
  maxVisible,
  showFocusRing,
}: {
  contentGroup: THREE.Group;
  interactiveMeshes: THREE.Mesh[];
  animatedOrbs: AnimatedOrb[];
  maxVisible: number;
  showFocusRing: boolean;
}): SceneHelpers {
  const ringGeometry = new THREE.TorusGeometry(0.72, 0.035, 12, 64);
  const eyeGeometry = new THREE.SphereGeometry(0.085, 16, 12);
  const glintGeometry = new THREE.SphereGeometry(0.028, 8, 8);
  const cheekGeometry = new THREE.SphereGeometry(0.06, 12, 8);
  const mouthGeometry = new THREE.TorusGeometry(0.085, 0.022, 8, 20, Math.PI);
  const faceMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3344, roughness: 0.4 });
  const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cheekMaterial = new THREE.MeshBasicMaterial({
    color: 0xf59fb0,
    transparent: true,
    opacity: 0.55,
  });
  const digitSegments: Record<string, number[]> = {
    "0": [0, 1, 2, 4, 5, 6],
    "1": [2, 5],
    "2": [0, 2, 3, 4, 6],
    "3": [0, 2, 3, 5, 6],
    "4": [1, 2, 3, 5],
    "5": [0, 1, 3, 5, 6],
    "6": [0, 1, 3, 4, 5, 6],
    "7": [0, 2, 5],
    "8": [0, 1, 2, 3, 4, 5, 6],
    "9": [0, 1, 2, 3, 5, 6],
  };

  const createBlobGeometry = (seed: number) => {
    const geometry = new THREE.SphereGeometry(0.48, 40, 28);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index);
      normal.copy(vertex).normalize();
      const bump =
        Math.sin(normal.x * 3.2 + seed) * Math.sin(normal.y * 2.6 + seed * 1.7) * 0.06 +
        Math.sin(normal.y * 4.4 + seed * 2.1) * Math.sin(normal.z * 3.7 + seed * 0.8) * 0.045 +
        Math.sin(normal.z * 5.2 + seed * 1.4) * Math.sin(normal.x * 4.1 + seed * 2.6) * 0.035;
      const faceSmoothing = 1 - Math.max(0, normal.z) * 0.75;
      vertex.multiplyScalar(1 + bump * faceSmoothing);
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  };

  const createOrb = (position: THREE.Vector3, color: number, index: number, scale = 1) => {
    const seed = index * 2.39 + 1.7;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.34,
      metalness: 0.06,
      emissive: color,
      emissiveIntensity: 0.12,
    });
    const orb = new THREE.Mesh(createBlobGeometry(seed), material);
    orb.position.copy(position);
    orb.scale.setScalar(scale);
    const baseTilt = Math.sin(seed * 5.3) * 0.12;
    orb.rotation.z = baseTilt;
    orb.userData.baseScale = scale;
    orb.userData.active = false;

    const eyeSpacing = 0.165 + Math.sin(seed * 3.1) * 0.02;
    const eyeHeight = 0.09 + Math.sin(seed * 4.7) * 0.03;
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeometry, faceMaterial);
      eye.position.set(side * eyeSpacing, eyeHeight, 0.43);
      eye.scale.set(1, 1.25, 0.75);
      orb.add(eye);

      const glint = new THREE.Mesh(glintGeometry, glintMaterial);
      glint.position.set(side * eyeSpacing - 0.03, eyeHeight + 0.035, 0.49);
      orb.add(glint);

      const cheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
      cheek.position.set(side * (eyeSpacing + 0.14), -0.03, 0.41);
      cheek.scale.set(1, 0.7, 0.4);
      orb.add(cheek);
    }

    const mouth = new THREE.Mesh(mouthGeometry, faceMaterial);
    mouth.position.set(0, -0.09, 0.465);
    mouth.rotation.z = Math.PI;
    mouth.scale.setScalar(0.75 + Math.abs(Math.sin(seed * 2.2)) * 0.35);
    orb.add(mouth);

    contentGroup.add(orb);
    interactiveMeshes.push(orb);
    animatedOrbs.push({ mesh: orb, baseY: position.y, baseTilt, phase: index * 0.63 });

    if (showFocusRing) {
      const ring = new THREE.Mesh(
        ringGeometry,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 }),
      );
      ring.position.copy(position);
      ring.rotation.x = Math.PI / 2;
      ring.scale.setScalar(scale);
      contentGroup.add(ring);
    }

    return orb;
  };

  const createDigitSlot = (color: number) => {
    const slot = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.18,
      roughness: 0.3,
    });
    const horizontalGeometry = new THREE.BoxGeometry(0.42, 0.12, 0.14);
    const verticalGeometry = new THREE.BoxGeometry(0.14, 0.42, 0.14);
    const segmentPositions = [
      [0, 0.48],
      [-0.21, 0.24],
      [0.21, 0.24],
      [0, 0],
      [-0.21, -0.24],
      [0.21, -0.24],
      [0, -0.48],
    ];

    segmentPositions.forEach(([x, y], index) => {
      const segment = new THREE.Mesh(
        index === 0 || index === 3 || index === 6 ? horizontalGeometry : verticalGeometry,
        material,
      );
      segment.position.set(x, y, 0);
      segment.visible = false;
      slot.add(segment);
    });

    return slot;
  };

  const showDigit = (slot: THREE.Group, digit: string | undefined) => {
    const visibleSegments = digit === undefined ? [] : digitSegments[digit] ?? [];
    slot.children.forEach((segment, index) => {
      segment.visible = visibleSegments.includes(index);
    });
  };

  const createEquationSymbol = (kind: "plus" | "multiply" | "equals", color: number) => {
    const symbol = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15,
      roughness: 0.32,
    });
    if (kind === "multiply") {
      for (const angle of [-Math.PI / 4, Math.PI / 4]) {
        const stroke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.14), material);
        stroke.rotation.z = angle;
        symbol.add(stroke);
      }
      return symbol;
    }

    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.14), material);
    symbol.add(horizontal);
    if (kind === "plus") {
      symbol.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.14), material));
    } else {
      horizontal.position.y = 0.13;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.14), material);
      lower.position.y = -0.13;
      symbol.add(lower);
    }
    return symbol;
  };

  const addRow = (count: number, y: number, color: number, xOffset = 0, startIndex = 0) => {
    const visible = Math.min(Math.max(count, 0), maxVisible);
    const columns = Math.min(6, Math.max(visible, 1));
    const rows = Math.ceil(visible / columns);

    for (let index = 0; index < visible; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const usedInRow = Math.min(columns, visible - row * columns);
      createOrb(
        new THREE.Vector3(
          xOffset + (column - (usedInRow - 1) / 2) * 1.25,
          y + (rows - 1) * 0.62 - row * 1.25,
          Math.sin(index * 1.7) * 0.18,
        ),
        color,
        startIndex + index,
      );
    }
  };

  return { createDigitSlot, showDigit, createEquationSymbol, createOrb, addRow };
}
