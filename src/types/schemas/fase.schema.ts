import { z } from 'zod'

export const FaseFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  status: z.enum([
    'nao_iniciada', 'em_andamento', 'aguardando_cliente', 'concluida', 'pausada', 'cancelada',
  ]),
  data_inicio_prevista: z.coerce.date().optional().nullable(),
  data_fim_prevista: z.coerce.date().optional().nullable(),
  data_inicio_real: z.coerce.date().optional().nullable(),
  data_fim_real: z.coerce.date().optional().nullable(),
})

export type FaseFormData = z.infer<typeof FaseFormSchema>
