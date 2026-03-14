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
import { ReuniaoFormSchema, type ReuniaoFormData } from '@/types/schemas/reuniao.schema'
import { criarReuniaoAction, editarReuniaoAction } from '@/actions/registro-operacional.actions'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = {
  id: string; titulo: string; data_reuniao: Date; fase_id: string | null
  participantes: string | null; link_referencia: string | null
  resumo_executivo: string | null; ata_resumida: string | null; created_at: Date
}

type ReuniaoFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  reuniao?: ReuniaoItem
  onSuccess?: () => void
}

export function ReuniaoFormDialog({ trigger, projetoId, fases, reuniao, onSuccess }: ReuniaoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ReuniaoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ReuniaoFormSchema as any),
    defaultValues: reuniao ? {
      titulo: reuniao.titulo,
      data_reuniao: reuniao.data_reuniao.toLocaleDateString('sv-SE') as unknown as Date,
      fase_id: reuniao.fase_id ?? null,
      participantes: reuniao.participantes ?? '',
      link_referencia: reuniao.link_referencia ?? '',
      resumo_executivo: reuniao.resumo_executivo ?? '',
      ata_resumida: reuniao.ata_resumida ?? '',
    } : {
      titulo: '',
      data_reuniao: undefined,
      fase_id: null,
    },
  })

  function onSubmit(data: ReuniaoFormData) {
    startTransition(async () => {
      const result = reuniao
        ? await editarReuniaoAction(reuniao.id, data)
        : await criarReuniaoAction(projetoId, data)
      if (result.success) {
        toast.success(reuniao ? 'Reunião atualizada' : 'Reunião criada')
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
          <DialogTitle>{reuniao ? 'Editar reunião' : 'Nova reunião'}</DialogTitle>
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
            <Label htmlFor="data_reuniao">Data *</Label>
            <Input id="data_reuniao" type="date" {...form.register('data_reuniao')} />
            {form.formState.errors.data_reuniao && (
              <p className="text-sm text-destructive">{form.formState.errors.data_reuniao.message}</p>
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
            <Label htmlFor="participantes">Participantes</Label>
            <Textarea id="participantes" {...form.register('participantes')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="link_referencia">Link de referência</Label>
            <Input id="link_referencia" {...form.register('link_referencia')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="resumo_executivo">Resumo executivo</Label>
            <Textarea id="resumo_executivo" {...form.register('resumo_executivo')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ata_resumida">Ata resumida</Label>
            <Textarea id="ata_resumida" {...form.register('ata_resumida')} />
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
