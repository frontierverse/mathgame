import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildMultiplicationScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, helpers } = context;
  const { createDigitSlot, showDigit, createEquationSymbol } = helpers;
  const multiplicationCountTotal = 7;
  let lastMultiplicationCount = -1;
  const multiplicationUnitDisplays: Array<{ draw: (count: number) => void }> = [];
  const symbolColor = 0x8a8194;
  const productColor = 0xe6894e;

  const createUnitDisplay = (baseValue: 1 | 2 | 3, centerY: number, color: number) => {
    const additionGroup = new THREE.Group();
    const zeroSlot = createDigitSlot(color);
    showDigit(zeroSlot, "0");
    additionGroup.add(zeroSlot);
    const oneTerms = Array.from({ length: multiplicationCountTotal }, () => {
      const slot = createDigitSlot(color);
      showDigit(slot, String(baseValue));
      additionGroup.add(slot);
      return slot;
    });
    const plusSymbols = Array.from({ length: multiplicationCountTotal }, () => {
      const plus = createEquationSymbol("plus", symbolColor);
      additionGroup.add(plus);
      return plus;
    });
    additionGroup.position.set(-3.5, centerY + 0.76, 0.45);
    contentGroup.add(additionGroup);

    const textCanvas = document.createElement("canvas");
    textCanvas.width = 1000;
    textCanvas.height = 140;
    const canvasContext = textCanvas.getContext("2d");
    if (!canvasContext) return;

    const texture = new THREE.CanvasTexture(textCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 0.72),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    textPlane.position.set(0, centerY - 0.2, 0.45);
    contentGroup.add(textPlane);

    const multiplyGroup = new THREE.Group();
    const multiplyOne = createDigitSlot(color);
    showDigit(multiplyOne, String(baseValue));
    const multiplySymbol = createEquationSymbol("multiply", productColor);
    const countSlots = [createDigitSlot(0x9b84d9), createDigitSlot(0x9b84d9)];
    multiplyGroup.add(multiplyOne, multiplySymbol, ...countSlots);
    multiplyGroup.position.set(0, centerY - 1.08, 0.45);
    multiplyGroup.scale.setScalar(0.72);
    contentGroup.add(multiplyGroup);

    const draw = (count: number) => {
      const digitWidth = 0.58;
      const plusWidth = 0.5;
      const totalWidth = digitWidth + count * (plusWidth + digitWidth);
      let cursor = digitWidth / 2;
      zeroSlot.position.x = 0;
      oneTerms.forEach((term, index) => {
        const visible = index < count;
        term.visible = visible;
        plusSymbols[index].visible = visible;
        if (!visible) return;
        plusSymbols[index].position.x = cursor + plusWidth / 2;
        cursor += plusWidth;
        term.position.x = cursor + digitWidth / 2;
        cursor += digitWidth;
      });
      additionGroup.scale.setScalar(Math.min(0.92, 7.4 / totalWidth));

      canvasContext.clearRect(0, 0, textCanvas.width, textCanvas.height);
      if (count > 0) {
        canvasContext.fillStyle = "#635a6c";
        canvasContext.font = '700 52px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        canvasContext.textAlign = "center";
        canvasContext.textBaseline = "middle";
        const particle = baseValue === 2 ? "를" : "을";
        canvasContext.fillText(
          `${baseValue}${particle} ${count}번 더하기`,
          textCanvas.width / 2,
          textCanvas.height / 2,
        );
      }
      texture.needsUpdate = true;

      multiplyGroup.visible = count > 0;
      if (count > 0) {
        multiplyOne.position.x = -0.9;
        multiplySymbol.position.x = -0.2;
        const countDigits = String(count).padStart(2, " ");
        showDigit(countSlots[0], countDigits[0] === " " ? undefined : countDigits[0]);
        showDigit(countSlots[1], countDigits[1]);
        countSlots[0].position.x = 0.48;
        countSlots[1].position.x = 1.23;
      }
    };

    multiplicationUnitDisplays.push({ draw });
    draw(0);
  };

  createUnitDisplay(1, 3.35, 0x53aebb);
  createUnitDisplay(2, 0, 0x9b84d9);
  createUnitDisplay(3, -3.35, 0xe6894e);

  return {
    animate(elapsed) {
      if (multiplicationUnitDisplays.length === 0) return;

      const introDuration = 1;
      const countInterval = 0.55;
      const holdDuration = 2;
      const cycleDuration = introDuration + multiplicationCountTotal * countInterval + holdDuration;
      const countTime = elapsed % cycleDuration;
      const counted =
        countTime < introDuration
          ? 0
          : Math.min(
              multiplicationCountTotal,
              Math.floor((countTime - introDuration) / countInterval) + 1,
            );

      if (counted !== lastMultiplicationCount) {
        multiplicationUnitDisplays.forEach((display) => display.draw(counted));
        lastMultiplicationCount = counted;
      }
    },
  };
}
