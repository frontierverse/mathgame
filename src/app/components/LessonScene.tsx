import MathScene from "../MathScene";
import { hasDedicatedLessonScene } from "../shared/lessonScenes";
import LessonStageControls from "./LessonStageControls";
import type {
  CircleAreaStage,
  ExpressionPreview,
  Lesson,
  PowersStage,
  TriangleAreaStage,
} from "./types";

type LessonSceneProps = {
  lesson: Lesson;
  expression: string;
  sceneExpression: string;
  preview: ExpressionPreview;
  triangleAreaStage: TriangleAreaStage;
  circleAreaStage: CircleAreaStage;
  powersStage: PowersStage;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
  onPowersStageChange: (stage: PowersStage) => void;
};

export default function LessonScene({
  lesson,
  expression,
  sceneExpression,
  preview,
  triangleAreaStage,
  circleAreaStage,
  powersStage,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
  onPowersStageChange,
}: LessonSceneProps) {
  return (
    <section className="relative flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[#ded3ed] bg-[#f8f4fb] shadow-[0_12px_30px_rgba(111,92,130,0.09)] xl:min-h-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(197,226,230,0.45),transparent_52%)]" />
      <div className="relative z-10 px-5 pb-2 pt-5 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{lesson.title}</h2>
        </div>
      </div>

      <div className="relative min-h-[420px] flex-1">
        <MathScene
          key={`centered-scene-v6-${lesson.id}-${triangleAreaStage}-${circleAreaStage}-${powersStage}`}
          expression={sceneExpression}
          lessonId={lesson.id}
          triangleStage={triangleAreaStage}
          circleStage={circleAreaStage}
          powersStage={powersStage}
        />
        <LessonStageControls
          lessonId={lesson.id}
          triangleAreaStage={triangleAreaStage}
          circleAreaStage={circleAreaStage}
          powersStage={powersStage}
          onTriangleAreaStageChange={onTriangleAreaStageChange}
          onCircleAreaStageChange={onCircleAreaStageChange}
          onPowersStageChange={onPowersStageChange}
        />
        {!hasDedicatedLessonScene(lesson.id) && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-[#ded3ed] bg-white/85 p-4 text-center shadow-[0_12px_30px_rgba(105,85,125,0.12)] backdrop-blur-xl">
            <p className="font-mono text-2xl font-bold tracking-[0.08em] text-[#443b50] sm:text-3xl">
              {sceneExpression}
              {preview.result && expression ? <span className="text-[#4b9aa6]"> = {preview.result}</span> : null}
            </p>
            <p className="mt-1 text-xs text-[#95899a]">
              구체를 클릭하면 선택할 수 있어요 · 최대 24개까지 시각화됩니다
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
