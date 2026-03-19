import { getFasesByProjeto } from '@/queries/fase.queries'
import { FasesManager } from './_components/fases-manager'

export default async function FasesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fasesRaw = await getFasesByProjeto(id)

  // Converter Decimal → number para serialização RSC
  const fases = fasesRaw.map((fase) => ({
    ...fase,
    tarefas: fase.tarefas.map((t) => ({
      ...t,
      tempo_estimado_horas:
        t.tempo_estimado_horas !== null ? Number(t.tempo_estimado_horas) : null,
    })),
  }))

  return <FasesManager projetoId={id} fases={fases} />
}
