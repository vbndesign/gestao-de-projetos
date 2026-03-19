import { getProjetoById, getClientesParaSelect } from '@/queries/projeto.queries'
import { ProjetoDetalhe } from './_components/projeto-detalhe'

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [projeto, clientes] = await Promise.all([
    getProjetoById(id),
    getClientesParaSelect(),
  ])

  // layout.tsx already handles notFound()
  return <ProjetoDetalhe projeto={projeto!} clientes={clientes} />
}
