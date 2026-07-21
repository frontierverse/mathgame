import { buildAdditionScene } from "./lessons/additionScene";
import {
  buildCircleAreaScene,
  buildCircleCircumferenceScene,
} from "./lessons/circleAreaScene";
import { buildFastAdditionScene } from "./lessons/fastAdditionScene";
import { buildFallbackScene } from "./lessons/fallbackScene";
import { buildMultiplicationScene } from "./lessons/multiplicationScene";
import { buildPowersScene } from "./lessons/powersScene";
import { buildPowersTwoScene } from "./lessons/powersTwoScene";
import { buildPrimesCompositesScene } from "./lessons/primesCompositesScene";
import { buildQuantityScene } from "./lessons/quantityScene";
import { buildSquareAreaScene } from "./lessons/squareAreaScene";
import { buildTimesTableTwoScene } from "./lessons/timesTableTwoScene";
import { buildTriangleAreaScene } from "./lessons/triangleAreaScene";
import type { LessonScene, LessonSceneContext } from "./types";

export { hasDedicatedLessonScene } from "../shared/lessonScenes";

export function buildLessonScene(lessonId: string, context: LessonSceneContext): LessonScene {
  switch (lessonId) {
    case "quantity":
      return buildQuantityScene(context);
    case "addition":
      return buildAdditionScene(context);
    case "fast-addition":
      return buildFastAdditionScene(context);
    case "multiplication":
      return buildMultiplicationScene(context);
    case "times-table-two":
      return buildTimesTableTwoScene(context);
    case "square-area":
      return buildSquareAreaScene(context);
    case "triangle-area":
      return buildTriangleAreaScene(context);
    case "circle-circumference":
      return buildCircleCircumferenceScene(context);
    case "circle-area":
      return buildCircleAreaScene(context);
    case "powers":
      return buildPowersScene(context);
    case "primes-composites":
      return buildPrimesCompositesScene(context);
    case "powers-two":
      return buildPowersTwoScene(context);
    default:
      return buildFallbackScene(context);
  }
}
