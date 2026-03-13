import { getFasesByProjeto } from '@/queries/fase.queries'
import { FasesManager } from './_components/fases-manager'

export default async function FasesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fases = await getFasesByProjeto(id)

  return <FasesManager projetoId={id} fases={fases} />
}
