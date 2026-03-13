import { db } from '@/lib/db'
import type { ProjetoFormData } from '@/types/schemas/projeto.schema'

export async function criarProjeto(data: ProjetoFormData) {
  return db.$transaction(async (tx) => {
    const projeto = await tx.projeto.create({ data })
    await tx.fase.create({
      data: {
        projeto_id: projeto.id,
        nome: 'Geral do projeto',
        ordem: 1,
        status: 'nao_iniciada',
        is_fase_geral: true,
      },
    })
    return projeto
  })
}
