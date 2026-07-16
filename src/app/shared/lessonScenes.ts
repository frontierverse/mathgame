export type TriangleAreaStage = 0 | 1 | 2;
export type CircleAreaStage = 0 | 1 | 2 | 3 | 4;
export type PowersStage = 0 | 1;

const dedicatedSceneLessonIds = new Set([
  "quantity",
  "addition",
  "fast-addition",
  "multiplication",
  "times-table-two",
  "square-area",
  "triangle-area",
  "circle-area",
  "powers",
  "powers-two",
]);

export function hasDedicatedLessonScene(lessonId: string) {
  return dedicatedSceneLessonIds.has(lessonId);
}
