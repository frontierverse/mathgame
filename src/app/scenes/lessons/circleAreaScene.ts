import * as THREE from "three";
import type { CircleAreaStage, LessonScene, LessonSceneContext } from "../types";

const KOREAN_FONT_STACK = '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

function clampProgress(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smootherProgress(value: number) {
  const progress = clampProgress(value);
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
}

function createTextPlane({
  text,
  color,
  width,
  height,
  fontSize = 64,
  fontWeight = 800,
  canvasWidth = 768,
}: {
  text: string;
  color: string;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: number;
  canvasWidth?: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = 180;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `${fontWeight} ${fontSize}px ${KOREAN_FONT_STACK}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  return { plane, material };
}

function createCircumferenceFormulaPlane() {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 280;
  const context = canvas.getContext("2d");

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.shadowColor = "rgba(74, 53, 98, 0.18)";
    context.shadowBlur = 28;
    context.fillStyle = "rgba(255, 253, 248, 0.97)";
    context.beginPath();
    context.roundRect(24, 24, canvas.width - 48, canvas.height - 48, 48);
    context.fill();
    context.shadowBlur = 0;
    context.lineWidth = 6;
    context.strokeStyle = "rgba(102, 78, 139, 0.52)";
    context.stroke();

    const prefix = "둘레 = 지름 × ";
    const answer = "3.14";
    context.font = `900 92px ${KOREAN_FONT_STACK}`;
    const prefixWidth = context.measureText(prefix).width;
    const answerWidth = context.measureText(answer).width;
    let cursor = (canvas.width - prefixWidth - answerWidth) / 2;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = "#2f2438";
    context.fillText(prefix, cursor, 116);
    cursor += prefixWidth;
    context.fillStyle = "#e58c2f";
    context.fillText(answer, cursor, 116);

    context.font = `700 40px ${KOREAN_FONT_STACK}`;
    context.textAlign = "center";
    context.fillStyle = "#5b4d66";
    context.fillText("지름 × 3 + 지름 × 0.14", canvas.width / 2, 200);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.24), material);
  return { plane, material };
}

function createRadiusPiFormulaPlane() {
  const canvas = document.createElement("canvas");
  canvas.width = 1500;
  canvas.height = 520;
  const context = canvas.getContext("2d");

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.shadowColor = "rgba(54, 38, 73, 0.2)";
    context.shadowBlur = 30;
    context.fillStyle = "rgba(255, 253, 248, 0.98)";
    context.beginPath();
    context.roundRect(28, 28, canvas.width - 56, canvas.height - 56, 52);
    context.fill();
    context.shadowBlur = 0;
    context.lineWidth = 6;
    context.strokeStyle = "rgba(102, 78, 139, 0.48)";
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `800 60px ${KOREAN_FONT_STACK}`;
    context.fillStyle = "#685675";
    context.fillText("r + r = 2r", canvas.width / 2, 105);

    const prefix = "둘레 = 2 × r × ";
    const pi = "π";
    context.font = `900 98px ${KOREAN_FONT_STACK}`;
    const prefixWidth = context.measureText(prefix).width;
    const piWidth = context.measureText(pi).width;
    let cursor = (canvas.width - prefixWidth - piWidth) / 2;
    context.textAlign = "left";
    context.fillStyle = "#2f2438";
    context.fillText(prefix, cursor, 235);
    cursor += prefixWidth;
    context.fillStyle = "#df842c";
    context.fillText(pi, cursor, 235);

    context.textAlign = "center";
    context.font = `800 54px ${KOREAN_FONT_STACK}`;
    context.fillStyle = "#59476a";
    context.fillText("r = 반지름", canvas.width / 2 - 220, 340);
    context.fillStyle = "#b96820";
    context.fillText("π = 둘레 ÷ 지름", canvas.width / 2 + 230, 340);

    context.font = `700 42px ${KOREAN_FONT_STACK}`;
    context.fillStyle = "#786b81";
    context.fillText("π ≈ 3.14", canvas.width / 2, 425);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(4.82, 1.56), material);
  return { plane, material };
}

export function buildCircleCircumferenceScene(context: LessonSceneContext): LessonScene {
  const circleStage = context.circleStage <= 2 ? context.circleStage : 0;
  return buildCircleLessonScene(context, circleStage);
}

export function buildCircleAreaScene(context: LessonSceneContext): LessonScene {
  const areaStage: CircleAreaStage =
    context.circleStage === 0 ? 0 : context.circleStage === 1 ? 3 : context.circleStage === 2 ? 4 : 5;
  return buildCircleLessonScene(context, areaStage);
}

function buildCircleLessonScene(context: LessonSceneContext, circleStage: CircleAreaStage): LessonScene {
  const { contentGroup, helpers, isLightTheme } = context;
  const { createDigitSlot, showDigit } = helpers;
  const radius = 2.55;

  if (circleStage === 0) {
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 64),
      new THREE.MeshStandardMaterial({
        color: 0x72bce9,
        emissive: 0x4b98c8,
        emissiveIntensity: 0.14,
        roughness: 0.42,
        metalness: 0.03,
        side: THREE.DoubleSide,
      }),
    );
    circle.position.z = 0.02;
    contentGroup.add(circle);

    const circumference = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.09, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x236fa6 }),
    );
    circumference.position.z = 0.12;
    contentGroup.add(circumference);

    const radiusMaterial = new THREE.MeshBasicMaterial({ color: 0xf1a663 });
    const radiusLine = new THREE.Mesh(new THREE.BoxGeometry(radius, 0.075, 0.07), radiusMaterial);
    radiusLine.position.set(radius / 2, 0, 0.18);
    contentGroup.add(radiusLine);
    const centerPoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xf1a663 }),
    );
    centerPoint.position.z = 0.2;
    contentGroup.add(centerPoint);

    const radiusFive = createDigitSlot(radiusMaterial.color.getHex());
    showDigit(radiusFive, "5");
    radiusFive.position.set(radius / 2, -0.45, 0.2);
    radiusFive.scale.setScalar(0.48);
    contentGroup.add(radiusFive);

    const layoutBounds = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 6.4, 0.01),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    layoutBounds.position.set(0, 0, -0.5);
    contentGroup.add(layoutBounds);
    return {};
  }

  const isDiameterGuideStage = circleStage === 1;
  const isRadiusPiStage = circleStage === 2;
  const isPizzaStage = circleStage === 3;
  const isFineSliceStage = circleStage === 4;
  const isUltraFineSliceStage = circleStage === 5;
  const isDenseSliceStage = isFineSliceStage || isUltraFineSliceStage;
  const sliceCount =
    isDiameterGuideStage || isRadiusPiStage
      ? 0
      : isPizzaStage
        ? 8
        : isUltraFineSliceStage
          ? 160
          : 48;
  const sliceAngle = sliceCount > 0 ? (Math.PI * 2) / sliceCount : 0;
  const columns = sliceCount / 2;
  const sliceWidth = isPizzaStage ? 2 * radius * Math.sin(sliceAngle / 2) : radius * sliceAngle;
  const rectangleWidth = (columns + 0.5) * sliceWidth;
  const referenceRadius = 1.3;
  const referenceCircleY = 1.75;
  const sliceScale = isDenseSliceStage ? 0.78 : 1;
  const arrangedSlices = isDenseSliceStage ? new THREE.Group() : null;
  if (arrangedSlices) {
    arrangedSlices.position.y = -1.75;
    arrangedSlices.scale.setScalar(sliceScale);
    contentGroup.add(arrangedSlices);
  }

  const circleSlices: Array<{
    object: THREE.Object3D;
    target: THREE.Vector3;
    targetRotation: number;
    delay: number;
  }> = [];
  let diameterGuideAnimation: ((elapsed: number) => void) | null = null;
  let radiusPiAnimation: ((elapsed: number) => void) | null = null;

  const pizzaDoughMaterial = isPizzaStage
    ? new THREE.MeshStandardMaterial({
        color: 0xb96835,
        roughness: 0.84,
        metalness: 0,
      })
    : null;
  const pizzaCrustMaterial = isPizzaStage
    ? new THREE.MeshStandardMaterial({
        color: 0xd98c48,
        emissive: 0x6b2f12,
        emissiveIntensity: 0.05,
        roughness: 0.72,
        metalness: 0,
      })
    : null;
  const pepperoniMaterial = isPizzaStage
    ? new THREE.MeshStandardMaterial({
        color: 0xc4473e,
        emissive: 0x5a1715,
        emissiveIntensity: 0.08,
        roughness: 0.58,
        metalness: 0,
      })
    : null;
  const oliveMaterial = isPizzaStage
    ? new THREE.MeshStandardMaterial({
        color: 0x567648,
        roughness: 0.62,
        metalness: 0,
      })
    : null;
  const pizzaCrustGeometry = isPizzaStage
    ? new THREE.TorusGeometry(radius - 0.12, 0.12, 10, 18, sliceAngle)
    : null;
  const pepperoniGeometry = isPizzaStage ? new THREE.CylinderGeometry(0.14, 0.14, 0.055, 18) : null;
  const oliveGeometry = isPizzaStage ? new THREE.TorusGeometry(0.075, 0.024, 8, 14) : null;

  for (let index = 0; index < sliceCount; index += 1) {
    const thetaStart = index * sliceAngle;
    const midAngle = thetaStart + sliceAngle / 2;
    const sliceGroup = new THREE.Group();

    if (
      isPizzaStage &&
      pizzaDoughMaterial &&
      pizzaCrustMaterial &&
      pepperoniMaterial &&
      oliveMaterial &&
      pizzaCrustGeometry &&
      pepperoniGeometry &&
      oliveGeometry
    ) {
      const pizzaShape = new THREE.Shape();
      pizzaShape.moveTo(0, 0);
      pizzaShape.lineTo(radius * Math.cos(thetaStart), radius * Math.sin(thetaStart));
      pizzaShape.absarc(0, 0, radius, thetaStart, thetaStart + sliceAngle, false);
      pizzaShape.lineTo(0, 0);

      const cheeseColor = index % 2 === 0 ? 0xf5c967 : 0xf1ba57;
      const cheeseMaterial = new THREE.MeshStandardMaterial({
        color: cheeseColor,
        emissive: 0x8b5315,
        emissiveIntensity: 0.055,
        roughness: 0.66,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const pizzaBody = new THREE.Mesh(
        new THREE.ExtrudeGeometry(pizzaShape, {
          depth: 0.22,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.035,
          bevelThickness: 0.035,
        }),
        [cheeseMaterial, pizzaDoughMaterial],
      );
      pizzaBody.position.z = 0.015;
      sliceGroup.add(pizzaBody);

      const crust = new THREE.Mesh(pizzaCrustGeometry, pizzaCrustMaterial);
      crust.rotation.z = thetaStart;
      crust.position.z = 0.265;
      sliceGroup.add(crust);

      const toppingDistances = [1.05, 1.72];
      toppingDistances.forEach((distance, toppingIndex) => {
        const toppingAngle = midAngle + (toppingIndex === 0 ? -0.11 : 0.1);
        const pepperoni = new THREE.Mesh(pepperoniGeometry, pepperoniMaterial);
        pepperoni.position.set(
          Math.cos(toppingAngle) * distance,
          Math.sin(toppingAngle) * distance,
          0.305,
        );
        pepperoni.rotation.x = Math.PI / 2;
        sliceGroup.add(pepperoni);
      });

      if (index % 2 === 0) {
        const oliveAngle = midAngle + 0.17;
        const olive = new THREE.Mesh(oliveGeometry, oliveMaterial);
        olive.position.set(
          Math.cos(oliveAngle) * 1.38,
          Math.sin(oliveAngle) * 1.38,
          0.325,
        );
        sliceGroup.add(olive);
      }
    } else {
      const sliceColor = index % 2 === 0 ? 0x5eafe3 : 0x9edce3;
      const slice = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 8, thetaStart, sliceAngle),
        new THREE.MeshStandardMaterial({
          color: sliceColor,
          emissive: sliceColor,
          emissiveIntensity: 0.1,
          roughness: 0.42,
          metalness: 0.02,
          side: THREE.DoubleSide,
        }),
      );
      sliceGroup.add(slice);
    }

    (arrangedSlices ?? contentGroup).add(sliceGroup);
    const isUpperSlice = index % 2 === 0;
    const column = Math.floor(index / 2);
    const targetDirection = isUpperSlice ? Math.PI / 2 : -Math.PI / 2;
    circleSlices.push({
      object: sliceGroup,
      target: new THREE.Vector3(
        (column - (columns - 1) / 2) * sliceWidth +
          (isUpperSlice ? -sliceWidth / 4 : sliceWidth / 4),
        isUpperSlice ? -radius / 2 : radius / 2,
        0.1,
      ),
      targetRotation: targetDirection - midAngle,
      delay: isPizzaStage ? column * 0.15 : 0,
    });
  }

  if (isDiameterGuideStage) {
    const referenceGroup = new THREE.Group();
    referenceGroup.position.y = referenceCircleY;
    contentGroup.add(referenceGroup);

    const circleFillMaterial = new THREE.MeshStandardMaterial({
      color: 0x9edce3,
      emissive: 0x6ba8b6,
      emissiveIntensity: 0.1,
      roughness: 0.45,
      metalness: 0.02,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
    });
    const circleFill = new THREE.Mesh(
      new THREE.CircleGeometry(referenceRadius, 48),
      circleFillMaterial,
    );
    circleFill.position.z = 0.02;
    referenceGroup.add(circleFill);

    const radiusColor = 0xe6894e;
    const diameterColor = isLightTheme ? 0x6c4cab : 0x9b84d9;
    const diameterMaterial = new THREE.MeshBasicMaterial({
      color: diameterColor,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const diameterLine = new THREE.Mesh(
      new THREE.BoxGeometry(referenceRadius * 2, 0.075, 0.08),
      diameterMaterial,
    );
    diameterLine.position.z = 0.19;
    referenceGroup.add(diameterLine);

    const arrowGeometry = new THREE.ConeGeometry(0.09, 0.2, 10);
    for (const direction of [-1, 1]) {
      const arrow = new THREE.Mesh(arrowGeometry, diameterMaterial);
      arrow.position.set(direction * referenceRadius, 0, 0.21);
      arrow.rotation.z = direction === -1 ? Math.PI / 2 : -Math.PI / 2;
      referenceGroup.add(arrow);
    }

    const centerPoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 10),
      new THREE.MeshBasicMaterial({ color: radiusColor, transparent: true, opacity: 0.92 }),
    );
    centerPoint.position.z = 0.24;
    referenceGroup.add(centerPoint);

    const diameterCaption = createTextPlane({
      text: "지름",
      color: isLightTheme ? "#765fb4" : "#c9b7ff",
      width: 0.95,
      height: 0.32,
      fontSize: 72,
    });
    diameterCaption.plane.position.set(0, -0.32, 0.31);
    referenceGroup.add(diameterCaption.plane);

    const circumferenceCaption = createTextPlane({
      text: "○  →  ─",
      color: isLightTheme ? "#5b4d67" : "#f1eaf6",
      width: 4.9,
      height: 0.42,
      fontSize: 48,
      fontWeight: 750,
    });
    circumferenceCaption.plane.position.set(0, referenceCircleY + referenceRadius + 0.38, 0.32);
    contentGroup.add(circumferenceCaption.plane);

    const unrolledY = -0.82;
    const visualDiameter = referenceRadius * 2;
    const circumferenceLength = visualDiameter * 3.14;
    const circumferenceSegmentCount = 128;
    const circumferenceSegmentLength = circumferenceLength / circumferenceSegmentCount;
    const circumferenceSegmentGeometry = new THREE.BoxGeometry(
      circumferenceSegmentLength * 1.16,
      0.14,
      0.11,
    );
    const circumferenceColors = isLightTheme
      ? [0x087f90, 0x3568ad, 0x6049a6, 0xc66a14]
      : [0x32a9bb, 0x4b88cc, 0x7769c5, 0xefa94d];
    const circumferenceBaseColors = circumferenceColors.map((color) => new THREE.Color(color));
    const circumferenceGlowColors = circumferenceBaseColors.map((color) =>
      color.clone().lerp(new THREE.Color(0xffffff), 0.24),
    );
    const circumferenceMaterials = circumferenceColors.map(
      (color) =>
        new THREE.MeshBasicMaterial({
          color,
          toneMapped: false,
        }),
    );
    const animatedCircumference: Array<{
      mesh: THREE.Mesh;
      start: THREE.Vector3;
      target: THREE.Vector3;
      startRotation: number;
      order: number;
    }> = [];

    for (let index = 0; index < circumferenceSegmentCount; index += 1) {
      const order = (index + 0.5) / circumferenceSegmentCount;
      const theta = -Math.PI / 2 + order * Math.PI * 2;
      const start = new THREE.Vector3(
        Math.cos(theta) * referenceRadius,
        referenceCircleY + Math.sin(theta) * referenceRadius,
        0.24,
      );
      const target = new THREE.Vector3(
        -circumferenceLength / 2 + order * circumferenceLength,
        unrolledY,
        0.27,
      );
      const multiple = order * 3.14;
      const colorIndex = Math.min(3, Math.floor(multiple));
      const mesh = new THREE.Mesh(circumferenceSegmentGeometry, circumferenceMaterials[colorIndex]);
      const tangentRotation = Math.atan2(Math.sin(theta + Math.PI / 2), Math.cos(theta + Math.PI / 2));
      mesh.position.copy(start);
      mesh.rotation.z = tangentRotation;
      contentGroup.add(mesh);
      animatedCircumference.push({ mesh, start, target, startRotation: tangentRotation, order });
    }

    const cutMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd06a,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const cutPoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), cutMaterial);
    cutPoint.position.set(0, referenceCircleY - referenceRadius, 0.39);
    contentGroup.add(cutPoint);
    const cutHaloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd06a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const cutHalo = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 32), cutHaloMaterial);
    cutHalo.position.copy(cutPoint.position);
    contentGroup.add(cutHalo);

    const tickMaterial = new THREE.MeshBasicMaterial({
      color: isLightTheme ? 0x44364f : 0xd8cfdf,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const tickGroup = new THREE.Group();
    const boundaryMultiples = [0, 1, 2, 3, 3.14];
    boundaryMultiples.forEach((multiple) => {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.31, 0.08), tickMaterial);
      tick.position.set(-circumferenceLength / 2 + visualDiameter * multiple, unrolledY, 0.34);
      tickGroup.add(tick);
    });
    contentGroup.add(tickGroup);

    const measurementMaterials: THREE.MeshBasicMaterial[] = [];
    const measurementGroups: THREE.Group[] = [];
    const measurementLabels: Array<{
      plane: THREE.Mesh;
      material: THREE.MeshBasicMaterial;
      delay: number;
    }> = [];
    const measurementMultiples = [1, 1, 1, 0.14];
    const measurementTexts = ["지름", "지름", "지름", "+ 0.14지름"];
    let measurementCursor = -circumferenceLength / 2;
    measurementMultiples.forEach((multiple, index) => {
      const length = visualDiameter * multiple;
      const centerX = measurementCursor + length / 2;
      const material = new THREE.MeshBasicMaterial({
        color: circumferenceColors[index],
        transparent: true,
        opacity: 0,
        toneMapped: false,
      });
      const group = new THREE.Group();
      if (index < 3) {
        const bracket = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(0.08, length - 0.16), 0.035, 0.06),
          material,
        );
        bracket.position.set(centerX, unrolledY - 0.29, 0.3);
        group.add(bracket);
        for (const direction of [-1, 1]) {
          const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), material);
          arrow.position.set(centerX + (direction * (length - 0.08)) / 2, unrolledY - 0.29, 0.31);
          arrow.rotation.z = direction === -1 ? -Math.PI / 2 : Math.PI / 2;
          group.add(arrow);
        }
      }
      contentGroup.add(group);
      measurementMaterials.push(material);
      measurementGroups.push(group);

      const label = createTextPlane({
        text: measurementTexts[index],
        color:
          index === 3
            ? isLightTheme
              ? "#d98022"
              : "#ffc56b"
            : isLightTheme
              ? "#5c5070"
              : "#eee8f5",
        width: index === 3 ? 1.35 : 1.55,
        height: 0.35,
        fontSize: index === 3 ? 86 : 74,
      });
      label.plane.position.set(
        index === 3 ? centerX + 0.12 : centerX,
        unrolledY + 0.34,
        0.34,
      );
      label.plane.scale.setScalar(0.84);
      contentGroup.add(label.plane);
      measurementLabels.push({ ...label, delay: index * 0.2 });
      measurementCursor += length;
    });

    const formula = createCircumferenceFormulaPlane();
    formula.plane.position.set(0, -1.68, 0.43);
    formula.plane.scale.setScalar(0.84);
    contentGroup.add(formula.plane);

    const sparkleColors = [0x32a9bb, 0x7769c5, 0xefa94d];
    const sparkles = Array.from({ length: 15 }, (_, index) => {
      const angle = (index / 15) * Math.PI * 2 + (index % 3) * 0.17;
      const radius = 0.52 + (index % 4) * 0.12;
      const material = new THREE.MeshBasicMaterial({
        color: sparkleColors[index % sparkleColors.length],
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), material);
      mesh.position.set(Math.cos(angle) * 0.2, -1.93 + Math.sin(angle) * 0.1, 0.5);
      contentGroup.add(mesh);
      return {
        mesh,
        material,
        angle,
        radius,
        start: mesh.position.clone(),
      };
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    diameterGuideAnimation = (elapsed) => {
      const timeline = prefersReducedMotion ? 8 : elapsed;
      const intro = smootherProgress(timeline / 0.75);
      const diameterReveal = smootherProgress((timeline - 0.35) / 0.7);
      const unrollTimeline = clampProgress((timeline - 1.1) / 2.45);
      const circleGhost = smootherProgress((timeline - 1.35) / 1.9);
      const measurementsReveal = smootherProgress((timeline - 3.5) / 0.55);
      const formulaReveal = smootherProgress((timeline - 4.45) / 0.62);

      circumferenceCaption.material.opacity = intro * (1 - smootherProgress((timeline - 2.1) / 0.55));
      diameterMaterial.opacity = diameterReveal * (1 - circleGhost * 0.1);
      diameterCaption.material.opacity = diameterReveal * (1 - circleGhost * 0.1);
      circleFillMaterial.opacity = 0.58 - circleGhost * (isLightTheme ? 0.4 : 0.48);
      circleFillMaterial.emissiveIntensity = 0.1 + Math.sin(timeline * 3.5) * 0.025 * (1 - circleGhost);

      const cutPulse = clampProgress((timeline - 0.72) / 0.35) * (1 - clampProgress((timeline - 2.45) / 0.5));
      cutMaterial.opacity = cutPulse;
      cutHaloMaterial.opacity = cutPulse * 0.72;
      cutHalo.scale.setScalar(0.78 + (timeline % 0.8) * 0.65);

      animatedCircumference.forEach(({ mesh, start, target, startRotation, order }) => {
        const localProgress = smootherProgress((unrollTimeline - order * 0.18) / 0.82);
        mesh.position.lerpVectors(start, target, localProgress);
        mesh.position.y += Math.sin(localProgress * Math.PI) * (0.34 + order * 0.26);
        mesh.position.z = THREE.MathUtils.lerp(0.24, 0.27, localProgress) +
          Math.sin(localProgress * Math.PI) * 0.48;
        mesh.rotation.z = THREE.MathUtils.lerp(startRotation, 0, localProgress);
      });

      tickMaterial.opacity = measurementsReveal * 0.84;
      measurementGroups.forEach((group, index) => {
        const reveal = smootherProgress((timeline - 3.55 - index * 0.2) / 0.42);
        measurementMaterials[index].opacity = reveal * 0.9;
        group.scale.y = reveal;
      });
      measurementLabels.forEach(({ plane, material, delay }) => {
        const reveal = smootherProgress((timeline - 3.62 - delay) / 0.44);
        material.opacity = reveal;
        const scale = 0.84 + reveal * 0.16;
        plane.scale.setScalar(scale);
      });

      formula.material.opacity = formulaReveal;
      const formulaScale = 0.84 + formulaReveal * 0.16 + Math.sin(formulaReveal * Math.PI) * 0.045;
      formula.plane.scale.setScalar(formulaScale);

      const celebration = smootherProgress((timeline - 4.48) / 0.28) *
        (1 - smootherProgress((timeline - 5.25) / 0.75));
      sparkles.forEach(({ mesh, material, angle, radius, start }, index) => {
        const individual = clampProgress((timeline - 4.48 - index * 0.018) / 0.75);
        mesh.position.set(
          start.x + Math.cos(angle) * radius * individual,
          start.y + Math.sin(angle) * radius * individual + individual * 0.15,
          start.z,
        );
        mesh.rotation.z = individual * Math.PI * 1.8;
        mesh.scale.setScalar(0.35 + Math.sin(individual * Math.PI) * 1.15);
        material.opacity = celebration * (1 - individual * 0.35);
      });

      const settledPulse = formulaReveal * (0.5 + Math.sin(timeline * 2.8) * 0.5);
      circumferenceMaterials.forEach((material, index) => {
        material.color
          .copy(circumferenceBaseColors[index])
          .lerp(circumferenceGlowColors[index], settledPulse * (index === 3 ? 0.52 : 0.2));
      });
    };
  }

  if (isRadiusPiStage) {
    const textColor = isLightTheme ? "#44364f" : "#f1ebf5";
    const mutedTextColor = isLightTheme ? "#695a73" : "#d8cfdf";
    const piTextColor = isLightTheme ? "#bd681c" : "#ffc46a";
    const diameterColor = isLightTheme ? 0x6546a2 : 0xa991e8;
    const firstCircumferenceColor = isLightTheme ? 0x087f90 : 0x42bac9;
    const secondCircumferenceColor = isLightTheme ? 0x3568ad : 0x609bdc;

    const heading = createTextPlane({
      text: "둘레 ÷ 지름 = π",
      color: textColor,
      width: 4.8,
      height: 0.52,
      fontSize: 82,
    });
    heading.plane.position.set(0, 2.88, 0.42);
    contentGroup.add(heading.plane);

    const comparisonCircles: Array<{
      group: THREE.Group;
      fillMaterial: THREE.MeshStandardMaterial;
      edgeMaterial: THREE.MeshBasicMaterial;
      diameterMaterial: THREE.MeshBasicMaterial;
      labelMaterials: THREE.MeshBasicMaterial[];
      revealAt: number;
    }> = [];

    const createDiameterCircle = ({
      radius: circleRadius,
      x,
      y,
      diameterLabel,
      circumferenceLabel,
      circumferenceColor,
      revealAt,
    }: {
      radius: number;
      x: number;
      y: number;
      diameterLabel: string;
      circumferenceLabel: string;
      circumferenceColor: number;
      revealAt: number;
    }) => {
      const group = new THREE.Group();
      group.position.set(x, y, 0);
      group.scale.setScalar(0.001);
      contentGroup.add(group);

      const fillMaterial = new THREE.MeshStandardMaterial({
        color: circumferenceColor,
        emissive: circumferenceColor,
        emissiveIntensity: 0.08,
        roughness: 0.44,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const fill = new THREE.Mesh(new THREE.CircleGeometry(circleRadius, 64), fillMaterial);
      fill.position.z = 0.04;
      group.add(fill);

      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: circumferenceColor,
        transparent: true,
        opacity: 0,
        toneMapped: false,
      });
      const edge = new THREE.Mesh(
        new THREE.TorusGeometry(circleRadius, 0.065, 10, 72),
        edgeMaterial,
      );
      edge.position.z = 0.16;
      group.add(edge);

      const diameterMaterial = new THREE.MeshBasicMaterial({
        color: diameterColor,
        transparent: true,
        opacity: 0,
        toneMapped: false,
      });
      const diameter = new THREE.Mesh(
        new THREE.BoxGeometry(circleRadius * 2, 0.055, 0.07),
        diameterMaterial,
      );
      diameter.position.z = 0.22;
      group.add(diameter);

      for (const direction of [-1, 1]) {
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 8), diameterMaterial);
        arrow.position.set(direction * circleRadius, 0, 0.24);
        arrow.rotation.z = direction === -1 ? Math.PI / 2 : -Math.PI / 2;
        group.add(arrow);
      }

      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 14, 10),
        new THREE.MeshBasicMaterial({ color: 0xf0a44c, toneMapped: false }),
      );
      center.position.z = 0.28;
      group.add(center);

      const diameterText = createTextPlane({
        text: diameterLabel,
        color: mutedTextColor,
        width: 1.55,
        height: 0.4,
        fontSize: 92,
      });
      diameterText.plane.position.set(0, circleRadius * 0.38, 0.32);
      group.add(diameterText.plane);

      const circumferenceText = createTextPlane({
        text: circumferenceLabel,
        color: piTextColor,
        width: 1.75,
        height: 0.44,
        fontSize: 104,
      });
      circumferenceText.plane.position.set(0, -circleRadius - 0.3, 0.32);
      group.add(circumferenceText.plane);

      comparisonCircles.push({
        group,
        fillMaterial,
        edgeMaterial,
        diameterMaterial,
        labelMaterials: [diameterText.material, circumferenceText.material],
        revealAt,
      });
    };

    createDiameterCircle({
      radius: 0.55,
      x: -1.65,
      y: 1.4,
      diameterLabel: "지름 = 1",
      circumferenceLabel: "둘레 = π",
      circumferenceColor: firstCircumferenceColor,
      revealAt: 0.2,
    });
    createDiameterCircle({
      radius: 1.1,
      x: 1.05,
      y: 1.4,
      diameterLabel: "지름 = 2",
      circumferenceLabel: "둘레 = 2π",
      circumferenceColor: secondCircumferenceColor,
      revealAt: 0.9,
    });

    const doubleLabel = createTextPlane({
      text: "× 2",
      color: piTextColor,
      width: 0.9,
      height: 0.48,
      fontSize: 88,
      canvasWidth: 300,
    });
    doubleLabel.plane.position.set(-0.45, 1.4, 0.45);
    doubleLabel.plane.scale.setScalar(0.72);
    contentGroup.add(doubleLabel.plane);

    const generalCircleGroup = new THREE.Group();
    const generalCircleRadius = 1.05;
    generalCircleGroup.position.set(0, -1.3, 0);
    generalCircleGroup.scale.setScalar(0.001);
    contentGroup.add(generalCircleGroup);

    const generalFillMaterial = new THREE.MeshStandardMaterial({
      color: isLightTheme ? 0x74b9c5 : 0x85c9d2,
      emissive: isLightTheme ? 0x397b89 : 0x397b89,
      emissiveIntensity: 0.08,
      roughness: 0.46,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const generalFill = new THREE.Mesh(
      new THREE.CircleGeometry(generalCircleRadius, 64),
      generalFillMaterial,
    );
    generalFill.position.z = 0.04;
    generalCircleGroup.add(generalFill);

    const generalEdgeMaterial = new THREE.MeshBasicMaterial({
      color: isLightTheme ? 0xc36e20 : 0xffbd63,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const generalEdge = new THREE.Mesh(
      new THREE.TorusGeometry(generalCircleRadius, 0.075, 10, 80),
      generalEdgeMaterial,
    );
    generalEdge.position.z = 0.18;
    generalCircleGroup.add(generalEdge);

    const leftRadiusMaterial = new THREE.MeshBasicMaterial({
      color: diameterColor,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const rightRadiusMaterial = new THREE.MeshBasicMaterial({
      color: isLightTheme ? 0xd77a27 : 0xffb45e,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    for (const direction of [-1, 1]) {
      const radiusMaterial = direction === -1 ? leftRadiusMaterial : rightRadiusMaterial;
      const radiusLine = new THREE.Mesh(
        new THREE.BoxGeometry(generalCircleRadius, 0.07, 0.075),
        radiusMaterial,
      );
      radiusLine.position.set((direction * generalCircleRadius) / 2, 0, 0.25);
      generalCircleGroup.add(radiusLine);

      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.17, 9), radiusMaterial);
      arrow.position.set(direction * generalCircleRadius, 0, 0.27);
      arrow.rotation.z = direction === -1 ? Math.PI / 2 : -Math.PI / 2;
      generalCircleGroup.add(arrow);
    }

    const generalCenter = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff1d1, toneMapped: false }),
    );
    generalCenter.position.z = 0.32;
    generalCircleGroup.add(generalCenter);

    const radiusLabels = [-1, 1].map((direction) => {
      const label = createTextPlane({
        text: "r",
        color: direction === -1 ? (isLightTheme ? "#6546a2" : "#c7b4ff") : piTextColor,
        width: 0.58,
        height: 0.4,
        fontSize: 150,
        canvasWidth: 180,
      });
      label.plane.position.set(direction * generalCircleRadius * 0.52, -0.26, 0.36);
      generalCircleGroup.add(label.plane);
      return label;
    });

    const radiusSumLabel = createTextPlane({
      text: "r + r = 2r",
      color: textColor,
      width: 2.2,
      height: 0.4,
      fontSize: 72,
    });
    radiusSumLabel.plane.position.set(0, 0.42, 0.4);
    generalCircleGroup.add(radiusSumLabel.plane);

    const tracerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe39a,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), tracerMaterial);
    tracer.position.set(0, -generalCircleRadius, 0.4);
    generalCircleGroup.add(tracer);
    const tracerHaloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffca61,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const tracerHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.025, 8, 28),
      tracerHaloMaterial,
    );
    tracerHalo.position.copy(tracer.position);
    generalCircleGroup.add(tracerHalo);

    const formula = createRadiusPiFormulaPlane();
    formula.plane.position.set(0, -3.18, 0.44);
    formula.plane.scale.setScalar(0.82);
    contentGroup.add(formula.plane);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    radiusPiAnimation = (elapsed) => {
      const timeline = prefersReducedMotion ? 8 : elapsed;
      const headingReveal = smootherProgress(timeline / 0.6);
      heading.material.opacity = headingReveal;

      comparisonCircles.forEach(
        ({ group, fillMaterial, edgeMaterial, diameterMaterial, labelMaterials, revealAt }, index) => {
          const reveal = smootherProgress((timeline - revealAt) / 0.68);
          const scale = 0.001 + reveal * 0.999 + Math.sin(reveal * Math.PI) * 0.055;
          group.scale.setScalar(scale);
          fillMaterial.opacity = reveal * 0.42;
          edgeMaterial.opacity = reveal;
          diameterMaterial.opacity = reveal * 0.94;
          labelMaterials.forEach((material) => {
            material.opacity = reveal;
          });
          const pulse = reveal * (0.78 + Math.sin(timeline * 2.5 + index) * 0.22);
          edgeMaterial.opacity = 0.78 * reveal + pulse * 0.22;
        },
      );

      const doubleReveal = smootherProgress((timeline - 1.55) / 0.5);
      doubleLabel.material.opacity = doubleReveal;
      doubleLabel.plane.scale.setScalar(0.72 + doubleReveal * 0.28);

      const generalReveal = smootherProgress((timeline - 2.15) / 0.78);
      const generalScale = 0.001 + generalReveal * 0.999 + Math.sin(generalReveal * Math.PI) * 0.05;
      generalCircleGroup.scale.setScalar(generalScale);
      generalFillMaterial.opacity = generalReveal * 0.38;
      generalEdgeMaterial.opacity = generalReveal;
      leftRadiusMaterial.opacity = generalReveal * 0.95;
      rightRadiusMaterial.opacity = generalReveal * 0.95;
      radiusLabels.forEach(({ material }) => {
        material.opacity = generalReveal;
      });
      radiusSumLabel.material.opacity = generalReveal;

      const traceProgress = clampProgress((timeline - 3.05) / 1.28);
      const traceAngle = -Math.PI / 2 + traceProgress * Math.PI * 2;
      tracer.position.set(
        Math.cos(traceAngle) * generalCircleRadius,
        Math.sin(traceAngle) * generalCircleRadius,
        0.4,
      );
      tracerHalo.position.copy(tracer.position);
      const traceVisibility = generalReveal * (1 - smootherProgress((timeline - 4.42) / 0.34));
      tracerMaterial.opacity = traceVisibility;
      tracerHaloMaterial.opacity = traceVisibility * 0.72;
      tracerHalo.scale.setScalar(0.75 + (timeline % 0.7) * 0.7);
      generalEdgeMaterial.opacity = generalReveal * (0.82 + Math.sin(timeline * 3.1) * 0.18);

      const formulaReveal = smootherProgress((timeline - 4.18) / 0.68);
      formula.material.opacity = formulaReveal;
      const formulaScale = 0.82 + formulaReveal * 0.18 + Math.sin(formulaReveal * Math.PI) * 0.045;
      formula.plane.scale.setScalar(formulaScale);
    };
  }

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(
      isDiameterGuideStage
        ? referenceRadius * 2 * 3.14 + 0.5
        : isRadiusPiStage
          ? 5.6
          : rectangleWidth + 1,
      isDiameterGuideStage ? 4.8 : isRadiusPiStage ? 8.4 : 4.2,
      0.01,
    ),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, isDiameterGuideStage ? 1.1 : isRadiusPiStage ? -0.45 : 0, -0.5);
  contentGroup.add(layoutBounds);

  if (diameterGuideAnimation) {
    return { animate: diameterGuideAnimation };
  }

  if (radiusPiAnimation) {
    return { animate: radiusPiAnimation };
  }

  if (circleSlices.length === 0) return {};

  return {
    animate(elapsed) {
      const startsAt = isPizzaStage ? 0.8 : 0.2;
      const duration = isPizzaStage ? 2.2 : isUltraFineSliceStage ? 6 : isFineSliceStage ? 5 : 2.8;
      circleSlices.forEach(({ object, target, targetRotation, delay }) => {
        const progress = THREE.MathUtils.smoothstep((elapsed - startsAt - delay) / duration, 0, 1);
        const lift = Math.sin(progress * Math.PI) * 0.55;
        object.position.set(target.x * progress, target.y * progress, target.z + lift);
        object.rotation.z = targetRotation * progress;
      });
    },
  };
}
