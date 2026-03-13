'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProjetoFormSchema, type ProjetoFormData } from '@/types/schemas/projeto.schema'
import { criarProjeto } from '@/services/projeto.service'

export async function criarProjetoAction(data: ProjetoFormData) {
  const parsed = ProjetoFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    const projeto = await criarProjeto(parsed.data)
    revalidatePath('/projetos')
    return { success: true as const, projetoId: projeto.id }
  } catch {
    return { success: false as const, error: 'Erro ao criar projeto.' }
  }
}

export async function editarProjetoAction(id: string, data: ProjetoFormData) {
  const parsed = ProjetoFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    await db.projeto.update({ where: { id }, data: parsed.data })
  } catch {
    return { success: false as const, error: 'Erro ao editar projeto.' }
  }

  revalidatePath('/projetos')
  revalidatePath('/projetos/' + id)
  return { success: true as const }
}

export async function excluirProjetoAction(id: string) {
  await requireAuth()

  try {
    await db.projeto.delete({ where: { id } })
  } catch {
    return { success: false as const, error: 'Erro ao excluir projeto.' }
  }

  revalidatePath('/projetos')
  return { success: true as const }
}
