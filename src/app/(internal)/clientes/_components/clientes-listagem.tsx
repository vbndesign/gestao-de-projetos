'use client'

import { useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { PageHeader } from '@/components/page-header'
import { DataRow } from '@/components/data-row'

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
      <PageHeader
        title="Clientes"
        actions={<ClienteFormModal trigger={<Button variant="filled-brand">Novo cliente</Button>} />}
      />

      <Input
        placeholder="Buscar por nome ou empresa..."
        value={busca}
        onChange={(e) => handleBuscaChange(e.target.value)}
        className="max-w-sm"
      />

      {filtrados.length === 0 ? (
        <p className="py-8 text-center text-ds-muted">
          {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--ds-color-component-data-row-default-border)]">
          {filtrados.map((cliente) => (
            <DataRow
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              title={cliente.nome}
              metadata={
                <>
                  {cliente.empresa_organizacao && <span>{cliente.empresa_organizacao}</span>}
                  {cliente.email_principal && <span>{cliente.email_principal}</span>}
                </>
              }
              trailing={
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
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
