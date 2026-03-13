import { db } from '@/lib/db'

export async function excluirFase(faseId: string) {
  const fase = await db.fase.findUnique({
    where: { id: faseId },
    select: { is_fase_geral: true, projeto_id: true },
  })

  if (!fase) {
    return { success: false as const, error: 'Fase não encontrada.' }
  }

  if (fase.is_fase_geral) {
    return { success: false as const, error: 'A fase Geral do projeto não pode ser excluída.' }
  }

  await db.fase.delete({ where: { id: faseId } })

  return { success: true as const, projetoId: fase.projeto_id }
}

export async function reordenarFases(
  projetoId: string,
  fasesOrdenadas: { id: string; ordem: number }[]
) {
  // Verificar se a fase Geral está na posição 1
  const faseGeral = await db.fase.findFirst({
    where: { projeto_id: projetoId, is_fase_geral: true },
    select: { id: true },
  })

  if (faseGeral) {
    const geralNoArray = fasesOrdenadas.find((f) => f.id === faseGeral.id)
    if (geralNoArray && geralNoArray.ordem !== 1) {
      return {
        success: false as const,
        error: 'A fase Geral deve permanecer na primeira posição.',
      }
    }
  }

  await db.$transaction(
    fasesOrdenadas.map((f) =>
      db.fase.update({
        where: { id: f.id },
        data: { ordem: f.ordem },
      })
    )
  )

  return { success: true as const }
}
