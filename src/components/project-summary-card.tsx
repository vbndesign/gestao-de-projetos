import Link from "next/link"
import { cn } from "@/lib/utils"

type SummaryField = {
  label: string
  value: React.ReactNode
  href?: string
  colSpan?: 2
}

type ProjectSummaryCardProps = {
  fields: SummaryField[]
  className?: string
}

export function ProjectSummaryCard({
  fields,
  className,
}: ProjectSummaryCardProps) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-lg p-6 sm:grid-cols-2",
        "bg-[var(--ds-color-component-project-summary-card-bg)]",
        className,
      )}
    >
      {fields.map((field, i) => (
        <div
          key={i}
          className={field.colSpan === 2 ? "sm:col-span-2" : undefined}
        >
          <p className="text-[length:var(--ds-typography-size-sm)] font-medium leading-[var(--ds-typography-line-height-sm)] text-[var(--ds-color-component-project-summary-card-label)]">
            {field.label}
          </p>
          {field.href ? (
            <p>
              <Link
                href={field.href}
                className="text-[var(--ds-color-component-project-summary-card-title)] hover:underline"
              >
                {field.value}
              </Link>
            </p>
          ) : (
            <p className="text-ds-heading">{field.value}</p>
          )}
        </div>
      ))}
    </div>
  )
}
