export default function ProgressLoading() {
  return (
    <main className="min-h-screen bg-[#fbf4e7] px-4 py-4 text-[#443b50] sm:px-6 lg:px-8" aria-busy="true">
      <div className="mx-auto max-w-[1720px]">
        <header className="flex items-center justify-between border-b border-[#e7dccb] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-[#eee4d7]" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-[#eee4d7]" />
              <div className="h-2.5 w-36 animate-pulse rounded bg-[#f3ede4]" />
            </div>
          </div>
          <div className="h-[42px] w-40 animate-pulse rounded-xl bg-[#f1ecfb]" />
        </header>

        <section className="mt-8 rounded-3xl border border-[#e7dccb] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgba(111,92,74,0.08)] sm:p-8">
          <div className="h-3 w-24 animate-pulse rounded bg-[#eee4d7]" />
          <div className="mt-2 h-9 w-56 animate-pulse rounded bg-[#eee4d7]" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-[#f3ede4]" />

          <div className="mt-8">
            <div className="h-4 w-32 animate-pulse rounded bg-[#f3ede4]" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-[#eee4d7] bg-[#fffefa] px-4 py-4"
                >
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-[#f1ecfb]" />
                  <div className="h-4 w-40 animate-pulse rounded bg-[#eee4d7]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
