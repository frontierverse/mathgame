import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildPowersScene({ contentGroup, helpers, powersStage }: LessonSceneContext): LessonScene {
  if (powersStage === 1) {
    return buildPowersTermsScene(contentGroup, helpers);
  }

  const { createDigitSlot, showDigit, createEquationSymbol } = helpers;
  const baseColor = 0x53aebb;
  const additionColor = 0xe6894e;
  const exponentColor = 0x9b84d9;
  const symbolColor = 0x8a8194;
  const repeatedAdditionRow = new THREE.Group();
  const repeatedGap = 1.08;

  for (let index = 0; index < 8; index += 1) {
    const two = createDigitSlot(additionColor);
    showDigit(two, "2");
    two.position.x = (index - 3.5) * repeatedGap;
    repeatedAdditionRow.add(two);
    if (index > 0) {
      const plus = createEquationSymbol("plus", symbolColor);
      plus.position.x = (index - 4) * repeatedGap;
      plus.scale.setScalar(0.7);
      repeatedAdditionRow.add(plus);
    }
  }

  const equals = createEquationSymbol("equals", symbolColor);
  equals.position.x = 4.65;
  equals.scale.setScalar(0.68);
  const multiplyBase = createDigitSlot(baseColor);
  showDigit(multiplyBase, "2");
  multiplyBase.position.x = 5.55;
  const multiply = createEquationSymbol("multiply", symbolColor);
  multiply.position.x = 6.25;
  multiply.scale.setScalar(0.72);
  const multiplyCount = createDigitSlot(exponentColor);
  showDigit(multiplyCount, "8");
  multiplyCount.position.x = 6.95;
  const additionResultEquals = createEquationSymbol("equals", symbolColor);
  additionResultEquals.position.x = 7.78;
  additionResultEquals.scale.setScalar(0.68);
  const additionResultTens = createDigitSlot(baseColor);
  showDigit(additionResultTens, "1");
  additionResultTens.position.x = 8.45;
  const additionResultOnes = createDigitSlot(baseColor);
  showDigit(additionResultOnes, "6");
  additionResultOnes.position.x = 9.25;
  repeatedAdditionRow.add(
    equals,
    multiplyBase,
    multiply,
    multiplyCount,
    additionResultEquals,
    additionResultTens,
    additionResultOnes,
  );
  repeatedAdditionRow.position.set(-1.6, 2.25, 0.3);
  repeatedAdditionRow.scale.setScalar(0.58);
  contentGroup.add(repeatedAdditionRow);

  const additionText = createTextPlane("2를 8번 더했다", "#9a5c32", 94);
  additionText.position.set(2.05, 1.12, 0.3);
  contentGroup.add(additionText);

  const powerEquationRow = new THREE.Group();
  const powerGap = 1.12;
  for (let index = 0; index < 4; index += 1) {
    const two = createDigitSlot(baseColor);
    showDigit(two, "2");
    two.position.x = -3.05 + index * powerGap;
    powerEquationRow.add(two);
    if (index > 0) {
      const factor = createEquationSymbol("multiply", symbolColor);
      factor.position.x = -3.05 + (index - 0.5) * powerGap;
      factor.scale.setScalar(0.7);
      powerEquationRow.add(factor);
    }
  }
  const powerEquals = createEquationSymbol("equals", symbolColor);
  powerEquals.position.x = 1.55;
  powerEquals.scale.setScalar(0.7);
  const powerBase = createDigitSlot(baseColor);
  showDigit(powerBase, "2");
  powerBase.position.x = 2.38;
  const powerExponent = createDigitSlot(exponentColor);
  showDigit(powerExponent, "4");
  powerExponent.position.set(3.02, 0.58, 0.05);
  powerExponent.scale.setScalar(0.5);
  const powerResultEquals = createEquationSymbol("equals", symbolColor);
  powerResultEquals.position.x = 3.82;
  powerResultEquals.scale.setScalar(0.7);
  const powerResultTens = createDigitSlot(baseColor);
  showDigit(powerResultTens, "1");
  powerResultTens.position.x = 4.52;
  const powerResultOnes = createDigitSlot(baseColor);
  showDigit(powerResultOnes, "6");
  powerResultOnes.position.x = 5.32;
  powerEquationRow.add(
    powerEquals,
    powerBase,
    powerExponent,
    powerResultEquals,
    powerResultTens,
    powerResultOnes,
  );
  powerEquationRow.position.set(-0.9, -0.68, 0.3);
  powerEquationRow.scale.setScalar(0.74);
  contentGroup.add(powerEquationRow);

  const powerText = createTextPlane("2를 4번 곱했다", "#62506f", 90);
  powerText.position.set(0.86, -1.55, 0.3);
  contentGroup.add(powerText);

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 5.8, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.25, -0.5);
  contentGroup.add(layoutBounds);

  return {};
}

function buildPowersTermsScene(contentGroup: THREE.Group, helpers: LessonSceneContext["helpers"]): LessonScene {
  const { createDigitSlot, showDigit, createEquationSymbol } = helpers;
  const baseColor = 0x53aebb;
  const exponentColor = 0x9b84d9;
  const symbolColor = 0x8a8194;

  const repeatedNumbers = new THREE.Group();
  for (let index = 0; index < 4; index += 1) {
    const factor = createDigitSlot(baseColor);
    showDigit(factor, "2");
    factor.position.x = index * 1.05;
    repeatedNumbers.add(factor);

    if (index > 0) {
      const multiply = createEquationSymbol("multiply", symbolColor);
      multiply.position.x = index * 1.05 - 0.52;
      multiply.scale.setScalar(0.68);
      repeatedNumbers.add(multiply);
    }
  }
  repeatedNumbers.position.set(-2.95, 0.35, 0.3);
  repeatedNumbers.scale.setScalar(0.78);
  contentGroup.add(repeatedNumbers);

  const equals = createEquationSymbol("equals", symbolColor);
  equals.position.set(0.35, 0.35, 0.3);
  equals.scale.setScalar(0.82);
  contentGroup.add(equals);

  const powerExpression = new THREE.Group();
  const base = createDigitSlot(baseColor);
  showDigit(base, "2");
  base.scale.setScalar(1.65);
  base.position.set(1.5, 0.1, 0.3);

  const exponent = createDigitSlot(exponentColor);
  showDigit(exponent, "4");
  exponent.scale.setScalar(0.82);
  exponent.position.set(2.45, 1.2, 0.35);
  powerExpression.add(base, exponent);
  contentGroup.add(powerExpression);

  const repeatedCount = createLabelPlane("4개", "#7258b1", "#f1edff");
  repeatedCount.position.set(-1.72, 1.78, 0.28);
  repeatedCount.scale.setScalar(0.82);
  contentGroup.add(repeatedCount);

  const countArrow = createArrow(
    new THREE.Vector3(-0.95, 1.82, 0.2),
    new THREE.Vector3(2.12, 1.46, 0.2),
    exponentColor,
  );
  contentGroup.add(countArrow);

  const baseName = createLabelPlane("밑", "#318696", "#e7f8fa");
  baseName.position.set(1.5, -1.5, 0.28);
  baseName.scale.setScalar(0.82);
  const exponentName = createLabelPlane("지수", "#7258b1", "#f1edff");
  exponentName.position.set(3.5, 1.2, 0.28);
  exponentName.scale.setScalar(0.82);
  contentGroup.add(baseName, exponentName);

  const baseLabelArrow = createArrow(
    new THREE.Vector3(1.5, -1.08, 0.2),
    new THREE.Vector3(1.5, -0.5, 0.2),
    baseColor,
  );
  const exponentLabelArrow = createArrow(
    new THREE.Vector3(3.08, 1.2, 0.2),
    new THREE.Vector3(2.72, 1.2, 0.2),
    exponentColor,
  );
  contentGroup.add(baseLabelArrow, exponentLabelArrow);

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 6.2, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, 0.15, -0.5);
  contentGroup.add(layoutBounds);

  return {};
}

function createArrow(start: THREE.Vector3, end: THREE.Vector3, color: number) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, Math.max(0.1, length - 0.18), 12),
    new THREE.MeshBasicMaterial({ color }),
  );
  shaft.position.copy(start).lerp(end, 0.46);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.3, 16),
    new THREE.MeshBasicMaterial({ color }),
  );
  head.position.copy(end);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  group.add(shaft, head);
  return group;
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

function createTextPlane(text: string, color: string, fontSize: number, width = 3.8) {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 220;
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
    new THREE.PlaneGeometry(width, 0.84),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}
