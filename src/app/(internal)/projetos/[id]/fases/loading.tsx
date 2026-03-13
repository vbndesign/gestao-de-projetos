export default function FasesLoading() {
  return (
    <div className="space-y-4">
      {/* Botão "Nova fase" placeholder */}
      <div className="flex justify-end">
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
      </div>
      {/* Cards de fase skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
