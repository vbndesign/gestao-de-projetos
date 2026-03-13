'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { ClienteFormModal } from './cliente-form-modal'
import { excluirClienteAction } from '@/actions/cliente.actions'

type ClienteData = {
  id: string
  nome: string
  empresa_organizacao: string | null
  email_principal: string | null
  telefone_contato: string | null
  observacoes: string | null
  created_at: Date
  updated_at: Date
}

type ProjetoListItem = {
  id: string
  nome: string
  status: string
  data_inicio: Date
  previsao_entrega: Date | null
}

export function ClienteDetalhe({
  cliente,
  projetos,
}: {
  cliente: ClienteData
  projetos: ProjetoListItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleExcluir() {
    startTransition(async () => {
      const result = await excluirClienteAction(cliente.id)
      if (result.success) {
        toast.success('Cliente excluído.')
        router.push('/clientes')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/clientes" className="hover:text-foreground">
          Clientes
        </Link>
        <span>/</span>
        <span className="text-foreground">{cliente.nome}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
          {cliente.empresa_organizacao && (
            <p className="text-muted-foreground">{cliente.empresa_organizacao}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ClienteFormModal
            cliente={cliente}
            trigger={<Button variant="outline">Editar</Button>}
          />
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
                <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir &quot;{cliente.nome}&quot;? Todos os
                  projetos e dados vinculados serão removidos permanentemente.
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
      </div>

      {/* Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        {cliente.email_principal && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{cliente.email_principal}</p>
          </div>
        )}
        {cliente.telefone_contato && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
            <p>{cliente.telefone_contato}</p>
          </div>
        )}
        {cliente.observacoes && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Observações</p>
            <p className="whitespace-pre-wrap">{cliente.observacoes}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Criado em</p>
          <p>{new Date(cliente.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Atualizado em</p>
          <p>{new Date(cliente.updated_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Projetos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Projetos</h2>
        {projetos.length === 0 ? (
          <p className="text-muted-foreground">Nenhum projeto vinculado.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {projetos.map((projeto) => (
              <div key={projeto.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link
                    href={`/projetos/${projeto.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {projeto.nome}
                  </Link>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span>{projeto.status}</span>
                    <span>{new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
