import { StatusProjeto } from '@prisma/client'
import { getProjetosFiltrados, getClientesParaSelect } from '@/queries/projeto.queries'
import { ProjetosListagem } from './_components/projetos-listagem'

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cliente?: string }>
}) {
  const { status, cliente } = await searchParams
  const [projetos, clientes] = await Promise.all([
    getProjetosFiltrados({
      status: status as StatusProjeto | undefined,
      clienteId: cliente,
    }),
    getClientesParaSelect(),
  ])
  return <ProjetosListagem projetos={projetos} clientes={clientes} />
}
