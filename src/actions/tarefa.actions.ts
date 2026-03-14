'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { TarefaFormSchema, type TarefaFormData } from '@/types/schemas/tarefa.schema'

export async function criarTarefaAction(faseId: string, data: TarefaFormData) {
  const parsed = TarefaFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  const fase = await db.fase.findUnique({
    where: { id: faseId },
    select: { projeto_id: true },
  })
  if (!fase) {
    return { success: false as const, error: 'Fase não encontrada.' }
  }

  const maxOrdem = await db.tarefaPlanejada.aggregate({
    where: { fase_id: faseId },
    _max: { ordem: true },
  })
  const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1

  await db.tarefaPlanejada.create({
    data: {
      ...parsed.data,
      fase_id: faseId,
      ordem: novaOrdem,
    },
  })

  revalidatePath(`/projetos/${fase.projeto_id}/fases`)
  return { success: true as const }
}

export async function editarTarefaAction(tarefaId: string, data: TarefaFormData) {
  const parsed = TarefaFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  const tarefa = await db.tarefaPlanejada.update({
    where: { id: tarefaId },
    data: parsed.data,
    select: { fase: { select: { projeto_id: true } } },
  })

  revalidatePath(`/projetos/${tarefa.fase.projeto_id}/fases`)
  return { success: true as const }
}

export async function excluirTarefaAction(tarefaId: string) {
  await requireAuth()

  const tarefa = await db.tarefaPlanejada.findUnique({
    where: { id: tarefaId },
    select: { fase: { select: { projeto_id: true } } },
  })
  if (!tarefa) {
    return { success: false as const, error: 'Tarefa não encontrada.' }
  }

  await db.tarefaPlanejada.delete({ where: { id: tarefaId } })

  revalidatePath(`/projetos/${tarefa.fase.projeto_id}/fases`)
  return { success: true as const }
}

export async function reordenarTarefasAction(
  faseId: string,
  tarefasOrdenadas: { id: string; ordem: number }[]
) {
  await requireAuth()

  const fase = await db.fase.findUnique({
    where: { id: faseId },
    select: { projeto_id: true },
  })
  if (!fase) {
    return { success: false as const, error: 'Fase não encontrada.' }
  }

  await db.$transaction(
    tarefasOrdenadas.map(({ id, ordem }) =>
      db.tarefaPlanejada.update({ where: { id }, data: { ordem } })
    )
  )

  revalidatePath(`/projetos/${fase.projeto_id}/fases`)
  return { success: true as const }
}
