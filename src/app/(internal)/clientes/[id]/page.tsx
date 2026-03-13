import { notFound } from 'next/navigation'
import { getClienteById, getProjetosDoCliente } from '@/queries/cliente.queries'
import { ClienteDetalhe } from '../_components/cliente-detalhe'

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [cliente, projetos] = await Promise.all([
    getClienteById(id),
    getProjetosDoCliente(id),
  ])

  if (!cliente) notFound()

  return <ClienteDetalhe cliente={cliente} projetos={projetos} />
}
