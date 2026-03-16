'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ProjectSummaryCard } from '../../_components/project-summary-card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjetoFormSchema, type ProjetoFormData } from '@/types/schemas/projeto.schema'
import { editarProjetoAction, excluirProjetoAction } from '@/actions/projeto.actions'
import { STATUS_LABELS } from '@/lib/constants'

type ProjetoData = {
  id: string
  nome: string
  cliente_id: string
  descricao: string | null
  status: string
  data_inicio: Date
  previsao_entrega: Date | null
  data_conclusao_real: Date | null
  fase_atual_id: string | null
  created_at: Date
  updated_at: Date
  cliente: { id: string; nome: string }
  fases: { id: string; nome: string; status: string; ordem: number; is_fase_geral: boolean }[]
}

export function ProjetoDetalhe({
  projeto,
  clientes,
}: {
  projeto: ProjetoData
  clientes: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProjetoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProjetoFormSchema as any),
    defaultValues: {
      nome: projeto.nome,
      cliente_id: projeto.cliente_id,
      descricao: projeto.descricao ?? '',
      status: projeto.status as ProjetoFormData['status'],
      // z.coerce.date() aceita strings em runtime; cast necessário para TypeScript
      data_inicio: new Date(projeto.data_inicio).toLocaleDateString('sv-SE') as unknown as Date,
      previsao_entrega: projeto.previsao_entrega
        ? new Date(projeto.previsao_entrega).toLocaleDateString('sv-SE') as unknown as Date
        : undefined,
      data_conclusao_real: projeto.data_conclusao_real
        ? new Date(projeto.data_conclusao_real).toLocaleDateString('sv-SE') as unknown as Date
        : undefined,
    },
  })

  function onSubmit(data: ProjetoFormData) {
    startTransition(async () => {
      const result = await editarProjetoAction(projeto.id, data)
      if (result.success) {
        toast.success('Projeto atualizado.')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleExcluir() {
    startTransition(async () => {
      const result = await excluirProjetoAction(projeto.id)
      if (result.success) {
        toast.success('Projeto excluído.')
        router.push('/projetos')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline">Editar</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar projeto</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {/* Nome */}
              <div className="grid gap-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input id="edit-nome" {...form.register('nome')} />
                {form.formState.errors.nome && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>

              {/* Cliente */}
              <div className="grid gap-2">
                <Label htmlFor="edit-cliente_id">Cliente *</Label>
                <Controller
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                      <SelectTrigger id="edit-cliente_id">
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
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea id="edit-descricao" {...form.register('descricao')} />
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? field.value)}>
                      <SelectTrigger id="edit-status">
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
                <Label htmlFor="edit-data_inicio">Data de início *</Label>
                <Input
                  id="edit-data_inicio"
                  type="date"
                  {...form.register('data_inicio')}
                />
                {form.formState.errors.data_inicio && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.data_inicio.message}
                  </p>
                )}
              </div>

              {/* Previsão de entrega */}
              <div className="grid gap-2">
                <Label htmlFor="edit-previsao_entrega">Previsão de entrega</Label>
                <Input
                  id="edit-previsao_entrega"
                  type="date"
                  {...form.register('previsao_entrega', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
              </div>

              {/* Data de conclusão real */}
              <div className="grid gap-2">
                <Label htmlFor="edit-data_conclusao_real">Data de conclusão real</Label>
                <Input
                  id="edit-data_conclusao_real"
                  type="date"
                  {...form.register('data_conclusao_real', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" disabled={isPending}>
                Excluir
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir &quot;{projeto.nome}&quot;? Todos os
                dados vinculados serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleExcluir}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info Grid */}
      <ProjectSummaryCard
        fields={[
          {
            label: 'Cliente',
            value: projeto.cliente.nome,
            href: `/clientes/${projeto.cliente.id}`,
          },
          {
            label: 'Status',
            value: (
              <Badge variant="purple">
                {STATUS_LABELS[projeto.status] ?? projeto.status}
              </Badge>
            ),
          },
          {
            label: 'Data de início',
            value: new Date(projeto.data_inicio).toLocaleDateString('pt-BR'),
          },
          ...(projeto.previsao_entrega
            ? [{
                label: 'Previsão de entrega',
                value: new Date(projeto.previsao_entrega).toLocaleDateString('pt-BR'),
              }]
            : []),
          ...(projeto.data_conclusao_real
            ? [{
                label: 'Data de conclusão real',
                value: new Date(projeto.data_conclusao_real).toLocaleDateString('pt-BR'),
              }]
            : []),
          ...(projeto.descricao
            ? [{
                label: 'Descrição',
                value: <span className="whitespace-pre-wrap">{projeto.descricao}</span>,
                colSpan: 2 as const,
              }]
            : []),
          {
            label: 'Criado em',
            value: new Date(projeto.created_at).toLocaleDateString('pt-BR'),
          },
          {
            label: 'Atualizado em',
            value: new Date(projeto.updated_at).toLocaleDateString('pt-BR'),
          },
        ]}
      />

      {/* Fases */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Fases</h2>
        {projeto.fases.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma fase encontrada.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {projeto.fases.map((fase) => (
              <div key={fase.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{fase.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {fase.is_fase_geral ? 'Fase geral' : `Ordem: ${fase.ordem}`}
                  </p>
                </div>
                <Badge variant="outline">{fase.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
