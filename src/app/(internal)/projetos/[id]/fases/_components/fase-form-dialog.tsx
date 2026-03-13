'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FaseFormSchema, type FaseFormData } from '@/types/schemas/fase.schema'
import { criarFaseAction, editarFaseAction } from '@/actions/fase.actions'
import { FASE_STATUS_LABELS } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
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

type FaseData = {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  status: string
  data_inicio_prevista: Date | null
  data_fim_prevista: Date | null
  data_inicio_real: Date | null
  data_fim_real: Date | null
  is_fase_geral: boolean
  created_at: Date
}

type FaseFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fase?: FaseData
  onSuccess?: () => void
}

export function FaseFormDialog({ trigger, projetoId, fase, onSuccess }: FaseFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FaseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(FaseFormSchema as any),
    defaultValues: {
      nome: fase?.nome ?? '',
      status: (fase?.status as FaseFormData['status']) ?? 'nao_iniciada',
      descricao: fase?.descricao ?? '',
      data_inicio_prevista: fase?.data_inicio_prevista
        ? new Date(fase.data_inicio_prevista).toLocaleDateString('sv-SE') as unknown as Date
        : undefined,
      data_fim_prevista: fase?.data_fim_prevista
        ? new Date(fase.data_fim_prevista).toLocaleDateString('sv-SE') as unknown as Date
        : undefined,
      data_inicio_real: fase?.data_inicio_real
        ? new Date(fase.data_inicio_real).toLocaleDateString('sv-SE') as unknown as Date
        : undefined,
      data_fim_real: fase?.data_fim_real
        ? new Date(fase.data_fim_real).toLocaleDateString('sv-SE') as unknown as Date
        : undefined,
    },
  })

  function onSubmit(data: FaseFormData) {
    startTransition(async () => {
      const result = fase
        ? await editarFaseAction(fase.id, data)
        : await criarFaseAction(projetoId, data)
      if (result.success) {
        toast.success(fase ? 'Fase atualizada.' : 'Fase criada.')
        setOpen(false)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fase ? 'Editar fase' : 'Nova fase'}</DialogTitle>
          <DialogDescription>
            {fase ? 'Altere os dados da fase.' : 'Preencha os dados da nova fase.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="fase-nome">Nome *</Label>
            <Input id="fase-nome" {...form.register('nome')} />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive">
                {form.formState.errors.nome.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="fase-status">Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                  <SelectTrigger id="fase-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FASE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="fase-descricao">Descrição</Label>
            <Textarea id="fase-descricao" {...form.register('descricao')} />
          </div>

          {/* Data início prevista */}
          <div className="grid gap-2">
            <Label htmlFor="fase-data_inicio_prevista">Data início prevista</Label>
            <Input
              id="fase-data_inicio_prevista"
              type="date"
              {...form.register('data_inicio_prevista', {
                setValueAs: (v) => (v === '' ? undefined : v),
              })}
            />
          </div>

          {/* Data fim prevista */}
          <div className="grid gap-2">
            <Label htmlFor="fase-data_fim_prevista">Data fim prevista</Label>
            <Input
              id="fase-data_fim_prevista"
              type="date"
              {...form.register('data_fim_prevista', {
                setValueAs: (v) => (v === '' ? undefined : v),
              })}
            />
          </div>

          {/* Data início real */}
          <div className="grid gap-2">
            <Label htmlFor="fase-data_inicio_real">Data início real</Label>
            <Input
              id="fase-data_inicio_real"
              type="date"
              {...form.register('data_inicio_real', {
                setValueAs: (v) => (v === '' ? undefined : v),
              })}
            />
          </div>

          {/* Data fim real */}
          <div className="grid gap-2">
            <Label htmlFor="fase-data_fim_real">Data fim real</Label>
            <Input
              id="fase-data_fim_real"
              type="date"
              {...form.register('data_fim_real', {
                setValueAs: (v) => (v === '' ? undefined : v),
              })}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
