import { getReunioesByProjeto, getDecisoesByProjeto, getCheckpointsByProjeto } from '@/queries/registro-operacional.queries'
import { getFasesByProjeto } from '@/queries/fase.queries'
import { RegistrosManager } from './_components/registros-manager'

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [reunioes, decisoes, checkpoints, fases] = await Promise.all([
    getReunioesByProjeto(id),
    getDecisoesByProjeto(id),
    getCheckpointsByProjeto(id),
    getFasesByProjeto(id),
  ])
  return (
    <RegistrosManager
      projetoId={id}
      reunioes={reunioes}
      decisoes={decisoes}
      checkpoints={checkpoints}
      fases={fases.map(f => ({ id: f.id, nome: f.nome, is_fase_geral: f.is_fase_geral }))}
    />
  )
}
