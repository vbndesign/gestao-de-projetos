'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ClienteFormSchema, type ClienteFormData } from '@/types/schemas/cliente.schema'
import { criarClienteAction, editarClienteAction } from '@/actions/cliente.actions'

type ClienteData = {
  id: string
  nome: string
  empresa_organizacao: string | null
  email_principal: string | null
  telefone_contato: string | null
  observacoes: string | null
}

export function ClienteFormModal({
  cliente,
  trigger,
}: {
  cliente?: ClienteData
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEditing = !!cliente

  const form = useForm<ClienteFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ClienteFormSchema as any),
    defaultValues: {
      nome: cliente?.nome ?? '',
      empresa_organizacao: cliente?.empresa_organizacao ?? '',
      email_principal: cliente?.email_principal ?? '',
      telefone_contato: cliente?.telefone_contato ?? '',
      observacoes: cliente?.observacoes ?? '',
    },
  })

  function onSubmit(data: ClienteFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await editarClienteAction(cliente.id, data)
        : await criarClienteAction(data)

      if (result.success) {
        toast.success(isEditing ? 'Cliente atualizado.' : 'Cliente criado.')
        setOpen(false)
        if (!isEditing) form.reset()
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
          <DialogTitle>{isEditing ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...form.register('nome')} />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="empresa_organizacao">Empresa / Organização</Label>
            <Input id="empresa_organizacao" {...form.register('empresa_organizacao')} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email_principal">Email</Label>
            <Input id="email_principal" type="email" {...form.register('email_principal')} />
            {form.formState.errors.email_principal && (
              <p className="text-sm text-destructive">{form.formState.errors.email_principal.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="telefone_contato">Telefone</Label>
            <Input id="telefone_contato" {...form.register('telefone_contato')} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...form.register('observacoes')} />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing ? 'Salvando...' : 'Criando...'
              : isEditing ? 'Salvar' : 'Criar cliente'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
