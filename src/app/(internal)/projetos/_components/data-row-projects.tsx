import Link from "next/link"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type DataRowProjectsProps = {
  id: string
  nome: string
  clienteNome: string
  totalTarefas: number
  dataInicio: Date
  previsaoEntrega: Date | null
  className?: string
}

export function DataRowProjects({
  id,
  nome,
  clienteNome,
  totalTarefas,
  dataInicio,
  previsaoEntrega,
  className,
}: DataRowProjectsProps) {
  return (
    <Link
      href={`/projetos/${id}`}
      className={cn(
        "group flex items-center gap-ds-64 rounded-[6px] border p-ds-24 transition-colors",
        "border-[var(--ds-color-component-data-row-default-border)] bg-[var(--ds-color-component-data-row-default-bg)]",
        "hover:border-[var(--ds-color-component-data-row-hover-border)] hover:bg-[var(--ds-color-component-data-row-hover-bg)]",
        className,
      )}
    >
      {/* primaryInfo */}
      <div className="flex min-w-[380px] flex-1 items-center gap-ds-16">
        {/* IconTile inline */}
        <div className="shrink-0 rounded-[2px] bg-[var(--ds-color-component-icon-tile-purple-bg)] p-3">
          <BookOpen
            size={24}
            className="text-[var(--ds-color-component-icon-tile-purple-icon)]"
          />
        </div>

        {/* nome + cliente */}
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
          <p
            className={cn(
              "w-full truncate text-[length:var(--ds-typography-size-lg)] font-semibold leading-[var(--ds-typography-line-height-lg)] transition-colors",
              "text-[var(--ds-color-component-data-row-default-title)] group-hover:text-[var(--ds-color-component-data-row-hover-title)]",
            )}
          >
            {nome}
          </p>
          <p className="w-full truncate text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-body">
            {clienteNome}
          </p>
        </div>
      </div>

      {/* Tarefas — 80px */}
      <p className="w-20 shrink-0 text-[length:var(--ds-typography-size-base)] leading-[var(--ds-typography-line-height-base)] text-ds-muted">
        — / {totalTarefas}
      </p>

      {/* Data de início — 140px */}
      <p className="w-[140px] shrink-0 text-[length:var(--ds-typography-size-base)] leading-[var(--ds-typography-line-height-base)] text-ds-muted">
        {new Date(dataInicio).toLocaleDateString("pt-BR")}
      </p>

      {/* Previsão de término — 192px */}
      <p className="w-48 shrink-0 text-[length:var(--ds-typography-size-base)] leading-[var(--ds-typography-line-height-base)] text-ds-muted">
        {previsaoEntrega
          ? new Date(previsaoEntrega).toLocaleDateString("pt-BR")
          : "—"}
      </p>
    </Link>
  )
}
