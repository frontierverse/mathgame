import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildPowersScene({ contentGroup, helpers }: LessonSceneContext): LessonScene {
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

function createTextPlane(text: string, color: string, fontSize: number) {
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
    new THREE.PlaneGeometry(3.8, 0.84),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
}
