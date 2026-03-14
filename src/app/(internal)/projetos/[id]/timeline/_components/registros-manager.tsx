'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  excluirReuniaoAction,
  excluirDecisaoAction,
  excluirCheckpointAction,
} from '@/actions/registro-operacional.actions'
import { ReuniaoFormDialog } from './reuniao-form-dialog'
import { DecisaoFormDialog } from './decisao-form-dialog'
import { CheckpointFormDialog } from './checkpoint-form-dialog'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = {
  id: string; titulo: string; data_reuniao: Date; fase_id: string | null
  participantes: string | null; link_referencia: string | null
  resumo_executivo: string | null; ata_resumida: string | null; created_at: Date
}
type DecisaoItem = {
  id: string; titulo: string; descricao: string; contexto: string | null
  impacto: string | null; data_decisao: Date; fase_id: string | null
  reuniao_id: string | null; created_at: Date
}
type CheckpointItem = {
  id: string; titulo: string; resumo: string; proximos_passos: string | null
  data_checkpoint: Date; fase_id: string | null; created_at: Date
}

type RegistrosManagerProps = {
  projetoId: string
  reunioes: ReuniaoItem[]
  decisoes: DecisaoItem[]
  checkpoints: CheckpointItem[]
  fases: FaseItem[]
}

export function RegistrosManager({ projetoId, reunioes, decisoes, checkpoints, fases }: RegistrosManagerProps) {
  const [isPendingReuniao, startReuniaoTransition] = useTransition()
  const [isPendingDecisao, startDecisaoTransition] = useTransition()
  const [isPendingCheckpoint, startCheckpointTransition] = useTransition()

  function handleExcluirReuniao(id: string) {
    startReuniaoTransition(async () => {
      const result = await excluirReuniaoAction(id)
      if (result.success) toast.success('Reunião excluída')
      else toast.error(result.error)
    })
  }

  function handleExcluirDecisao(id: string) {
    startDecisaoTransition(async () => {
      const result = await excluirDecisaoAction(id)
      if (result.success) toast.success('Decisão excluída')
      else toast.error(result.error)
    })
  }

  function handleExcluirCheckpoint(id: string) {
    startCheckpointTransition(async () => {
      const result = await excluirCheckpointAction(id)
      if (result.success) toast.success('Checkpoint excluído')
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-8">
      {/* Seção Reuniões */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reuniões</h2>
          <ReuniaoFormDialog
            trigger={<Button size="sm">Nova reunião</Button>}
            projetoId={projetoId}
            fases={fases}
          />
        </div>
        {reunioes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma reunião registrada.</p>
        ) : (
          reunioes.map(reuniao => (
            <div key={reuniao.id} className="flex items-center gap-4 rounded-lg border p-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {reuniao.data_reuniao.toLocaleDateString('pt-BR')}
              </span>
              <span className="flex-1 font-medium">{reuniao.titulo}</span>
              <div className="flex gap-2">
                <ReuniaoFormDialog
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                  projetoId={projetoId}
                  fases={fases}
                  reuniao={reuniao}
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPendingReuniao}>
                        Excluir
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleExcluirReuniao(reuniao.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seção Decisões */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Decisões</h2>
          <DecisaoFormDialog
            trigger={<Button size="sm">Nova decisão</Button>}
            projetoId={projetoId}
            fases={fases}
            reunioes={reunioes}
          />
        </div>
        {decisoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma decisão registrada.</p>
        ) : (
          decisoes.map(decisao => (
            <div key={decisao.id} className="flex items-center gap-4 rounded-lg border p-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {decisao.data_decisao.toLocaleDateString('pt-BR')}
              </span>
              <span className="flex-1 font-medium">{decisao.titulo}</span>
              <div className="flex gap-2">
                <DecisaoFormDialog
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                  projetoId={projetoId}
                  fases={fases}
                  reunioes={reunioes}
                  decisao={decisao}
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPendingDecisao}>
                        Excluir
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir decisão?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleExcluirDecisao(decisao.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seção Checkpoints */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Checkpoints</h2>
          <CheckpointFormDialog
            trigger={<Button size="sm">Novo checkpoint</Button>}
            projetoId={projetoId}
            fases={fases}
          />
        </div>
        {checkpoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum checkpoint registrado.</p>
        ) : (
          checkpoints.map(checkpoint => (
            <div key={checkpoint.id} className="flex items-center gap-4 rounded-lg border p-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {checkpoint.data_checkpoint.toLocaleDateString('pt-BR')}
              </span>
              <span className="flex-1 font-medium">{checkpoint.titulo}</span>
              <div className="flex gap-2">
                <CheckpointFormDialog
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                  projetoId={projetoId}
                  fases={fases}
                  checkpoint={checkpoint}
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPendingCheckpoint}>
                        Excluir
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir checkpoint?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleExcluirCheckpoint(checkpoint.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
