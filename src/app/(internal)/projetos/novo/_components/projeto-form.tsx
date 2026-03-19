'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjetoFormSchema, type ProjetoFormData } from '@/types/schemas/projeto.schema'
import { criarProjetoAction } from '@/actions/projeto.actions'
import { STATUS_LABELS } from '@/lib/constants'

export function ProjetoForm({
  clientes,
}: {
  clientes: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProjetoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProjetoFormSchema as any),
    defaultValues: {
      nome: '',
      cliente_id: '',
      descricao: '',
      status: 'rascunho',
    },
  })

  function onSubmit(data: ProjetoFormData) {
    startTransition(async () => {
      const result = await criarProjetoAction(data)
      if (result.success) {
        router.push('/projetos/' + result.projetoId)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projetos" className="hover:text-foreground">
          Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground">Novo projeto</span>
      </nav>

      <h1 className="text-2xl font-semibold">Novo projeto</h1>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        {/* Nome */}
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" {...form.register('nome')} />
          {form.formState.errors.nome && (
            <p className="text-sm text-destructive">
              {form.formState.errors.nome.message}
            </p>
          )}
        </div>

        {/* Cliente */}
        <div className="grid gap-2">
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Controller
            control={form.control}
            name="cliente_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                <SelectTrigger id="cliente_id">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.cliente_id && (
            <p className="text-sm text-destructive">
              {form.formState.errors.cliente_id.message}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" {...form.register('descricao')} />
        </div>

        {/* Status */}
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'rascunho')}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Data de início */}
        <div className="grid gap-2">
          <Label htmlFor="data_inicio">Data de início *</Label>
          <Input id="data_inicio" type="date" {...form.register('data_inicio')} />
          {form.formState.errors.data_inicio && (
            <p className="text-sm text-destructive">
              {form.formState.errors.data_inicio.message}
            </p>
          )}
        </div>

        {/* Previsão de entrega */}
        <div className="grid gap-2">
          <Label htmlFor="previsao_entrega">Previsão de entrega</Label>
          <Input
            id="previsao_entrega"
            type="date"
            {...form.register('previsao_entrega', {
              setValueAs: (v) => (v === '' ? undefined : v),
            })}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar projeto'}
        </Button>
      </form>
    </div>
  )
}
