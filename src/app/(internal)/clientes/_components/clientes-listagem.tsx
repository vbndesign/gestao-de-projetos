'use client'

import { useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type ClienteListItem = {
  id: string
  nome: string
  empresa_organizacao: string | null
  email_principal: string | null
  created_at: Date
}

export function ClientesListagem({ clientes }: { clientes: ClienteListItem[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const busca = searchParams.get('busca') ?? ''

  const filtrados = clientes.filter((c) => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      c.nome.toLowerCase().includes(termo) ||
      (c.empresa_organizacao?.toLowerCase().includes(termo) ?? false)
    )
  })

  function handleBuscaChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('busca', value)
    } else {
      params.delete('busca')
    }
    router.replace(`/clientes?${params.toString()}`)
  }

  function handleExcluir(id: string) {
    startTransition(async () => {
      const result = await excluirClienteAction(id)
      if (result.success) {
        toast.success('Cliente excluído.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <ClienteFormModal trigger={<Button>Novo cliente</Button>} />
      </div>

      <Input
        placeholder="Buscar por nome ou empresa..."
        value={busca}
        onChange={(e) => handleBuscaChange(e.target.value)}
        className="max-w-sm"
      />

      {filtrados.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {filtrados.map((cliente) => (
            <div
              key={cliente.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {cliente.nome}
                </Link>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  {cliente.empresa_organizacao && (
                    <span>{cliente.empresa_organizacao}</span>
                  )}
                  {cliente.email_principal && (
                    <span>{cliente.email_principal}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <ClienteFormModal
                  cliente={{
                    ...cliente,
                    telefone_contato: null,
                    observacoes: null,
                  }}
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                />

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm" disabled={isPending}>
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
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleExcluir(cliente.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
