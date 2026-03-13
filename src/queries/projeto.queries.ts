import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import type { StatusProjeto } from '@prisma/client'

export const getProjetosFiltrados = cache(
  async (filtros?: { status?: StatusProjeto; clienteId?: string }) => {
    return db.projeto.findMany({
      where: {
        ...(filtros?.status && { status: filtros.status }),
        ...(filtros?.clienteId && { cliente_id: filtros.clienteId }),
      },
      select: {
        id: true,
        nome: true,
        status: true,
        data_inicio: true,
        previsao_entrega: true,
        created_at: true,
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: { created_at: 'desc' },
    })
  }
)

export const getProjetoById = cache(async (id: string) => {
  return db.projeto.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      cliente_id: true,
      descricao: true,
      status: true,
      data_inicio: true,
      previsao_entrega: true,
      data_conclusao_real: true,
      fase_atual_id: true,
      created_at: true,
      updated_at: true,
      cliente: { select: { id: true, nome: true } },
      fases: {
        select: {
          id: true,
          nome: true,
          status: true,
          ordem: true,
          is_fase_geral: true,
        },
        orderBy: { ordem: 'asc' },
      },
    },
  })
})

export const getClientesParaSelect = cache(async () => {
  return db.cliente.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
})
