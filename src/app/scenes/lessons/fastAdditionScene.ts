import * as THREE from "three";

import type { LessonScene, LessonSceneContext } from "../types";

export function buildFastAdditionScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, helpers } = context;
  const { createOrb } = helpers;
  const multiplicationOrbs: THREE.Mesh[] = [];
  const multiplicationSlowOrbs: THREE.Mesh[] = [];
  let multiplicationSlowMarker: THREE.Mesh | null = null;
  let multiplicationUnitMarker: THREE.Mesh | null = null;
  let multiplicationRowMarker: THREE.Group | null = null;
  let lastMultiplicationSlowStep = -1;
  let lastMultiplicationUnitStep = -1;
  let lastMultiplicationStep = -1;
  const gridSize = 10;
  const spacing = 0.47;
  const gridOffset = 2.45;

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const index = row * gridSize + column;
      const slowOrb = createOrb(
        new THREE.Vector3(
          -gridOffset + (column - (gridSize - 1) / 2) * spacing,
          0.55 + ((gridSize - 1) / 2 - row) * spacing,
          0,
        ),
        row % 2 === 0 ? 0x9edce3 : 0xb9a9e3,
        index + 100,
        0.36,
      );
      multiplicationSlowOrbs.push(slowOrb);

      const fastOrb = createOrb(
        new THREE.Vector3(
          gridOffset + (column - (gridSize - 1) / 2) * spacing,
          0.55 + ((gridSize - 1) / 2 - row) * spacing,
          0,
        ),
        row % 2 === 0 ? 0x9edce3 : 0xb9a9e3,
        index,
        0.36,
      );
      multiplicationOrbs.push(fastOrb);
    }
  }

  multiplicationSlowMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.035, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0x72bec8, transparent: true, opacity: 0.92 }),
  );
  multiplicationSlowMarker.position.set(
    multiplicationSlowOrbs[0].position.x,
    multiplicationSlowOrbs[0].position.y,
    0.52,
  );
  contentGroup.add(multiplicationSlowMarker);

  multiplicationRowMarker = new THREE.Group();
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xf08b72,
    transparent: true,
    opacity: 0.9,
  });
  const markerWidth = 4.62;
  const markerHeight = 0.4;
  for (const y of [-markerHeight / 2, markerHeight / 2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(markerWidth, 0.055, 0.055), markerMaterial);
    bar.position.y = y;
    multiplicationRowMarker.add(bar);
  }
  for (const x of [-markerWidth / 2, markerWidth / 2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, markerHeight, 0.055), markerMaterial);
    bar.position.x = x;
    multiplicationRowMarker.add(bar);
  }
  multiplicationRowMarker.position.set(gridOffset, multiplicationOrbs[0].position.y, 0.52);
  contentGroup.add(multiplicationRowMarker);

  multiplicationUnitMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.035, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xf08b72, transparent: true, opacity: 0.92 }),
  );
  multiplicationUnitMarker.position.set(
    multiplicationOrbs[0].position.x,
    multiplicationOrbs[0].position.y,
    0.54,
  );
  contentGroup.add(multiplicationUnitMarker);

  const createFormulaPanel = (title: string, formula: string, subtitle: string, accent: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 760;
    canvas.height = 320;
    const canvasContext = canvas.getContext("2d");
    if (canvasContext) {
      const panelWidth = canvas.width;
      const panelHeight = canvas.height;
      const radius = 40;
      canvasContext.clearRect(0, 0, panelWidth, panelHeight);

      canvasContext.beginPath();
      canvasContext.moveTo(16 + radius, 16);
      canvasContext.arcTo(panelWidth - 16, 16, panelWidth - 16, panelHeight - 16, radius);
      canvasContext.arcTo(panelWidth - 16, panelHeight - 16, 16, panelHeight - 16, radius);
      canvasContext.arcTo(16, panelHeight - 16, 16, 16, radius);
      canvasContext.arcTo(16, 16, panelWidth - 16, 16, radius);
      canvasContext.closePath();
      canvasContext.fillStyle = "#fffdf8";
      canvasContext.fill();
      canvasContext.lineWidth = 8;
      canvasContext.strokeStyle = accent;
      canvasContext.stroke();

      canvasContext.textAlign = "center";
      canvasContext.textBaseline = "middle";

      canvasContext.fillStyle = accent;
      canvasContext.font =
        '700 48px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
      canvasContext.fillText(title, panelWidth / 2, 78);

      canvasContext.fillStyle = "#443b50";
      let formulaSize = 80;
      const setFormulaFont = () => {
        canvasContext.font = `800 ${formulaSize}px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      };
      setFormulaFont();
      while (canvasContext.measureText(formula).width > panelWidth - 100 && formulaSize > 24) {
        formulaSize -= 2;
        setFormulaFont();
      }
      canvasContext.fillText(formula, panelWidth / 2, 172);

      canvasContext.fillStyle = "#8a7f92";
      canvasContext.font = '600 42px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      canvasContext.fillText(subtitle, panelWidth / 2, 260);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const panelPlaneWidth = 4;
    return new THREE.Mesh(
      new THREE.PlaneGeometry(panelPlaneWidth, (panelPlaneWidth * canvas.height) / canvas.width),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
  };

  const slowFormulaPanel = createFormulaPanel(
    "하나씩 세기",
    "1+1+1+…+1 = 100",
    "덧셈을 100번",
    "#4f9aa6",
  );
  slowFormulaPanel.position.set(-gridOffset, -3.05, 0.5);
  contentGroup.add(slowFormulaPanel);

  const fastFormulaPanel = createFormulaPanel(
    "10씩 더하기",
    "10+10+…+10 = 100",
    "덧셈을 10번",
    "#9b84d9",
  );
  fastFormulaPanel.position.set(gridOffset, -3.05, 0.5);
  contentGroup.add(fastFormulaPanel);

  return {
    animate(elapsed) {
      if (
        !multiplicationSlowMarker ||
        !multiplicationUnitMarker ||
        !multiplicationRowMarker ||
        multiplicationSlowOrbs.length === 0 ||
        multiplicationOrbs.length === 0
      ) {
        return;
      }

      const unitCountingDuration = 5.5;
      const rowCountingDuration = 12.5;
      const endingPause = 1.8;
      const multiplicationCycle = unitCountingDuration + rowCountingDuration + endingPause;
      const cycleTime = elapsed % multiplicationCycle;
      const isCountingUnits = cycleTime < unitCountingDuration;

      const slowStep = Math.min(99, Math.floor(cycleTime / 0.55));
      const slowOrb = multiplicationSlowOrbs[slowStep];
      multiplicationSlowMarker.position.x +=
        (slowOrb.position.x - multiplicationSlowMarker.position.x) * 0.24;
      multiplicationSlowMarker.position.y +=
        (slowOrb.position.y - multiplicationSlowMarker.position.y) * 0.24;
      const slowMarkerScale = 1 + Math.sin(elapsed * 6) * 0.08;
      multiplicationSlowMarker.scale.setScalar(slowMarkerScale);
      if (slowStep !== lastMultiplicationSlowStep) {
        multiplicationSlowOrbs.forEach((orb, index) => {
          const material = orb.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = index <= slowStep ? 0.72 : 0.08;
        });
        lastMultiplicationSlowStep = slowStep;
      }

      multiplicationUnitMarker.visible = isCountingUnits;
      multiplicationRowMarker.visible = !isCountingUnits;

      if (isCountingUnits) {
        const unitStep = Math.min(9, Math.floor(cycleTime / 0.55));
        const activeOrb = multiplicationOrbs[unitStep];
        multiplicationUnitMarker.position.x +=
          (activeOrb.position.x - multiplicationUnitMarker.position.x) * 0.24;
        multiplicationUnitMarker.position.y +=
          (activeOrb.position.y - multiplicationUnitMarker.position.y) * 0.24;
        const unitMarkerScale = 1 + Math.sin(elapsed * 6) * 0.08;
        multiplicationUnitMarker.scale.setScalar(unitMarkerScale);

        if (unitStep !== lastMultiplicationUnitStep) {
          multiplicationOrbs.forEach((orb, index) => {
            const material = orb.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = index <= unitStep ? 0.72 : 0.08;
          });
          lastMultiplicationUnitStep = unitStep;
        }
      } else {
        const rowTime = cycleTime - unitCountingDuration;
        const multiplicationStep = Math.min(9, Math.floor(rowTime / 1.25));
        const activeRowY = multiplicationOrbs[multiplicationStep * 10].position.y;
        multiplicationRowMarker.position.y +=
          (activeRowY - multiplicationRowMarker.position.y) * 0.2;
        const markerPulse = 1 + Math.sin(elapsed * 5) * 0.025;
        multiplicationRowMarker.scale.set(markerPulse, markerPulse, 1);

        if (multiplicationStep !== lastMultiplicationStep) {
          multiplicationOrbs.forEach((orb, index) => {
            const material = orb.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = index < (multiplicationStep + 1) * 10 ? 0.72 : 0.08;
          });
          lastMultiplicationStep = multiplicationStep;
        }
      }
    },
  };
}
