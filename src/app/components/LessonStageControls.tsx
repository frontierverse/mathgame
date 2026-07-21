import type { CircleAreaStage, PowersStage, PrimesStage, TriangleAreaStage } from "./types";

type LessonStageControlsProps = {
  lessonId: string;
  triangleAreaStage: TriangleAreaStage;
  circleAreaStage: CircleAreaStage;
  powersStage: PowersStage;
  primesStage: PrimesStage;
  onTriangleAreaStageChange: (stage: TriangleAreaStage) => void;
  onCircleAreaStageChange: (stage: CircleAreaStage) => void;
  onPowersStageChange: (stage: PowersStage) => void;
  onPrimesStageChange: (stage: PrimesStage) => void;
};

export default function LessonStageControls({
  lessonId,
  triangleAreaStage,
  circleAreaStage,
  powersStage,
  primesStage,
  onTriangleAreaStageChange,
  onCircleAreaStageChange,
  onPowersStageChange,
  onPrimesStageChange,
}: LessonStageControlsProps) {
  return (
    <>
      {lessonId === "powers" && powersStage === 0 && (
        <button
          type="button"
          onClick={() => onPowersStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          다음
        </button>
      )}
      {lessonId === "powers" && powersStage === 1 && (
        <button
          type="button"
          onClick={() => onPowersStageChange(0)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          이전
        </button>
      )}
      {lessonId === "primes-composites" && primesStage === 0 && (
        <button
          type="button"
          onClick={() => onPrimesStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          약수 →
        </button>
      )}
      {lessonId === "primes-composites" && primesStage === 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onPrimesStageChange(0)}
            aria-label="이전 단계"
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onPrimesStageChange(2)}
            className="rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            소인수분해 →
          </button>
        </div>
      )}
      {lessonId === "primes-composites" && primesStage === 2 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onPrimesStageChange(1)}
            aria-label="이전 단계"
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("math-scene:replay"))}
            aria-label="소인수분해 애니메이션 다시 보기"
            className="rounded-xl border border-[#d99443] bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#9a5a18] shadow-[0_4px_0_#ead0a8] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            ↻
          </button>
        </div>
      )}
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
      {lessonId === "circle-circumference" && circleAreaStage === 0 && (
        <button
          type="button"
          onClick={() => onCircleAreaStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          펼치기
        </button>
      )}
      {lessonId === "circle-circumference" && circleAreaStage === 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex w-[calc(100%-2rem)] -translate-x-1/2 justify-center gap-2 sm:w-auto sm:gap-3">
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(0)}
            aria-label="이전 단계"
            className="whitespace-nowrap rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-3 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:px-5"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("math-scene:replay"))}
            className="whitespace-nowrap rounded-xl border border-[#d99443] bg-[#fff8e8] px-3 py-3 text-sm font-bold text-[#9a5a18] shadow-[0_4px_0_#ead0a8] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:px-4"
            aria-label="원의 둘레 펼치기 애니메이션 다시 보기"
          >
            ↻
          </button>
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(2)}
            aria-label="반지름과 파이 단계"
            className="whitespace-nowrap rounded-xl border border-[#5487bf] bg-[#eef7ff] px-3 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:px-5"
          >
            r · π →
          </button>
        </div>
      )}
      {lessonId === "circle-circumference" && circleAreaStage === 2 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex w-[calc(100%-2rem)] -translate-x-1/2 justify-center gap-2 sm:w-auto sm:gap-3">
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(1)}
            aria-label="이전 단계"
            className="whitespace-nowrap rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-3 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:px-5"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("math-scene:replay"))}
            className="whitespace-nowrap rounded-xl border border-[#d99443] bg-[#fff8e8] px-3 py-3 text-sm font-bold text-[#9a5a18] shadow-[0_4px_0_#ead0a8] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 sm:px-4"
            aria-label="반지름과 파이 애니메이션 다시 보기"
          >
            ↻
          </button>
        </div>
      )}
      {lessonId === "circle-area" && circleAreaStage === 0 && (
        <button
          type="button"
          onClick={() => onCircleAreaStageChange(1)}
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          자르기
        </button>
      )}
      {lessonId === "circle-area" && circleAreaStage === 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(0)}
            aria-label="이전 단계"
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(2)}
            aria-label="다음 단계"
            className="rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            →
          </button>
        </div>
      )}
      {lessonId === "circle-area" && circleAreaStage === 2 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(1)}
            aria-label="이전 단계"
            className="rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => onCircleAreaStageChange(3)}
            aria-label="다음 단계"
            className="rounded-xl border border-[#5487bf] bg-[#eef7ff] px-5 py-3 text-sm font-bold text-[#335f91] shadow-[0_4px_0_#b6d4ec] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
          >
            →
          </button>
        </div>
      )}
      {lessonId === "circle-area" && circleAreaStage === 3 && (
        <button
          type="button"
          onClick={() => onCircleAreaStageChange(2)}
          aria-label="이전 단계"
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#b9add2] bg-[#f7f3fb] px-5 py-3 text-sm font-bold text-[#685c76] shadow-[0_4px_0_#d8cfe3] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
          ←
        </button>
      )}
    </>
  );
}
