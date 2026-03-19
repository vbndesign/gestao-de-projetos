import { db } from '@/lib/db'
import type { ReuniaoFormData } from '@/types/schemas/reuniao.schema'
import type { DecisaoFormData } from '@/types/schemas/decisao.schema'
import type { CheckpointFormData } from '@/types/schemas/checkpoint.schema'

// ── Reunião ──────────────────────────────────────────────

export async function criarReuniao(projetoId: string, data: ReuniaoFormData) {
  return db.$transaction(async (tx) => {
    const reuniao = await tx.reuniao.create({
      data: {
        projeto_id: projetoId,
        fase_id:           data.fase_id ?? null,
        titulo:            data.titulo,
        data_reuniao:      data.data_reuniao,
        participantes:     data.participantes     ?? null,
        link_referencia:   data.link_referencia   ?? null,
        resumo_executivo:  data.resumo_executivo  ?? null,
        ata_resumida:      data.ata_resumida      ?? null,
      },
    })
    await tx.eventoTimeline.create({
      data: {
        projeto_id:  projetoId,
        fase_id:     data.fase_id ?? null,
        tipo_evento: 'reuniao_registrada',
        titulo:      data.titulo,
        data_evento: data.data_reuniao,
        origem_tipo: 'reuniao',
        origem_id:   reuniao.id,
      },
    })
    return reuniao
  })
}

export async function editarReuniao(reuniaoId: string, data: ReuniaoFormData) {
  return db.$transaction(async (tx) => {
    const reuniao = await tx.reuniao.update({
      where: { id: reuniaoId },
      data: {
        fase_id:           data.fase_id ?? null,
        titulo:            data.titulo,
        data_reuniao:      data.data_reuniao,
        participantes:     data.participantes     ?? null,
        link_referencia:   data.link_referencia   ?? null,
        resumo_executivo:  data.resumo_executivo  ?? null,
        ata_resumida:      data.ata_resumida      ?? null,
      },
    })
    await tx.eventoTimeline.updateMany({
      where: { origem_tipo: 'reuniao', origem_id: reuniaoId },
      data: {
        titulo:      data.titulo,
        data_evento: data.data_reuniao,
        fase_id:     data.fase_id ?? null,
      },
    })
    return reuniao
  })
}

export async function excluirReuniao(reuniaoId: string) {
  const reuniao = await db.reuniao.findUniqueOrThrow({
    where: { id: reuniaoId },
    select: { projeto_id: true },
  })
  await db.$transaction([
    db.eventoTimeline.deleteMany({
      where: { origem_tipo: 'reuniao', origem_id: reuniaoId },
    }),
    db.reuniao.delete({ where: { id: reuniaoId } }),
  ])
  return { projetoId: reuniao.projeto_id }
}

// ── Decisão ──────────────────────────────────────────────

export async function criarDecisao(projetoId: string, data: DecisaoFormData) {
  return db.$transaction(async (tx) => {
    const decisao = await tx.decisao.create({
      data: {
        projeto_id: projetoId,
        fase_id:      data.fase_id ?? null,
        reuniao_id:   data.reuniao_id ?? null,
        titulo:       data.titulo,
        descricao:    data.descricao,
        contexto:     data.contexto ?? null,
        impacto:      data.impacto ?? null,
        data_decisao: data.data_decisao,
      },
    })
    await tx.eventoTimeline.create({
      data: {
        projeto_id:  projetoId,
        fase_id:     data.fase_id ?? null,
        tipo_evento: 'decisao_registrada',
        titulo:      data.titulo,
        data_evento: data.data_decisao,
        origem_tipo: 'decisao',
        origem_id:   decisao.id,
      },
    })
    return decisao
  })
}

export async function editarDecisao(decisaoId: string, data: DecisaoFormData) {
  return db.$transaction(async (tx) => {
    const decisao = await tx.decisao.update({
      where: { id: decisaoId },
      data: {
        fase_id:      data.fase_id ?? null,
        reuniao_id:   data.reuniao_id ?? null,
        titulo:       data.titulo,
        descricao:    data.descricao,
        contexto:     data.contexto ?? null,
        impacto:      data.impacto ?? null,
        data_decisao: data.data_decisao,
      },
    })
    await tx.eventoTimeline.updateMany({
      where: { origem_tipo: 'decisao', origem_id: decisaoId },
      data: {
        titulo:      data.titulo,
        data_evento: data.data_decisao,
        fase_id:     data.fase_id ?? null,
      },
    })
    return decisao
  })
}

export async function excluirDecisao(decisaoId: string) {
  const decisao = await db.decisao.findUniqueOrThrow({
    where: { id: decisaoId },
    select: { projeto_id: true },
  })
  await db.$transaction([
    db.eventoTimeline.deleteMany({
      where: { origem_tipo: 'decisao', origem_id: decisaoId },
    }),
    db.decisao.delete({ where: { id: decisaoId } }),
  ])
  return { projetoId: decisao.projeto_id }
}

// ── Checkpoint ───────────────────────────────────────────

export async function criarCheckpoint(projetoId: string, data: CheckpointFormData) {
  return db.$transaction(async (tx) => {
    const checkpoint = await tx.checkpoint.create({
      data: {
        projeto_id: projetoId,
        fase_id:         data.fase_id ?? null,
        titulo:          data.titulo,
        resumo:          data.resumo,
        proximos_passos: data.proximos_passos ?? null,
        data_checkpoint: data.data_checkpoint,
      },
    })
    await tx.eventoTimeline.create({
      data: {
        projeto_id:  projetoId,
        fase_id:     data.fase_id ?? null,
        tipo_evento: 'checkpoint_registrado',
        titulo:      data.titulo,
        data_evento: data.data_checkpoint,
        origem_tipo: 'checkpoint',
        origem_id:   checkpoint.id,
      },
    })
    return checkpoint
  })
}

export async function editarCheckpoint(checkpointId: string, data: CheckpointFormData) {
  return db.$transaction(async (tx) => {
    const checkpoint = await tx.checkpoint.update({
      where: { id: checkpointId },
      data: {
        fase_id:         data.fase_id ?? null,
        titulo:          data.titulo,
        resumo:          data.resumo,
        proximos_passos: data.proximos_passos ?? null,
        data_checkpoint: data.data_checkpoint,
      },
    })
    await tx.eventoTimeline.updateMany({
      where: { origem_tipo: 'checkpoint', origem_id: checkpointId },
      data: {
        titulo:      data.titulo,
        data_evento: data.data_checkpoint,
        fase_id:     data.fase_id ?? null,
      },
    })
    return checkpoint
  })
}

export async function excluirCheckpoint(checkpointId: string) {
  const checkpoint = await db.checkpoint.findUniqueOrThrow({
    where: { id: checkpointId },
    select: { projeto_id: true },
  })
  await db.$transaction([
    db.eventoTimeline.deleteMany({
      where: { origem_tipo: 'checkpoint', origem_id: checkpointId },
    }),
    db.checkpoint.delete({ where: { id: checkpointId } }),
  ])
  return { projetoId: checkpoint.projeto_id }
}
