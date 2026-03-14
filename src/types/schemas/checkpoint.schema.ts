import { z } from 'zod'

export const CheckpointFormSchema = z.object({
  fase_id:          z.string().uuid().nullable().optional(),
  titulo:           z.string().min(1, 'Título é obrigatório').max(200),
  resumo:           z.string().min(1, 'Resumo é obrigatório'),
  proximos_passos:  z.string().optional(),
  data_checkpoint:  z.coerce.date({ error: 'Data é obrigatória' }),
})

export type CheckpointFormData = z.infer<typeof CheckpointFormSchema>
