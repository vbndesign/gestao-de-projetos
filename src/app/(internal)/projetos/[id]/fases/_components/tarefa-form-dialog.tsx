'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { TarefaFormSchema, type TarefaFormData } from '@/types/schemas/tarefa.schema'
import { criarTarefaAction, editarTarefaAction } from '@/actions/tarefa.actions'
import { TAREFA_STATUS_LABELS } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type TarefaData = {
  id: string
  titulo: string
  descricao: string | null
  status: string
  ordem: number
  tempo_estimado_horas: number | null
}

type TarefaFormDialogProps = {
  trigger: React.ReactElement
  faseId: string
  tarefa?: TarefaData
  onSuccess?: () => void
}

export function TarefaFormDialog({ trigger, faseId, tarefa, onSuccess }: TarefaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isEditing = !!tarefa

  const form = useForm<TarefaFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(TarefaFormSchema as any),
    defaultValues: isEditing
      ? {
          titulo: tarefa.titulo,
          status: tarefa.status as TarefaFormData['status'],
          descricao: tarefa.descricao ?? '',
          tempo_estimado_horas: tarefa.tempo_estimado_horas,
        }
      : {
          titulo: '',
          status: 'nao_iniciada',
          descricao: '',
          tempo_estimado_horas: null,
        },
  })

  function onSubmit(data: TarefaFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await editarTarefaAction(tarefa.id, data)
        : await criarTarefaAction(faseId, data)

      if (result.success) {
        toast.success(isEditing ? 'Tarefa atualizada.' : 'Tarefa criada.')
        setOpen(false)
        form.reset()
        onSuccess?.()
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
          <DialogTitle>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da tarefa.' : 'Preencha o título para criar a tarefa.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Título */}
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...form.register('titulo')} />
            {form.formState.errors.titulo && (
              <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status *</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'nao_iniciada')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TAREFA_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.status && (
              <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" rows={3} {...form.register('descricao')} />
          </div>

          {/* Horas estimadas */}
          <div className="space-y-1">
            <Label htmlFor="tempo_estimado_horas">Horas estimadas</Label>
            <Input
              id="tempo_estimado_horas"
              type="number"
              step="0.5"
              min="0.01"
              {...form.register('tempo_estimado_horas', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
            />
            {form.formState.errors.tempo_estimado_horas && (
              <p className="text-sm text-destructive">
                {form.formState.errors.tempo_estimado_horas.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
