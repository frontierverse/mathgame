import MathScene from "../MathScene";
import { isFactorConceptLessonId } from "../shared/factorConcepts";
import { hasDedicatedLessonScene } from "../shared/lessonScenes";
import DivisorsLesson2D from "./DivisorsLesson2D";
import FactorConceptLesson from "./FactorConceptLesson";
import LessonStageControls from "./LessonStageControls";
import PrimeCompositeLesson2D from "./PrimeCompositeLesson2D";
import PrimeFactorizationLesson2D from "./PrimeFactorizationLesson2D";
import type {
  CircleAreaStage,
  ExpressionPreview,
  Lesson,
  PowersStage,
  PrimesStage,
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
  primesStage: PrimesStage;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
  onPowersStageChange: (stage: PowersStage) => void;
  onPrimesStageChange: (stage: PrimesStage) => void;
};

export default function LessonScene({
  lesson,
  expression,
  sceneExpression,
  preview,
  triangleAreaStage,
  circleAreaStage,
  powersStage,
  primesStage,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
  onPowersStageChange,
  onPrimesStageChange,
}: LessonSceneProps) {
  if (lesson.id === "divisors") {
    return <DivisorsLesson2D key={lesson.id} />;
  }

  if (lesson.id === "primes-composites") {
    return <PrimeCompositeLesson2D key={lesson.id} />;
  }

  if (lesson.id === "prime-factorization") {
    return <PrimeFactorizationLesson2D key={lesson.id} />;
  }

  if (isFactorConceptLessonId(lesson.id)) {
    return (
      <FactorConceptLesson
        key={lesson.id}
        lessonId={lesson.id}
        sceneExpression={sceneExpression}
      />
    );
  }

  return (
    <section className="relative flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[#ded3ed] bg-[#f8f4fb] shadow-[0_12px_30px_rgba(111,92,130,0.09)] lg:min-h-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(197,226,230,0.45),transparent_52%)]" />
      <div className="relative z-10 px-5 pb-2 pt-5 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{lesson.title}</h2>
        </div>
      </div>

      <div className="relative min-h-[420px] flex-1 lg:min-h-0">
        <MathScene
          key={`centered-scene-v6-${lesson.id}-${triangleAreaStage}-${circleAreaStage}-${powersStage}-${primesStage}`}
          expression={sceneExpression}
          lessonId={lesson.id}
          triangleStage={triangleAreaStage}
          circleStage={circleAreaStage}
          powersStage={powersStage}
          primesStage={primesStage}
        />
        <LessonStageControls
          lessonId={lesson.id}
          triangleAreaStage={triangleAreaStage}
          circleAreaStage={circleAreaStage}
          powersStage={powersStage}
          primesStage={primesStage}
          onTriangleAreaStageChange={onTriangleAreaStageChange}
          onCircleAreaStageChange={onCircleAreaStageChange}
          onPowersStageChange={onPowersStageChange}
          onPrimesStageChange={onPrimesStageChange}
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
