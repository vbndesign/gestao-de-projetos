import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Legacy API (campos genéricos) — usado em ClienteDetalhe e ProjetoDetalhe ─

type SummaryField = {
  label: string
  value: React.ReactNode
  href?: string
  colSpan?: 2
}

type SummaryFieldsProps = {
  fields: SummaryField[]
  className?: string
}

export function SummaryFields({ fields, className }: SummaryFieldsProps) {
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

// ─── New API (dual-card tipado) — usado em ProjetoDetalhe (Phase 6) ──────────

type ProjectSummaryProps = {
  clienteNome: string
  clienteHref?: string
  tarefasConcluidas: number
  totalTarefas: number
  horasTrabalhadas: number
  horasEstimadas: number
  orcamento: number | null
  dataInicio: Date
  previsaoTermino: Date | null
  className?: string
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR")
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function calcDiasRestantes(previsao: Date) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(previsao)
  alvo.setHours(0, 0, 0, 0)
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export function ProjectSummary({
  clienteNome,
  clienteHref,
  tarefasConcluidas,
  totalTarefas,
  horasTrabalhadas,
  horasEstimadas,
  orcamento,
  dataInicio,
  previsaoTermino,
  className,
}: ProjectSummaryProps) {
  const diasRestantes = previsaoTermino ? calcDiasRestantes(previsaoTermino) : null

  return (
    <div className={cn("flex items-end gap-4", className)}>
      {/* summaryCard */}
      <div className="flex flex-1 items-center gap-[72px] self-stretch rounded-[6px] border border-[var(--ds-color-component-data-row-default-border)] px-6">
        {/* Cliente */}
        <div className="flex flex-1 flex-col items-start">
          {clienteHref ? (
            <Link
              href={clienteHref}
              className="text-[length:var(--ds-typography-size-h6)] font-semibold leading-[var(--ds-typography-line-height-h6)] text-ds-heading hover:underline"
            >
              {clienteNome}
            </Link>
          ) : (
            <p className="text-[length:var(--ds-typography-size-h6)] font-semibold leading-[var(--ds-typography-line-height-h6)] text-ds-heading">
              {clienteNome}
            </p>
          )}
          <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            Cliente
          </p>
        </div>

        {/* Tarefas concluídas */}
        <div className="flex w-40 flex-col items-start">
          <p className="text-[length:var(--ds-typography-size-lg)] font-semibold leading-[var(--ds-typography-line-height-lg)] text-ds-heading">
            {tarefasConcluidas} / {totalTarefas}
          </p>
          <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            Tarefas concluídas
          </p>
        </div>

        {/* Horas trabalhadas */}
        <div className="flex w-40 flex-col items-start">
          <p className="text-[length:var(--ds-typography-size-lg)] font-semibold leading-[var(--ds-typography-line-height-lg)] text-ds-heading">
            {horasTrabalhadas} / {horasEstimadas}
          </p>
          <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            Horas trabalhadas
          </p>
        </div>
      </div>

      {/* highlightCard */}
      <div className="flex shrink-0 items-center gap-[72px] rounded-[6px] bg-[var(--ds-color-component-project-summary-card-bg)] px-10 py-8">
        {/* Orçamento */}
        <div className="flex flex-col items-start">
          <p className="text-[length:var(--ds-typography-size-lg)] font-bold leading-[var(--ds-typography-line-height-lg)] text-[var(--ds-color-component-project-summary-card-title)]">
            {orcamento !== null ? formatCurrency(orcamento) : "—"}
          </p>
          <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            Orçamento
          </p>
        </div>

        {/* Data de início */}
        <div className="flex flex-col items-start">
          <p className="text-[length:var(--ds-typography-size-lg)] font-bold leading-[var(--ds-typography-line-height-lg)] text-[var(--ds-color-component-project-summary-card-title)]">
            {formatDate(dataInicio)}
          </p>
          <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            Data de início
          </p>
        </div>

        {/* Previsão de término */}
        <div className="flex flex-col items-start whitespace-nowrap">
          <p className="text-[length:var(--ds-typography-size-lg)] font-bold leading-[var(--ds-typography-line-height-lg)] text-[var(--ds-color-component-project-summary-card-title)]">
            {diasRestantes !== null ? `${diasRestantes} dias` : "—"}
          </p>
          <p className="text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            Previsão de término
          </p>
        </div>
      </div>
    </div>
  )
}
