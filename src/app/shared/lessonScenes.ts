import { factorConceptLessonIds } from "./factorConcepts";

export type TriangleAreaStage = 0 | 1 | 2;
export type CircleAreaStage = 0 | 1 | 2 | 3 | 4 | 5;
export type PowersStage = 0 | 1;
export type PrimesStage = 0 | 1 | 2;

const dedicatedSceneLessonIds = new Set([
  "quantity",
  "addition",
  "fast-addition",
  "multiplication",
  "times-table-two",
  "square-area",
  "triangle-area",
  "circle-circumference",
  "circle-area",
  "powers",
  "powers-two",
  ...factorConceptLessonIds,
]);

export function hasDedicatedLessonScene(lessonId: string) {
  return dedicatedSceneLessonIds.has(lessonId);
}
