import * as THREE from "three";
import type { LessonScene, LessonSceneContext } from "../types";

export function buildCircleAreaScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, circleStage, helpers } = context;
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
  const isPizzaStage = circleStage === 2;
  const isFineSliceStage = circleStage === 3;
  const isUltraFineSliceStage = circleStage === 4;
  const isDenseSliceStage = isFineSliceStage || isUltraFineSliceStage;
  const sliceCount = isDiameterGuideStage ? 0 : isPizzaStage ? 8 : isUltraFineSliceStage ? 160 : 48;
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

    const circleFill = new THREE.Mesh(
      new THREE.CircleGeometry(referenceRadius, 48),
      new THREE.MeshStandardMaterial({
        color: 0x9edce3,
        emissive: 0x6ba8b6,
        emissiveIntensity: 0.1,
        roughness: 0.45,
        metalness: 0.02,
        transparent: true,
        opacity: 0.52,
        side: THREE.DoubleSide,
      }),
    );
    circleFill.position.z = 0.02;
    referenceGroup.add(circleFill);

    const circleEdge = new THREE.Mesh(
      new THREE.TorusGeometry(referenceRadius, 0.065, 10, 48),
      new THREE.MeshStandardMaterial({
        color: 0x287cad,
        emissive: 0x287cad,
        emissiveIntensity: 0.12,
        roughness: 0.36,
      }),
    );
    circleEdge.position.z = 0.12;
    referenceGroup.add(circleEdge);

    const radiusColor = 0xe6894e;
    const diameterColor = 0x9b84d9;
    const radiusMaterial = new THREE.MeshBasicMaterial({ color: radiusColor });
    const diameterMaterial = new THREE.MeshBasicMaterial({ color: diameterColor });
    const radiusLine = new THREE.Mesh(
      new THREE.BoxGeometry(referenceRadius, 0.07, 0.08),
      radiusMaterial,
    );
    radiusLine.position.set(referenceRadius / 2, 0, 0.18);
    referenceGroup.add(radiusLine);
    const diameterLine = new THREE.Mesh(
      new THREE.BoxGeometry(referenceRadius * 2, 0.06, 0.07),
      diameterMaterial,
    );
    diameterLine.position.z = 0.15;
    referenceGroup.add(diameterLine);

    const arrowGeometry = new THREE.ConeGeometry(0.09, 0.2, 10);
    const radiusArrow = new THREE.Mesh(arrowGeometry, radiusMaterial);
    radiusArrow.position.set(referenceRadius, 0, 0.22);
    radiusArrow.rotation.z = -Math.PI / 2;
    referenceGroup.add(radiusArrow);
    for (const direction of [-1, 1]) {
      const arrow = new THREE.Mesh(arrowGeometry, diameterMaterial);
      arrow.position.set(direction * referenceRadius, 0, 0.19);
      arrow.rotation.z = direction === -1 ? Math.PI / 2 : -Math.PI / 2;
      referenceGroup.add(arrow);
    }

    const centerPoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 10),
      new THREE.MeshBasicMaterial({ color: radiusColor }),
    );
    centerPoint.position.z = 0.24;
    referenceGroup.add(centerPoint);

    const radiusThree = createDigitSlot(radiusColor);
    showDigit(radiusThree, "3");
    radiusThree.position.set(referenceRadius / 2, -0.28, 0.3);
    radiusThree.scale.setScalar(0.34);
    referenceGroup.add(radiusThree);
    const diameterSix = createDigitSlot(diameterColor);
    showDigit(diameterSix, "6");
    diameterSix.position.set(0, -0.42, 0.3);
    diameterSix.scale.setScalar(0.3);
    referenceGroup.add(diameterSix);

    const unrolledY = -0.75;
    const visualDiameter = referenceRadius * 2;
    const circumferenceLength = visualDiameter * 3.14;
    const segmentMultiples = [1, 1, 1, 0.14];
    const segmentColors = [0x72bec8, 0x72bec8, 0x72bec8, 0xf1b768];
    let cursor = -circumferenceLength / 2;
    const circumferenceLineGroup = new THREE.Group();
    contentGroup.add(circumferenceLineGroup);
    segmentMultiples.forEach((multiple, index) => {
      const length = visualDiameter * multiple;
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.09, 0.08),
        new THREE.MeshStandardMaterial({
          color: segmentColors[index],
          emissive: segmentColors[index],
          emissiveIntensity: 0.12,
          roughness: 0.35,
        }),
      );
      line.position.set(cursor + length / 2, unrolledY, 0.2);
      circumferenceLineGroup.add(line);

      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.25, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x5b6977 }),
      );
      tick.position.set(cursor, unrolledY, 0.22);
      circumferenceLineGroup.add(tick);
      cursor += length;
    });
    const finalTick = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.25, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x5b6977 }),
    );
    finalTick.position.set(cursor, unrolledY, 0.22);
    circumferenceLineGroup.add(finalTick);

    const circumferenceArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x72bec8 });
    for (const direction of [-1, 1]) {
      const arrow = new THREE.Mesh(arrowGeometry, circumferenceArrowMaterial);
      arrow.position.set((direction * circumferenceLength) / 2, unrolledY, 0.24);
      arrow.rotation.z = direction === -1 ? Math.PI / 2 : -Math.PI / 2;
      circumferenceLineGroup.add(arrow);
    }

    const formulaCanvas = document.createElement("canvas");
    formulaCanvas.width = 1400;
    formulaCanvas.height = 180;
    const formulaContext = formulaCanvas.getContext("2d");
    if (formulaContext) {
      formulaContext.clearRect(0, 0, formulaCanvas.width, formulaCanvas.height);
      formulaContext.fillStyle = "#62506f";
      formulaContext.font = '800 74px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
      formulaContext.textAlign = "center";
      formulaContext.textBaseline = "middle";
      formulaContext.fillText("원의 둘레 = 지름 × 3.14", formulaCanvas.width / 2, formulaCanvas.height / 2);
    }
    const formulaTexture = new THREE.CanvasTexture(formulaCanvas);
    formulaTexture.colorSpace = THREE.SRGBColorSpace;
    formulaTexture.anisotropy = 4;
    const formulaPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 0.62),
      new THREE.MeshBasicMaterial({ map: formulaTexture, transparent: true, depthWrite: false }),
    );
    formulaPlane.position.set(0, unrolledY + 0.45, 0.32);
    contentGroup.add(formulaPlane);
  }

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(
      isDiameterGuideStage ? referenceRadius * 2 * 3.14 + 0.5 : rectangleWidth + 1,
      isDiameterGuideStage ? 4.8 : 4.2,
      0.01,
    ),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, isDiameterGuideStage ? 1.1 : 0, -0.5);
  contentGroup.add(layoutBounds);

  if (circleSlices.length === 0) return {};

  return {
    animate(elapsed) {
      const startsAt = circleStage === 2 ? 0.8 : 0.2;
      const duration = circleStage === 2 ? 2.2 : isUltraFineSliceStage ? 6 : isFineSliceStage ? 5 : 2.8;
      circleSlices.forEach(({ object, target, targetRotation, delay }) => {
        const progress = THREE.MathUtils.smoothstep((elapsed - startsAt - delay) / duration, 0, 1);
        const lift = Math.sin(progress * Math.PI) * 0.55;
        object.position.set(target.x * progress, target.y * progress, target.z + lift);
        object.rotation.z = targetRotation * progress;
      });
    },
  };
}
