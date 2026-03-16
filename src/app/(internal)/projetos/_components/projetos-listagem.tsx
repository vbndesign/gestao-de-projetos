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
import { Badge } from '@/components/ui/badge'
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
        title="Projetos"
        actions={
          <Link href="/projetos/novo">
            <Button variant="filled-brand">Novo projeto</Button>
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusAtual}
          onValueChange={(v) => handleFiltro('status', v ?? '')}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os status" />
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os clientes" />
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
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista */}
      {projetos.length === 0 ? (
        <p className="py-8 text-center text-ds-muted">
          Nenhum projeto encontrado.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--ds-color-component-data-row-default-border)]">
          {projetos.map((projeto) => (
            <DataRowProjects
              key={projeto.id}
              id={projeto.id}
              nome={projeto.nome}
              clienteNome={projeto.cliente.nome}
              dataInicio={projeto.data_inicio}
              badge={
                <Badge variant="purple">
                  {STATUS_LABELS[projeto.status] ?? projeto.status}
                </Badge>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
