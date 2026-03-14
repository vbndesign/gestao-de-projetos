import { z } from 'zod'

export const TarefaFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200),
  descricao: z.string().optional(),
  status: z.enum(['nao_iniciada', 'em_andamento', 'concluida', 'cancelada']),
  tempo_estimado_horas: z.number().min(0.01, 'Deve ser maior que zero').nullable().optional(),
})

export type TarefaFormData = z.infer<typeof TarefaFormSchema>
