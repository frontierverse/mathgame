import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

const TWELVE_COLOR = 0x53aebb;
const EIGHTEEN_COLOR = 0x9b84d9;
const COMMON_COLOR = 0x68b58d;
const BEAT_DURATION = 5.2;
const TOTAL_DURATION = BEAT_DURATION * 3;

type FadingObject = {
  group: THREE.Object3D;
  materials: THREE.Material[];
};

type DivisorChip = FadingObject & {
  discoveredAt: number;
};

type CommonChip = FadingObject & {
  common: boolean;
};

type GroupedDot = {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
};

export function buildDivisorsGcdScene({
  contentGroup,
}: LessonSceneContext): LessonScene {
  const divisorsBeat = new THREE.Group();
  const commonBeat = new THREE.Group();
  const gcdBeat = new THREE.Group();
  contentGroup.add(divisorsBeat, commonBeat, gcdBeat);

  const divisorsLabel = createLabelPlane("약수", "#318696", "#e7f8fa");
  divisorsLabel.position.set(0, 2.3, 0.3);
  divisorsBeat.add(divisorsLabel);

  const divisorLayouts = [
    createGridPositions(12, 1, 12, 0.5, 0.58),
    createGridPositions(12, 2, 6, 0.5, 0.58),
    createGridPositions(12, 3, 4, 0.5, 0.58),
  ];
  const divisorDots = Array.from({ length: 12 }, (_, index) => {
    const dot = createDot(TWELVE_COLOR, 0.19);
    dot.position.copy(divisorLayouts[0][index]);
    divisorsBeat.add(dot);
    return dot;
  });

  const divisorEquations = ["12 = 1×12", "12 = 2×6", "12 = 3×4"].map(
    (text) => {
      const equation = createTextPlane(text, "#4a8790", 108, 3.6, 0.76);
      equation.position.set(0, -0.95, 0.3);
      divisorsBeat.add(equation);
      return { group: equation, materials: collectMaterials(equation) };
    },
  );

  const divisorDiscovery = new Map<number, number>([
    [1, 0],
    [12, 0],
    [2, 1],
    [6, 1],
    [3, 2],
    [4, 2],
  ]);
  const divisorChips: DivisorChip[] = [1, 2, 3, 4, 6, 12].map((value, index) => {
    const chip = new THREE.Group();
    chip.position.set((index - 2.5) * 0.86, -1.82, 0.3);
    chip.add(createNumberChip(String(value), "#377f5b", "#edf8f0"));
    divisorsBeat.add(chip);
    return {
      group: chip,
      materials: collectMaterials(chip),
      discoveredAt: divisorDiscovery.get(value) ?? 0,
    };
  });

  const commonLabel = createLabelPlane("공약수", "#377f5b", "#edf8f0", 1.72);
  commonLabel.position.set(0, 2.3, 0.3);
  commonBeat.add(commonLabel);

  const twelveLabel = createGlyphPlane("12", "#53aebb", 0.58);
  twelveLabel.position.set(-3.15, 0.62, 0.3);
  const eighteenLabel = createGlyphPlane("18", "#9b84d9", 0.58);
  eighteenLabel.position.set(-3.15, -0.62, 0.3);
  commonBeat.add(twelveLabel, eighteenLabel);

  const alignedXs = [-1.45, -0.48, 0.48, 1.45];
  const rowDefinitions = [
    {
      y: 0.62,
      values: [4, 1, 2, 3, 6, 12],
      xs: [-2.45, ...alignedXs, 2.45],
      color: "#318696",
      background: "#e7f8fa",
    },
    {
      y: -0.62,
      values: [9, 1, 2, 3, 6, 18],
      xs: [-2.45, ...alignedXs, 2.45],
      color: "#7258b1",
      background: "#f1edff",
    },
  ];
  const commonValues = new Set([1, 2, 3, 6]);
  const commonChips: CommonChip[] = [];
  rowDefinitions.forEach(({ y, values, xs, color, background }) => {
    values.forEach((value, index) => {
      const common = commonValues.has(value);
      const chip = new THREE.Group();
      chip.position.set(xs[index], y, 0.3);
      chip.add(
        createNumberChip(
          String(value),
          common ? "#377f5b" : color,
          common ? "#edf8f0" : background,
          0.68,
        ),
      );
      commonBeat.add(chip);
      commonChips.push({ group: chip, materials: collectMaterials(chip), common });
    });
  });

  const commonConnectors = alignedXs.map((x) => {
    const connector = createBar(0.04, 0.72, COMMON_COLOR, 0.72);
    connector.position.set(x, 0, 0.06);
    commonBeat.add(connector);
    return { group: connector, materials: collectMaterials(connector) };
  });
  const commonResult = createTextPlane(
    "1 · 2 · 3 · 6",
    "#55a878",
    118,
    4.5,
    0.8,
  );
  commonResult.position.set(0, -1.68, 0.3);
  commonBeat.add(commonResult);
  const commonResultMaterials = collectMaterials(commonResult);

  const gcdLabel = createLabelPlane(
    "최대공약수",
    "#9a6b20",
    "#fff7df",
    2.15,
  );
  gcdLabel.position.set(0, 2.35, 0.3);
  const gcdValue = createGlyphPlane("6", "#b37c25", 0.72);
  gcdValue.position.set(0, 1.63, 0.3);
  gcdBeat.add(gcdLabel, gcdValue);

  const twelveEquation = createTextPlane("12 = 6×2", "#318696", 102, 3, 0.68);
  twelveEquation.position.set(0, 0.98, 0.3);
  const eighteenEquation = createTextPlane("18 = 6×3", "#7258b1", 102, 3, 0.68);
  eighteenEquation.position.set(0, -0.52, 0.3);
  gcdBeat.add(twelveEquation, eighteenEquation);

  const twelveGroups = createSixDotGroups(12, 2, 0.34, TWELVE_COLOR);
  const eighteenGroups = createSixDotGroups(18, 3, -1.16, EIGHTEEN_COLOR);
  [...twelveGroups.dots, ...eighteenGroups.dots].forEach(({ mesh }) =>
    gcdBeat.add(mesh),
  );

  const gcdFrames: THREE.Mesh[] = [];
  twelveGroups.centers.forEach((center) => {
    const frame = createOutlinePlane(1.12, 0.78, "#d3a94e", "rgba(211, 169, 78, 0.08)");
    frame.position.set(center, 0.34, -0.03);
    gcdBeat.add(frame);
    gcdFrames.push(frame);
  });
  eighteenGroups.centers.forEach((center) => {
    const frame = createOutlinePlane(1.12, 0.78, "#d3a94e", "rgba(211, 169, 78, 0.08)");
    frame.position.set(center, -1.16, -0.03);
    gcdBeat.add(frame);
    gcdFrames.push(frame);
  });

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 5.8, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.1, -0.5);
  contentGroup.add(layoutBounds);

  const divisorsMaterials = collectMaterials(divisorsBeat);
  const commonMaterials = collectMaterials(commonBeat);
  const gcdMaterials = collectMaterials(gcdBeat);
  const gcdFramesMaterials = gcdFrames.flatMap((frame) => collectMaterials(frame));
  const gcdEquationMaterials = [
    ...collectMaterials(twelveEquation),
    ...collectMaterials(eighteenEquation),
  ];

  return {
    animate(elapsed) {
      const time = elapsed % TOTAL_DURATION;
      const divisorsOpacity = getBeatOpacity(time, 0);
      const commonOpacity = getBeatOpacity(time, 1);
      const gcdOpacity = getBeatOpacity(time, 2);

      setMaterialsOpacity(divisorsMaterials, divisorsOpacity);
      divisorsBeat.visible = divisorsOpacity > 0.001;
      const divisorsLocal = getBeatLocalTime(time, 0);
      const divisorStepDuration = 1.45;
      const divisorStepFloat = Math.max(0, divisorsLocal - 0.35) / divisorStepDuration;
      const divisorStep = Math.min(2, Math.floor(divisorStepFloat));
      const nextDivisorStep = Math.min(2, divisorStep + 1);
      const divisorStepTime = divisorStepFloat - divisorStep;
      const divisorMorph =
        divisorStep < 2 ? smoothstep((divisorStepTime - 0.62) / 0.3) : 0;
      divisorDots.forEach((dot, index) => {
        dot.position.lerpVectors(
          divisorLayouts[divisorStep][index],
          divisorLayouts[nextDivisorStep][index],
          divisorMorph,
        );
      });
      divisorEquations.forEach(({ materials }, index) => {
        const activeStep = divisorMorph < 0.5 ? divisorStep : nextDivisorStep;
        const weight = index === activeStep ? 1 : 0;
        setMaterialsOpacity(materials, divisorsOpacity * weight);
      });
      divisorChips.forEach(({ group, materials, discoveredAt }) => {
        const reveal = smoothstep((divisorStepFloat - discoveredAt + 0.03) / 0.22);
        setMaterialsOpacity(materials, divisorsOpacity * reveal);
        group.scale.setScalar(0.84 + reveal * 0.16);
      });

      setMaterialsOpacity(commonMaterials, commonOpacity);
      commonBeat.visible = commonOpacity > 0.001;
      const commonLocal = getBeatLocalTime(time, 1);
      const comparisonReveal = smoothstep((commonLocal - 0.7) / 0.5);
      const commonFocus = smoothstep((commonLocal - 1.65) / 0.75);
      commonChips.forEach(({ group, materials, common }, index) => {
        const rowReveal = smoothstep((commonLocal - 0.5 - (index >= 6 ? 0.3 : 0)) / 0.45);
        const opacity = common ? rowReveal : rowReveal * (1 - commonFocus * 0.76);
        setMaterialsOpacity(materials, commonOpacity * opacity);
        const pulse = common
          ? commonFocus * (0.06 + Math.sin(elapsed * 3.8 + index) * 0.018)
          : 0;
        group.scale.setScalar(1 + pulse);
      });
      commonConnectors.forEach(({ materials }, index) => {
        const reveal = smoothstep((commonLocal - 1.75 - index * 0.14) / 0.32);
        setMaterialsOpacity(
          materials,
          commonOpacity * comparisonReveal * commonFocus * reveal,
        );
      });
      const resultReveal = smoothstep((commonLocal - 2.45) / 0.5);
      setMaterialsOpacity(commonResultMaterials, commonOpacity * resultReveal);

      setMaterialsOpacity(gcdMaterials, gcdOpacity);
      gcdBeat.visible = gcdOpacity > 0.001;
      const gcdLocal = getBeatLocalTime(time, 2);
      const grouping = smoothstep((gcdLocal - 0.85) / 0.95);
      [...twelveGroups.dots, ...eighteenGroups.dots].forEach(({ mesh, start, end }) => {
        mesh.position.lerpVectors(start, end, grouping);
      });
      setMaterialsOpacity(gcdFramesMaterials, gcdOpacity * grouping);
      const equationReveal = smoothstep((gcdLocal - 1.35) / 0.5);
      setMaterialsOpacity(gcdEquationMaterials, gcdOpacity * equationReveal);
      gcdValue.scale.setScalar(1 + grouping * Math.sin(elapsed * 2.6) * 0.025);
    },
  };
}

function createGridPositions(
  count: number,
  rows: number,
  columns: number,
  centerY: number,
  spacing: number,
) {
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return new THREE.Vector3(
      (column - (columns - 1) / 2) * spacing,
      centerY + ((rows - 1) / 2 - row) * spacing,
      0,
    );
  });
}

function createSixDotGroups(total: number, groupCount: number, y: number, color: number) {
  const groupGap = 1.34;
  const dotSpacing = 0.34;
  const dots: GroupedDot[] = [];
  const centers = Array.from(
    { length: groupCount },
    (_, groupIndex) => (groupIndex - (groupCount - 1) / 2) * groupGap,
  );

  for (let index = 0; index < total; index += 1) {
    const mesh = createDot(color, 0.135);
    const groupIndex = Math.floor(index / 6);
    const localIndex = index % 6;
    const column = localIndex % 3;
    const row = Math.floor(localIndex / 3);
    const start = new THREE.Vector3((index - (total - 1) / 2) * 0.28, y, 0.12);
    const end = new THREE.Vector3(
      centers[groupIndex] + (column - 1) * dotSpacing,
      y + (0.5 - row) * dotSpacing,
      0.12,
    );
    mesh.position.copy(start);
    dots.push({ mesh, start, end });
  }

  return { dots, centers };
}

function createDot(color: number, radius: number) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 24),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.05,
      emissive: color,
      emissiveIntensity: 0.12,
      transparent: true,
      depthWrite: false,
    }),
  );
}

function createBar(width: number, height: number, color: number, opacity: number) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.025),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
}

function createLabelPlane(
  text: string,
  color: string,
  background: string,
  width = 1.45,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 220;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    context.beginPath();
    context.roundRect(18, 18, canvas.width - 36, canvas.height - 36, 72);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = color;
    context.font =
      '900 96px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, 0.64),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}

function createNumberChip(
  text: string,
  color: string,
  background: string,
  width = 0.72,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    context.beginPath();
    context.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 58);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 7;
    context.stroke();
    context.fillStyle = color;
    context.font =
      '900 126px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, 0.62),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
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
    context.font =
      `800 ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}

function createGlyphPlane(text: string, color: string, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font =
      '900 190px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}

function createOutlinePlane(width: number, height: number, stroke: string, fill: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 260;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = 9;
    context.beginPath();
    context.roundRect(18, 18, canvas.width - 36, canvas.height - 36, 64);
    context.fill();
    context.stroke();
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
}

function createCanvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function collectMaterials(object: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    childMaterials.forEach((material) => {
      if (material.userData.divisorsGcdBaseOpacity === undefined) {
        material.userData.divisorsGcdBaseOpacity = material.opacity;
      }
      materials.add(material);
    });
  });
  return Array.from(materials);
}

function setMaterialsOpacity(materials: THREE.Material[], opacity: number) {
  materials.forEach((material) => {
    const baseOpacity = material.userData.divisorsGcdBaseOpacity as number | undefined;
    material.transparent = true;
    material.opacity = (baseOpacity ?? 1) * opacity;
  });
}

function getBeatOpacity(time: number, beatIndex: number) {
  const local = getBeatLocalTime(time, beatIndex);
  if (local < 0 || local >= BEAT_DURATION) return 0;
  const fadeDuration = 0.55;
  if (local < fadeDuration) return smoothstep(local / fadeDuration);
  if (local > BEAT_DURATION - fadeDuration) {
    return 1 - smoothstep((local - (BEAT_DURATION - fadeDuration)) / fadeDuration);
  }
  return 1;
}

function getBeatLocalTime(time: number, beatIndex: number) {
  return time - beatIndex * BEAT_DURATION;
}

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}
