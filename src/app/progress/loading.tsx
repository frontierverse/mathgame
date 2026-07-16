const PULSE = "animate-pulse rounded bg-[#eee4d7]";

function QuizCircleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`${PULSE} shrink-0 rounded-full ${compact ? "h-14 w-14" : "h-16 w-16 2xl:h-[72px] 2xl:w-[72px]"}`}
    />
  );
}

function QuizBoardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="min-w-0 p-1 sm:p-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={`${PULSE} h-7 w-32`} />
        <div className="ml-auto flex items-center gap-x-2.5 gap-y-1">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className={`${PULSE} h-7 w-7 rounded-full`} />
              <span className={`${PULSE} h-3.5 w-3`} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[168px] overflow-hidden px-2 py-4 2xl:h-[184px]">
        <div className="grid w-max grid-cols-6 gap-2">
          {Array.from({ length: 12 }, (_, index) => (
            <QuizCircleSkeleton key={index} compact={compact} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentListSkeleton() {
  return (
    <aside className="rounded-2xl border border-[#eee4d7] bg-[#fffefa] p-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex h-[72px] items-center gap-3 rounded-xl px-3.5 py-4">
            <span className={`${PULSE} h-10 w-10 shrink-0 rounded-xl bg-[#f1ecfb]`} />
            <span className={`${PULSE} h-5 flex-1`} />
            <span className={`${PULSE} h-3 w-3`} />
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function ProgressLoading() {
  return (
    <main
      className="min-h-screen bg-[#fbf4e7] px-4 py-4 text-[#443b50] sm:px-6 lg:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">학생 진도를 불러오는 중입니다.</span>
      <div className="mx-auto max-w-[1720px]">
        <header className="flex items-center justify-between border-b border-[#e7dccb] pb-4">
          <div className="flex items-center gap-3">
            <div className={`${PULSE} h-10 w-10 rounded-xl bg-[#9edce3]`} />
            <div className="space-y-2">
              <div className={`${PULSE} h-4 w-24`} />
              <div className={`${PULSE} h-2.5 w-32 bg-[#f3ede4]`} />
            </div>
          </div>
          <div className={`${PULSE} h-[42px] w-36 rounded-xl bg-[#f1ecfb]`} />
        </header>

        <section className="mt-8 rounded-3xl border border-[#e7dccb] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className={`${PULSE} h-9 w-56`} />
            <div className="flex max-w-full items-center gap-3 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className={`${PULSE} h-10 w-10 shrink-0 rounded-full bg-[#f1ecfb]`} />
                  <span className={`${PULSE} h-3 w-8`} />
                </div>
              ))}
            </div>
          </div>

          <section className="mt-5">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
              <div className="min-w-0">
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,400px)_minmax(516px,1fr)] 2xl:grid-cols-[minmax(360px,480px)_minmax(596px,1fr)]">
                  <StudentListSkeleton />
                  <QuizBoardSkeleton />
                </div>

                <div className="mt-10 border-t border-[#e7dccb] pt-8">
                  <div className={`${PULSE} h-7 w-48`} />
                  <div className="mt-5 grid min-w-0 grid-cols-2 gap-x-12 gap-y-6">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div key={index} className="min-w-0 border-b border-[#eee4d7] pb-6">
                        <QuizBoardSkeleton compact />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
