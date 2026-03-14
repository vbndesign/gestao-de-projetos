import { z } from 'zod'

export const ReuniaoFormSchema = z.object({
  fase_id:           z.string().uuid().nullable().optional(),
  titulo:            z.string().min(1, 'Título é obrigatório').max(200),
  data_reuniao:      z.coerce.date({ error: 'Data é obrigatória' }),
  participantes:     z.string().optional(),
  link_referencia:   z.string().optional(),
  resumo_executivo:  z.string().optional(),
  ata_resumida:      z.string().optional(),
})

export type ReuniaoFormData = z.infer<typeof ReuniaoFormSchema>
