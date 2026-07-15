"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type QuizCubeMood = "neutral" | "wrong" | "correct";

type DivisorOutcome = "found" | "not";

type SceneHandle = {
  testDivisor: (divisor: number) => boolean;
  setMood: (mood: QuizCubeMood) => void;
  dispose: () => void;
};

type SplitAnim = {
  kind: "split";
  start: number;
  slices: { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; baseX: number }[];
  labels: { sprite: THREE.Sprite; material: THREE.SpriteMaterial }[];
  cleanup: () => void;
};

type HappyAnim = {
  kind: "happy";
  start: number;
  ring: THREE.Mesh;
  ringMaterial: THREE.MeshBasicMaterial;
  cleanup: () => void;
};

const CUBE_SIZE = 1.6;
const HERO_BASE_Y = -0.1;
const STAGE_TOP_Y = -0.9;

const SPLIT_SEPARATE = 0.55;
const SPLIT_REDDEN = 0.35;
const SPLIT_SHAKE = 1.05;
const SPLIT_MERGE = 0.5;
const SPLIT_TOTAL = SPLIT_SEPARATE + SPLIT_REDDEN + SPLIT_SHAKE + SPLIT_MERGE;
const HAPPY_TOTAL = 1.5;
const CONFETTI_LIFE = 3.5;

const confettiColors = ["#ff5c5d", "#ffb23f", "#39b567", "#4f8df7", "#9f70eb", "#f56fd2", "#ffca3a"];

const heroPink = new THREE.Color("#f56fd2");
const failRed = new THREE.Color("#ff5963");
const happyGreen = new THREE.Color("#39b567");
const plainWhite = new THREE.Color("#ffffff");

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function createBodyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d")!;

  context.fillStyle = "#f56fd2";
  context.fillRect(0, 0, 256, 256);
  context.fillStyle = "rgba(255,255,255,0.28)";
  context.beginPath();
  context.ellipse(70, 48, 46, 24, -0.3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.85)";
  context.font = "900 130px 'Arial Black', Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("1", 128, 188);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 110;
  const context = canvas.getContext("2d")!;

  context.fillStyle = "#ffffff";
  drawRoundedRect(context, 8, 8, 184, 94, 40);
  context.fill();
  context.fillStyle = "#d5486d";
  context.font = "900 62px 'Segoe UI', Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 100, 58);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createScene(container: HTMLDivElement, onAnimEnd: () => void): SceneHandle {
  const disposables: { dispose: () => void }[] = [];

  function track<T extends { dispose: () => void }>(resource: T): T {
    disposables.push(resource);
    return resource;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    40,
    (container.clientWidth || 1) / (container.clientHeight || 1),
    0.1,
    50,
  );
  camera.position.set(0, 2.4, 7);
  camera.lookAt(0, 0.2, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cff0, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(3.5, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 20;
  scene.add(sun);

  const stageGeometry = track(new THREE.CylinderGeometry(2.4, 2.7, 0.24, 48));
  const stageMaterial = track(new THREE.MeshStandardMaterial({ color: "#ded1ff" }));
  const stage = new THREE.Mesh(stageGeometry, stageMaterial);
  stage.position.y = STAGE_TOP_Y - 0.12;
  stage.receiveShadow = true;
  scene.add(stage);

  const hero = new THREE.Group();
  const bodyTexture = track(createBodyTexture());
  const bodySideMaterial = track(new THREE.MeshStandardMaterial({ color: heroPink }));
  const bodyFrontMaterial = track(new THREE.MeshStandardMaterial({ map: bodyTexture }));
  const bodyGeometry = track(new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE));
  const body = new THREE.Mesh(bodyGeometry, [
    bodySideMaterial,
    bodySideMaterial,
    bodySideMaterial,
    bodySideMaterial,
    bodyFrontMaterial,
    bodySideMaterial,
  ]);
  body.castShadow = true;
  hero.add(body);

  const darkMaterial = track(new THREE.MeshStandardMaterial({ color: "#3d285f" }));
  const eyeGeometry = track(new THREE.SphereGeometry(0.1, 16, 16));
  const leftEye = new THREE.Mesh(eyeGeometry, darkMaterial);
  leftEye.position.set(-0.3, 0.42, 0.82);
  const rightEye = new THREE.Mesh(eyeGeometry, darkMaterial);
  rightEye.position.set(0.3, 0.42, 0.82);
  hero.add(leftEye, rightEye);

  const cheekMaterial = track(new THREE.MeshStandardMaterial({ color: "#ff9ec8" }));
  const cheekGeometry = track(new THREE.SphereGeometry(0.09, 16, 16));
  const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
  leftCheek.position.set(-0.55, 0.2, 0.8);
  leftCheek.scale.set(1, 0.7, 0.35);
  const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
  rightCheek.position.set(0.55, 0.2, 0.8);
  rightCheek.scale.set(1, 0.7, 0.35);
  hero.add(leftCheek, rightCheek);

  const mouthGeometry = track(new THREE.TorusGeometry(0.17, 0.05, 10, 20, Math.PI));
  const smile = new THREE.Mesh(mouthGeometry, darkMaterial);
  smile.position.set(0, 0.24, 0.82);
  smile.rotation.z = Math.PI;
  const frown = new THREE.Mesh(mouthGeometry, darkMaterial);
  frown.position.set(0, 0.02, 0.82);
  frown.visible = false;
  hero.add(smile, frown);

  hero.position.y = HERO_BASE_Y;
  scene.add(hero);

  const timer = new THREE.Timer();
  let mood: QuizCubeMood = "neutral";
  let shakeStart = -10;
  let targetRotationY = 0;
  let celebrateSpin = 0;
  let activeAnim: SplitAnim | HappyAnim | null = null;
  let confetti: {
    mesh: THREE.InstancedMesh;
    geometry: THREE.BoxGeometry;
    material: THREE.MeshBasicMaterial;
    positions: THREE.Vector3[];
    velocities: THREE.Vector3[];
    rotations: THREE.Euler[];
    spins: THREE.Vector3[];
    start: number;
  } | null = null;
  const dummy = new THREE.Object3D();

  function removeConfetti() {
    if (!confetti) {
      return;
    }

    scene.remove(confetti.mesh);
    confetti.geometry.dispose();
    confetti.material.dispose();
    confetti = null;
  }

  function spawnConfetti() {
    removeConfetti();

    const count = 120;
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.02);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const positions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];
    const rotations: THREE.Euler[] = [];
    const spins: THREE.Vector3[] = [];
    const color = new THREE.Color();

    for (let index = 0; index < count; index += 1) {
      positions.push(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.6, (Math.random() - 0.5) * 0.6));
      velocities.push(
        new THREE.Vector3((Math.random() - 0.5) * 4.5, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 4.5),
      );
      rotations.push(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0));
      spins.push(
        new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
      );
      mesh.setColorAt(index, color.set(confettiColors[index % confettiColors.length]));
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    scene.add(mesh);
    confetti = {
      mesh,
      geometry,
      material,
      positions,
      velocities,
      rotations,
      spins,
      start: timer.getElapsed(),
    };
  }

  function resetBodyColor() {
    bodySideMaterial.color.copy(heroPink);
    bodyFrontMaterial.color.copy(plainWhite);
  }

  function finishActiveAnim() {
    if (!activeAnim) {
      return;
    }

    activeAnim.cleanup();
    activeAnim = null;
    onAnimEnd();
  }

  function updateSplitAnim(anim: SplitAnim, time: number) {
    const elapsed = time - anim.start;

    if (elapsed >= SPLIT_TOTAL) {
      finishActiveAnim();
      return;
    }

    let spread = 0;
    let redness = 0;
    let jitter = 0;

    if (elapsed < SPLIT_SEPARATE) {
      spread = easeOutCubic(elapsed / SPLIT_SEPARATE);
    } else if (elapsed < SPLIT_SEPARATE + SPLIT_REDDEN) {
      spread = 1;
      redness = (elapsed - SPLIT_SEPARATE) / SPLIT_REDDEN;
    } else if (elapsed < SPLIT_SEPARATE + SPLIT_REDDEN + SPLIT_SHAKE) {
      spread = 1;
      redness = 1;
      jitter = Math.sin(elapsed * 40) * 0.06;
    } else {
      const progress = (elapsed - SPLIT_SEPARATE - SPLIT_REDDEN - SPLIT_SHAKE) / SPLIT_MERGE;
      spread = 1 - easeOutCubic(progress);
      redness = 1 - progress;
    }

    anim.slices.forEach((slice, index) => {
      slice.mesh.position.x = slice.baseX * (1 + 1.6 * spread) + jitter * (index % 2 === 0 ? 1 : -1);
      slice.material.color.lerpColors(heroPink, failRed, redness);
    });
    anim.labels.forEach((label, index) => {
      label.sprite.position.x = anim.slices[index].mesh.position.x;
      label.material.opacity = redness;
    });
  }

  function updateHappyAnim(anim: HappyAnim, time: number) {
    const elapsed = time - anim.start;

    if (elapsed >= HAPPY_TOTAL) {
      finishActiveAnim();
      return null;
    }

    const pulse = Math.sin((Math.PI * elapsed) / HAPPY_TOTAL);
    bodySideMaterial.color.lerpColors(heroPink, happyGreen, pulse * 0.65);
    bodyFrontMaterial.color.lerpColors(plainWhite, happyGreen, pulse * 0.4);
    anim.ring.scale.setScalar(0.6 + elapsed * 2);
    anim.ringMaterial.opacity = Math.max(0, 0.85 * (1 - elapsed / HAPPY_TOTAL));

    return HERO_BASE_Y + Math.abs(Math.sin(elapsed * Math.PI * 2.2)) * 0.45 * (1 - elapsed / HAPPY_TOTAL);
  }

  function updateConfetti(time: number, delta: number) {
    if (!confetti) {
      return;
    }

    const life = time - confetti.start;

    if (life > CONFETTI_LIFE) {
      removeConfetti();
      return;
    }

    const scale = life > CONFETTI_LIFE - 0.7 ? Math.max(0.001, (CONFETTI_LIFE - life) / 0.7) : 1;

    confetti.positions.forEach((position, index) => {
      const velocity = confetti!.velocities[index];
      velocity.y -= 6 * delta;
      position.addScaledVector(velocity, delta);

      const rotation = confetti!.rotations[index];
      const spin = confetti!.spins[index];
      rotation.x += spin.x * delta;
      rotation.y += spin.y * delta;
      rotation.z += spin.z * delta;

      dummy.position.copy(position);
      dummy.rotation.copy(rotation);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      confetti!.mesh.setMatrixAt(index, dummy.matrix);
    });
    confetti.mesh.instanceMatrix.needsUpdate = true;
  }

  let rafId = 0;

  function tick() {
    rafId = requestAnimationFrame(tick);

    timer.update();
    const time = timer.getElapsed();
    const delta = Math.min(timer.getDelta(), 0.05);

    let heroY = HERO_BASE_Y + Math.sin(time * 2.2) * 0.05;
    let sway = Math.sin(time * 0.8) * 0.06;

    if (mood === "correct") {
      celebrateSpin += delta * 2;
      heroY = HERO_BASE_Y + Math.abs(Math.sin(time * 5)) * 0.4;
      sway = celebrateSpin;
    }

    let heroX = 0;
    const sinceShake = time - shakeStart;

    if (sinceShake < 0.6) {
      heroX = Math.sin(sinceShake * 42) * 0.12 * (1 - sinceShake / 0.6);
    }

    if (activeAnim?.kind === "split") {
      hero.visible = false;
      updateSplitAnim(activeAnim, time);
    } else {
      hero.visible = true;
    }

    if (activeAnim?.kind === "happy") {
      const happyY = updateHappyAnim(activeAnim, time);

      if (happyY !== null) {
        heroY = happyY;
      }
    }

    hero.position.set(heroX, heroY, 0);
    hero.rotation.y = targetRotationY + sway;

    updateConfetti(time, delta);
    renderer.render(scene, camera);
  }

  function testDivisor(divisor: number): boolean {
    if (activeAnim) {
      return false;
    }

    const start = timer.getElapsed();

    if (divisor === 1) {
      const ringGeometry = new THREE.TorusGeometry(1, 0.06, 10, 40);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: happyGreen,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = STAGE_TOP_Y + 0.05;
      scene.add(ring);

      activeAnim = {
        kind: "happy",
        start,
        ring,
        ringMaterial,
        cleanup() {
          scene.remove(ring);
          ringGeometry.dispose();
          ringMaterial.dispose();
          resetBodyColor();
        },
      };
      return true;
    }

    const group = new THREE.Group();
    const sliceWidth = CUBE_SIZE / divisor;
    const sliceGeometry = new THREE.BoxGeometry(sliceWidth * 0.94, CUBE_SIZE, CUBE_SIZE);
    const labelTexture = createLabelTexture(divisor === 2 ? "½" : divisor === 3 ? "⅓" : `1/${divisor}`);
    const slices: SplitAnim["slices"] = [];
    const labels: SplitAnim["labels"] = [];

    for (let index = 0; index < divisor; index += 1) {
      const material = new THREE.MeshStandardMaterial({ color: heroPink });
      const mesh = new THREE.Mesh(sliceGeometry, material);
      mesh.castShadow = true;
      const baseX = -CUBE_SIZE / 2 + sliceWidth / 2 + index * sliceWidth;
      mesh.position.set(baseX, HERO_BASE_Y, 0);
      slices.push({ mesh, material, baseX });
      group.add(mesh);

      const labelMaterial = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(labelMaterial);
      sprite.scale.set(0.85, 0.47, 1);
      sprite.position.set(baseX, 1.15, 0.4);
      labels.push({ sprite, material: labelMaterial });
      group.add(sprite);
    }

    scene.add(group);
    activeAnim = {
      kind: "split",
      start,
      slices,
      labels,
      cleanup() {
        scene.remove(group);
        sliceGeometry.dispose();
        labelTexture.dispose();
        slices.forEach((slice) => slice.material.dispose());
        labels.forEach((label) => label.material.dispose());
      },
    };
    return true;
  }

  function setMood(nextMood: QuizCubeMood) {
    if (nextMood === mood) {
      return;
    }

    mood = nextMood;
    smile.visible = nextMood !== "wrong";
    frown.visible = nextMood === "wrong";

    if (nextMood === "wrong") {
      shakeStart = timer.getElapsed();
    }

    if (nextMood === "correct") {
      spawnConfetti();
    }

    if (nextMood === "neutral") {
      resetBodyColor();
    }
  }

  let dragging = false;
  let lastPointerX = 0;

  function handlePointerDown(event: globalThis.PointerEvent) {
    dragging = true;
    lastPointerX = event.clientX;
    renderer.domElement.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: globalThis.PointerEvent) {
    if (!dragging) {
      return;
    }

    targetRotationY += (event.clientX - lastPointerX) * 0.012;
    lastPointerX = event.clientX;
  }

  function handlePointerUp() {
    dragging = false;
  }

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("pointercancel", handlePointerUp);

  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) {
      return;
    }

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);

  tick();

  return {
    testDivisor,
    setMood,
    dispose() {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);

      if (activeAnim) {
        activeAnim.cleanup();
        activeAnim = null;
      }

      removeConfetti();
      disposables.forEach((resource) => resource.dispose());
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}

const divisorButtons = [
  { divisor: 1, color: "bg-[#39b567]", shadow: "shadow-[0_5px_0_#257a45]" },
  { divisor: 2, color: "bg-[#4f8df7]", shadow: "shadow-[0_5px_0_#2f5fb7]" },
  { divisor: 3, color: "bg-[#ffb23f] text-[#3d285f]", shadow: "shadow-[0_5px_0_#b97718]" },
];

const divisorFeedback: Record<number, { outcome: DivisorOutcome; text: string }> = {
  1: { outcome: "found", text: "1 ÷ 1 = 1 ✓ 딱 떨어져요! 1은 1의 약수예요." },
  2: {
    outcome: "not",
    text: "1을 2조각으로 나누면 ½조각이 되어버려요. 2는 1의 약수가 아니에요!",
  },
  3: {
    outcome: "not",
    text: "1을 3조각으로 나누면 ⅓조각이 되어버려요. 3도 1의 약수가 아니에요!",
  },
};

export default function OneIsPrimeQuiz3D({ mood }: { mood: QuizCubeMood }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [tested, setTested] = useState<Record<number, DivisorOutcome>>({});
  const [feedback, setFeedback] = useState<{ outcome: DivisorOutcome; text: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const handle = createScene(mount, () => setIsBusy(false));
    handleRef.current = handle;

    return () => {
      handleRef.current = null;
      handle.dispose();
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setMood(mood);
  }, [mood]);

  function runDivisorTest(divisor: number) {
    if (isBusy || !handleRef.current?.testDivisor(divisor)) {
      return;
    }

    const result = divisorFeedback[divisor];
    setIsBusy(true);
    setFeedback(result);
    setTested((current) => ({ ...current, [divisor]: result.outcome }));
  }

  const foundCount = Object.values(tested).filter((outcome) => outcome === "found").length;

  return (
    <div className="w-full max-w-3xl">
      <div className="relative h-64 overflow-hidden rounded-[24px] border-4 border-white bg-gradient-to-b from-[#efe8ff] to-[#fdf3ff] shadow-[0_6px_0_#ded9ec] sm:h-80">
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#9f70eb] px-4 py-1.5 text-sm font-black text-white">
          약수 실험실
        </span>
        <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/85 px-4 py-1.5 text-xs font-black text-[#7c5cd6]">
          드래그해서 돌려보세요
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm font-black text-[#6f4ab4]">1을 나눠보기:</span>
        {divisorButtons.map((button) => {
          const outcome = tested[button.divisor];

          return (
            <button
              key={button.divisor}
              type="button"
              onClick={() => runDivisorTest(button.divisor)}
              disabled={isBusy}
              className={`rounded-full px-6 py-2.5 text-xl font-black text-white transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-105 enabled:active:translate-y-0 disabled:opacity-60 ${button.color} ${button.shadow}`}
            >
              ÷ {button.divisor}
              {outcome === "found" && " ✓"}
              {outcome === "not" && " ✗"}
            </button>
          );
        })}
        <span className="rounded-full bg-white px-5 py-2.5 text-base font-black text-[#3d285f] shadow-[0_4px_0_#ded9ec]">
          찾은 약수 {foundCount}개
        </span>
      </div>
      {feedback && (
        <p
          className={`mt-4 text-center text-lg font-black leading-snug ${
            feedback.outcome === "found" ? "text-[#2e9155]" : "text-[#d5486d]"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
