export function ShellSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-8 w-48 rounded-md bg-ds-subtle" />
      <div className="flex flex-col gap-4">
        <div className="h-4 w-full rounded bg-ds-subtle" />
        <div className="h-4 w-5/6 rounded bg-ds-subtle" />
        <div className="h-4 w-4/6 rounded bg-ds-subtle" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 rounded-md bg-ds-subtle" />
        <div className="h-24 rounded-md bg-ds-subtle" />
        <div className="h-24 rounded-md bg-ds-subtle" />
      </div>
    </div>
  )
}
