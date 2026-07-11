import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildTimesTableTwoScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, helpers } = context;
  const { createDigitSlot, showDigit, createEquationSymbol } = helpers;
  const symbolColor = 0x8a8194;
  const additionColor = 0x53aebb;
  const productColor = 0x9b84d9;
  const timesTableRows: THREE.Group[] = [];
  const timesTableAdditionRows: THREE.Group[] = [];
  let lastTimesTableStep = -1;

  const buildTimesRow = (multiplier: number) => {
    const row = new THREE.Group();
    const items: THREE.Object3D[] = [];
    const two = createDigitSlot(additionColor);
    showDigit(two, "2");
    items.push(two, createEquationSymbol("multiply", 0xe6894e));
    const multiplierSlot = createDigitSlot(productColor);
    showDigit(multiplierSlot, String(multiplier));
    items.push(multiplierSlot, createEquationSymbol("equals", symbolColor));
    String(multiplier * 2)
      .split("")
      .forEach((digit) => {
        const slot = createDigitSlot(productColor);
        showDigit(slot, digit);
        items.push(slot);
      });
    const gap = 0.62;
    items.forEach((item, index) => {
      item.position.x = (index - (items.length - 1) / 2) * gap;
      row.add(item);
    });
    row.position.set(2.7, 3.45 - (multiplier - 1) * 0.82, 0.45);
    row.scale.setScalar(0.43);
    contentGroup.add(row);
    timesTableRows.push(row);
  };

  for (let multiplier = 1; multiplier <= 9; multiplier += 1) {
    buildTimesRow(multiplier);
  }

  const buildAdditionRow = (multiplier: number) => {
    const row = new THREE.Group();
    const items: THREE.Object3D[] = [];
    const zero = createDigitSlot(additionColor);
    showDigit(zero, "0");
    items.push(zero);
    for (let count = 0; count < multiplier; count += 1) {
      items.push(createEquationSymbol("plus", symbolColor));
      const two = createDigitSlot(additionColor);
      showDigit(two, "2");
      items.push(two);
    }
    items.push(createEquationSymbol("equals", symbolColor));
    String(multiplier * 2)
      .split("")
      .forEach((digit) => {
        const slot = createDigitSlot(productColor);
        showDigit(slot, digit);
        items.push(slot);
      });
    const gap = 0.54;
    items.forEach((item, index) => {
      item.position.x = (index - (items.length - 1) / 2) * gap;
      row.add(item);
    });
    const baseScale = Math.min(0.43, 3.95 / (items.length * gap));
    row.position.set(-2.7, 3.45 - (multiplier - 1) * 0.82, 0.45);
    row.scale.setScalar(baseScale);
    row.userData.baseScale = baseScale;
    contentGroup.add(row);
    timesTableAdditionRows.push(row);
  };

  for (let multiplier = 1; multiplier <= 9; multiplier += 1) {
    buildAdditionRow(multiplier);
  }

  const draw = (step: number) => {
    timesTableRows.forEach((row, index) => {
      row.scale.setScalar(index === step - 1 ? 0.55 : 0.43);
    });
    timesTableAdditionRows.forEach((row, index) => {
      const baseScale = row.userData.baseScale as number;
      row.scale.setScalar(index === step - 1 ? baseScale * 1.22 : baseScale);
    });
  };
  draw(1);

  return {
    animate(elapsed) {
      const step = (Math.floor(elapsed / 1.25) % 9) + 1;
      if (step !== lastTimesTableStep) {
        draw(step);
        lastTimesTableStep = step;
      }
    },
  };
}
