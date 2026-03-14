export default function TimelineLoading() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          </div>
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-4 rounded-lg border p-4">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="flex-1 h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
