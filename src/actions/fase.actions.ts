'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { FaseFormSchema, type FaseFormData } from '@/types/schemas/fase.schema'
import { excluirFase, reordenarFases } from '@/services/fase.service'

export async function criarFaseAction(projetoId: string, data: FaseFormData) {
  const parsed = FaseFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    const maxOrdem = await db.fase.aggregate({
      where: { projeto_id: projetoId },
      _max: { ordem: true },
    })
    const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1

    await db.fase.create({
      data: {
        ...parsed.data,
        projeto_id: projetoId,
        ordem: novaOrdem,
        is_fase_geral: false,
      },
    })
  } catch {
    return { success: false as const, error: 'Erro ao criar fase.' }
  }

  revalidatePath('/projetos/' + projetoId)
  return { success: true as const }
}

export async function editarFaseAction(faseId: string, data: FaseFormData) {
  const parsed = FaseFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    const fase = await db.fase.update({
      where: { id: faseId },
      data: parsed.data,
      select: { projeto_id: true },
    })
    revalidatePath('/projetos/' + fase.projeto_id)
  } catch {
    return { success: false as const, error: 'Erro ao editar fase.' }
  }

  return { success: true as const }
}

export async function excluirFaseAction(faseId: string) {
  await requireAuth()

  const result = await excluirFase(faseId)
  if (!result.success) {
    return { success: false as const, error: result.error }
  }

  revalidatePath('/projetos/' + result.projetoId)
  return { success: true as const }
}

export async function reordenarFasesAction(
  projetoId: string,
  fasesOrdenadas: { id: string; ordem: number }[]
) {
  await requireAuth()

  const result = await reordenarFases(projetoId, fasesOrdenadas)
  if (!result.success) {
    return { success: false as const, error: result.error }
  }

  revalidatePath('/projetos/' + projetoId)
  return { success: true as const }
}
