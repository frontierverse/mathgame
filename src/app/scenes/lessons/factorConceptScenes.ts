import * as THREE from "three";

import type { FactorConceptLessonId } from "../../shared/factorConcepts";
import type { LessonScene, LessonSceneContext } from "../types";

const BLUE = 0x53aebb;
const RED = 0xe85b76;
const PURPLE = 0x9b84d9;
const GOLD = 0xd3a94e;
const GREEN = 0x68b58d;
const GREY = 0xa8a0aa;
const FAIL = 0xd9534f;

type ScenePalette = {
  ink: string;
  muted: string;
};

function paletteFor(isLightTheme: boolean): ScenePalette {
  return isLightTheme
    ? { ink: "#443b50", muted: "#756b7a" }
    : { ink: "#f5f5f5", muted: "#d4d4d4" };
}

export function buildFactorConceptScene(
  lessonId: FactorConceptLessonId,
  context: LessonSceneContext,
): LessonScene {
  switch (lessonId) {
    case "divisors":
      return buildDivisorsScene(context);
    case "primes-composites":
      return buildPrimesCompositesScene(context);
    case "prime-factorization":
      return buildPrimeFactorizationScene(context);
    case "multiples":
      return buildMultiplesScene(context);
    case "common-multiples":
      return buildCommonMultiplesScene(context);
    case "least-common-multiple":
      return buildLeastCommonMultipleScene(context);
    case "common-divisors":
      return buildCommonDivisorsScene(context);
    case "greatest-common-divisor":
      return buildGreatestCommonDivisorScene(context);
  }
}

function smoothstep(value: number) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function reveal(elapsed: number, start: number, duration = 0.7) {
  return smoothstep((elapsed - start) / duration);
}

function createBlock(color: number, scale = 1) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.46, 0.34),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.28,
      metalness: 0.06,
      emissive: color,
      emissiveIntensity: 0.1,
    }),
  );
  block.scale.setScalar(scale);
  return block;
}

function createDot(color: number, radius = 0.18) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 18),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.04,
      emissive: color,
      emissiveIntensity: 0.13,
    }),
  );
}

function createTextPlane(
  text: string,
  color: string,
  width: number,
  height = 0.72,
  fontSize = 108,
) {
  const canvas = document.createElement("canvas");
  canvas.height = 260;
  canvas.width = Math.max(
    canvas.height,
    Math.round((width / height) * canvas.height),
  );
  const drawingContext = canvas.getContext("2d");
  if (drawingContext) {
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);
    drawingContext.fillStyle = color;
    drawingContext.font = `900 ${fontSize}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    drawingContext.textAlign = "center";
    drawingContext.textBaseline = "middle";
    drawingContext.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
}

function setOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.98;
    });
  });
}

function addBounds(
  contentGroup: THREE.Group,
  width: number,
  height: number,
  y = 0,
) {
  const bounds = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.01),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  bounds.position.set(0, y, -0.7);
  contentGroup.add(bounds);
  return bounds;
}

function gridPositions(
  count: number,
  rows: number,
  columns: number,
  spacing: number,
  centerY = 0.45,
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

function buildDivisorsScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext): LessonScene {
  const palette = paletteFor(isLightTheme);
  const layouts = [
    gridPositions(12, 1, 12, 0.64, 0.55),
    gridPositions(12, 2, 6, 0.68, 0.55),
    gridPositions(12, 3, 4, 0.7, 0.55),
  ];
  const blocks = Array.from({ length: 12 }, (_, index) => {
    const block = createBlock(index % 2 === 0 ? PURPLE : BLUE, 0.94);
    block.position.copy(layouts[0][index]);
    contentGroup.add(block);
    return block;
  });
  const equations = ["1 × 12", "2 × 6", "3 × 4"].map((text) => {
    const equation = createTextPlane(text, palette.ink, 3.1, 0.75, 116);
    equation.position.set(0, -1.55, 0.35);
    contentGroup.add(equation);
    return equation;
  });
  addBounds(contentGroup, 9.4, 5.2, 0.15);

  return {
    animate(elapsed) {
      const firstMorph = reveal(elapsed, 1.8, 0.9);
      const secondMorph = reveal(elapsed, 4.3, 0.9);
      blocks.forEach((block, index) => {
        if (secondMorph > 0) {
          block.position.lerpVectors(layouts[1][index], layouts[2][index], secondMorph);
        } else {
          block.position.lerpVectors(layouts[0][index], layouts[1][index], firstMorph);
        }
        block.rotation.y = Math.sin(elapsed * 1.1 + index * 0.3) * 0.06;
      });
      setOpacity(equations[0], 1 - firstMorph);
      setOpacity(equations[1], firstMorph * (1 - secondMorph));
      setOpacity(equations[2], secondMorph);
    },
  };
}

function buildPrimesCompositesScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext): LessonScene {
  const palette = paletteFor(isLightTheme);
  const leftCenter = new THREE.Vector3(-2.55, 0.45, 0);
  const rightCenter = new THREE.Vector3(2.55, 0.45, 0);
  const primeBlocks = Array.from({ length: 7 }, () => createBlock(BLUE, 0.88));
  const compositeBlocks = Array.from({ length: 8 }, () => createBlock(PURPLE, 0.88));
  const primeRow = gridPositions(7, 1, 7, 0.56, 0).map((position) =>
    position.add(leftCenter),
  );
  const primeAttempt = gridPositions(7, 2, 4, 0.62, 0).map((position) =>
    position.add(leftCenter),
  );
  const compositeRow = gridPositions(8, 1, 8, 0.52, 0).map((position) =>
    position.add(rightCenter),
  );
  const compositeGrid = gridPositions(8, 2, 4, 0.62, 0).map((position) =>
    position.add(rightCenter),
  );

  primeBlocks.forEach((block, index) => {
    block.position.copy(primeRow[index]);
    contentGroup.add(block);
  });
  compositeBlocks.forEach((block, index) => {
    block.position.copy(compositeRow[index]);
    contentGroup.add(block);
  });

  const missingPosition = gridPositions(8, 2, 4, 0.62, 0)[7].add(leftCenter);
  const missingRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.035, 12, 48),
    new THREE.MeshBasicMaterial({
      color: FAIL,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  missingRing.position.copy(missingPosition);
  const missingMark = createTextPlane("×", "#d9534f", 0.52, 0.52, 160);
  missingMark.position.copy(missingPosition).setZ(0.25);
  setOpacity(missingMark, 0);
  contentGroup.add(missingRing, missingMark);

  const seven = createTextPlane("7", palette.ink, 0.9, 0.72, 130);
  seven.position.set(leftCenter.x, 2.05, 0.3);
  const eight = createTextPlane("8", palette.ink, 0.9, 0.72, 130);
  eight.position.set(rightCenter.x, 2.05, 0.3);
  const primeLabel = createTextPlane("소수", "#287c89", 1.5, 0.68, 108);
  primeLabel.position.set(leftCenter.x, -1.45, 0.3);
  const compositeLabel = createTextPlane("합성수", "#7258b1", 2, 0.68, 108);
  compositeLabel.position.set(rightCenter.x, -1.45, 0.3);
  setOpacity(primeLabel, 0);
  setOpacity(compositeLabel, 0);
  contentGroup.add(seven, eight, primeLabel, compositeLabel);
  addBounds(contentGroup, 9.5, 5.4, 0.15);

  return {
    animate(elapsed) {
      const morph = reveal(elapsed, 2, 1);
      const labelReveal = reveal(elapsed, 3.4, 0.7);
      primeBlocks.forEach((block, index) => {
        block.position.lerpVectors(primeRow[index], primeAttempt[index], morph);
      });
      compositeBlocks.forEach((block, index) => {
        block.position.lerpVectors(compositeRow[index], compositeGrid[index], morph);
      });
      (missingRing.material as THREE.MeshBasicMaterial).opacity = morph * 0.9;
      setOpacity(missingMark, morph);
      setOpacity(primeLabel, labelReveal);
      setOpacity(compositeLabel, labelReveal);
    },
  };
}

function createConnector(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
) {
  const direction = to.clone().sub(from);
  const connector = new THREE.Mesh(
    new THREE.BoxGeometry(direction.length(), 0.055, 0.055),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }),
  );
  connector.position.copy(from).add(to).multiplyScalar(0.5);
  connector.rotation.z = Math.atan2(direction.y, direction.x);
  return connector;
}

function createNumberNode(
  label: string,
  color: number,
  textColor: string,
  radius = 0.48,
) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.2, 40),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.28,
      metalness: 0.06,
      emissive: color,
      emissiveIntensity: 0.1,
    }),
  );
  disc.rotation.x = Math.PI / 2;
  const text = createTextPlane(
    label,
    textColor,
    radius * 1.65,
    radius * 1.2,
    205,
  );
  text.position.z = 0.16;
  group.add(disc, text);
  return group;
}

function buildPrimeFactorizationScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext): LessonScene {
  const palette = paletteFor(isLightTheme);
  const positions = {
    twelve: new THREE.Vector3(0, 2, 0),
    three: new THREE.Vector3(-2, 0.4, 0),
    four: new THREE.Vector3(2, 0.4, 0),
    twoLeft: new THREE.Vector3(1.15, -1.45, 0),
    twoRight: new THREE.Vector3(2.85, -1.45, 0),
  };
  const twelve = createNumberNode("12", GOLD, "#ffffff", 0.58);
  twelve.position.copy(positions.twelve);
  const three = createNumberNode("3", BLUE, "#ffffff");
  three.position.copy(positions.three);
  const four = createNumberNode("4", GREY, "#ffffff");
  four.position.copy(positions.four);
  const twoLeft = createNumberNode("2", BLUE, "#ffffff");
  twoLeft.position.copy(positions.twoLeft);
  const twoRight = createNumberNode("2", BLUE, "#ffffff");
  twoRight.position.copy(positions.twoRight);
  const firstLeft = createConnector(positions.twelve, positions.three, GREY);
  const firstRight = createConnector(positions.twelve, positions.four, GREY);
  const secondLeft = createConnector(positions.four, positions.twoLeft, GREY);
  const secondRight = createConnector(positions.four, positions.twoRight, GREY);
  const primeRings = [three, twoLeft, twoRight].map((node) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.04, 12, 56),
      new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0 }),
    );
    ring.position.copy(node.position);
    contentGroup.add(ring);
    return ring;
  });
  const equation = createTextPlane("12 = 2 × 2 × 3", palette.ink, 4.3, 0.76, 106);
  equation.position.set(0, -2.65, 0.3);
  contentGroup.add(
    firstLeft,
    firstRight,
    secondLeft,
    secondRight,
    twelve,
    three,
    four,
    twoLeft,
    twoRight,
    equation,
  );
  [firstLeft, firstRight, secondLeft, secondRight, three, four, twoLeft, twoRight, equation].forEach(
    (object) => setOpacity(object, 0),
  );
  addBounds(contentGroup, 7.2, 6.6, -0.25);

  return {
    animate(elapsed) {
      const firstSplit = reveal(elapsed, 1.3, 0.8);
      const secondSplit = reveal(elapsed, 3.1, 0.8);
      const finish = reveal(elapsed, 4.7, 0.8);
      [firstLeft, firstRight, three, four].forEach((object) =>
        setOpacity(object, firstSplit),
      );
      [secondLeft, secondRight, twoLeft, twoRight].forEach((object) =>
        setOpacity(object, secondSplit),
      );
      primeRings.forEach((ring, index) => {
        (ring.material as THREE.MeshBasicMaterial).opacity = finish;
        ring.scale.setScalar(1 + Math.sin(elapsed * 2.2 + index) * 0.04 * finish);
      });
      setOpacity(equation, finish);
      twelve.rotation.z = Math.sin(elapsed * 1.2) * 0.025;
    },
  };
}

function xFor(value: number, max: number) {
  return -5 + (value / max) * 10;
}

function createRail(contentGroup: THREE.Group, max: number, y = 0) {
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 0.07, 0.08),
    new THREE.MeshStandardMaterial({ color: GREY, roughness: 0.45 }),
  );
  rail.position.y = y;
  contentGroup.add(rail);
  for (let value = 0; value <= max; value += 1) {
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, value % 2 === 0 ? 0.28 : 0.16, 0.06),
      new THREE.MeshBasicMaterial({ color: GREY }),
    );
    tick.position.set(xFor(value, max), y, 0.08);
    contentGroup.add(tick);
  }
}

function createJumpArc(
  from: number,
  to: number,
  max: number,
  color: number,
  y = 0,
) {
  const fromX = xFor(from, max);
  const toX = xFor(to, max);
  const radius = (toX - fromX) / 2;
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.045, 10, 48, Math.PI),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  arc.position.set((fromX + toX) / 2, y + 0.08, 0.12);
  return arc;
}

function buildMultiplesScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext): LessonScene {
  const palette = paletteFor(isLightTheme);
  const multipleTextColor = isLightTheme ? "#287c89" : "#63c5d0";
  const productTextColor = isLightTheme ? "#7258b1" : "#b49bea";
  const stops = [0, 2, 4, 6, 8, 10];
  const railY = -0.15;
  const stepInterval = 0.9;
  let compactLayout = false;
  createRail(contentGroup, 10, railY);
  const arcs = stops.slice(1).map((stop, index) => {
    const arc = createJumpArc(stops[index], stop, 10, BLUE, railY);
    contentGroup.add(arc);
    return arc;
  });
  const landingDots = stops.map((stop) => {
    const dot = createDot(BLUE, stop === 0 ? 0.13 : 0.2);
    dot.position.set(xFor(stop, 10), railY, 0.2);
    contentGroup.add(dot);
    const number = createTextPlane(String(stop), palette.ink, 0.78, 0.58, 180);
    number.position.set(xFor(stop, 10), -0.82, 0.25);
    contentGroup.add(number);
    return dot;
  });

  const productLabels = stops.slice(1).map((stop, index) => {
    const product = createTextPlane(
      `2 × ${index + 1} = ${stop}`,
      productTextColor,
      1.9,
      0.54,
      120,
    );
    product.position.set(xFor(stop, 10), -1.55, 0.28);
    setOpacity(product, 0);
    contentGroup.add(product);
    return product;
  });

  const additionLabels = stops.slice(1).map((stop, index) => {
    const addends = ["0", ...Array.from({ length: index + 1 }, () => "2")];
    const addition = createTextPlane(
      `${addends.join(" + ")} = ${stop}`,
      multipleTextColor,
      7.2,
      0.62,
      140,
    );
    addition.position.set(0, 1.5, 0.3 + index * 0.01);
    setOpacity(addition, 0);
    contentGroup.add(addition);
    return addition;
  });

  const stepLabel = createTextPlane(
    "2의 배수",
    multipleTextColor,
    2.4,
    0.68,
    104,
  );
  stepLabel.position.set(0, 2.5, 0.25);
  contentGroup.add(stepLabel);
  addBounds(contentGroup, 11.3, 6.6, 0.3);

  return {
    animate(elapsed) {
      arcs.forEach((arc, index) => {
        const stepStart = 0.55 + index * stepInterval;
        const amount = reveal(elapsed, stepStart, 0.55);
        (arc.material as THREE.MeshBasicMaterial).opacity = amount * 0.95;
        landingDots[index + 1].position.y =
          railY + Math.sin(amount * Math.PI) * 0.28;

        const additionIn = reveal(elapsed, stepStart + 0.2, 0.28);
        const additionOut =
          index === additionLabels.length - 1
            ? 0
            : reveal(elapsed, stepStart + stepInterval + 0.2, 0.24);
        setOpacity(additionLabels[index], additionIn * (1 - additionOut));

        const productIn = reveal(elapsed, stepStart + 0.46, 0.28);
        setOpacity(productLabels[index], productIn);
        const productPulse =
          Math.sin(
            THREE.MathUtils.clamp(
              (elapsed - stepStart - 0.42) / 0.72,
              0,
              1,
            ) * Math.PI,
          ) * 0.07;
        productLabels[index].scale.setScalar(
          (compactLayout ? 1.6 : 1) * (1 + productPulse),
        );
      });
    },
    resize(aspect) {
      compactLayout = aspect < 1.3;
      const compactPositions = [
        [-3.4, -1.6],
        [0, -1.6],
        [3.4, -1.6],
        [-1.75, -2.5],
        [1.75, -2.5],
      ] as const;

      productLabels.forEach((product, index) => {
        const [x, y] = compactLayout
          ? compactPositions[index]
          : [xFor(stops[index + 1], 10), -1.55];
        product.position.set(x, y, 0.28);
        product.scale.setScalar(compactLayout ? 1.6 : 1);
      });
      additionLabels.forEach((addition) => {
        addition.scale.setScalar(compactLayout ? 1.15 : 1);
      });
    },
  };
}

function createTrackDot(
  contentGroup: THREE.Group,
  value: number,
  max: number,
  y: number,
  color: number,
) {
  const dot = createDot(color, 0.19);
  dot.position.set(xFor(value, max), y, 0.2);
  contentGroup.add(dot);
  return dot;
}

function buildMeetingTracks(
  contentGroup: THREE.Group,
  isLightTheme: boolean,
  max: number,
  first: readonly number[],
  second: readonly number[],
  hits: readonly number[],
  firstOnly: boolean,
): LessonScene {
  const palette = paletteFor(isLightTheme);
  createRail(contentGroup, max, 0);
  const firstDots = first.map((value) =>
    createTrackDot(contentGroup, value, max, 0.5, BLUE),
  );
  const secondDots = second.map((value) =>
    createTrackDot(contentGroup, value, max, -0.5, RED),
  );
  const union = Array.from(new Set([...first, ...second])).sort((a, b) => a - b);
  union.forEach((value) => {
    const number = createTextPlane(String(value), palette.ink, 0.76, 0.58, 175);
    number.position.set(xFor(value, max), -1.18, 0.25);
    contentGroup.add(number);
  });
  const rings = hits.map((value) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(firstOnly ? 0.48 : 0.38, 0.055, 12, 56),
      new THREE.MeshBasicMaterial({
        color: firstOnly ? GOLD : PURPLE,
        transparent: true,
        opacity: 0,
      }),
    );
    ring.position.set(xFor(value, max), 0, 0.25);
    contentGroup.add(ring);
    return ring;
  });
  const result = createTextPlane(
    firstOnly ? `첫 만남 ${hits[0]}` : hits.join(", "),
    firstOnly ? "#a6761e" : "#7258b1",
    firstOnly ? 2.7 : 2.1,
    0.72,
    112,
  );
  result.position.set(0, 2.15, 0.28);
  setOpacity(result, 0);
  contentGroup.add(result);
  addBounds(contentGroup, 11.2, 5.4, 0.2);

  return {
    animate(elapsed) {
      firstDots.forEach((dot, index) => {
        dot.scale.setScalar(reveal(elapsed, 0.4 + index * 0.35, 0.4));
      });
      secondDots.forEach((dot, index) => {
        dot.scale.setScalar(reveal(elapsed, 1.1 + index * 0.45, 0.4));
      });
      const hitReveal = reveal(elapsed, 3.8, 0.8);
      rings.forEach((ring, index) => {
        (ring.material as THREE.MeshBasicMaterial).opacity = hitReveal;
        ring.scale.setScalar(
          1 + Math.sin(elapsed * 2.4 + index) * 0.06 * hitReveal,
        );
      });
      setOpacity(result, hitReveal);
    },
  };
}

function buildCommonMultiplesScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext) {
  return buildMeetingTracks(
    contentGroup,
    isLightTheme,
    12,
    [2, 4, 6, 8, 10, 12],
    [3, 6, 9, 12],
    [6, 12],
    false,
  );
}

function buildLeastCommonMultipleScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext) {
  return buildMeetingTracks(
    contentGroup,
    isLightTheme,
    6,
    [2, 4, 6],
    [3, 6],
    [6],
    true,
  );
}

function groupedPositions(
  total: number,
  groupSize: number,
  centerY: number,
  spacing = 0.42,
  groupGap = 0.28,
) {
  const groupCount = total / groupSize;
  const totalWidth =
    (total - 1) * spacing + Math.max(0, groupCount - 1) * groupGap;
  return Array.from({ length: total }, (_, index) => {
    const groupIndex = Math.floor(index / groupSize);
    return new THREE.Vector3(
      -totalWidth / 2 + index * spacing + groupIndex * groupGap,
      centerY,
      0,
    );
  });
}

function groupedGridPositions(
  total: number,
  groupSize: number,
  centerY: number,
  columns = 6,
  spacing = 0.46,
  groupGap = 0.24,
  rowGap = 0.58,
) {
  const rows = Math.ceil(total / columns);
  return Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const countInRow = Math.min(columns, total - row * columns);
    const groupsInRow = Math.ceil(countInRow / groupSize);
    const rowWidth =
      (countInRow - 1) * spacing + Math.max(0, groupsInRow - 1) * groupGap;
    const groupIndex = Math.floor(column / groupSize);
    return new THREE.Vector3(
      -rowWidth / 2 + column * spacing + groupIndex * groupGap,
      centerY + ((rows - 1) / 2 - row) * rowGap,
      0,
    );
  });
}

function createGroupingBlocks(
  contentGroup: THREE.Group,
  total: number,
  y: number,
) {
  return Array.from({ length: total }, (_, index) => {
    const block = createBlock(index % 2 === 0 ? PURPLE : BLUE, 0.7);
    block.position.set(index * 0.2, y, 0);
    contentGroup.add(block);
    return block;
  });
}

function applyGroupingLayout(
  blocks: readonly THREE.Mesh[],
  positions: readonly THREE.Vector3[],
  groupSize: number,
  transitionFrom?: {
    positions: readonly THREE.Vector3[];
    groupSize: number;
    amount: number;
  },
) {
  blocks.forEach((block, index) => {
    if (transitionFrom) {
      block.position.lerpVectors(
        transitionFrom.positions[index],
        positions[index],
        transitionFrom.amount,
      );
    } else {
      block.position.copy(positions[index]);
    }
    const activeGroupSize =
      transitionFrom && transitionFrom.amount < 0.5
        ? transitionFrom.groupSize
        : groupSize;
    const material = block.material as THREE.MeshStandardMaterial;
    material.color.set(
      Math.floor(index / activeGroupSize) % 2 === 0 ? PURPLE : BLUE,
    );
    material.emissive.copy(material.color);
  });
}

function buildCommonDivisorsScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext): LessonScene {
  const palette = paletteFor(isLightTheme);
  const twelve = createGroupingBlocks(contentGroup, 12, 0.8);
  const eighteen = createGroupingBlocks(contentGroup, 18, -0.55);
  const buildLayouts = (compact: boolean) => {
    const positionsFor = compact ? groupedGridPositions : groupedPositions;
    return {
      two: [positionsFor(12, 2, 0.8), positionsFor(18, 2, -0.55)] as const,
      three: [positionsFor(12, 3, 0.8), positionsFor(18, 3, -0.55)] as const,
    };
  };
  let layouts = buildLayouts(false);
  const twelveLabel = createTextPlane("12", palette.muted, 0.8, 0.58, 112);
  twelveLabel.position.set(-5, 0.8, 0.3);
  const eighteenLabel = createTextPlane("18", palette.muted, 0.8, 0.58, 112);
  eighteenLabel.position.set(-5, -0.55, 0.3);
  const twoLabel = createTextPlane("2개씩 ✓", "#287c89", 2.3, 0.68, 106);
  twoLabel.position.set(0, 2.15, 0.3);
  const threeLabel = createTextPlane("3개씩 ✓", "#7258b1", 2.3, 0.68, 106);
  threeLabel.position.set(0, 2.15, 0.3);
  contentGroup.add(twelveLabel, eighteenLabel, twoLabel, threeLabel);
  setOpacity(threeLabel, 0);
  const bounds = addBounds(contentGroup, 11.4, 5.2, 0.15);

  return {
    resize(aspect) {
      const compact = aspect < 1.25;
      layouts = buildLayouts(compact);
      bounds.scale.x = compact ? 0.6 : 1;
      twelveLabel.position.x = compact ? -2.25 : -5;
      eighteenLabel.position.x = compact ? -2.25 : -5;
    },
    animate(elapsed) {
      const morph = reveal(elapsed, 2.7, 1);
      applyGroupingLayout(twelve, layouts.three[0], 3, {
        positions: layouts.two[0],
        groupSize: 2,
        amount: morph,
      });
      applyGroupingLayout(eighteen, layouts.three[1], 3, {
        positions: layouts.two[1],
        groupSize: 2,
        amount: morph,
      });
      setOpacity(twoLabel, 1 - morph);
      setOpacity(threeLabel, morph);
    },
  };
}

function buildGreatestCommonDivisorScene({
  contentGroup,
  isLightTheme,
}: LessonSceneContext): LessonScene {
  const palette = paletteFor(isLightTheme);
  const twelve = createGroupingBlocks(contentGroup, 12, 1.05);
  const eighteen = createGroupingBlocks(contentGroup, 18, -0.15);
  const groupSizes = [2, 3, 6] as const;
  const buildLayouts = (compact: boolean) =>
    groupSizes.map((groupSize) => {
      const positionsFor = compact ? groupedGridPositions : groupedPositions;
      return [
        positionsFor(12, groupSize, 1.05),
        positionsFor(18, groupSize, compact ? -0.45 : -0.15),
      ] as const;
    });
  let layouts = buildLayouts(false);
  const candidateNodes = groupSizes.map((groupSize, index) => {
    const node = createNumberNode(
      String(groupSize),
      index === groupSizes.length - 1 ? GOLD : GREY,
      "#ffffff",
      index === groupSizes.length - 1 ? 0.52 : 0.42,
    );
    node.position.set((index - 1) * 1.65, -2.05, 0.1);
    contentGroup.add(node);
    return node;
  });
  const crown = createTextPlane("★", "#a6761e", 0.9, 0.7, 160);
  crown.position.set(1.65, -1.25, 0.35);
  setOpacity(crown, 0);
  const result = createTextPlane("6개씩", palette.ink, 2, 0.7, 110);
  result.position.set(0, 2.35, 0.3);
  setOpacity(result, 0);
  contentGroup.add(crown, result);
  const bounds = addBounds(contentGroup, 11.4, 5.8, 0.15);

  return {
    resize(aspect) {
      const compact = aspect < 1.25;
      layouts = buildLayouts(compact);
      bounds.scale.x = compact ? 0.6 : 1;
    },
    animate(elapsed) {
      const firstMorph = reveal(elapsed, 1.8, 0.8);
      const secondMorph = reveal(elapsed, 3.6, 0.9);
      if (secondMorph > 0) {
        applyGroupingLayout(twelve, layouts[2][0], 6, {
          positions: layouts[1][0],
          groupSize: 3,
          amount: secondMorph,
        });
        applyGroupingLayout(eighteen, layouts[2][1], 6, {
          positions: layouts[1][1],
          groupSize: 3,
          amount: secondMorph,
        });
      } else {
        applyGroupingLayout(twelve, layouts[1][0], 3, {
          positions: layouts[0][0],
          groupSize: 2,
          amount: firstMorph,
        });
        applyGroupingLayout(eighteen, layouts[1][1], 3, {
          positions: layouts[0][1],
          groupSize: 2,
          amount: firstMorph,
        });
      }
      const activeIndex = secondMorph > 0.5 ? 2 : firstMorph > 0.5 ? 1 : 0;
      candidateNodes.forEach((node, index) => {
        const targetScale = index === activeIndex ? (index === 2 ? 1.25 : 1.1) : 0.86;
        node.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.08,
        );
      });
      const finish = reveal(elapsed, 4.8, 0.7);
      setOpacity(crown, finish);
      setOpacity(result, finish);
    },
  };
}
