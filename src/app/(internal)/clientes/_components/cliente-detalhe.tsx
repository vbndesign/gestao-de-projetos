'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { PageHeader } from '@/components/page-header'
import { ProjectSummary } from '@/components/project-summary'
import { DataRow } from '@/components/data-row'

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
      <PageHeader
        title={cliente.nome}
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: cliente.nome },
        ]}
        actions={
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
        }
      />

      <ProjectSummary
        fields={[
          ...(cliente.empresa_organizacao
            ? [{ label: 'Empresa', value: cliente.empresa_organizacao }]
            : []),
          ...(cliente.email_principal
            ? [{ label: 'Email', value: cliente.email_principal }]
            : []),
          ...(cliente.telefone_contato
            ? [{ label: 'Telefone', value: cliente.telefone_contato }]
            : []),
          ...(cliente.observacoes
            ? [{ label: 'Observações', value: cliente.observacoes, colSpan: 2 as const }]
            : []),
          { label: 'Criado em', value: new Date(cliente.created_at).toLocaleDateString('pt-BR') },
          { label: 'Atualizado em', value: new Date(cliente.updated_at).toLocaleDateString('pt-BR') },
        ]}
      />

      <div className="space-y-4">
        <h2 className="text-[length:var(--ds-typography-size-lg)] font-semibold leading-[var(--ds-typography-line-height-lg)] text-ds-heading">
          Projetos
        </h2>
        {projetos.length === 0 ? (
          <p className="py-8 text-center text-ds-muted">Nenhum projeto vinculado.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--ds-color-component-data-row-default-border)]">
            {projetos.map((projeto) => (
              <DataRow
                key={projeto.id}
                href={`/projetos/${projeto.id}`}
                title={projeto.nome}
                metadata={
                  <>
                    <span>{projeto.status}</span>
                    <span>{new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</span>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
