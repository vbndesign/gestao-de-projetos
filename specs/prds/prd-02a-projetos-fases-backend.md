# PRD-02a — Projetos + Fases Backend

> **Depende de:** PRD-01 (Clientes CRUD) — deve estar concluído antes de iniciar
> **Contexto:** Implementa as camadas de dados, regras de negócio e actions para Projetos e Fases. Inclui as regras R1 (criar projeto cria fase Geral automática) e R2 (fase Geral não pode ser excluída nem reordenada). Ao final, o backend está pronto para a UI dos PRDs 02b e 02c.

---

## Escopo

### Inclui
- Zod schemas `ProjetoFormSchema` e `FaseFormSchema`
- Queries de leitura para projetos e fases
- Service `projeto.service.ts` — criação com fase Geral automática (R1)
- Service `fase.service.ts` — proteção da fase Geral (R2) + reordenação
- Actions para criar, editar, excluir projetos
- Actions para criar, editar, excluir, reordenar fases

### Não inclui
- UI de projetos — `/projetos`, `/projetos/novo`, `/projetos/[id]` (PRD-02b)
- UI de fases — drag and drop, modais de fase (PRD-02c)
- Tarefas planejadas (PRD-03)
- Timeline, registros operacionais (PRDs futuros)

---

## Arquivos

### Criar

```
src/types/schemas/projeto.schema.ts      — ProjetoFormSchema (Zod)
src/types/schemas/fase.schema.ts         — FaseFormSchema (Zod)
src/queries/projeto.queries.ts           — getProjetosFiltrados, getProjetoById, getClientesParaSelect
src/queries/fase.queries.ts              — getFasesByProjeto
src/services/projeto.service.ts          — criarProjeto (R1: $transaction com fase Geral)
src/services/fase.service.ts             — excluirFase (R2), reordenarFases (R2)
src/actions/projeto.actions.ts           — criarProjetoAction, editarProjetoAction, excluirProjetoAction
src/actions/fase.actions.ts              — criarFaseAction, editarFaseAction, excluirFaseAction, reordenarFasesAction
```

### Modificar

```
(nenhum arquivo existente a modificar)
```

> **Dependências a instalar antes de implementar:**
> Nenhuma — `zod`, `react-hook-form`, `@hookform/resolvers` já instalados no PRD-01.

---

## Especificação

### Schema Prisma

Sem alterações — os modelos `Projeto`, `Fase` e todos os enums já existem no schema do PRD-00b.

---

### Zod Schemas

#### `types/schemas/projeto.schema.ts`

```ts
import { z } from 'zod'

export const ProjetoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cliente_id: z.string().uuid('Cliente inválido'),
  descricao: z.string().optional(),
  status: z.enum([
    'rascunho', 'ativo', 'aguardando_cliente', 'pausado', 'concluido', 'arquivado',
  ]),
  data_inicio: z.coerce.date({ required_error: 'Data de início é obrigatória' }),
  previsao_entrega: z.coerce.date().optional().nullable(),
  data_conclusao_real: z.coerce.date().optional().nullable(),
})

export type ProjetoFormData = z.infer<typeof ProjetoFormSchema>
```

#### `types/schemas/fase.schema.ts`

```ts
import { z } from 'zod'

export const FaseFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  status: z.enum([
    'nao_iniciada', 'em_andamento', 'aguardando_cliente', 'concluida', 'pausada', 'cancelada',
  ]),
  data_inicio_prevista: z.coerce.date().optional().nullable(),
  data_fim_prevista: z.coerce.date().optional().nullable(),
  data_inicio_real: z.coerce.date().optional().nullable(),
  data_fim_real: z.coerce.date().optional().nullable(),
})

export type FaseFormData = z.infer<typeof FaseFormSchema>
```

---

### Queries (`queries/projeto.queries.ts`)

Todas as queries usam `import 'server-only'` e `import { db } from '@/lib/db'`.

---

**`getProjetosFiltrados({ status?, clienteId? })`**

- **Parâmetros:** `{ status?: StatusProjeto; clienteId?: string }`
- **Retorna:** `{ id, nome, status, data_inicio, previsao_entrega, created_at, cliente: { id, nome } }[]`
- **Filtros:** `status` e `clienteId` são opcionais e cumulativos
- **Ordenação:** `created_at` desc
- **Contexto:** interno — página `/projetos` com filtros server-side via `searchParams`

---

**`getProjetoById(id: string)`**

- **Parâmetros:** `id: string` (UUID)
- **Retorna:** todos os campos do projeto + `cliente: { id, nome }` + `fases: { id, nome, status, ordem, is_fase_geral }[]` ou `null`
- **Fases:** ordenadas por `ordem` asc
- **Usar `React.cache()`:** sim — chamado pelo layout e pela page do projeto
- **Contexto:** interno

---

**`getClientesParaSelect()`**

- **Parâmetros:** nenhum
- **Retorna:** `{ id, nome }[]`
- **Ordenação:** `nome` asc
- **Contexto:** interno — usado no form de criação de projeto para popular o select de clientes

---

### Queries (`queries/fase.queries.ts`)

---

**`getFasesByProjeto(projetoId: string)`**

- **Parâmetros:** `projetoId: string` (UUID)
- **Retorna:** `{ id, nome, descricao, ordem, status, data_inicio_prevista, data_fim_prevista, data_inicio_real, data_fim_real, is_fase_geral, created_at }[]`
- **Ordenação:** `ordem` asc
- **Contexto:** interno — página `/projetos/[id]/fases`

---

### Services

#### `services/projeto.service.ts`

Implementa R1 — criação de projeto com fase Geral automática em `$transaction`.

---

**`criarProjeto(data: ProjetoFormData)`**

- **Input:** dados validados do formulário
- **Efeitos em `$transaction`:**
  1. Cria o registro em `Projeto`
  2. Cria a fase Geral: `{ nome: "Geral do projeto", ordem: 1, status: "nao_iniciada", is_fase_geral: true }`
- **Retorna:** o projeto criado (com `id`)
- **Regra:** R1 — a fase Geral é obrigatória e criada automaticamente

> **Nota:** não cria evento de timeline neste PRD. O evento `projeto_criado` será adicionado quando `timeline.service.ts` for implementado (PRD-07a).

---

#### `services/fase.service.ts`

Implementa R2 — proteção da fase Geral contra exclusão e reordenação.

---

**`excluirFase(faseId: string)`**

- **Input:** `faseId: string`
- **Validação:** verifica se `is_fase_geral === true` → retorna erro
- **Efeitos:** deleta a fase (cascata em tarefas e lançamentos de horas via Prisma)
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`
- **Regra:** R2 — fase Geral não pode ser excluída

---

**`reordenarFases(projetoId: string, fasesOrdenadas: { id: string; ordem: number }[])`**

- **Input:** `projetoId` + array de `{ id, ordem }`
- **Validação:** verifica se alguma fase com `is_fase_geral === true` foi movida da `ordem: 1` → retorna erro
- **Efeitos em `$transaction`:** atualiza `ordem` de todas as fases do array
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`
- **Regra:** R2 — fase Geral sempre ocupa `ordem: 1` e não pode ser reordenada

---

### Actions (`actions/projeto.actions.ts`)

Todas as actions:
- Iniciam com `'use server'`
- Chamam `await requireAuth()` antes de qualquer operação
- Revalidam com Zod via `ProjetoFormSchema.safeParse`
- Retornam `{ success: true }` ou `{ success: false, error: string }`
- Nunca lançam exceção para a UI

---

**`criarProjetoAction(data: ProjetoFormData)`**

- **Input:** `ProjetoFormSchema`
- **Efeitos:** chama `projetoService.criarProjeto(data)` (cross-entity → service); `revalidatePath('/projetos')`
- **Retorna:** `{ success: true, projetoId: string }` ou `{ success: false, error: string }`
- **Nota:** retorna `projetoId` para que a UI possa redirecionar para `/projetos/[id]`

---

**`editarProjetoAction(id: string, data: ProjetoFormData)`**

- **Input:** `id: string` + `ProjetoFormSchema`
- **Efeitos:** atualiza o registro diretamente via `db` (operação simples); `revalidatePath('/projetos')`; `revalidatePath('/projetos/' + id)`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

---

**`excluirProjetoAction(id: string)`**

- **Input:** `id: string`
- **Efeitos:** deleta o projeto (cascata via Prisma — fases, tarefas, horas, registros, timeline); `revalidatePath('/projetos')`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`
- **Nota:** exclusão irreversível. A UI deve exibir diálogo de confirmação (PRD-02b).

---

### Actions (`actions/fase.actions.ts`)

Todas as actions:
- Iniciam com `'use server'`
- Chamam `await requireAuth()` antes de qualquer operação
- Retornam `{ success: true }` ou `{ success: false, error: string }`
- Nunca lançam exceção para a UI

---

**`criarFaseAction(projetoId: string, data: FaseFormData)`**

- **Input:** `projetoId: string` + `FaseFormSchema`
- **Efeitos:** calcula `ordem` como `max(ordem) + 1` das fases do projeto; cria o registro com `is_fase_geral: false`; `revalidatePath('/projetos/' + projetoId)`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

---

**`editarFaseAction(faseId: string, data: FaseFormData)`**

- **Input:** `faseId: string` + `FaseFormSchema`
- **Efeitos:** atualiza o registro; busca `projeto_id` para revalidar; `revalidatePath('/projetos/' + projetoId)`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`
- **Nota:** não permite editar `is_fase_geral` nem `ordem` (ordem é controlada pela ação de reordenar)

---

**`excluirFaseAction(faseId: string)`**

- **Input:** `faseId: string`
- **Efeitos:** chama `faseService.excluirFase(faseId)` (verifica R2); busca `projeto_id` para revalidar; `revalidatePath('/projetos/' + projetoId)`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

---

**`reordenarFasesAction(projetoId: string, fasesOrdenadas: { id: string; ordem: number }[])`**

- **Input:** `projetoId: string` + array de `{ id, ordem }`
- **Efeitos:** chama `faseService.reordenarFases(projetoId, fasesOrdenadas)` (verifica R2); `revalidatePath('/projetos/' + projetoId)`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

---

## Regras de negócio aplicáveis

| Regra | Onde implementar | Descrição |
|---|---|---|
| R1 — Criar projeto cria fase Geral automática | `services/projeto.service.ts` em `$transaction` | Fase com `is_fase_geral: true`, `ordem: 1`, `status: nao_iniciada` |
| R2 — Fase Geral não pode ser excluída/reordenada | `services/fase.service.ts` | Verifica `is_fase_geral` antes de excluir; valida `ordem: 1` na reordenação |

### Regras NÃO implementadas neste PRD

| Regra | Motivo |
|---|---|
| R3 — Resolver pendência (timeline) | `timeline.service.ts` — PRD-07a |
| R4 — Horas nunca no portal | Queries de portal — PRD-08 |
| R5 — Excluir fase cascateia | Já definido no schema Prisma (`onDelete: Cascade`) |

---

## Critérios de aceitação

- [ ] `ProjetoFormSchema` valida todos os campos obrigatórios e rejeita dados inválidos
- [ ] `FaseFormSchema` valida todos os campos obrigatórios e rejeita dados inválidos
- [ ] `getProjetosFiltrados()` retorna projetos com filtros opcionais e `select` explícito
- [ ] `getProjetoById()` retorna projeto com cliente e fases aninhadas, ou `null`
- [ ] `getClientesParaSelect()` retorna lista de clientes para popular select
- [ ] `getFasesByProjeto()` retorna fases ordenadas por `ordem` com `select` explícito
- [ ] `criarProjetoAction` cria projeto + fase Geral automática em transação (R1)
- [ ] `editarProjetoAction` atualiza campos do projeto e revalida caches
- [ ] `excluirProjetoAction` deleta projeto com cascata e revalida caches
- [ ] `criarFaseAction` cria fase com `ordem` calculada e `is_fase_geral: false`
- [ ] `editarFaseAction` atualiza campos da fase e revalida caches
- [ ] `excluirFaseAction` impede exclusão de fase Geral (R2) e permite exclusão de demais
- [ ] `reordenarFasesAction` impede mover fase Geral da posição 1 (R2)
- [ ] Todas as actions chamam `requireAuth()` antes de qualquer operação
- [ ] Todas as actions revalidam com Zod no servidor
- [ ] `pnpm build` completa com zero erros de TypeScript

---

## Verificação

### Build

```bash
npx prisma generate && pnpm build
```

Zero erros de TypeScript é pré-requisito para declarar o PRD concluído.

### Teste manual via Prisma Studio + console

Como este PRD é backend-only (sem UI), a verificação é feita via:

1. **Prisma Studio** (`npx prisma studio`) — verificar registros criados/editados/excluídos
2. **Importar actions em um script temporário** ou testar via UI dos PRDs 02b/02c
3. **Build** — confirmar que todas as assinaturas de tipo estão corretas

### Checklist

- [ ] **Criar projeto** via action → projeto criado + fase "Geral do projeto" com `is_fase_geral: true`, `ordem: 1`
- [ ] **Editar projeto** → campos atualizados, `updated_at` alterado
- [ ] **Excluir projeto** → projeto, fases e tudo abaixo removidos (cascata)
- [ ] **Criar fase** → fase criada com `ordem = max + 1`, `is_fase_geral: false`
- [ ] **Editar fase** → campos atualizados
- [ ] **Excluir fase Geral** → bloqueado com mensagem de erro
- [ ] **Excluir fase normal** → fase removida, tarefas e horas cascateadas
- [ ] **Reordenar fases** → ordens atualizadas; tentativa de mover Geral → bloqueada
- [ ] **`pnpm build`** → zero erros
