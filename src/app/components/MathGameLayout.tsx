"use client";

import Link from "next/link";
import ExpressionKeypad from "./ExpressionKeypad";
import LessonProgress from "./LessonProgress";
import LessonScene from "./LessonScene";
import type {
  CircleAreaStage,
  ExpressionPreview,
  Lesson,
  PowersStage,
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
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onAddToken: (token: string) => void;
  onRemoveToken: () => void;
  onClearExpression: () => void;
  onCommitExpression: () => void;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
  onPowersStageChange: (stage: PowersStage) => void;
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
  onSelectLesson,
  onToggleLessonComplete,
  onAddToken,
  onRemoveToken,
  onClearExpression,
  onCommitExpression,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
  onPowersStageChange,
}: MathGameLayoutProps) {
  return (
    <main className="min-h-screen bg-[#fbf4e7] text-[#443b50] xl:h-screen xl:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1720px] flex-col px-4 py-4 sm:px-6 lg:px-8 xl:h-full xl:min-h-0">
        <header className="mb-4 flex items-center border-b border-[#e7dccb] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#9edce3] text-lg font-black text-[#3f4358] shadow-[0_8px_22px_rgba(100,175,185,0.22)]">
              ∑
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#8f78ff]" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-[-0.03em]">수학 공간</p>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#95899a]">
                움직이는 수학 연구소
              </p>
            </div>
          </div>
          <Link
            href="/progress"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#cfc1e5] bg-[#f8f4ff] px-3.5 py-2.5 text-sm font-bold text-[#68578b] shadow-[0_4px_12px_rgba(111,92,130,0.1)] transition hover:-translate-y-0.5 hover:border-[#a795d8] hover:bg-[#f1ecfb] active:translate-y-0"
          >
            <span aria-hidden="true">✓</span>
            진도 체크하기
          </Link>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 xl:overflow-hidden xl:grid-cols-[270px_minmax(520px,1fr)_340px]">
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
            onTriangleAreaStageChange={onTriangleAreaStageChange}
            onCircleAreaStageChange={onCircleAreaStageChange}
            onPowersStageChange={onPowersStageChange}
          />
          <ExpressionKeypad
            expression={expression}
            preview={preview}
            isCommitted={isCommitted}
            onAddToken={onAddToken}
            onRemoveToken={onRemoveToken}
            onClear={onClearExpression}
            onCommit={onCommitExpression}
          />
        </section>
      </div>
    </main>
  );
}
