import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getClientes = cache(async () => {
  return db.cliente.findMany({
    select: {
      id: true,
      nome: true,
      empresa_organizacao: true,
      email_principal: true,
      created_at: true,
    },
    orderBy: { nome: 'asc' },
  })
})

export const getClienteById = cache(async (id: string) => {
  return db.cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      empresa_organizacao: true,
      email_principal: true,
      telefone_contato: true,
      observacoes: true,
      created_at: true,
      updated_at: true,
    },
  })
})

export const getProjetosDoCliente = cache(async (clienteId: string) => {
  return db.projeto.findMany({
    where: { cliente_id: clienteId },
    select: {
      id: true,
      nome: true,
      status: true,
      data_inicio: true,
      previsao_entrega: true,
    },
    orderBy: { created_at: 'desc' },
  })
})
