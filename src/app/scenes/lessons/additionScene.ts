import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildAdditionScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, helpers } = context;
  const { createDigitSlot, showDigit, createEquationSymbol, createOrb } = helpers;
  const additionOrbs: THREE.Mesh[] = [];
  let additionCountMarker: THREE.Mesh | null = null;
  let additionEquationGroup: THREE.Group | null = null;
  let lastAdditionStep = -1;

  const updateAdditionEquation = (before: number) => {
    if (!additionEquationGroup) return;

    const beforeDigits = String(before).padStart(2, " ");
    const afterDigits = String(before + 1).padStart(3, " ");
    const slots = additionEquationGroup.userData.digitSlots as THREE.Group[];
    showDigit(slots[0], beforeDigits[0] === " " ? undefined : beforeDigits[0]);
    showDigit(slots[1], beforeDigits[1]);
    showDigit(slots[2], "1");
    showDigit(slots[3], afterDigits[0] === " " ? undefined : afterDigits[0]);
    showDigit(slots[4], afterDigits[1] === " " ? undefined : afterDigits[1]);
    showDigit(slots[5], afterDigits[2]);
  };

  const gridSize = 10;
  const spacing = 0.72;

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const index = row * gridSize + column;
      const orb = createOrb(
        new THREE.Vector3(
          (column - (gridSize - 1) / 2) * spacing,
          0.55 + ((gridSize - 1) / 2 - row) * spacing,
          0,
        ),
        row < gridSize / 2 ? 0x9edce3 : 0xb9a9e3,
        index,
        0.56,
      );
      additionOrbs.push(orb);
    }
  }

  additionCountMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.37, 0.045, 12, 48),
    new THREE.MeshBasicMaterial({ color: 0xf08b72, transparent: true, opacity: 0.92 }),
  );
  additionCountMarker.position.set(additionOrbs[0].position.x, additionOrbs[0].position.y, 0.58);
  contentGroup.add(additionCountMarker);

  additionEquationGroup = new THREE.Group();
  const digitSlots = [
    createDigitSlot(0x72bec8),
    createDigitSlot(0x72bec8),
    createDigitSlot(0xe69a7c),
    createDigitSlot(0x9b84d9),
    createDigitSlot(0x9b84d9),
    createDigitSlot(0x9b84d9),
  ];
  const plus = createEquationSymbol("plus", 0xe69a7c);
  const equals = createEquationSymbol("equals", 0x6f6578);
  const equationItems: THREE.Object3D[] = [
    digitSlots[0],
    digitSlots[1],
    plus,
    digitSlots[2],
    equals,
    digitSlots[3],
    digitSlots[4],
    digitSlots[5],
  ];
  const itemPositions = [-2.75, -2.05, -1.35, -0.68, 0, 0.72, 1.42, 2.12];
  equationItems.forEach((item, index) => {
    item.position.x = itemPositions[index];
    additionEquationGroup?.add(item);
  });
  additionEquationGroup.position.set(0.25, -3.9, 0.45);
  additionEquationGroup.scale.setScalar(0.86);
  additionEquationGroup.userData.digitSlots = digitSlots;
  contentGroup.add(additionEquationGroup);
  updateAdditionEquation(0);

  return {
    animate(elapsed) {
      if (!additionCountMarker || additionOrbs.length === 0) return;

      const additionStep = Math.floor(elapsed / 0.75) % additionOrbs.length;
      const activeOrb = additionOrbs[additionStep];
      additionCountMarker.position.x += (activeOrb.position.x - additionCountMarker.position.x) * 0.24;
      additionCountMarker.position.y += (activeOrb.position.y - additionCountMarker.position.y) * 0.24;
      const markerScale = 1 + Math.sin(elapsed * 6) * 0.08;
      additionCountMarker.scale.setScalar(markerScale);

      if (additionStep !== lastAdditionStep) {
        additionOrbs.forEach((orb, index) => {
          const material = orb.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = index <= additionStep ? 0.72 : 0.08;
        });
        updateAdditionEquation(additionStep);
        lastAdditionStep = additionStep;
      }
    },
  };
}
