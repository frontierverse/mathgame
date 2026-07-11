import * as THREE from "three";
import type { LessonScene, LessonSceneContext } from "../types";

export function buildTriangleAreaScene(context: LessonSceneContext): LessonScene {
  const { contentGroup, triangleStage, helpers } = context;
  const { createDigitSlot, showDigit } = helpers;
  const side = 4.2;
  const halfSide = side / 2;
  const centerX = 0;
  const edgeThickness = 0.1;
  const diagonalLength = Math.sqrt(2) * side;
  const overlayFades: Array<{
    material: THREE.MeshBasicMaterial | THREE.LineBasicMaterial;
    opacity: number;
  }> = [];

  const createTriangleShape = () => {
    const shape = new THREE.Shape();
    shape.moveTo(centerX - halfSide, -halfSide);
    shape.lineTo(centerX + halfSide, -halfSide);
    shape.lineTo(centerX - halfSide, halfSide);
    shape.closePath();
    return shape;
  };

  const addFrame = (
    target: THREE.Group,
    material: THREE.MeshBasicMaterial,
    z: number,
  ) => {
    const horizontalGeometry = new THREE.BoxGeometry(side + edgeThickness, edgeThickness, 0.07);
    const verticalGeometry = new THREE.BoxGeometry(edgeThickness, side + edgeThickness, 0.07);
    for (const y of [-halfSide, halfSide]) {
      const edge = new THREE.Mesh(horizontalGeometry, material);
      edge.position.set(centerX, y, z);
      target.add(edge);
    }
    for (const x of [-halfSide, halfSide]) {
      const edge = new THREE.Mesh(verticalGeometry, material);
      edge.position.set(centerX + x, 0, z);
      target.add(edge);
    }
  };

  const addDiagonal = (target: THREE.Group, material: THREE.MeshBasicMaterial, z: number) => {
    const diagonal = new THREE.Mesh(
      new THREE.BoxGeometry(diagonalLength, edgeThickness, 0.075),
      material,
    );
    diagonal.position.set(centerX, 0, z);
    diagonal.rotation.z = -Math.PI / 4;
    target.add(diagonal);
    return diagonal;
  };

  const blueTriangleMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d9be6,
    emissive: 0x2a78b8,
    emissiveIntensity: 0.18,
    roughness: 0.42,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const triangle = new THREE.Mesh(new THREE.ShapeGeometry(createTriangleShape()), blueTriangleMaterial);
  triangle.position.z = 0.02;
  triangle.visible = triangleStage !== 2;
  contentGroup.add(triangle);

  const triangleEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0x17639d });
  const triangleBase = new THREE.Mesh(
    new THREE.BoxGeometry(side + edgeThickness, edgeThickness, 0.075),
    triangleEdgeMaterial,
  );
  triangleBase.position.set(centerX, -halfSide, 0.12);
  triangleBase.visible = triangleStage !== 2;
  contentGroup.add(triangleBase);
  const triangleSide = new THREE.Mesh(
    new THREE.BoxGeometry(edgeThickness, side + edgeThickness, 0.075),
    triangleEdgeMaterial,
  );
  triangleSide.position.set(centerX - halfSide, 0, 0.12);
  triangleSide.visible = triangleStage !== 2;
  contentGroup.add(triangleSide);
  const triangleHypotenuse = addDiagonal(contentGroup, triangleEdgeMaterial, 0.12);
  triangleHypotenuse.visible = triangleStage !== 2;

  const squareFillMaterial = new THREE.MeshBasicMaterial({
    color: 0xf9f7ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const squareFill = new THREE.Mesh(new THREE.PlaneGeometry(side, side), squareFillMaterial);
  squareFill.position.set(centerX, 0, 0.16);
  contentGroup.add(squareFill);
  overlayFades.push({ material: squareFillMaterial, opacity: 0.2 });

  const squareOutlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x9b84d9,
    transparent: true,
    opacity: 0,
  });
  addFrame(contentGroup, squareOutlineMaterial, 0.2);
  overlayFades.push({ material: squareOutlineMaterial, opacity: 0.8 });

  const diagonalMaterial = new THREE.MeshBasicMaterial({
    color: 0x9b84d9,
    transparent: true,
    opacity: 0,
  });
  addDiagonal(contentGroup, diagonalMaterial, 0.22);
  overlayFades.push({ material: diagonalMaterial, opacity: 0.7 });

  const halfAreaGroup = new THREE.Group();
  halfAreaGroup.visible = triangleStage === 2;
  contentGroup.add(halfAreaGroup);

  const halfSquareFill = new THREE.Mesh(
    new THREE.PlaneGeometry(side, side),
    new THREE.MeshBasicMaterial({
      color: 0xfaf8ff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  halfSquareFill.position.set(centerX, 0, 0.01);
  halfAreaGroup.add(halfSquareFill);
  const halfSquareFrameMaterial = new THREE.MeshBasicMaterial({
    color: 0xb7a8d4,
    transparent: true,
    opacity: 0.52,
  });
  addFrame(halfAreaGroup, halfSquareFrameMaterial, 0.12);

  const halfRectangle = new THREE.Mesh(
    new THREE.PlaneGeometry(side, side / 2),
    new THREE.MeshStandardMaterial({
      color: 0x3d9be6,
      emissive: 0x2a78b8,
      emissiveIntensity: 0.2,
      roughness: 0.4,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
  );
  halfRectangle.position.set(centerX, -halfSide / 2, 0.16);
  halfAreaGroup.add(halfRectangle);
  const halfEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0x17639d });
  const halfTop = new THREE.Mesh(
    new THREE.BoxGeometry(side + edgeThickness, edgeThickness, 0.08),
    halfEdgeMaterial,
  );
  halfTop.position.set(centerX, 0, 0.26);
  halfAreaGroup.add(halfTop);
  const halfBottom = new THREE.Mesh(
    new THREE.BoxGeometry(side + edgeThickness, edgeThickness, 0.08),
    halfEdgeMaterial,
  );
  halfBottom.position.set(centerX, -halfSide, 0.26);
  halfAreaGroup.add(halfBottom);
  const halfLeft = new THREE.Mesh(
    new THREE.BoxGeometry(edgeThickness, halfSide + edgeThickness, 0.08),
    halfEdgeMaterial,
  );
  halfLeft.position.set(centerX - halfSide, -halfSide / 2, 0.26);
  halfAreaGroup.add(halfLeft);
  const halfRight = new THREE.Mesh(
    new THREE.BoxGeometry(edgeThickness, halfSide + edgeThickness, 0.08),
    halfEdgeMaterial,
  );
  halfRight.position.set(centerX + halfSide, -halfSide / 2, 0.26);
  halfAreaGroup.add(halfRight);
  addDiagonal(halfAreaGroup, halfEdgeMaterial, 0.27);

  const measureColor = 0xe6894e;
  const addBaseMeasure = (target: THREE.Group) => {
    const measureLine = new THREE.Mesh(
      new THREE.BoxGeometry(side, 0.065, 0.06),
      new THREE.MeshBasicMaterial({ color: measureColor }),
    );
    measureLine.position.set(centerX, -halfSide - 0.42, 0.22);
    target.add(measureLine);
    for (const direction of [-1, 1]) {
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.26, 12),
        new THREE.MeshBasicMaterial({ color: measureColor }),
      );
      arrow.position.set(centerX + direction * halfSide, -halfSide - 0.42, 0.22);
      arrow.rotation.z = direction === -1 ? Math.PI / 2 : -Math.PI / 2;
      target.add(arrow);
    }
    const baseTen = new THREE.Group();
    const tenOne = createDigitSlot(measureColor);
    showDigit(tenOne, "1");
    tenOne.position.x = -0.4;
    const tenZero = createDigitSlot(measureColor);
    showDigit(tenZero, "0");
    tenZero.position.x = 0.4;
    baseTen.add(tenOne, tenZero);
    baseTen.position.set(centerX, -halfSide - 0.98, 0.24);
    baseTen.scale.setScalar(0.48);
    target.add(baseTen);
  };
  addBaseMeasure(contentGroup);

  const layoutBounds = new THREE.Mesh(
    new THREE.BoxGeometry(6.3, 6.3, 0.01),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  layoutBounds.position.set(0, -0.18, -0.5);
  contentGroup.add(layoutBounds);

  return {
    animate(elapsed) {
      const fadeProgress =
        triangleStage === 1 ? THREE.MathUtils.smoothstep((elapsed - 0.25) / 3.2, 0, 1) : 0;
      overlayFades.forEach(({ material, opacity }) => {
        material.opacity = opacity * fadeProgress;
      });
    },
  };
}
