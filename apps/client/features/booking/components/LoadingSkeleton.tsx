export default function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-surface-card shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] md:divide-x md:divide-slate-200">
          <div className="animate-pulse border-b border-slate-200 p-8 md:border-b-0">
            <div className="h-14 w-14 rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-1/2 rounded-md bg-slate-200" />
            <div className="mt-2 h-6 w-3/4 rounded-md bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded-md bg-slate-200" />
          </div>
          <div className="p-8">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-24 shrink-0 animate-pulse rounded-lg bg-slate-200"
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-slate-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}