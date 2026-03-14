# PRD-03 — Tarefas

> **Depende de:** PRD-02c (Fases UI) — deve estar concluído antes de iniciar
> **Contexto:** CRUD completo de Tarefas Planejadas — schema Zod, actions, query update e UI integrada à aba Fases. O modelo `TarefaPlanejada` já existe no schema Prisma e a migration foi aplicada.

---

## Escopo

### Inclui
- Schema Zod `TarefaFormSchema` em `types/schemas/tarefa.schema.ts`
- Actions: criar, editar, excluir, reordenar tarefas
- Update em `getFasesByProjeto` para incluir tarefas aninhadas
- Update em `fases/page.tsx` para converter `Decimal` → `number`
- Dialog reutilizável `tarefa-form-dialog.tsx` (4 campos: título, status, descrição, horas estimadas)
- Integração no `fases-manager.tsx`: tarefas exibidas dentro de cada fase card
- Drag-and-drop para reordenar tarefas dentro de cada fase (DndContext aninhado por fase)
- Constante `TAREFA_STATUS_LABELS` em `lib/constants.ts`

### Não inclui
- Arquivo `tarefa.queries.ts` — será criado no PRD-08b (portal) quando necessário
- Vínculo tarefa ↔ lançamento de horas (fora do MVP)
- Eventos de timeline gerados por tarefas (domínio: tarefas não geram eventos)
- Outras abas do projeto (Timeline, Horas)

---

## Arquivos

### Criar
```
src/types/schemas/tarefa.schema.ts
src/app/(internal)/projetos/[id]/fases/_components/tarefa-form-dialog.tsx
```

### Modificar
```
src/lib/constants.ts                                                         — adicionar TAREFA_STATUS_LABELS
src/queries/fase.queries.ts                                                  — incluir tarefas na query
src/app/(internal)/projetos/[id]/fases/page.tsx                              — converter Decimal → number
src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx         — show tarefas + DnD aninhado
```

### Criar (actions)
```
src/actions/tarefa.actions.ts
```

**Total: 3 criar + 4 modificar = 7 arquivos**

---

## Especificação

### Constante `TAREFA_STATUS_LABELS` (`lib/constants.ts`)

Adicionar ao arquivo existente (não substituir constantes existentes):

```ts
export const TAREFA_STATUS_LABELS: Record<string, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}
```

### Schema Zod (`types/schemas/tarefa.schema.ts`)

```ts
import { z } from 'zod'

export const TarefaFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200),
  descricao: z.string().optional(),
  status: z.enum(['nao_iniciada', 'em_andamento', 'concluida', 'cancelada']),
  tempo_estimado_horas: z.number().min(0.01, 'Deve ser maior que zero').nullable().optional(),
})

export type TarefaFormData = z.infer<typeof TarefaFormSchema>
```

### Query update (`queries/fase.queries.ts`)

Adicionar `tarefas` ao select de `getFasesByProjeto`:

```ts
tarefas: {
  select: {
    id: true,
    titulo: true,
    descricao: true,
    status: true,
    ordem: true,
    tempo_estimado_horas: true,
  },
  orderBy: { ordem: 'asc' },
},
```

### Actions (`actions/tarefa.actions.ts`)

Quatro actions, sem service (sem regras cross-entity):

| Action | Assinatura | Comportamento |
|--------|-----------|---------------|
| `criarTarefaAction` | `(faseId, data)` | Calcula próxima `ordem`, cria tarefa |
| `editarTarefaAction` | `(tarefaId, data)` | Atualiza campos; recupera `projeto_id` para revalidatePath |
| `excluirTarefaAction` | `(tarefaId)` | Recupera `projeto_id` antes de deletar para revalidatePath |
| `reordenarTarefasAction` | `(faseId, tarefasOrdenadas)` | `db.$transaction` array-style (compatível com pgbouncer) |

Todas as actions chamam `requireAuth()` e retornam `{ success: true } | { success: false, error: string }`.

Para `revalidatePath`, todas as actions recuperam `projeto_id` via relação e revalidam `/projetos/${projeto_id}/fases`.

### page.tsx update (`fases/page.tsx`)

Prisma retorna `tempo_estimado_horas` como `Decimal` (não serializável pelo RSC sem conversão). Converter para `number` antes de passar ao Client Component:

```tsx
const fasesRaw = await getFasesByProjeto(id)
const fases = fasesRaw.map(fase => ({
  ...fase,
  tarefas: fase.tarefas.map(t => ({
    ...t,
    tempo_estimado_horas: t.tempo_estimado_horas !== null
      ? Number(t.tempo_estimado_horas)
      : null,
  })),
}))
return <FasesManager projetoId={id} fases={fases} />
```

### Dialog (`tarefa-form-dialog.tsx`)

Props:
```ts
type TarefaFormDialogProps = {
  trigger: React.ReactElement
  faseId: string
  tarefa?: TarefaData      // se presente → modo edição
  onSuccess?: () => void
}
```

Campos do formulário (4 campos):

| Campo | Input | Obrigatório | Default (editar) |
|-------|-------|-------------|------------------|
| titulo | `<Input>` | sim | `tarefa.titulo` |
| status | `<Select>` + `<Controller>` | sim (criar: `'nao_iniciada'`) | `tarefa.status as TarefaFormData['status']` |
| descricao | `<Textarea>` | não | `tarefa.descricao ?? ''` |
| tempo_estimado_horas | `<Input type="number" step="0.5">` | não | `tarefa.tempo_estimado_horas ?? ''` |

Para `tempo_estimado_horas`: usar `setValueAs: (v) => v === '' || v == null ? null : Number(v)` no `register()`.

Comportamento idêntico ao `fase-form-dialog.tsx`:
- `useState(false)` para open/onOpenChange
- `useTransition()` para isPending
- `zodResolver(TarefaFormSchema as any)` (padrão do projeto)
- Sucesso: `toast.success(...)`, `setOpen(false)`, `onSuccess?.()`
- Erro: `toast.error(result.error)`
- `<DialogTrigger render={trigger} />`

### fases-manager.tsx update

#### Tipo `TarefaData` (adicionar)
```ts
type TarefaData = {
  id: string
  titulo: string
  descricao: string | null
  status: string
  ordem: number
  tempo_estimado_horas: number | null
}
```

#### `FaseData` update (adicionar `tarefas`)
```ts
type FaseData = {
  // ... campos existentes ...
  tarefas: TarefaData[]
}
```

#### Layout por tarefa dentro do fase card
```
[ drag handle ] [ título ] [ badge status ]   [ Editar ] [ Excluir ]
                [ descrição se existir ]
                [ X horas estimadas se existirem ]
```

#### Drag-and-drop aninhado
- Outer `DndContext` (em `FasesManager`): reordena fases (existente)
- Inner `DndContext` (em `SortableFaseCard`): reordena tarefas dentro da fase
- Cada `SortableFaseCard` tem seu próprio `useId()` para o DndContext inner
- `SortableTarefaItem`: componente com `useSortable`, drag handle sempre visível
- `handleTarefaDragEnd`: `arrayMove` otimista + `reordenarTarefasAction` + rollback se erro
- `SortableFaseCard` ganha `useTransition()` próprio para operações de tarefa
- Estado local `localTarefas` com `useEffect(() => setLocalTarefas(fase.tarefas), [fase.tarefas])` para sync

---

## Regras de negócio

| Regra | Implementação |
|-------|---------------|
| Tarefas ordenáveis dentro da fase | DnD aninhado por fase + `reordenarTarefasAction` |
| Qualquer tarefa pode ser excluída | Sem restrições — botão excluir sempre visível |
| Tarefas excluídas em cascata com fase | Garantido pelo `onDelete: Cascade` no schema Prisma |
| Sem eventos de timeline | Actions não chamam timeline.service |

---

## Critérios de aceitação

- [ ] Tarefas de cada fase aparecem listadas dentro do card da fase, em ordem
- [ ] Clicar "Nova tarefa" em uma fase → modal abre com status `nao_iniciada` pré-selecionado
- [ ] Campo "título" vazio → mensagem "Título é obrigatório", modal não fecha
- [ ] Salvar nova tarefa → tarefa aparece no final da lista da fase
- [ ] Clicar "Editar" em tarefa → modal abre com dados preenchidos
- [ ] Salvar edição → dados atualizados na lista
- [ ] Clicar "Excluir" em tarefa → AlertDialog de confirmação aparece
- [ ] Confirmar exclusão → tarefa removida da lista
- [ ] Arrastar tarefa dentro da fase → ordem persistida no banco
- [ ] Arrastar tarefa de uma fase para outra **não é suportado** (só reordenação intra-fase)
- [ ] `pnpm build` sem erros

---

## Verificação

### Build
```bash
pnpm build
```

### Checklist manual

- [ ] **Acessar `/projetos/[id]/fases`** → fases carregam, cada fase mostra suas tarefas
- [ ] **Fase sem tarefas** → área de tarefas vazia + botão "Nova tarefa" visível
- [ ] **Nova tarefa → título vazio → salvar** → erro "Título é obrigatório"
- [ ] **Nova tarefa → preencher título → salvar** → tarefa criada ao final da lista
- [ ] **Editar tarefa → alterar título → salvar** → título atualizado
- [ ] **Excluir tarefa → confirmar** → tarefa removida
- [ ] **Arrastar tarefa** → soltar em nova posição → ordem persistida (verificar via Prisma Studio)
