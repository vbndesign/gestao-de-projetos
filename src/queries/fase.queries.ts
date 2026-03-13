import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getFasesByProjeto = cache(async (projetoId: string) => {
  return db.fase.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      nome: true,
      descricao: true,
      ordem: true,
      status: true,
      data_inicio_prevista: true,
      data_fim_prevista: true,
      data_inicio_real: true,
      data_fim_real: true,
      is_fase_geral: true,
      created_at: true,
    },
    orderBy: { ordem: 'asc' },
  })
})
