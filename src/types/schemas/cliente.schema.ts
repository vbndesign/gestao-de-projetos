import { z } from 'zod'

export const ClienteFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  empresa_organizacao: z.string().optional(),
  email_principal: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  telefone_contato: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof ClienteFormSchema>
