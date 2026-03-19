'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckpointFormSchema, type CheckpointFormData } from '@/types/schemas/checkpoint.schema'
import { criarCheckpointAction, editarCheckpointAction } from '@/actions/registro-operacional.actions'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type CheckpointItem = { id: string; titulo: string; resumo: string; proximos_passos: string | null; data_checkpoint: Date; fase_id: string | null; created_at: Date }

type CheckpointFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  checkpoint?: CheckpointItem
  onSuccess?: () => void
}

export function CheckpointFormDialog({ trigger, projetoId, fases, checkpoint, onSuccess }: CheckpointFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CheckpointFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CheckpointFormSchema as any),
    defaultValues: checkpoint ? {
      titulo: checkpoint.titulo,
      resumo: checkpoint.resumo,
      data_checkpoint: checkpoint.data_checkpoint.toLocaleDateString('sv-SE') as unknown as Date,
      fase_id: checkpoint.fase_id ?? null,
      proximos_passos: checkpoint.proximos_passos ?? '',
    } : { titulo: '', resumo: '', data_checkpoint: undefined, fase_id: null },
  })

  function onSubmit(data: CheckpointFormData) {
    startTransition(async () => {
      const result = checkpoint
        ? await editarCheckpointAction(checkpoint.id, data)
        : await criarCheckpointAction(projetoId, data)
      if (result.success) {
        toast.success(checkpoint ? 'Checkpoint atualizado' : 'Checkpoint criado')
        setOpen(false)
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
          <DialogTitle>{checkpoint ? 'Editar checkpoint' : 'Novo checkpoint'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...form.register('titulo')} />
            {form.formState.errors.titulo && (
              <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="resumo">Resumo *</Label>
            <Textarea id="resumo" {...form.register('resumo')} />
            {form.formState.errors.resumo && (
              <p className="text-sm text-destructive">{form.formState.errors.resumo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_checkpoint">Data *</Label>
            <Input id="data_checkpoint" type="date" {...form.register('data_checkpoint')} />
            {form.formState.errors.data_checkpoint && (
              <p className="text-sm text-destructive">{form.formState.errors.data_checkpoint.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Fase</Label>
            <Controller
              name="fase_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem fase</SelectItem>
                    {fases.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.is_fase_geral ? `${f.nome} (Geral)` : f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="proximos_passos">Próximos passos</Label>
            <Textarea id="proximos_passos" {...form.register('proximos_passos')} />
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
