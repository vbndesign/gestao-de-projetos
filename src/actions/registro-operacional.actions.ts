'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { ReuniaoFormSchema } from '@/types/schemas/reuniao.schema'
import { DecisaoFormSchema } from '@/types/schemas/decisao.schema'
import { CheckpointFormSchema } from '@/types/schemas/checkpoint.schema'
import {
  criarReuniao, editarReuniao, excluirReuniao,
  criarDecisao, editarDecisao, excluirDecisao,
  criarCheckpoint, editarCheckpoint, excluirCheckpoint,
} from '@/services/registro-operacional.service'

// ── Reunião ──────────────────────────────────────────────

export async function criarReuniaoAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = ReuniaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarReuniao(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar reunião' }
  }
}

export async function editarReuniaoAction(reuniaoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = ReuniaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const reuniao = await editarReuniao(reuniaoId, parsed.data)
    revalidatePath(`/projetos/${reuniao.projeto_id}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao editar reunião' }
  }
}

export async function excluirReuniaoAction(reuniaoId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirReuniao(reuniaoId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao excluir reunião' }
  }
}

// ── Decisão ──────────────────────────────────────────────

export async function criarDecisaoAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = DecisaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarDecisao(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar decisão' }
  }
}

export async function editarDecisaoAction(decisaoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = DecisaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const decisao = await editarDecisao(decisaoId, parsed.data)
    revalidatePath(`/projetos/${decisao.projeto_id}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao editar decisão' }
  }
}

export async function excluirDecisaoAction(decisaoId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirDecisao(decisaoId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao excluir decisão' }
  }
}

// ── Checkpoint ───────────────────────────────────────────

export async function criarCheckpointAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = CheckpointFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarCheckpoint(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar checkpoint' }
  }
}

export async function editarCheckpointAction(checkpointId: string, rawData: unknown) {
  await requireAuth()
  const parsed = CheckpointFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const checkpoint = await editarCheckpoint(checkpointId, parsed.data)
    revalidatePath(`/projetos/${checkpoint.projeto_id}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao editar checkpoint' }
  }
}

export async function excluirCheckpointAction(checkpointId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirCheckpoint(checkpointId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao excluir checkpoint' }
  }
}
