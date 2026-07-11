export type MathKey = {
  value: string;
  color: string;
  shadow: string;
  text: string;
};

export type Lesson = {
  id: string;
  index: string;
  title: string;
  description: string;
  example: string;
  color: string;
};

export type ExactValue = {
  numerator: bigint;
  denominator: bigint;
};

export type ExpressionPreview = {
  label: string;
  result: string | null;
};
export type { CircleAreaStage, PowersStage, TriangleAreaStage } from "../shared/lessonScenes";
