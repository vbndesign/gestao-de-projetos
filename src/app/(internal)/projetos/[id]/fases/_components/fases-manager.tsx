'use client'

import { useState, useEffect, useId, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DndContext, closestCenter, DragEndEvent,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { excluirFaseAction, reordenarFasesAction } from '@/actions/fase.actions'
import { excluirTarefaAction, reordenarTarefasAction } from '@/actions/tarefa.actions'
import { FASE_STATUS_LABELS, TAREFA_STATUS_LABELS } from '@/lib/constants'
import { FaseFormDialog } from './fase-form-dialog'
import { TarefaFormDialog } from './tarefa-form-dialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type TarefaData = {
  id: string
  titulo: string
  descricao: string | null
  status: string
  ordem: number
  tempo_estimado_horas: number | null
}

type FaseData = {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  status: string
  data_inicio_prevista: Date | null
  data_fim_prevista: Date | null
  data_inicio_real: Date | null
  data_fim_real: Date | null
  is_fase_geral: boolean
  created_at: Date
  tarefas: TarefaData[]
}

type FasesManagerProps = {
  projetoId: string
  fases: FaseData[]
}

export function FasesManager({ projetoId, fases }: FasesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localFases, setLocalFases] = useState(fases)

  // Sync com props (quando server revalida)
  useEffect(() => { setLocalFases(fases) }, [fases])

  const dndId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // R-Geral-1: impedir mover a Fase Geral
    const activeItem = localFases.find((f) => f.id === active.id)
    if (activeItem?.is_fase_geral) return

    const oldIndex = localFases.findIndex((f) => f.id === active.id)
    const newIndex = localFases.findIndex((f) => f.id === over.id)

    // Impedir mover para posição 0 (Fase Geral)
    if (newIndex === 0) return

    const reordered = arrayMove(localFases, oldIndex, newIndex)
    const withOrdem = reordered.map((f, i) => ({ ...f, ordem: i + 1 }))

    // Atualização otimista
    setLocalFases(withOrdem)

    // Persistir
    const fasesOrdenadas = withOrdem.map((f) => ({ id: f.id, ordem: f.ordem }))
    startTransition(async () => {
      const result = await reordenarFasesAction(projetoId, fasesOrdenadas)
      if (!result.success) {
        toast.error(result.error)
        setLocalFases(fases) // rollback
      }
    })
  }

  function handleExcluir(faseId: string) {
    startTransition(async () => {
      const result = await excluirFaseAction(faseId)
      if (result.success) {
        toast.success('Fase excluída.')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header com botão Nova fase */}
      <div className="flex justify-end">
        <FaseFormDialog
          trigger={<Button>Nova fase</Button>}
          projetoId={projetoId}
        />
      </div>

      {/* Lista de fases com DnD */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localFases.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {localFases.map((fase) => (
              <SortableFaseCard
                key={fase.id}
                fase={fase}
                projetoId={projetoId}
                isPending={isPending}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableFaseCard({
  fase,
  projetoId,
  isPending,
  onExcluir,
}: {
  fase: FaseData
  projetoId: string
  isPending: boolean
  onExcluir: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: fase.id })
  const [localTarefas, setLocalTarefas] = useState(fase.tarefas)
  const [isTarefaPending, startTarefaTransition] = useTransition()
  const tarefaDndId = useId()

  // Sync quando o server revalida (props mudam)
  useEffect(() => {
    setLocalTarefas(fase.tarefas)
  }, [fase.tarefas])

  const tarefaSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleTarefaDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localTarefas.findIndex((t) => t.id === active.id)
    const newIndex = localTarefas.findIndex((t) => t.id === over.id)

    const reordered = arrayMove(localTarefas, oldIndex, newIndex)
    const withOrdem = reordered.map((t, i) => ({ ...t, ordem: i + 1 }))

    // Atualização otimista
    setLocalTarefas(withOrdem)

    // Persistir
    const tarefasOrdenadas = withOrdem.map((t) => ({ id: t.id, ordem: t.ordem }))
    startTarefaTransition(async () => {
      const result = await reordenarTarefasAction(fase.id, tarefasOrdenadas)
      if (!result.success) {
        toast.error(result.error)
        setLocalTarefas(fase.tarefas) // rollback
      }
    })
  }

  function handleExcluirTarefa(tarefaId: string) {
    startTarefaTransition(async () => {
      const result = await excluirTarefaAction(tarefaId)
      if (result.success) {
        toast.success('Tarefa excluída.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border p-4">
      <div className="flex items-center gap-4">
        {/* R-Geral-1: Fase Geral sem drag handle */}
        {fase.is_fase_geral ? (
          <div className="w-5" />
        ) : (
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
            ⠿
          </button>
        )}

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{fase.nome}</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs">
              {FASE_STATUS_LABELS[fase.status] ?? fase.status}
            </span>
            {fase.is_fase_geral && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Geral
              </span>
            )}
          </div>
          {fase.descricao && (
            <p className="text-sm text-muted-foreground truncate">{fase.descricao}</p>
          )}
          {(fase.data_inicio_prevista || fase.data_fim_prevista) && (
            <p className="text-xs text-muted-foreground">
              {fase.data_inicio_prevista && `Início: ${new Date(fase.data_inicio_prevista).toLocaleDateString('pt-BR')}`}
              {fase.data_inicio_prevista && fase.data_fim_prevista && ' — '}
              {fase.data_fim_prevista && `Fim: ${new Date(fase.data_fim_prevista).toLocaleDateString('pt-BR')}`}
            </p>
          )}
        </div>

        {/* Ações de fase */}
        <div className="flex items-center gap-1">
          <FaseFormDialog
            trigger={<Button variant="ghost" size="sm">Editar</Button>}
            projetoId={projetoId}
            fase={fase}
          />
          {/* R-Geral-2: Fase Geral não pode ser excluída */}
          {!fase.is_fase_geral && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="ghost" size="sm" className="text-destructive" disabled={isPending}>
                    Excluir
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir fase</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a fase &quot;{fase.nome}&quot;? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => onExcluir(fase.id)}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Tarefas */}
      <DndContext
        id={tarefaDndId}
        sensors={tarefaSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleTarefaDragEnd}
      >
        <SortableContext
          items={localTarefas.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mt-3 space-y-2 pl-9">
            {localTarefas.map((tarefa) => (
              <SortableTarefaItem
                key={tarefa.id}
                tarefa={tarefa}
                faseId={fase.id}
                isTarefaPending={isTarefaPending}
                onExcluir={handleExcluirTarefa}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Nova tarefa (fora do DndContext) */}
      <div className="pl-9 mt-2">
        <TarefaFormDialog
          trigger={
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              + Nova tarefa
            </Button>
          }
          faseId={fase.id}
        />
      </div>
    </div>
  )
}

function SortableTarefaItem({
  tarefa,
  faseId,
  isTarefaPending,
  onExcluir,
}: {
  tarefa: TarefaData
  faseId: string
  isTarefaPending: boolean
  onExcluir: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded border bg-muted/30 p-2"
    >
      {/* Drag handle */}
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground text-xs">
        ⠿
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{tarefa.titulo}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {TAREFA_STATUS_LABELS[tarefa.status] ?? tarefa.status}
          </span>
        </div>
        {tarefa.descricao && (
          <p className="text-xs text-muted-foreground truncate">{tarefa.descricao}</p>
        )}
        {tarefa.tempo_estimado_horas !== null && (
          <p className="text-xs text-muted-foreground">
            {tarefa.tempo_estimado_horas}h estimadas
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        <TarefaFormDialog
          trigger={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Editar</Button>}
          faseId={faseId}
          tarefa={tarefa}
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive"
                disabled={isTarefaPending}
              >
                Excluir
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir &quot;{tarefa.titulo}&quot;? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => onExcluir(tarefa.id)}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
