'use client'

import { useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { DataRowProjects } from './data-row-projects'
import { STATUS_LABELS } from '@/lib/constants'

type ProjetoListItem = {
  id: string
  nome: string
  status: string
  data_inicio: Date
  previsao_entrega: Date | null
  created_at: Date
  cliente: { id: string; nome: string }
  fases: { _count: { tarefas: number } }[]
}

export function ProjetosListagem({
  projetos,
  clientes,
}: {
  projetos: ProjetoListItem[]
  clientes: { id: string; nome: string }[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const statusAtual = searchParams.get('status') ?? ''
  const clienteAtual = searchParams.get('cliente') ?? ''
  const temFiltro = statusAtual || clienteAtual

  function handleFiltro(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace('/projetos?' + params.toString())
    })
  }

  function limparFiltros() {
    startTransition(() => {
      router.replace('/projetos')
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus projetos"
        actions={
          <div className="flex items-center gap-4">
            <Select
              value={statusAtual}
              onValueChange={(v) => handleFiltro('status', v ?? '')}
            >
              <SelectTrigger className="h-14 data-[size=default]:h-14 gap-4 rounded-[4px] border-[var(--ds-color-component-button-outline-brand-default-border)] p-4 text-base text-[var(--ds-color-component-button-outline-brand-default-text)] hover:bg-[var(--ds-color-component-button-outline-brand-hover-bg)] [&_svg]:size-6 [&_svg]:text-[var(--ds-color-component-button-outline-brand-default-text)]">
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={clienteAtual}
              onValueChange={(v) => handleFiltro('cliente', v ?? '')}
            >
              <SelectTrigger className="h-14 data-[size=default]:h-14 gap-4 rounded-[4px] border-[var(--ds-color-component-button-outline-brand-default-border)] p-4 text-base text-[var(--ds-color-component-button-outline-brand-default-text)] hover:bg-[var(--ds-color-component-button-outline-brand-hover-bg)] [&_svg]:size-6 [&_svg]:text-[var(--ds-color-component-button-outline-brand-default-text)]">
                <SelectValue placeholder="Selecionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {temFiltro && (
              <Button variant="ghost" size="sm" onClick={limparFiltros} disabled={isPending}>
                Limpar filtros
              </Button>
            )}

            <Link href="/projetos/novo">
              <Button variant="filled-brand" className="h-14 rounded-[4px]">
                Novo projeto
              </Button>
            </Link>
          </div>
        }
      />

      {/* Lista */}
      {projetos.length === 0 ? (
        <p className="py-8 text-center text-ds-muted">
          Nenhum projeto encontrado.
        </p>
      ) : (
        <div className="flex flex-col gap-4 rounded-[6px] bg-white p-6">
          {/* ListHeader */}
          <div
            className="flex shrink-0 items-center gap-16 rounded-[6px] px-6 py-4 text-[length:var(--ds-typography-size-sm)] font-semibold leading-[var(--ds-typography-line-height-sm)]"
            style={{
              backgroundColor: 'var(--ds-color-component-data-row-header-bg)',
              color: 'var(--ds-color-component-data-row-header-text)',
            }}
          >
            <span className="w-[420px] shrink-0">Projetos</span>
            <span className="w-20 shrink-0">Tarefas</span>
            <span className="w-20 shrink-0">Horas</span>
            <span className="w-[140px] shrink-0">Orçamento</span>
            <span className="w-[140px] shrink-0">Data de início</span>
            <span className="w-48 shrink-0">Previsão de término</span>
          </div>

          {/* Rows */}
          {projetos.map((projeto) => {
            const totalTarefas = projeto.fases.reduce(
              (sum, f) => sum + f._count.tarefas,
              0,
            )
            return (
              <DataRowProjects
                key={projeto.id}
                id={projeto.id}
                nome={projeto.nome}
                clienteNome={projeto.cliente.nome}
                totalTarefas={totalTarefas}
                dataInicio={projeto.data_inicio}
                previsaoEntrega={projeto.previsao_entrega}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
