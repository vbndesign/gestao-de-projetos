import Link from "next/link"
import { cn } from "@/lib/utils"

type BreadcrumbItem = {
  label: string
  href?: string
}

type PageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-ds-heading">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ds-heading">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[length:var(--ds-typography-size-h5)] font-semibold leading-[var(--ds-typography-line-height-h5)] text-ds-heading">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
