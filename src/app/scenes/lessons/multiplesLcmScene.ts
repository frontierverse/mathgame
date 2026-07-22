import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

const FOUR_COLOR = 0x53aebb;
const SIX_COLOR = 0x9b84d9;
const COMMON_COLOR = 0xd3a94e;
const TEXT_COLOR = "#665c6f";
const BEAT_DURATION = 5;
const TOTAL_DURATION = BEAT_DURATION * 3;

type AnimatedTile = {
  group: THREE.Group;
  materials: THREE.Material[];
};

type CommonMarker = {
  group: THREE.Group;
  materials: THREE.Material[];
};

type GroupedDot = {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
};

export function buildMultiplesLcmScene({ contentGroup }: LessonSceneContext): LessonScene {
  const multiplesBeat = new THREE.Group();
  const commonBeat = new THREE.Group();
  const lcmBeat = new THREE.Group();
  contentGroup.add(multiplesBeat, commonBeat, lcmBeat);

  const multiplesLabel = createLabelPlane("배수", "#318696", "#e7f8fa");
  multiplesLabel.position.set(0, 2.25, 0.3);
  multiplesBeat.add(multiplesLabel);

  const multipleTiles: AnimatedTile[] = [];
  for (let index = 0; index < 9; index += 1) {
    const tile = new THREE.Group();
    const column = index % 3;
    const row = Math.floor(index / 3);
    tile.position.set((column - 1) * 1.45, 1.05 - row * 1.18, 0.3);
    tile.add(createNumberChip(String((index + 1) * 4), "#318696", "#e7f8fa"));
    multiplesBeat.add(tile);
    multipleTiles.push({ group: tile, materials: collectMaterials(tile) });
  }

  const commonLabel = createLabelPlane("공배수", "#9a6b20", "#fff7df");
  commonLabel.position.set(0, 2.25, 0.3);
  commonBeat.add(commonLabel);

  const trackStart = -2.6;
  const trackEnd = 2.6;
  const trackWidth = trackEnd - trackStart;
  const fourY = 0.65;
  const sixY = -0.55;
  const valueToX = (value: number) => trackStart + (value / 36) * trackWidth;

  const fourTrack = createBar(trackWidth, 0.045, FOUR_COLOR, 0.34);
  fourTrack.position.set((trackStart + trackEnd) / 2, fourY, 0);
  const sixTrack = createBar(trackWidth, 0.045, SIX_COLOR, 0.34);
  sixTrack.position.set((trackStart + trackEnd) / 2, sixY, 0);
  commonBeat.add(fourTrack, sixTrack);

  const fourTrackLabel = createCompactTextPlane("4×", "#318696", 128, 0.8, 0.65);
  fourTrackLabel.position.set(-3.05, fourY, 0.3);
  const sixTrackLabel = createCompactTextPlane("6×", "#7258b1", 128, 0.8, 0.65);
  sixTrackLabel.position.set(-3.05, sixY, 0.3);
  commonBeat.add(fourTrackLabel, sixTrackLabel);

  for (let value = 4; value <= 36; value += 4) {
    const dot = createDot(FOUR_COLOR, 0.115, 0.9);
    dot.position.set(valueToX(value), fourY, 0.12);
    commonBeat.add(dot);
  }
  for (let value = 6; value <= 36; value += 6) {
    const dot = createDot(SIX_COLOR, 0.115, 0.9);
    dot.position.set(valueToX(value), sixY, 0.12);
    commonBeat.add(dot);
  }

  const commonMarkers: CommonMarker[] = [12, 24, 36].map((value) => {
    const marker = new THREE.Group();
    marker.position.x = valueToX(value);

    const connector = createBar(0.035, fourY - sixY, COMMON_COLOR, 0.72);
    connector.position.set(0, (fourY + sixY) / 2, 0.08);
    const topRing = createRing(COMMON_COLOR);
    topRing.position.set(0, fourY, 0.2);
    const bottomRing = createRing(COMMON_COLOR);
    bottomRing.position.set(0, sixY, 0.2);
    const valueLabel = createCompactTextPlane(String(value), "#b37c25", 128, 0.82, 0.65);
    valueLabel.position.set(0, -1.45, 0.3);
    marker.add(connector, topRing, bottomRing, valueLabel);
    commonBeat.add(marker);

    return { group: marker, materials: collectMaterials(marker) };
  });

  const lcmLabel = createLabelPlane("최소공배수", "#9a6b20", "#fff7df", 2.15);
  lcmLabel.position.set(0, 2.35, 0.3);
  const lcmValue = createCompactTextPlane("12", "#b37c25", 184, 1.35, 0.95);
  lcmValue.position.set(0, 1.45, 0.3);
  lcmBeat.add(lcmLabel, lcmValue);

  const fourEquation = createTextPlane("4×3 = 12", "#318696", 106, 3.2, 0.7);
  fourEquation.position.set(0, 0.72, 0.3);
  const sixEquation = createTextPlane("6×2 = 12", "#7258b1", 106, 3.2, 0.7);
  sixEquation.position.set(0, -0.92, 0.3);
  lcmBeat.add(fourEquation, sixEquation);

  const fourGroupedDots = createGroupedDotRow(4, 3, 0.3, 0.46, 0.15, FOUR_COLOR);
  const sixGroupedDots = createGroupedDotRow(6, 2, 0.3, 0.56, -1.72, SIX_COLOR);
  fourGroupedDots.dots.forEach(({ mesh }) => lcmBeat.add(mesh));
  sixGroupedDots.dots.forEach(({ mesh }) => lcmBeat.add(mesh));

  const groupingFrames: THREE.Mesh[] = [];
  fourGroupedDots.centers.forEach((center) => {
    const frame = createOutlinePlane(1.52, 0.66, "#53aebb", "rgba(83, 174, 187, 0.08)");
    frame.position.set(center, 0.15, -0.03);
    lcmBeat.add(frame);
    groupingFrames.push(frame);
  });
  sixGroupedDots.centers.forEach((center) => {
    const frame = createOutlinePlane(2.08, 0.66, "#9b84d9", "rgba(155, 132, 217, 0.08)");
    frame.position.set(center, -1.72, -0.03);
    lcmBeat.add(frame);
    groupingFrames.push(frame);
  });

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 5.8, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.1, -0.5);
  contentGroup.add(layoutBounds);

  const multiplesMaterials = collectMaterials(multiplesBeat);
  const commonMaterials = collectMaterials(commonBeat);
  const lcmMaterials = collectMaterials(lcmBeat);
  const fourEquationMaterials = collectMaterials(fourEquation);
  const sixEquationMaterials = collectMaterials(sixEquation);
  const groupingFrameMaterials = groupingFrames.flatMap((frame) => collectMaterials(frame));

  return {
    animate(elapsed) {
      const time = elapsed % TOTAL_DURATION;
      const multiplesOpacity = getBeatOpacity(time, 0);
      const commonOpacity = getBeatOpacity(time, 1);
      const lcmOpacity = getBeatOpacity(time, 2);

      setMaterialsOpacity(multiplesMaterials, multiplesOpacity);
      multiplesBeat.visible = multiplesOpacity > 0.001;
      const multiplesLocal = getBeatLocalTime(time, 0);
      multipleTiles.forEach(({ group, materials }, index) => {
        const reveal = smoothstep((multiplesLocal - 0.45 - index * 0.34) / 0.28);
        setMaterialsOpacity(materials, multiplesOpacity * reveal);
        const scale = 0.82 + reveal * 0.18;
        group.scale.setScalar(scale);
      });

      setMaterialsOpacity(commonMaterials, commonOpacity);
      commonBeat.visible = commonOpacity > 0.001;
      const commonLocal = getBeatLocalTime(time, 1);
      commonMarkers.forEach(({ group, materials }, index) => {
        const reveal = smoothstep((commonLocal - 0.65 - index * 0.72) / 0.38);
        setMaterialsOpacity(materials, commonOpacity * reveal);
        const pulse = reveal * (1 + Math.sin(elapsed * 4.2 + index) * 0.035);
        group.scale.setScalar(0.84 + pulse * 0.16);
      });

      setMaterialsOpacity(lcmMaterials, lcmOpacity);
      lcmBeat.visible = lcmOpacity > 0.001;
      const lcmLocal = getBeatLocalTime(time, 2);
      const grouping = smoothstep((lcmLocal - 0.9) / 0.9);
      [...fourGroupedDots.dots, ...sixGroupedDots.dots].forEach(({ mesh, start, end }) => {
        mesh.position.lerpVectors(start, end, grouping);
      });
      setMaterialsOpacity(groupingFrameMaterials, lcmOpacity * grouping);
      const formulaReveal = smoothstep((lcmLocal - 1.45) / 0.5);
      setMaterialsOpacity(fourEquationMaterials, lcmOpacity * formulaReveal);
      setMaterialsOpacity(sixEquationMaterials, lcmOpacity * formulaReveal);
      lcmValue.scale.setScalar(1 + grouping * Math.sin(elapsed * 2.5) * 0.025);
    },
  };
}

function createGroupedDotRow(
  groupSize: number,
  groupCount: number,
  spacing: number,
  gap: number,
  y: number,
  color: number,
) {
  const count = groupSize * groupCount;
  const continuousSpacing = 0.34;
  const groupedWidth = (count - 1) * spacing + (groupCount - 1) * gap;
  const dots: GroupedDot[] = [];

  for (let index = 0; index < count; index += 1) {
    const mesh = createDot(color, 0.135);
    const start = new THREE.Vector3((index - (count - 1) / 2) * continuousSpacing, y, 0.12);
    const end = new THREE.Vector3(
      -groupedWidth / 2 + index * spacing + Math.floor(index / groupSize) * gap,
      y,
      0.12,
    );
    mesh.position.copy(start);
    dots.push({ mesh, start, end });
  }

  const centers = Array.from({ length: groupCount }, (_, groupIndex) => {
    const first = dots[groupIndex * groupSize].end.x;
    const last = dots[groupIndex * groupSize + groupSize - 1].end.x;
    return (first + last) / 2;
  });

  return { dots, centers };
}

function createDot(color: number, radius: number, opacity = 1) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 24),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.05,
      emissive: color,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity,
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

function createRing(color: number) {
  return new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.225, 40),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
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
    context.font = '900 96px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
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

function createNumberChip(text: string, color: string, background: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    context.beginPath();
    context.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 54);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 7;
    context.stroke();
    context.fillStyle = color;
    context.font = '900 126px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.04, 0.72),
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
    context.fillStyle = color || TEXT_COLOR;
    context.font = `800 ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
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

function createCompactTextPlane(
  text: string,
  color: string,
  fontSize: number,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font =
      `900 ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  }

  const texture = createCanvasTexture(canvas);
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}

function createOutlinePlane(
  width: number,
  height: number,
  stroke: string,
  fill: string,
) {
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
      if (material.userData.multiplesLcmBaseOpacity === undefined) {
        material.userData.multiplesLcmBaseOpacity = material.opacity;
      }
      materials.add(material);
    });
  });
  return Array.from(materials);
}

function setMaterialsOpacity(materials: THREE.Material[], opacity: number) {
  materials.forEach((material) => {
    const baseOpacity = material.userData.multiplesLcmBaseOpacity as number | undefined;
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
