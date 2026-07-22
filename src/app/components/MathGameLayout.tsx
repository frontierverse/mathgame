"use client";

import ExpressionKeypad from "./ExpressionKeypad";
import LessonProgress from "./LessonProgress";
import LessonScene from "./LessonScene";
import type {
  CircleAreaStage,
  ExpressionPreview,
  Lesson,
  PowersStage,
  PrimesStage,
  TriangleAreaStage,
} from "./types";

type MathGameLayoutProps = {
  lessons: Lesson[];
  selectedLesson: Lesson;
  completedLessonIds: string[];
  expression: string;
  sceneExpression: string;
  preview: ExpressionPreview;
  isCommitted: boolean;
  triangleAreaStage: TriangleAreaStage;
  circleAreaStage: CircleAreaStage;
  powersStage: PowersStage;
  primesStage: PrimesStage;
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onAddToken: (token: string) => void;
  onRemoveToken: () => void;
  onClearExpression: () => void;
  onCommitExpression: () => void;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
  onPowersStageChange: (stage: PowersStage) => void;
  onPrimesStageChange: (stage: PrimesStage) => void;
};

export default function MathGameLayout({
  lessons,
  selectedLesson,
  completedLessonIds,
  expression,
  sceneExpression,
  preview,
  isCommitted,
  triangleAreaStage,
  circleAreaStage,
  powersStage,
  primesStage,
  onSelectLesson,
  onToggleLessonComplete,
  onAddToken,
  onRemoveToken,
  onClearExpression,
  onCommitExpression,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
  onPowersStageChange,
  onPrimesStageChange,
}: MathGameLayoutProps) {
  return (
    <main className="learning-page-shell flex h-0 min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--background)] text-[var(--foreground)] lg:overflow-hidden">
      <div className="mx-auto flex min-h-full w-full max-w-[1720px] flex-1 flex-col px-4 py-4 sm:px-6 lg:min-h-0 lg:px-8">
        <section className="grid min-h-0 min-w-0 flex-none grid-cols-[minmax(0,1fr)] gap-4 lg:flex-1 lg:grid-cols-[270px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
          <LessonProgress
            lessons={lessons}
            selectedLessonId={selectedLesson.id}
            completedLessonIds={completedLessonIds}
            onSelectLesson={onSelectLesson}
            onToggleLessonComplete={onToggleLessonComplete}
          />
          <LessonScene
            lesson={selectedLesson}
            expression={expression}
            sceneExpression={sceneExpression}
            preview={preview}
            triangleAreaStage={triangleAreaStage}
            circleAreaStage={circleAreaStage}
            powersStage={powersStage}
            primesStage={primesStage}
            onTriangleAreaStageChange={onTriangleAreaStageChange}
            onCircleAreaStageChange={onCircleAreaStageChange}
            onPowersStageChange={onPowersStageChange}
            onPrimesStageChange={onPrimesStageChange}
          />
          <div className="hidden">
            <ExpressionKeypad
              expression={expression}
              preview={preview}
              isCommitted={isCommitted}
              onAddToken={onAddToken}
              onRemoveToken={onRemoveToken}
              onClear={onClearExpression}
              onCommit={onCommitExpression}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
