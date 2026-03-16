import Link from "next/link"
import { cn } from "@/lib/utils"

type DataRowProjectsProps = {
  id: string
  nome: string
  clienteNome: string
  dataInicio: Date
  badge?: React.ReactNode
  className?: string
}

export function DataRowProjects({
  id,
  nome,
  clienteNome,
  dataInicio,
  badge,
  className,
}: DataRowProjectsProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 border-b px-4 py-3 transition-colors",
        "border-[var(--ds-color-component-data-row-default-border)]",
        "bg-[var(--ds-color-component-data-row-default-bg)]",
        "hover:border-[var(--ds-color-component-data-row-hover-border)]",
        "hover:bg-[var(--ds-color-component-data-row-hover-bg)]",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Link
          href={`/projetos/${id}`}
          className={cn(
            "text-[length:var(--ds-typography-size-base)] font-medium leading-[var(--ds-typography-line-height-base)]",
            "text-[var(--ds-color-component-data-row-default-title)]",
            "group-hover:text-[var(--ds-color-component-data-row-hover-title)]",
          )}
        >
          {nome}
        </Link>
        <div className="flex gap-3 text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
          <span>{clienteNome}</span>
          <span>
            {new Date(dataInicio).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
      {badge}
    </div>
  )
}
