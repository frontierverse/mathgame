import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildQuantityScene({ contentGroup, interactiveMeshes }: LessonSceneContext): LessonScene {
  const animatedDigits: Array<{ object: THREE.Object3D; baseY: number; phase: number }> = [];
  let countMarker: THREE.Mesh | null = null;
  let sweatDrop: THREE.Mesh | null = null;
  let character: THREE.Group | null = null;
  let speechBubble: THREE.Mesh | null = null;
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a6947,
    roughness: 0.92,
    metalness: 0,
  });
  const twigMaterial = new THREE.MeshStandardMaterial({
    color: 0xb17b54,
    roughness: 0.96,
    metalness: 0,
  });

  for (let index = 0; index < 10; index += 1) {
    const branch = new THREE.Group();
    branch.position.set(
      (index - 4.5) * 0.68,
      2.35 + Math.sin(index * 1.7) * 0.08,
      Math.sin(index * 1.3) * 0.12,
    );
    branch.rotation.z = Math.sin(index * 2.1) * 0.025;
    branch.rotation.y = Math.sin(index * 0.8) * 0.04;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.76, 8), branchMaterial);
    branch.add(stem);
    interactiveMeshes.push(stem);

    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.038, 0.24, 7), twigMaterial);
    twig.position.set(index % 2 === 0 ? 0.08 : -0.08, 0.16, 0);
    twig.rotation.z = index % 2 === 0 ? -0.72 : 0.72;
    branch.add(twig);

    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 8),
      new THREE.MeshStandardMaterial({
        color: index % 3 === 0 ? 0x9dbd89 : 0xc89c73,
        roughness: 0.82,
      }),
    );
    bud.position.set(index % 2 === 0 ? 0.16 : -0.16, 0.25, 0);
    branch.add(bud);
    contentGroup.add(branch);
  }

  countMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.045, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xe58c9c, transparent: true, opacity: 0.82 }),
  );
  countMarker.position.set(-3.06, 2.35, 0.32);
  contentGroup.add(countMarker);

  character = new THREE.Group();
  character.position.set(-4.05, 1.95, 0.15);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 22, 16),
    new THREE.MeshStandardMaterial({ color: 0x76513d, roughness: 0.9 }),
  );
  hair.position.set(0, 0.55, -0.02);
  character.add(hair);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xe7b184, roughness: 0.72 }),
  );
  head.position.set(0, 0.52, 0.1);
  character.add(head);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.36, 0.72, 10),
    new THREE.MeshStandardMaterial({ color: 0xa47655, roughness: 0.92 }),
  );
  body.position.y = -0.05;
  character.add(body);

  const tiredFaceMaterial = new THREE.MeshBasicMaterial({ color: 0x4f3e43 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), tiredFaceMaterial);
    eye.position.set(side * 0.1, 0.58, 0.38);
    eye.scale.set(1.4, 0.55, 0.5);
    character.add(eye);

    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.48, 8),
      new THREE.MeshStandardMaterial({ color: 0xe7b184, roughness: 0.75 }),
    );
    arm.position.set(side * 0.3, -0.08, 0);
    arm.rotation.z = side * 0.46;
    character.add(arm);
  }

  const mouthLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.12, 6),
    tiredFaceMaterial,
  );
  mouthLeft.position.set(-0.045, 0.43, 0.39);
  mouthLeft.rotation.z = -0.82;
  character.add(mouthLeft);
  const mouthRight = mouthLeft.clone();
  mouthRight.position.x = 0.045;
  mouthRight.rotation.z = 0.82;
  character.add(mouthRight);

  sweatDrop = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0x75c8d6, transparent: true, opacity: 0.85 }),
  );
  sweatDrop.position.set(0.35, 0.72, 0.32);
  sweatDrop.scale.set(0.65, 1.25, 0.55);
  character.add(sweatDrop);
  contentGroup.add(character);

  const speechCanvas = document.createElement("canvas");
  speechCanvas.width = 720;
  speechCanvas.height = 320;
  const speechContext = speechCanvas.getContext("2d");
  if (speechContext) {
    const width = speechCanvas.width;
    const height = speechCanvas.height;
    const bubbleTop = 14;
    const bubbleBottom = height - 74;
    const cornerRadius = 56;
    const traceRoundedRect = (x: number, y: number, rectWidth: number, rectHeight: number, radius: number) => {
      speechContext.beginPath();
      speechContext.moveTo(x + radius, y);
      speechContext.arcTo(x + rectWidth, y, x + rectWidth, y + rectHeight, radius);
      speechContext.arcTo(x + rectWidth, y + rectHeight, x, y + rectHeight, radius);
      speechContext.arcTo(x, y + rectHeight, x, y, radius);
      speechContext.arcTo(x, y, x + rectWidth, y, radius);
      speechContext.closePath();
    };

    speechContext.clearRect(0, 0, width, height);
    speechContext.fillStyle = "#fffdf8";
    traceRoundedRect(14, bubbleTop, width - 28, bubbleBottom - bubbleTop, cornerRadius);
    speechContext.fill();
    speechContext.strokeStyle = "#e79aa8";
    speechContext.lineWidth = 10;
    speechContext.stroke();

    const tailLeft = 180;
    const tailRight = 288;
    const tailTipX = 116;
    const tailTipY = height - 8;
    speechContext.fillStyle = "#fffdf8";
    speechContext.beginPath();
    speechContext.moveTo(tailLeft, bubbleBottom - 10);
    speechContext.lineTo(tailTipX, tailTipY);
    speechContext.lineTo(tailRight, bubbleBottom - 10);
    speechContext.closePath();
    speechContext.fill();
    speechContext.beginPath();
    speechContext.moveTo(tailLeft, bubbleBottom - 10);
    speechContext.lineTo(tailTipX, tailTipY);
    speechContext.lineTo(tailRight, bubbleBottom - 10);
    speechContext.stroke();

    speechContext.fillStyle = "#5b4149";
    speechContext.font = '700 82px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    speechContext.textAlign = "center";
    speechContext.textBaseline = "middle";
    const centerX = width / 2;
    const centerY = (bubbleTop + bubbleBottom) / 2;
    speechContext.fillText("하나씩 세기가", centerX, centerY - 48);
    speechContext.fillText("너무 귀찮아!", centerX, centerY + 48);
  }

  const speechTexture = new THREE.CanvasTexture(speechCanvas);
  speechTexture.colorSpace = THREE.SRGBColorSpace;
  speechTexture.anisotropy = 4;
  speechBubble = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 1.2),
    new THREE.MeshBasicMaterial({ map: speechTexture, transparent: true, depthWrite: false }),
  );
  speechBubble.position.set(-3.05, 3.55, 0.4);
  contentGroup.add(speechBubble);

  const stone = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 1.18, 0.34, 12, 3, 2),
    new THREE.MeshStandardMaterial({ color: 0xc8bca7, roughness: 0.96, metalness: 0 }),
  );
  stone.position.set(0, 0.25, -0.08);
  stone.rotation.z = -0.015;
  contentGroup.add(stone);

  const grooveMaterial = new THREE.MeshStandardMaterial({ color: 0x735d4b, roughness: 1 });
  for (let index = 0; index < 10; index += 1) {
    const groove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.045, 0.72 + (index % 3) * 0.05, 6),
      grooveMaterial,
    );
    groove.position.set((index - 4.5) * 0.68, 0.25 + Math.sin(index * 2.4) * 0.05, 0.16);
    groove.rotation.z = Math.sin(index * 1.8) * 0.1;
    contentGroup.add(groove);
    interactiveMeshes.push(groove);
  }

  const oneMaterial = new THREE.MeshStandardMaterial({ color: 0x78bfc8, roughness: 0.38, metalness: 0.06 });
  const zeroMaterial = new THREE.MeshStandardMaterial({ color: 0xa58bd4, roughness: 0.38, metalness: 0.06 });
  const one = new THREE.Group();
  one.position.set(-0.7, -2.0, 0);
  const oneStem = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.55, 0.34), oneMaterial);
  one.add(oneStem);
  const oneTop = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.34), oneMaterial);
  oneTop.position.set(-0.18, 0.61, 0);
  oneTop.rotation.z = -0.6;
  one.add(oneTop);
  const oneBase = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.25, 0.34), oneMaterial);
  oneBase.position.y = -0.77;
  one.add(oneBase);
  contentGroup.add(one);
  animatedDigits.push({ object: one, baseY: -2.0, phase: 0 });

  const zero = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.19, 20, 64), zeroMaterial);
  zero.position.set(0.65, -2.0, 0);
  contentGroup.add(zero);
  animatedDigits.push({ object: zero, baseY: -2.0, phase: 0.75 });
  interactiveMeshes.push(oneStem, zero);

  const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xb6a6c3, roughness: 0.75 });
  for (const y of [1.25, -0.9]) {
    const arrowStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8), arrowMaterial);
    arrowStem.position.set(0, y, -0.18);
    contentGroup.add(arrowStem);
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 12), arrowMaterial);
    arrowHead.position.set(0, y - 0.27, -0.18);
    arrowHead.rotation.z = Math.PI;
    contentGroup.add(arrowHead);
  }

  return {
    animate(elapsed) {
      animatedDigits.forEach(({ object, baseY, phase }) => {
        object.position.y = baseY + Math.sin(elapsed * 1.8 + phase) * 0.1;
        object.rotation.z = Math.sin(elapsed * 1.35 + phase) * 0.025;
      });
      if (countMarker) {
        const countingStep = Math.floor(elapsed / 0.7) % 10;
        const targetX = (countingStep - 4.5) * 0.68;
        countMarker.position.x += (targetX - countMarker.position.x) * 0.18;
        countMarker.position.y = 2.35 + Math.sin(countingStep * 1.7) * 0.08;
        countMarker.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.08);
      }
      if (sweatDrop) sweatDrop.position.y = 0.72 + Math.sin(elapsed * 2.4) * 0.05;
      if (character) character.rotation.z = Math.sin(elapsed * 1.2) * 0.018;
      if (speechBubble) {
        speechBubble.position.y = 3.55 + Math.sin(elapsed * 1.6) * 0.09;
        speechBubble.rotation.z = Math.sin(elapsed * 1.1) * 0.02;
      }
    },
  };
}
