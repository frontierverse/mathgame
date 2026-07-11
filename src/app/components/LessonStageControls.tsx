import type { CircleAreaStage, TriangleAreaStage } from "./types";

type LessonStageControlsProps = {
  lessonId: string;
  triangleAreaStage: TriangleAreaStage;
  circleAreaStage: CircleAreaStage;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
};

export default function LessonStageControls({
  lessonId,
  triangleAreaStage,
  circleAreaStage,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
}: LessonStageControlsProps) {
  return (
    <>
      {lessonId === "triangle-area" && triangleAreaStage === 0 && (
        <button
          type="button"
          onClick={() => onTriangleAreaStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#8f78c6] bg-[#f8f3ff] px-5 py-3 text-sm font-bold text-[#594572] shadow-[0_4px_0_#c9bce4] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          사각형 생각하기
        </button>
      )}
      {lessonId === "triangle-area" && triangleAreaStage === 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onTriangleAreaStageChange(0)}
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            이전
          </button>
          <button
            type="button"
            onClick={() => onTriangleAreaStageChange(2)}
            className="rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            다음
          </button>
        </div>
      )}
      {lessonId === "triangle-area" && triangleAreaStage === 2 && (
        <button
          type="button"
          onClick={() => onTriangleAreaStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          이전
        </button>
      )}
      {lessonId === "circle-area" && circleAreaStage === 0 && (
        <button
          type="button"
          onClick={() => onCircleAreaStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          다음
        </button>
      )}
      {lessonId === "circle-area" && circleAreaStage === 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(0)}
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            이전
          </button>
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(2)}
            className="rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            다음
          </button>
        </div>
      )}
      {lessonId === "circle-area" && circleAreaStage === 2 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(1)}
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            이전
          </button>
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(3)}
            className="rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            다음
          </button>
        </div>
      )}
      {lessonId === "circle-area" && circleAreaStage === 3 && (
        <button
          type="button"
          onClick={() => onCircleAreaStageChange(2)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          이전
        </button>
      )}
    </>
  );
}
