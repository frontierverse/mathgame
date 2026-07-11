import * as THREE from "three";
import type { LessonScene, LessonSceneContext } from "../types";

export function buildSquareAreaScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, helpers } = context;
  const { createDigitSlot, showDigit } = helpers;
  const cellSize = 0.88;
  const gap = 0.07;
  const boardSize = cellSize * 3 + gap * 4;
  const boardCenterY = 0.55;
  const leftCenterX = -3.2;
  const rightCenterX = 0;
  const emptyCenterX = 3.45;
  const areaTiles: Array<{
    group: THREE.Group;
    target: THREE.Vector3;
  }> = [];
  const areaGuideTiles: Array<{
    material: THREE.MeshStandardMaterial;
    row: number;
    column: number;
  }> = [];
  const areaColumnCounters: THREE.Group[] = [];
  const areaRowCounters: THREE.Group[] = [];
  let areaGuideUnitMarker: THREE.Group | null = null;
  let areaGuideRowMarker: THREE.Group | null = null;
  let lastAreaGuideStep = -1;

  const boardMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffbf1,
    roughness: 0.72,
    metalness: 0,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(boardSize, boardSize, 0.12), boardMaterial);
  board.position.set(leftCenterX, boardCenterY, -0.14);
  contentGroup.add(board);

  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0xc9b9d8,
    transparent: true,
    opacity: 0.68,
  });
  for (let index = 0; index <= 3; index += 1) {
    const offset = -boardSize / 2 + gap / 2 + index * (cellSize + gap);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.045, boardSize, 0.04), gridMaterial);
    vertical.position.set(leftCenterX + offset, boardCenterY, -0.04);
    contentGroup.add(vertical);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(boardSize, 0.045, 0.04), gridMaterial);
    horizontal.position.set(leftCenterX, boardCenterY + offset, -0.04);
    contentGroup.add(horizontal);
  }

  const tileColors = [
    0x9edce3,
    0xb9a9e3,
    0xf2cf8d,
    0xf2a6b1,
    0x9fd8b8,
    0x9fc4f2,
    0xe9aed8,
    0xf4aaa4,
    0xf4dc8f,
  ];
  const tileSource = new THREE.Vector3(leftCenterX, 3.45, 0.75);
  for (let index = 0; index < 9; index += 1) {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const group = new THREE.Group();
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(cellSize, cellSize, 0.16),
      new THREE.MeshStandardMaterial({
        color: tileColors[index],
        roughness: 0.42,
        metalness: 0.02,
        emissive: tileColors[index],
        emissiveIntensity: 0.1,
      }),
    );
    group.add(tile);
    const one = createDigitSlot(0x554b60);
    showDigit(one, "1");
    one.position.z = 0.12;
    one.scale.setScalar(0.36);
    group.add(one);
    const target = new THREE.Vector3(
      leftCenterX + (column - 1) * (cellSize + gap),
      boardCenterY + (1 - row) * (cellSize + gap),
      0.05,
    );
    group.position.copy(tileSource);
    group.visible = index === 0;
    contentGroup.add(group);
    areaTiles.push({ group, target });
  }

  const measureColor = 0xe6894e;
  const measureLine = new THREE.Mesh(
    new THREE.BoxGeometry(boardSize, 0.055, 0.055),
    new THREE.MeshBasicMaterial({ color: measureColor }),
  );
  measureLine.position.set(leftCenterX, boardCenterY - boardSize / 2 - 0.28, 0.08);
  contentGroup.add(measureLine);
  for (const side of [-1, 1]) {
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.28, 12),
      new THREE.MeshBasicMaterial({ color: measureColor }),
    );
    arrow.position.set(
      leftCenterX + (side * boardSize) / 2,
      boardCenterY - boardSize / 2 - 0.28,
      0.08,
    );
    arrow.rotation.z = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    contentGroup.add(arrow);
  }
  const sideLength = createDigitSlot(measureColor);
  showDigit(sideLength, "3");
  sideLength.position.set(leftCenterX, boardCenterY - boardSize / 2 - 0.72, 0.1);
  sideLength.scale.setScalar(0.44);
  contentGroup.add(sideLength);

  const guideBoard = new THREE.Mesh(
    new THREE.BoxGeometry(boardSize, boardSize, 0.12),
    boardMaterial.clone(),
  );
  guideBoard.position.set(rightCenterX, boardCenterY, -0.14);
  contentGroup.add(guideBoard);

  for (let index = 0; index < 9; index += 1) {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const color = tileColors[index];
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.48,
      metalness: 0.01,
      emissive: color,
      emissiveIntensity: 0.04,
      transparent: true,
      opacity: 0.25,
    });
    const tile = new THREE.Mesh(new THREE.BoxGeometry(cellSize, cellSize, 0.15), material);
    tile.position.set(
      rightCenterX + (column - 1) * (cellSize + gap),
      boardCenterY + (1 - row) * (cellSize + gap),
      0.04,
    );
    contentGroup.add(tile);
    areaGuideTiles.push({ material, row, column });
  }

  const createCheckMarker = (width: number, height: number, color: number) => {
    const marker = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const thickness = 0.065;
    for (const y of [-height / 2, height / 2]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(width + thickness, thickness, 0.055),
        material,
      );
      edge.position.y = y;
      marker.add(edge);
    }
    for (const x of [-width / 2, width / 2]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, height + thickness, 0.055),
        material,
      );
      edge.position.x = x;
      marker.add(edge);
    }
    marker.position.z = 0.2;
    marker.visible = false;
    contentGroup.add(marker);
    return marker;
  };

  areaGuideUnitMarker = createCheckMarker(cellSize, cellSize, 0x4f9aa6);
  areaGuideUnitMarker.userData.positions = Array.from({ length: 3 }, (_, column) =>
    new THREE.Vector3(
      rightCenterX + (column - 1) * (cellSize + gap),
      boardCenterY + cellSize + gap,
      0.2,
    ),
  );

  areaGuideRowMarker = createCheckMarker(boardSize - gap, cellSize, 0x9b84d9);
  areaGuideRowMarker.userData.positions = Array.from({ length: 3 }, (_, row) =>
    new THREE.Vector3(
      rightCenterX,
      boardCenterY + (1 - row) * (cellSize + gap),
      0.21,
    ),
  );

  const emptySquare = createCheckMarker(boardSize, boardSize, 0xe6894e);
  emptySquare.position.set(emptyCenterX, boardCenterY, 0.08);
  emptySquare.visible = true;

  const emptyMeasureY = boardCenterY - boardSize / 2 - 0.28;
  const emptyMeasureLine = new THREE.Mesh(
    new THREE.BoxGeometry(boardSize, 0.055, 0.055),
    new THREE.MeshBasicMaterial({ color: measureColor }),
  );
  emptyMeasureLine.position.set(emptyCenterX, emptyMeasureY, 0.08);
  contentGroup.add(emptyMeasureLine);
  for (const side of [-1, 1]) {
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.24, 12),
      new THREE.MeshBasicMaterial({ color: measureColor }),
    );
    arrow.position.set(emptyCenterX + (side * boardSize) / 2, emptyMeasureY, 0.08);
    arrow.rotation.z = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    contentGroup.add(arrow);
  }
  const emptySideLength = createDigitSlot(measureColor);
  showDigit(emptySideLength, "3");
  emptySideLength.position.set(emptyCenterX, emptyMeasureY - 0.44, 0.1);
  emptySideLength.scale.setScalar(0.44);
  contentGroup.add(emptySideLength);

  for (let column = 0; column < 3; column += 1) {
    const counter = createDigitSlot(0x4f9aa6);
    showDigit(counter, String(column + 1));
    counter.position.set(
      rightCenterX + (column - 1) * (cellSize + gap),
      boardCenterY + boardSize / 2 + 0.48,
      0.16,
    );
    counter.scale.setScalar(0.34);
    counter.visible = false;
    contentGroup.add(counter);
    areaColumnCounters.push(counter);
  }

  for (let row = 0; row < 3; row += 1) {
    const counter = createDigitSlot(0x9b84d9);
    showDigit(counter, String(row + 1));
    counter.position.set(
      rightCenterX + boardSize / 2 + 0.2,
      boardCenterY + (1 - row) * (cellSize + gap),
      0.16,
    );
    counter.scale.setScalar(0.28);
    counter.visible = false;
    contentGroup.add(counter);
    areaRowCounters.push(counter);
  }

  const formulaCanvas = document.createElement("canvas");
  formulaCanvas.width = 900;
  formulaCanvas.height = 260;
  const formulaContext = formulaCanvas.getContext("2d");
  const formulaTexture = new THREE.CanvasTexture(formulaCanvas);
  formulaTexture.colorSpace = THREE.SRGBColorSpace;
  formulaTexture.anisotropy = 4;
  const formulaPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, 1.07),
    new THREE.MeshBasicMaterial({ map: formulaTexture, transparent: true, depthWrite: false }),
  );
  formulaPanel.position.set(rightCenterX, boardCenterY - boardSize / 2 - 0.9, 0.18);
  contentGroup.add(formulaPanel);

  const areaFormulaDisplay = (horizontalCount: number, verticalCount: number) => {
    if (!formulaContext) return;
    formulaContext.clearRect(0, 0, formulaCanvas.width, formulaCanvas.height);
    formulaContext.textAlign = "center";
    formulaContext.textBaseline = "middle";
    formulaContext.fillStyle = "#756b7e";
    formulaContext.font = '700 52px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    formulaContext.fillText("가로 × 세로", formulaCanvas.width / 2, 58);
    formulaContext.fillStyle = "#443b50";
    formulaContext.font = '800 92px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    const formula =
      verticalCount > 0 ? `3 × ${verticalCount}` : horizontalCount > 0 ? `가로 ${horizontalCount}` : "";
    formulaContext.fillText(formula, formulaCanvas.width / 2, 164);
    formulaTexture.needsUpdate = true;
  };
  areaFormulaDisplay(0, 0);

  return {
    animate(elapsed) {
      const tileDuration = 0.62;
      const fillDuration = areaTiles.length * tileDuration;
      const guideDelay = 0.7;
      const horizontalInterval = 0.78;
      const horizontalDuration = horizontalInterval * 3;
      const verticalInterval = 0.92;
      const verticalDuration = verticalInterval * 3;
      const finalPause = 2.1;
      const guideStartsAt = fillDuration + guideDelay;
      const cycleDuration = guideStartsAt + horizontalDuration + verticalDuration + finalPause;
      const cycleTime = elapsed % cycleDuration;
      const tileCenterX = areaTiles.reduce((sum, tile) => sum + tile.target.x, 0) / areaTiles.length;
      const highestTargetY = Math.max(...areaTiles.map((tile) => tile.target.y));
      const source = new THREE.Vector3(tileCenterX, highestTargetY + 2.05, 0.75);
      areaTiles.forEach(({ group, target }, index) => {
        const startsAt = index * tileDuration;
        if (cycleTime < startsAt) {
          group.visible = false;
          return;
        }
        group.visible = true;
        if (cycleTime >= startsAt + tileDuration) {
          group.position.copy(target);
          group.rotation.z = 0;
          group.scale.setScalar(1);
          return;
        }
        const progress = THREE.MathUtils.clamp((cycleTime - startsAt) / tileDuration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.position.lerpVectors(source, target, eased);
        group.position.z += Math.sin(progress * Math.PI) * 0.5;
        group.rotation.z = (1 - eased) * 0.16;
        group.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.07);
      });

      let guideStep = 0;
      if (cycleTime >= guideStartsAt) {
        const guideTime = cycleTime - guideStartsAt;
        if (guideTime < horizontalDuration) {
          guideStep = Math.min(3, Math.floor(guideTime / horizontalInterval) + 1);
        } else {
          guideStep = 3 + Math.min(3, Math.floor((guideTime - horizontalDuration) / verticalInterval) + 1);
        }
      }

      if (guideStep !== lastAreaGuideStep) {
        const horizontalCount = guideStep > 0 ? Math.min(guideStep, 3) : 0;
        const verticalCount = guideStep > 3 ? Math.min(guideStep - 3, 3) : 0;

        areaGuideTiles.forEach(({ material, row, column }) => {
          const isCurrentRow = verticalCount > 0 && row === verticalCount - 1;
          const isPreviousRow = verticalCount > 0 && row < verticalCount - 1;
          const isHorizontalCounted = verticalCount === 0 && row === 0 && column < horizontalCount;
          material.opacity = isCurrentRow
            ? 1
            : isPreviousRow
              ? 0.62
              : isHorizontalCounted
                ? 0.98
                : 0.18;
          material.emissiveIntensity = isCurrentRow || isHorizontalCounted ? 0.22 : 0.02;
        });
        areaColumnCounters.forEach((counter, index) => {
          counter.visible = index < horizontalCount;
        });
        areaRowCounters.forEach((counter, index) => {
          counter.visible = index < verticalCount;
        });
        if (areaGuideUnitMarker) {
          areaGuideUnitMarker.visible = horizontalCount > 0 && verticalCount === 0;
          if (areaGuideUnitMarker.visible) {
            const positions = areaGuideUnitMarker.userData.positions as THREE.Vector3[];
            areaGuideUnitMarker.position.copy(positions[horizontalCount - 1]);
          }
        }
        if (areaGuideRowMarker) {
          areaGuideRowMarker.visible = verticalCount > 0;
          if (areaGuideRowMarker.visible) {
            const positions = areaGuideRowMarker.userData.positions as THREE.Vector3[];
            areaGuideRowMarker.position.copy(positions[verticalCount - 1]);
          }
        }
        areaFormulaDisplay(horizontalCount, verticalCount);
        lastAreaGuideStep = guideStep;
      }

      const markerPulse = 1 + Math.sin(elapsed * 8) * 0.035;
      if (areaGuideUnitMarker?.visible) {
        areaGuideUnitMarker.scale.setScalar(markerPulse);
      }
      if (areaGuideRowMarker?.visible) {
        areaGuideRowMarker.scale.set(1 + Math.sin(elapsed * 7) * 0.018, markerPulse, 1);
      }
    },
  };
}
