# PRD-02c — Fases UI

> **Depende de:** PRD-02b (Projetos UI) — deve estar concluído antes de iniciar
> **Contexto:** Implementa a aba `/projetos/[id]/fases` com listagem, criação, edição, reordenação por drag-and-drop e exclusão de fases. Toda a camada backend (actions, service, queries, schema) foi entregue no PRD-02a.

---

## Escopo

### Inclui
- Página `/projetos/[id]/fases` com listagem de fases em ordem
- Modal de criação de fase (botão "Nova fase")
- Modal de edição de fase (ícone/botão por fase)
- Confirmação de exclusão via AlertDialog
- Reordenação por drag-and-drop com `@dnd-kit`
- Restrições visuais da Fase Geral: sem drag handle, sem excluir
- Skeleton `loading.tsx` da rota
- Constante `FASE_STATUS_LABELS` em `lib/constants.ts`

### Não inclui
- Backend: actions, queries, service e schema já existem (PRD-02a)
- Tarefas planejadas dentro das fases (PRD-03)
- Edição da ordem de tarefas
- Qualquer outra aba do projeto (Timeline, Horas)

---

## Arquivos

### Criar
```
src/app/(internal)/projetos/[id]/fases/page.tsx            — Server Component; busca fases e passa para FasesManager
src/app/(internal)/projetos/[id]/fases/loading.tsx         — Skeleton da página de fases
src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx   — Client Component: lista DnD + add/edit/delete
src/app/(internal)/projetos/[id]/fases/_components/fase-form-dialog.tsx — Dialog reutilizável para criar e editar fase
```

### Modificar
```
src/lib/constants.ts    — adicionar FASE_STATUS_LABELS com rótulos PT-BR dos status de fase
```

**Total: 5 arquivos** (4 criar + 1 modificar)

---

## Especificação

### Dependência: instalar @dnd-kit

Antes de implementar, instalar os pacotes de drag-and-drop:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Constante `FASE_STATUS_LABELS` (`lib/constants.ts`)

Adicionar ao arquivo existente (não substituir `STATUS_LABELS`):

```ts
export const FASE_STATUS_LABELS: Record<string, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  concluida: 'Concluída',
  pausada: 'Pausada',
  cancelada: 'Cancelada',
}
```

### Queries (`queries/`)

Nenhuma query nova. Usar `getFasesByProjeto(projetoId)` já existente.

Campos retornados: `id`, `nome`, `descricao`, `ordem`, `status`, `data_inicio_prevista`, `data_fim_prevista`, `data_inicio_real`, `data_fim_real`, `is_fase_geral`, `created_at`.

### Actions (`actions/`)

Nenhuma action nova. Usar as existentes:
- **`criarFaseAction(projetoId, data)`** — cria fase com auto-ordering
- **`editarFaseAction(faseId, data)`** — atualiza campos da fase
- **`excluirFaseAction(faseId)`** — delega ao service, bloqueia Fase Geral
- **`reordenarFasesAction(projetoId, fasesOrdenadas)`** — batch update de `ordem`

Schema compartilhado: `FaseFormSchema` de `@/types/schemas/fase.schema`.

### UI (`components/` + `app/`)

#### `page.tsx` — Server Component

```tsx
// Recebe: params: Promise<{ id: string }>
// Faz: await params, chama getFasesByProjeto(id)
// Renderiza: <FasesManager projetoId={id} fases={fases} />
```

Sem `notFound()` — se o projeto não existe, o layout pai já trata.

#### `loading.tsx` — Skeleton

Estrutura: botão "Nova fase" placeholder + 3 linhas de skeleton imitando cards de fase.
Usar `div` com `animate-pulse` e `bg-muted` (sem componente `<Skeleton>` — ver decisões PRD-02b).

#### `fase-form-dialog.tsx` — Dialog reutilizável

Props:
```ts
type FaseFormDialogProps = {
  trigger: React.ReactElement      // render prop do DialogTrigger
  projetoId: string                // só necessário para criar
  fase?: FaseData                  // se presente → modo edição
  onSuccess?: () => void
}
```

Campos do formulário:
| Campo | Tipo input | Obrigatório |
|---|---|---|
| nome | text | sim |
| status | Select | sim (default: `nao_iniciada` para criar) |
| descricao | textarea | não |
| data_inicio_prevista | date | não |
| data_fim_prevista | date | não |
| data_inicio_real | date | não |
| data_fim_real | date | não |

Comportamento:
- Modo criar: chama `criarFaseAction(projetoId, data)` → toast success + fecha dialog
- Modo editar: chama `editarFaseAction(fase.id, data)` → toast success + fecha dialog
- Erro: `toast.error(result.error)`
- `zodResolver(FaseFormSchema as any)` (padrão do projeto — ver decisão PRD-01)
- `defaultValues` para datas usam `toLocaleDateString('sv-SE') as unknown as Date` (ver decisão PRD-02b)

#### `fases-manager.tsx` — Client Component principal

Props:
```ts
type FasesManagerProps = {
  projetoId: string
  fases: FaseData[]
}
```

Responsabilidades:
1. **Listagem** — renderiza fases em ordem com `DndContext` + `SortableContext` do `@dnd-kit/sortable`
2. **Drag-and-drop** — ao soltar (`onDragEnd`), recalcula `ordem` e chama `reordenarFasesAction`; atualiza estado otimisticamente
3. **Restrição Fase Geral** — fases com `is_fase_geral = true` não têm drag handle, não têm botão excluir, e não podem ser movidas (a action já bloqueia no backend)
4. **Nova fase** — botão no topo abre `<FaseFormDialog trigger={<Button>Nova fase</Button>} projetoId={projetoId} />`
5. **Editar** — botão por fase abre `<FaseFormDialog trigger={<Button variant="ghost">Editar</Button>} fase={fase} projetoId={projetoId} />`
6. **Excluir** — AlertDialog por fase não-geral; ao confirmar, chama `excluirFaseAction(faseId)` + toast

Layout sugerido por card de fase:
```
[ drag handle? ] [ nome ] [ badge status ]   [ Editar ] [ Excluir? ]
                 [ descrição se existir ]
                 [ datas se existirem ]
```

**Reordenação com @dnd-kit:**
```tsx
import {
  DndContext, closestCenter, DragEndEvent,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
```

Ao finalizar drag (`onDragEnd`):
1. `arrayMove` para reordenar array local
2. Atribuir `ordem = index + 1` para cada item (Fase Geral sempre `ordem = 1`)
3. Garantir que Fase Geral não muda de posição
4. Chamar `reordenarFasesAction(projetoId, fasesComNovaOrdem)`

---

## Regras de negócio aplicáveis

| Regra | Resumo | Onde implementar |
|---|---|---|
| R-Geral-1 | Fase Geral sempre em posição 1, não reordenável | `fases-manager.tsx` + `fase.service.ts` (já existe) |
| R-Geral-2 | Fase Geral não pode ser excluída | `fases-manager.tsx` (ocultar botão) + `fase.service.ts` (já existe) |

Ver definição completa em `specs/foundation/02_dominio.md` — seção "Restrições absolutas da fase Geral".

---

## Critérios de aceitação

- [ ] Ao acessar `/projetos/[id]/fases`, a lista de fases é exibida em ordem crescente de `ordem`
- [ ] A Fase Geral aparece sempre em primeiro lugar, sem drag handle e sem botão "Excluir"
- [ ] Ao clicar em "Nova fase" e preencher apenas o nome, a fase é criada e aparece no final da lista
- [ ] Campo "nome" vazio impede submissão com mensagem **"Nome é obrigatório"**
- [ ] Ao clicar em "Editar" de uma fase, o modal abre com os dados atuais preenchidos
- [ ] Ao salvar edição, os dados da fase são atualizados na lista
- [ ] Ao clicar em "Excluir" de uma fase não-geral, um AlertDialog de confirmação aparece
- [ ] Ao confirmar exclusão, a fase é removida da lista
- [ ] Ao tentar excluir a Fase Geral via API direta, a action retorna erro (já implementado)
- [ ] Arrastar uma fase não-geral e soltar em nova posição reordena a lista e persiste no banco
- [ ] A Fase Geral não pode ser arrastada (sem drag handle)
- [ ] Após qualquer mutação, a lista reflete o estado atualizado (via revalidatePath)

---

## Verificação

### Dependência
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Build
```bash
pnpm build
```
Zero erros de TypeScript é pré-requisito para declarar o PRD concluído.

### Checklist manual

Execute na ordem. Cada item tem uma ação e um resultado esperado.

- [ ] **Acessar `/projetos/[id]/fases`** → lista de fases carrega, Fase Geral em primeiro
- [ ] **Clicar "Nova fase" → preencher nome → salvar** → nova fase aparece ao final da lista
- [ ] **Clicar "Nova fase" → deixar nome vazio → salvar** → mensagem "Nome é obrigatório" aparece, sem fechar modal
- [ ] **Clicar "Editar" em uma fase → alterar nome → salvar** → nome atualizado na lista
- [ ] **Clicar "Excluir" em fase não-geral → confirmar** → fase removida da lista
- [ ] **Arrastar fase não-geral** → soltar em posição diferente → ordem persistida (verificar via Prisma Studio)
- [ ] **Verificar Fase Geral** → sem drag handle, sem botão excluir, sempre em primeiro

Verificar estado do banco via `npx prisma studio` quando necessário.
