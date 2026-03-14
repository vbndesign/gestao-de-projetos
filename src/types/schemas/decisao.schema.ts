import { z } from 'zod'

export const DecisaoFormSchema = z.object({
  fase_id:      z.string().uuid().nullable().optional(),
  reuniao_id:   z.string().uuid().nullable().optional(),
  titulo:       z.string().min(1, 'Título é obrigatório').max(200),
  descricao:    z.string().min(1, 'Descrição é obrigatória'),
  contexto:     z.string().optional(),
  impacto:      z.string().optional(),
  data_decisao: z.coerce.date({ error: 'Data é obrigatória' }),
})

export type DecisaoFormData = z.infer<typeof DecisaoFormSchema>
