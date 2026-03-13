'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ClienteFormSchema, type ClienteFormData } from '@/types/schemas/cliente.schema'

export async function criarClienteAction(data: ClienteFormData) {
  const parsed = ClienteFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    await db.cliente.create({ data: parsed.data })
  } catch {
    return { success: false as const, error: 'Erro ao criar cliente.' }
  }

  revalidatePath('/clientes')
  return { success: true as const }
}

export async function editarClienteAction(id: string, data: ClienteFormData) {
  const parsed = ClienteFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    await db.cliente.update({ where: { id }, data: parsed.data })
  } catch {
    return { success: false as const, error: 'Erro ao editar cliente.' }
  }

  revalidatePath('/clientes')
  revalidatePath('/clientes/' + id)
  return { success: true as const }
}

export async function excluirClienteAction(id: string) {
  await requireAuth()

  try {
    await db.cliente.delete({ where: { id } })
  } catch {
    return { success: false as const, error: 'Erro ao excluir cliente.' }
  }

  revalidatePath('/clientes')
  return { success: true as const }
}
