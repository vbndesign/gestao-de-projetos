import { z } from 'zod'

export const ProjetoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cliente_id: z.string().uuid('Cliente inválido'),
  descricao: z.string().optional(),
  status: z.enum([
    'rascunho', 'ativo', 'aguardando_cliente', 'pausado', 'concluido', 'arquivado',
  ]),
  data_inicio: z.coerce.date({ error: 'Data de início é obrigatória' }),
  previsao_entrega: z.coerce.date().optional().nullable(),
  data_conclusao_real: z.coerce.date().optional().nullable(),
})

export type ProjetoFormData = z.infer<typeof ProjetoFormSchema>
