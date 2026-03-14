import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getReunioesByProjeto = cache(async (projetoId: string) => {
  return db.reuniao.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      fase_id: true,
      titulo: true,
      data_reuniao: true,
      participantes: true,
      link_referencia: true,
      resumo_executivo: true,
      ata_resumida: true,
      created_at: true,
    },
    orderBy: { data_reuniao: 'desc' },
  })
})

export const getDecisoesByProjeto = cache(async (projetoId: string) => {
  return db.decisao.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      fase_id: true,
      reuniao_id: true,
      titulo: true,
      descricao: true,
      contexto: true,
      impacto: true,
      data_decisao: true,
      created_at: true,
    },
    orderBy: { data_decisao: 'desc' },
  })
})

export const getCheckpointsByProjeto = cache(async (projetoId: string) => {
  return db.checkpoint.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      fase_id: true,
      titulo: true,
      resumo: true,
      proximos_passos: true,
      data_checkpoint: true,
      created_at: true,
    },
    orderBy: { data_checkpoint: 'desc' },
  })
})
