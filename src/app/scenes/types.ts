import * as THREE from "three";

import type { CircleAreaStage, TriangleAreaStage } from "../shared/lessonScenes";

export type { CircleAreaStage, TriangleAreaStage } from "../shared/lessonScenes";

export type ParsedExpression = {
  left: number;
  right: number;
  operator: "+" | "-" | "×" | "÷";
};

export type SceneHelpers = {
  createDigitSlot: (color: number) => THREE.Group;
  showDigit: (slot: THREE.Group, digit: string | undefined) => void;
  createEquationSymbol: (kind: "plus" | "multiply" | "equals", color: number) => THREE.Group;
  createOrb: (position: THREE.Vector3, color: number, index: number, scale?: number) => THREE.Mesh;
  addRow: (count: number, y: number, color: number, xOffset?: number, startIndex?: number) => void;
};

export type LessonSceneContext = {
  contentGroup: THREE.Group;
  interactiveMeshes: THREE.Mesh[];
  parsed: ParsedExpression;
  triangleStage: TriangleAreaStage;
  circleStage: CircleAreaStage;
  maxVisible: number;
  helpers: SceneHelpers;
};

export type LessonScene = {
  animate?: (elapsed: number) => void;
};
