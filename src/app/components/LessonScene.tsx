import MathScene from "../MathScene";
import { hasDedicatedLessonScene } from "../shared/lessonScenes";
import DivisorsLesson2D from "./DivisorsLesson2D";
import LessonStageControls from "./LessonStageControls";
import PrimeCompositeLesson2D from "./PrimeCompositeLesson2D";
import type {
  CircleAreaStage,
  ExpressionPreview,
  Lesson,
  PowersStage,
  TriangleAreaStage,
} from "./types";

type LessonSceneProps = {
  lessons: Lesson[];
  lesson: Lesson;
  expression: string;
  sceneExpression: string;
  preview: ExpressionPreview;
  triangleAreaStage: TriangleAreaStage;
  circleAreaStage: CircleAreaStage;
  powersStage: PowersStage;
  onSelectLesson: (lessonId: string) => void;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
  onPowersStageChange: (stage: PowersStage) => void;
};

export default function LessonScene({
  lessons,
  lesson,
  expression,
  sceneExpression,
  preview,
  triangleAreaStage,
  circleAreaStage,
  powersStage,
  onSelectLesson,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
  onPowersStageChange,
}: LessonSceneProps) {
  const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined;
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;
  const chapterNavigation = (
    <ChapterNavigation
      previousLesson={previousLesson}
      nextLesson={nextLesson}
      onSelectLesson={onSelectLesson}
    />
  );

  if (lesson.id === "divisors-gcd" || lesson.id === "primes-composites") {
    return (
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {lesson.id === "divisors-gcd" ? (
          <DivisorsLesson2D key={lesson.id} />
        ) : (
          <PrimeCompositeLesson2D key={lesson.id} />
        )}
        {chapterNavigation}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <section className="relative flex min-h-[620px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#ded3ed] bg-[#f8f4fb] shadow-[0_12px_30px_rgba(111,92,130,0.09)] lg:min-h-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(197,226,230,0.45),transparent_52%)]" />
      <div className="relative z-10 px-5 pb-2 pt-5 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{lesson.title}</h2>
        </div>
      </div>

      <div className="relative min-h-[420px] flex-1 lg:min-h-0">
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
      {chapterNavigation}
    </div>
  );
}

function ChapterNavigation({
  previousLesson,
  nextLesson,
  onSelectLesson,
}: {
  previousLesson?: Lesson;
  nextLesson?: Lesson;
  onSelectLesson: (lessonId: string) => void;
}) {
  if (!previousLesson && !nextLesson) return null;

  return (
    <nav
      aria-label="챕터 이동"
      className="pointer-events-none absolute left-1/2 top-4 z-30 flex -translate-x-1/2 gap-2"
    >
      <button
        type="button"
        disabled={!previousLesson}
        onClick={() => previousLesson && onSelectLesson(previousLesson.id)}
        aria-label={previousLesson ? `이전 챕터: ${previousLesson.title}` : "이전 챕터 없음"}
        title={previousLesson ? `이전 챕터 · ${previousLesson.title}` : "이전 챕터 없음"}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--control-background-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        disabled={!nextLesson}
        onClick={() => nextLesson && onSelectLesson(nextLesson.id)}
        aria-label={nextLesson ? `다음 챕터: ${nextLesson.title}` : "다음 챕터 없음"}
        title={nextLesson ? `다음 챕터 · ${nextLesson.title}` : "다음 챕터 없음"}
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--control-background-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronIcon direction="right" />
      </button>
    </nav>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}
