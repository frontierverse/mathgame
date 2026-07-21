import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

const PRIME_COLOR = 0x53aebb;
const COMPOSITE_COLOR = 0x9b84d9;
const BASE_DOT_COLOR = 0xd3a94e;
const FAIL_COLOR = 0xd9534f;

export function buildPrimesCompositesScene({
  contentGroup,
  primesStage,
}: LessonSceneContext): LessonScene {
  if (primesStage === 1) return buildDivisorScene(contentGroup);
  if (primesStage === 2) return buildFactorizationScene(contentGroup);
  return buildPrimeVsCompositeScene(contentGroup);
}

function buildPrimeVsCompositeScene(contentGroup: THREE.Group): LessonScene {
  const leftCenter = new THREE.Vector3(-2.85, 0.35, 0);
  const rightCenter = new THREE.Vector3(2.45, 0.35, 0);

  const primeGroup = new THREE.Group();
  primeGroup.position.copy(leftCenter);
  const primeDots: THREE.Mesh[] = [];
  for (let index = 0; index < 7; index += 1) {
    const dot = createDot(PRIME_COLOR);
    primeDots.push(dot);
    primeGroup.add(dot);
  }
  contentGroup.add(primeGroup);

  const primeRowLayout = primeDots.map(
    (_, index) => new THREE.Vector3((index - 3) * 0.55, 0, 0),
  );
  const primeGridLayout = primeDots.map((_, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    return new THREE.Vector3((column - 1.5) * 0.58, (0.5 - row) * 0.62, 0);
  });
  primeDots.forEach((dot, index) => dot.position.copy(primeRowLayout[index]));

  const missingCell = new THREE.Vector3((3 - 1.5) * 0.58, (0.5 - 1) * 0.62, 0);
  const ghostRing = new THREE.Mesh(
    new THREE.RingGeometry(0.17, 0.23, 40),
    new THREE.MeshBasicMaterial({
      color: FAIL_COLOR,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ghostRing.position.copy(missingCell);
  const missingMark = createGlyphPlane("✕", "#d9534f", 0.42);
  (missingMark.material as THREE.MeshBasicMaterial).opacity = 0;
  missingMark.position.copy(missingCell).setZ(0.03);
  primeGroup.add(ghostRing, missingMark);

  const primeChip = createLabelPlane("소수", "#318696", "#e7f8fa");
  primeChip.position.set(leftCenter.x, 2.05, 0.3);
  const compositeChip = createLabelPlane("합성수", "#7258b1", "#f1edff");
  compositeChip.position.set(rightCenter.x, 2.05, 0.3);
  contentGroup.add(primeChip, compositeChip);

  const primeEquation = createTextPlane("7 = 1×7", "#3f9aab", 112, 2.8, 0.9);
  primeEquation.position.set(leftCenter.x, -1.4, 0.3);
  contentGroup.add(primeEquation);

  const compositeGroup = new THREE.Group();
  compositeGroup.position.copy(rightCenter);
  const compositeDots: THREE.Mesh[] = [];
  for (let index = 0; index < 12; index += 1) {
    const dot = createDot(COMPOSITE_COLOR);
    compositeDots.push(dot);
    compositeGroup.add(dot);
  }
  contentGroup.add(compositeGroup);

  const compositeLayouts = [
    compositeDots.map((_, index) => new THREE.Vector3((index - 5.5) * 0.42, 0, 0)),
    compositeDots.map((_, index) => {
      const column = index % 6;
      const row = Math.floor(index / 6);
      return new THREE.Vector3((column - 2.5) * 0.55, (0.5 - row) * 0.6, 0);
    }),
    compositeDots.map((_, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      return new THREE.Vector3((column - 1.5) * 0.58, (1 - row) * 0.62, 0);
    }),
  ];
  compositeDots.forEach((dot, index) => dot.position.copy(compositeLayouts[0][index]));

  const compositeEquations = [
    createTextPlane("12 = 1×12", "#8a71c4", 112, 3.2, 0.9),
    createTextPlane("12 = 2×6", "#8a71c4", 112, 3.2, 0.9),
    createTextPlane("12 = 3×4", "#8a71c4", 112, 3.2, 0.9),
  ];
  compositeEquations.forEach((equation, index) => {
    equation.position.set(rightCenter.x, -1.4, 0.3);
    (equation.material as THREE.MeshBasicMaterial).opacity = index === 0 ? 1 : 0;
    contentGroup.add(equation);
  });

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 5.8, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.3, -0.5);
  contentGroup.add(layoutBounds);

  return {
    animate(elapsed) {
      const t = elapsed % 9;

      let gridFactor = 0;
      if (t < 2.2) gridFactor = 0;
      else if (t < 3) gridFactor = smoothstep((t - 2.2) / 0.8);
      else if (t < 5.4) gridFactor = 1;
      else if (t < 6.2) gridFactor = 1 - smoothstep((t - 5.4) / 0.8);
      primeDots.forEach((dot, index) => {
        dot.position.lerpVectors(primeRowLayout[index], primeGridLayout[index], gridFactor);
      });
      (ghostRing.material as THREE.MeshBasicMaterial).opacity = gridFactor * 0.85;
      (missingMark.material as THREE.MeshBasicMaterial).opacity =
        gridFactor * Math.max(0, 0.55 + 0.4 * Math.sin(elapsed * 5));

      const segment = Math.floor(t / 3) % 3;
      const nextSegment = (segment + 1) % 3;
      const segmentTime = t - segment * 3;
      const morphFactor = segmentTime < 2.2 ? 0 : smoothstep((segmentTime - 2.2) / 0.8);
      compositeDots.forEach((dot, index) => {
        dot.position.lerpVectors(
          compositeLayouts[segment][index],
          compositeLayouts[nextSegment][index],
          morphFactor,
        );
      });
      compositeEquations.forEach((equation, index) => {
        const weight = index === segment ? 1 - morphFactor : index === nextSegment ? morphFactor : 0;
        (equation.material as THREE.MeshBasicMaterial).opacity = weight;
      });

      primeGroup.position.y = leftCenter.y + Math.sin(elapsed * 1.2) * 0.05;
      compositeGroup.position.y = rightCenter.y + Math.sin(elapsed * 1.2 + 0.9) * 0.05;
    },
  };
}

function buildDivisorScene(contentGroup: THREE.Group): LessonScene {
  const dotCount = 12;
  const layouts: { rows: number; cols: number }[] = [
    { rows: 1, cols: 12 },
    { rows: 2, cols: 6 },
    { rows: 3, cols: 4 },
  ];
  const spacing = 0.58;
  const gridCenterY = 0.85;

  const dots: THREE.Mesh[] = [];
  for (let index = 0; index < dotCount; index += 1) {
    const dot = createDot(COMPOSITE_COLOR);
    dots.push(dot);
    contentGroup.add(dot);
  }

  const layoutPositions = layouts.map(({ rows, cols }) => {
    const positions: THREE.Vector3[] = [];
    for (let index = 0; index < dotCount; index += 1) {
      const row = Math.floor(index / cols);
      const column = index % cols;
      positions.push(
        new THREE.Vector3(
          (column - (cols - 1) / 2) * spacing,
          gridCenterY + ((rows - 1) / 2 - row) * spacing,
          0,
        ),
      );
    }
    return positions;
  });
  dots.forEach((dot, index) => dot.position.copy(layoutPositions[0][index]));

  const labelOffsets = layouts.map(({ rows, cols }) => ({
    rowX: -(((cols - 1) / 2) * spacing) - 0.55,
    columnY: gridCenterY + ((rows - 1) / 2) * spacing + 0.55,
  }));

  const rowLabel = createDynamicGlyphPlane("#3f9aab", 0.62);
  rowLabel.mesh.position.set(labelOffsets[0].rowX, gridCenterY, 0.3);
  const columnLabel = createDynamicGlyphPlane("#d0742e", 0.62);
  columnLabel.mesh.position.set(0, labelOffsets[0].columnY, 0.3);
  contentGroup.add(rowLabel.mesh, columnLabel.mesh);

  const equation = createDynamicTextPlane("#8a8194", 110, 3.4, 0.9);
  equation.mesh.position.set(0, -1.55, 0.3);
  contentGroup.add(equation.mesh);

  const divisorList = createDynamicTextPlane("#3f8f63", 92, 6.4, 0.85);
  divisorList.mesh.position.set(0, -2.55, 0.3);
  contentGroup.add(divisorList.mesh);

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 6.4, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.15, -0.5);
  contentGroup.add(layoutBounds);

  const HOLD_DURATION = 2.2;
  const MORPH_DURATION = 0.8;
  const LAST_HOLD_BONUS = 1.8;
  const stageDurations = layouts.map((_, index) =>
    index === layouts.length - 1
      ? HOLD_DURATION + LAST_HOLD_BONUS + MORPH_DURATION
      : HOLD_DURATION + MORPH_DURATION,
  );
  const totalDuration = stageDurations.reduce((sum, value) => sum + value, 0);

  const divisorsUpTo = (stageIndex: number) => {
    const found = new Set<number>();
    for (let index = 0; index <= stageIndex; index += 1) {
      found.add(layouts[index].rows);
      found.add(layouts[index].cols);
    }
    return Array.from(found).sort((a, b) => a - b);
  };

  let displayedStage = -1;

  return {
    animate(elapsed) {
      const t = elapsed % totalDuration;
      let segment = 0;
      let segmentTime = t;
      for (let index = 0; index < stageDurations.length; index += 1) {
        if (segmentTime < stageDurations[index]) {
          segment = index;
          break;
        }
        segmentTime -= stageDurations[index];
      }
      const nextSegment = (segment + 1) % layouts.length;
      const holdDuration = segment === layouts.length - 1 ? HOLD_DURATION + LAST_HOLD_BONUS : HOLD_DURATION;
      const morphFactor =
        segmentTime < holdDuration ? 0 : smoothstep((segmentTime - holdDuration) / MORPH_DURATION);

      dots.forEach((dot, index) => {
        dot.position.lerpVectors(
          layoutPositions[segment][index],
          layoutPositions[nextSegment][index],
          morphFactor,
        );
      });

      const activeStage = morphFactor < 0.5 ? segment : nextSegment;
      if (activeStage !== displayedStage) {
        displayedStage = activeStage;
        const { rows, cols } = layouts[activeStage];
        rowLabel.setText(String(rows));
        rowLabel.mesh.position.x = labelOffsets[activeStage].rowX;
        columnLabel.setText(String(cols));
        columnLabel.mesh.position.y = labelOffsets[activeStage].columnY;
        equation.setText(`12 = ${rows} × ${cols}`);
        divisorList.setText(`약수: ${divisorsUpTo(activeStage).join(", ")}`);
      }
    },
  };
}

function buildFactorizationScene(contentGroup: THREE.Group): LessonScene {
  const spacing = 0.55;
  const maxBlockGap = 0.42;
  const gridGroup = new THREE.Group();
  gridGroup.position.set(0, 0.35, 0);
  contentGroup.add(gridGroup);

  const baseColor = new THREE.Color(BASE_DOT_COLOR);
  const blockColors = [new THREE.Color(PRIME_COLOR), new THREE.Color(COMPOSITE_COLOR)];
  const dots: {
    mesh: THREE.Mesh;
    base: THREE.Vector3;
    blockX: number;
    blockY: number;
  }[] = [];

  for (let row = 0; row < 6; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const blockX = Math.floor(column / 2);
      const blockY = Math.floor(row / 3);
      const dot = createDot(BASE_DOT_COLOR);
      const base = new THREE.Vector3((column - 2.5) * spacing, (2.5 - row) * spacing, 0);
      dot.position.copy(base);
      dots.push({ mesh: dot, base, blockX, blockY });
      gridGroup.add(dot);
    }
  }

  const unitChip = createLabelPlane("2×3", "#318696", "#e7f8fa");
  unitChip.scale.setScalar(0.72);
  (unitChip.material as THREE.MeshBasicMaterial).opacity = 0;
  gridGroup.add(unitChip);

  const squareEquation = createTextPlane("36 = 6×6", "#7c7390", 112, 3.6, 0.9);
  squareEquation.position.set(0, 2.85, 0.3);
  contentGroup.add(squareEquation);

  const groupedEquation = createTextPlane("= (2×3)×(2×3)", "#8a71c4", 104, 4.6, 0.88);
  groupedEquation.position.set(0, -2.1, 0.3);
  (groupedEquation.material as THREE.MeshBasicMaterial).opacity = 0;
  const powerEquation = createTextPlane("= 2²×3²", "#c08a2e", 116, 3, 0.9);
  powerEquation.position.set(0, -2.85, 0.3);
  (powerEquation.material as THREE.MeshBasicMaterial).opacity = 0;
  contentGroup.add(groupedEquation, powerEquation);

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 6.8, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.1, -0.5);
  contentGroup.add(layoutBounds);

  return {
    animate(elapsed) {
      const split = smoothstep((elapsed - 2) / 1);
      const gap = maxBlockGap * split;

      dots.forEach(({ mesh, base, blockX, blockY }) => {
        mesh.position.set(base.x + (blockX - 1) * gap, base.y + (0.5 - blockY) * gap * 1.3, base.z);
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.color.lerpColors(baseColor, blockColors[(blockX + blockY) % 2], split);
        material.emissive.copy(material.color);
      });

      const topLeftBlockCenter = new THREE.Vector3(
        -2 * spacing - gap,
        1.5 * spacing + 0.5 * gap * 1.3,
        0.3,
      );
      unitChip.position.set(topLeftBlockCenter.x - 1.05, topLeftBlockCenter.y + 0.55, 0.35);
      (unitChip.material as THREE.MeshBasicMaterial).opacity = split;

      (groupedEquation.material as THREE.MeshBasicMaterial).opacity = smoothstep(
        (elapsed - 3.4) / 0.8,
      );
      (powerEquation.material as THREE.MeshBasicMaterial).opacity = smoothstep(
        (elapsed - 5) / 0.8,
      );

      gridGroup.position.y = 0.35 + Math.sin(elapsed * 1.1) * 0.04;
    },
  };
}

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function createDot(color: number) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 24, 24),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.05,
      emissive: color,
      emissiveIntensity: 0.12,
    }),
  );
}

function createLabelPlane(text: string, color: string, background: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 500;
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
    context.font = '900 104px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.64),
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
    context.font = '900 190px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
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

function createDynamicGlyphPlane(color: string, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  function setText(text: string) {
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = '900 190px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
    texture.needsUpdate = true;
  }
  return { mesh, setText };
}

function createDynamicTextPlane(color: string, fontSize: number, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 240;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  function setText(text: string) {
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `800 ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    texture.needsUpdate = true;
  }
  return { mesh, setText };
}
