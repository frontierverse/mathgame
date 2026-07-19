const PULSE = "animate-pulse";
const PRIMARY_PULSE = `${PULSE} bg-[var(--skeleton-primary)]`;
const SECONDARY_PULSE = `${PULSE} bg-[var(--skeleton-secondary)]`;

function QuizCircleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`${SECONDARY_PULSE} shrink-0 rounded-full border border-[var(--border)] ${compact ? "h-14 w-14" : "h-16 w-16 2xl:h-[72px] 2xl:w-[72px]"}`}
    />
  );
}

function QuizBoardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="min-w-0 p-1 sm:p-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={`${PRIMARY_PULSE} h-7 w-32 rounded`} />
        <div className="ml-auto flex items-center gap-x-2.5 gap-y-1">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className={`${PRIMARY_PULSE} h-7 w-7 rounded-full`} />
              <span className={`${SECONDARY_PULSE} h-3.5 w-3 rounded`} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[168px] overflow-hidden px-2 py-4 2xl:h-[184px]">
        <div className="grid w-max grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, index) => (
            <QuizCircleSkeleton key={index} compact={compact} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SharedQuizQueueSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className={`${PRIMARY_PULSE} h-6 w-28 rounded`} />
          <div className={`${SECONDARY_PULSE} mt-2 h-3 w-20 rounded`} />
        </div>
        <div className={`${SECONDARY_PULSE} h-7 w-12 rounded-full`} />
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2.5 sm:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-10">
        {Array.from({ length: 10 }, (_, index) => (
          <QuizCircleSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function ProgressLoading() {
  return (
    <main
      className="min-h-0 flex-1 bg-[var(--background)] px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">진도를 불러오는 중입니다.</span>
      <div className="mx-auto max-w-[1720px]">
        <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className={`${PRIMARY_PULSE} h-9 w-56 rounded`} />
              <span className={`${SECONDARY_PULSE} h-7 w-12 rounded-full`} />
            </div>
            <div className="flex max-w-full items-center gap-3 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className={`${PRIMARY_PULSE} h-10 w-10 shrink-0 rounded-full`} />
                  <span className={`${SECONDARY_PULSE} h-3 w-8 rounded`} />
                </div>
              ))}
            </div>
          </div>

          <section className="mt-5" aria-label="퀴즈 진행도 로딩 중">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
              <div className="min-w-0">
                <SharedQuizQueueSkeleton />

                <div className="mt-10 border-t border-[var(--border)] pt-8">
                  <div className={`${PRIMARY_PULSE} h-7 w-48 rounded`} />
                  <div className="mt-5 grid min-w-0 grid-cols-1 gap-x-12 gap-y-6 2xl:grid-cols-2">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div key={index} className="min-w-0 border-b border-[var(--border)] pb-6">
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
