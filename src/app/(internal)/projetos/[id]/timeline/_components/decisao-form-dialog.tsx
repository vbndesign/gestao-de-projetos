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
import { DecisaoFormSchema, type DecisaoFormData } from '@/types/schemas/decisao.schema'
import { criarDecisaoAction, editarDecisaoAction } from '@/actions/registro-operacional.actions'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = { id: string; titulo: string; data_reuniao: Date; fase_id: string | null; participantes: string | null; link_referencia: string | null; resumo_executivo: string | null; ata_resumida: string | null; created_at: Date }
type DecisaoItem = { id: string; titulo: string; descricao: string; contexto: string | null; impacto: string | null; data_decisao: Date; fase_id: string | null; reuniao_id: string | null; created_at: Date }

type DecisaoFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  reunioes: ReuniaoItem[]
  decisao?: DecisaoItem
  onSuccess?: () => void
}

export function DecisaoFormDialog({ trigger, projetoId, fases, reunioes, decisao, onSuccess }: DecisaoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<DecisaoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(DecisaoFormSchema as any),
    defaultValues: decisao ? {
      titulo: decisao.titulo,
      descricao: decisao.descricao,
      data_decisao: decisao.data_decisao.toLocaleDateString('sv-SE') as unknown as Date,
      fase_id: decisao.fase_id ?? null,
      reuniao_id: decisao.reuniao_id ?? null,
      contexto: decisao.contexto ?? '',
      impacto: decisao.impacto ?? '',
    } : { titulo: '', descricao: '', data_decisao: undefined, fase_id: null, reuniao_id: null },
  })

  function onSubmit(data: DecisaoFormData) {
    startTransition(async () => {
      const result = decisao
        ? await editarDecisaoAction(decisao.id, data)
        : await criarDecisaoAction(projetoId, data)
      if (result.success) {
        toast.success(decisao ? 'Decisão atualizada' : 'Decisão criada')
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
          <DialogTitle>{decisao ? 'Editar decisão' : 'Nova decisão'}</DialogTitle>
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
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea id="descricao" {...form.register('descricao')} />
            {form.formState.errors.descricao && (
              <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_decisao">Data *</Label>
            <Input id="data_decisao" type="date" {...form.register('data_decisao')} />
            {form.formState.errors.data_decisao && (
              <p className="text-sm text-destructive">{form.formState.errors.data_decisao.message}</p>
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
            <Label>Reunião de origem</Label>
            <Controller
              name="reuniao_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem reunião de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem reunião de origem</SelectItem>
                    {reunioes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.titulo} ({r.data_reuniao.toLocaleDateString('pt-BR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="contexto">Contexto</Label>
            <Textarea id="contexto" {...form.register('contexto')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="impacto">Impacto</Label>
            <Textarea id="impacto" {...form.register('impacto')} />
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
