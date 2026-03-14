'use client'

// tipos locais — serão expandidos na Fase 3
type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = { id: string; titulo: string; data_reuniao: Date; fase_id: string | null; participantes: string | null; link_referencia: string | null; resumo_executivo: string | null; ata_resumida: string | null; created_at: Date }
type DecisaoItem = { id: string; titulo: string; descricao: string; contexto: string | null; impacto: string | null; data_decisao: Date; fase_id: string | null; reuniao_id: string | null; created_at: Date }
type CheckpointItem = { id: string; titulo: string; resumo: string; proximos_passos: string | null; data_checkpoint: Date; fase_id: string | null; created_at: Date }

type RegistrosManagerProps = {
  projetoId: string
  reunioes: ReuniaoItem[]
  decisoes: DecisaoItem[]
  checkpoints: CheckpointItem[]
  fases: FaseItem[]
}

export function RegistrosManager({ projetoId, reunioes, decisoes, checkpoints, fases }: RegistrosManagerProps) {
  return <div>Timeline — em construção</div>
}
