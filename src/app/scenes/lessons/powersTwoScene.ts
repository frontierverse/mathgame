import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildPowersTwoScene({ contentGroup }: LessonSceneContext): LessonScene {
  const leftCluster = createCubeCluster(0x72bec8);
  const rightCluster = createCubeCluster(0x9b84d9);
  leftCluster.position.set(-1.35, 0.3, 0);
  rightCluster.position.set(1.35, 0.3, 0);
  contentGroup.add(leftCluster, rightCluster);

  const eightAsPower = createTextPlane(
    "8 = 2 × 2 × 2 = 2³",
    "#5d5270",
    92,
    6.2,
    0.9,
  );
  eightAsPower.position.set(0, 2.05, 0.25);
  contentGroup.add(eightAsPower);

  const leftLabel = createTextPlane("8 = 2³", "#438a94", 82, 2.4, 0.72);
  leftLabel.position.set(-1.35, -0.85, 0.3);
  const rightLabel = createTextPlane("8 = 2³", "#7660ae", 82, 2.4, 0.72);
  rightLabel.position.set(1.35, -0.85, 0.3);
  contentGroup.add(leftLabel, rightLabel);

  const combinedEquation = createTextPlane(
    "2 × 8 = 2 × 2³ = 2⁴ = 16",
    "#4b4059",
    88,
    7.2,
    0.96,
  );
  combinedEquation.position.set(0, -1.72, 0.3);
  contentGroup.add(combinedEquation);

  const explanation = createTextPlane(
    "8개짜리 묶음이 2개",
    "#95899a",
    62,
    4.2,
    0.65,
  );
  explanation.position.set(0, -2.35, 0.3);
  contentGroup.add(explanation);

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, 5.8, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0, -0.5);
  contentGroup.add(layoutBounds);

  return {
    animate(elapsed) {
      leftCluster.rotation.y = Math.sin(elapsed * 0.7) * 0.18 - 0.18;
      rightCluster.rotation.y = Math.sin(elapsed * 0.7 + 1.2) * 0.18 + 0.18;
      leftCluster.position.y = 0.3 + Math.sin(elapsed * 1.25) * 0.06;
      rightCluster.position.y = 0.3 + Math.sin(elapsed * 1.25 + 0.8) * 0.06;
    },
  };
}

function createCubeCluster(color: number) {
  const cluster = new THREE.Group();
  const geometry = new THREE.BoxGeometry(0.62, 0.62, 0.62);

  for (let x = 0; x < 2; x += 1) {
    for (let y = 0; y < 2; y += 1) {
      for (let z = 0; z < 2; z += 1) {
        const cube = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.28,
            metalness: 0.05,
            emissive: color,
            emissiveIntensity: 0.08 + (x + y + z) * 0.025,
          }),
        );
        cube.position.set((x - 0.5) * 0.7, (y - 0.5) * 0.7, (z - 0.5) * 0.7);
        cluster.add(cube);
      }
    }
  }

  return cluster;
}

function createTextPlane(
  text: string,
  color: string,
  fontSize: number,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 240;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `800 ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}
