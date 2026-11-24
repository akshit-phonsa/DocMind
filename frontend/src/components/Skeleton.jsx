/** Pulsing placeholder rows shaped like the list cards they stand in for. */
export default function ListSkeleton({ rows = 4, label = 'Loading' }) {
  return (
    <div role="status" aria-label={label} className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 p-3 dark:border-white/5 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 rounded-lg bg-slate-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-2.5 w-1/3 rounded bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  )
}
