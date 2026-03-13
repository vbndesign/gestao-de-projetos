---
date: 2026-03-12T00:00:00-03:00
researcher: Claude
git_commit: 392a795
branch: feature/projetos/prd-02b-ui
repository: gestao-projetos
topic: "PRD-02b — Projetos UI: análise completa para implementação"
tags: [research, projetos, ui, prd-02b]
status: complete
last_updated: 2026-03-12
last_updated_by: Claude
---

# Research: PRD-02b — Projetos UI

**Date**: 2026-03-12T00:00:00-03:00
**Git Commit**: 392a795
**Branch**: feature/projetos/prd-02b-ui
**Repository**: gestao-projetos
**Research Mode**: Mixed (backend implementado, UI pendente)

## Research Question

Análise completa do PRD-02b para implementação: o que já existe, o que precisa ser criado, dependências, padrões a seguir, e pontos de atenção.

## Summary

PRD-02b implementa a UI de projetos: listagem com filtros server-side, criação com redirect, e detalhe com edição/exclusão. Todo o backend (queries, actions, services, schemas) já está pronto no PRD-02a. A implementação segue os padrões estabelecidos no PRD-01 (clientes), com ajustes para filtros server-side (vs client-side em clientes) e layout com abas (novo padrão).

---

## Detailed Findings

### 1. Backend já implementado (PRD-02a) — pronto para uso

**Queries** (`src/queries/projeto.queries.ts`):
- `getProjetosFiltrados({ status?, clienteId? })` — lista com cliente aninhado, `created_at desc`, usa `React.cache()`
- `getProjetoById(id)` — dados completos com cliente e fases, usa `React.cache()` (deduplica entre layout e page)
- `getClientesParaSelect()` — `{ id, nome }[]` para selects, usa `React.cache()`

**Actions** (`src/actions/projeto.actions.ts`):
- `criarProjetoAction(data)` — retorna `{ success, projetoId }` (projetoId usado para redirect)
- `editarProjetoAction(id, data)` — revalida `/projetos` e `/projetos/{id}`
- `excluirProjetoAction(id)` — revalida `/projetos`, retorna `{ success }` (não faz redirect no server)

**Schema** (`src/types/schemas/projeto.schema.ts`):
- `ProjetoFormSchema` — Zod com `nome`, `cliente_id`, `descricao`, `status`, `data_inicio`, `previsao_entrega`, `data_conclusao_real`
- `data_inicio` usa `z.coerce.date()` — aceita string de `<input type="date">` e converte
- `previsao_entrega` e `data_conclusao_real` são `.optional().nullable()`

**Service** (`src/services/projeto.service.ts`):
- `criarProjeto(data)` — `$transaction` que cria projeto + fase Geral (R1)

### 2. Arquivos a criar (12 arquivos)

```
src/app/(internal)/projetos/page.tsx                             — Server Component: filtros + lista
src/app/(internal)/projetos/loading.tsx                          — skeleton da listagem
src/app/(internal)/projetos/_components/projetos-listagem.tsx    — Client Component: filtros + lista
src/app/(internal)/projetos/novo/page.tsx                        — Server Component: busca clientes
src/app/(internal)/projetos/novo/_components/projeto-form.tsx    — Client Component: form criação
src/app/(internal)/projetos/[id]/layout.tsx                      — layout: breadcrumb + tabs
src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx    — Client Component: tabs
src/app/(internal)/projetos/[id]/page.tsx                        — Visão Geral
src/app/(internal)/projetos/[id]/loading.tsx                     — skeleton detalhe
src/app/(internal)/projetos/[id]/not-found.tsx                   — 404
src/app/(internal)/projetos/[id]/error.tsx                       — error boundary
src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx — Client Component: editar + excluir
```

### 3. Dependências shadcn a instalar

Componentes ainda não instalados que o PRD-02b requer:
- `select` — para filtros (status, cliente) e campo de formulário
- `badge` — para status do projeto

Componentes já instalados e reutilizados:
- `button`, `dialog`, `alert-dialog`, `input`, `label`, `textarea`, `sonner`

**Comando:** `npx shadcn@latest add select badge`

### 4. Padrões a seguir (baseado no PRD-01)

**Tipagem inline para params/searchParams** (decisão PRD-01):
```tsx
// Correto
export default async function Page({ params }: { params: Promise<{ id: string }> }) {}
// PageProps<'/rota'> NÃO existe neste projeto
```

**zodResolver com `as any`** (decisão PRD-01):
```tsx
resolver: zodResolver(ProjetoFormSchema as any),
```

**DialogTrigger com `render` prop** (decisão PRD-01):
```tsx
<DialogTrigger render={<Button>Abrir</Button>} />
// Nunca usar Fragment: <DialogTrigger render={<>{trigger}</>} />
```

**Skeleton sem componente Skeleton** — PRD-01 usa `animate-pulse` + `bg-muted` diretamente (não há componente `skeleton.tsx` instalado)

**Tipo local para props** — definido no próprio componente, não importado do Prisma

### 5. Diferenças entre PRD-01 (clientes) e PRD-02b (projetos)

| Aspecto | Clientes (PRD-01) | Projetos (PRD-02b) |
|---|---|---|
| Filtro | Client-side (`useSearchParams` + `.filter()`) | Server-side (`searchParams` prop → query no banco) |
| Criação | Modal na listagem | Página dedicada `/projetos/novo` com redirect |
| Detalhe | Página simples com breadcrumb | Layout compartilhado com abas |
| Edição | Modal na listagem e no detalhe | Dialog dentro do componente detalhe |
| Componentes Select | Não usa | `<Select>` shadcn para filtro de status e cliente |
| Badge | Não usa | `<Badge>` para status do projeto |

### 6. Pontos de atenção para implementação

#### 6a. Filtros server-side com `useTransition`

Os filtros na listagem (`projetos-listagem.tsx`) são **server-side** — ao mudar o select, o componente faz `router.replace('/projetos?' + params)` que causa nova request ao servidor. O PRD especifica `useTransition` para feedback visual durante a navegação.

Diferente dos clientes onde o filtro é client-side (`.filter()` no array), aqui a mudança de filtro dispara nova query no banco via `getProjetosFiltrados()`.

#### 6b. `previsao_entrega` — `setValueAs` para campo opcional

O PRD especifica tratamento especial para `previsao_entrega`:
```tsx
register('previsao_entrega', { setValueAs: (v) => (v === '' ? undefined : v) })
```
Converte string vazia em `undefined` para compatibilidade com `.optional()` do Zod. Mesmo padrão para `data_conclusao_real` no formulário de edição.

#### 6c. Datas pré-preenchidas no formulário de edição

Converter `Date` para string `YYYY-MM-DD` nos `defaultValues`:
```tsx
data_inicio: projeto.data_inicio.toISOString().split('T')[0],
previsao_entrega: projeto.previsao_entrega?.toISOString().split('T')[0] ?? '',
```

**Atenção:** `.toISOString()` retorna UTC. Se a data foi salva como `2026-03-12`, pode aparecer como `2026-03-11` no fuso UTC-3. Verificar se `z.coerce.date()` do schema lida corretamente com isso.

#### 6d. Layout com abas — `getProjetoById` deduplica via `React.cache()`

O `layout.tsx` chama `getProjetoById(id)` para breadcrumb e título. O `page.tsx` chama novamente para os dados completos. Como a query usa `React.cache()`, não há duplicação de request ao banco.

O layout verifica null e chama `notFound()` — o page **não verifica null** (já tratado pelo layout).

#### 6e. Abas futuras (Fases, Timeline, Horas) — placeholder

As abas são definidas no `projeto-tabs.tsx` mas 3 das 4 ainda não têm pages. Clicar em "Fases", "Timeline" ou "Horas" vai gerar 404 até PRDs futuros. Isso é comportamento esperado.

#### 6f. `criarProjetoAction` retorna `projetoId`

A action de criação retorna `{ success: true, projetoId: string }`. O form usa isso para redirect:
```tsx
if (result.success) {
  router.push('/projetos/' + result.projetoId)
}
```

#### 6g. STATUS_LABELS — constante compartilhada

O PRD define `STATUS_LABELS` localmente no `projetos-listagem.tsx`, mas é usada também em:
- `projeto-form.tsx` (select de status)
- `projeto-detalhe.tsx` (badge de status)
- `[id]/layout.tsx` (badge no header)

Considerar exportar de um local comum ou definir em cada arquivo (PRD diz "definida no arquivo, exportável se necessário").

### 7. Fluxo de navegação implementado

```
/projetos                    → Listagem com filtros server-side
  ├── [Filtro status]        → router.replace com searchParams → nova query
  ├── [Filtro cliente]       → router.replace com searchParams → nova query
  ├── [Limpar filtros]       → router.replace('/projetos')
  ├── [Novo projeto]         → Link → /projetos/novo
  └── [Click projeto]        → Link → /projetos/[id]

/projetos/novo               → Formulário de criação
  ├── [Criar]                → criarProjetoAction → redirect /projetos/[id]
  └── [Breadcrumb: Projetos] → Link → /projetos

/projetos/[id]               → Layout com abas + Visão Geral
  ├── Breadcrumb             → Link → /projetos
  ├── [Tab: Visão Geral]     → /projetos/[id] (ativa)
  ├── [Tab: Fases]           → /projetos/[id]/fases (futuro: PRD-02c)
  ├── [Tab: Timeline]        → /projetos/[id]/timeline (futuro: PRD-07b)
  ├── [Tab: Horas]           → /projetos/[id]/horas (futuro: PRD-06)
  ├── [Editar]               → Dialog com form pré-preenchido
  ├── [Excluir]              → AlertDialog → redirect /projetos
  └── [Link cliente]         → /clientes/[id]
```

---

## References

- `specs/prds/prd-02b-projetos-ui.md` — PRD completo
- `src/queries/projeto.queries.ts` — queries existentes (PRD-02a)
- `src/actions/projeto.actions.ts` — actions existentes (PRD-02a)
- `src/types/schemas/projeto.schema.ts` — schema Zod existente
- `src/services/projeto.service.ts` — service de criação com R1
- `src/app/(internal)/clientes/_components/clientes-listagem.tsx` — padrão de listagem (PRD-01)
- `src/app/(internal)/clientes/_components/cliente-detalhe.tsx` — padrão de detalhe (PRD-01)
- `src/app/(internal)/clientes/_components/cliente-form-modal.tsx` — padrão de formulário com Dialog (PRD-01)
- `src/app/(internal)/clientes/loading.tsx` — padrão de skeleton (PRD-01)
- `specs/foundation/04_nextjs.md` — padrões Next.js 16 do projeto
- `specs/foundation/05_urls.md` — mapa de rotas

## Design & Decisions

- **Filtros server-side** — diferente de clientes (client-side), projetos filtra via searchParams no Server Component
- **Página dedicada para criação** — formulário mais complexo que clientes, URL compartilhável
- **Layout com abas** — padrão novo neste PRD, reutilizado em PRDs futuros
- **`React.cache()` para deduplicação** — layout e page compartilham `getProjetoById()`
- **`zodResolver(schema as any)`** — workaround necessário para incompatibilidade Zod v4 + @hookform/resolvers
- **Skeleton com `animate-pulse`** — sem componente Skeleton do shadcn, padrão manual

## Open Questions

- **STATUS_LABELS**: exportar de um local central ou manter localmente em cada arquivo? O PRD sugere manter local e exportar se necessário.
- **Timezone em datas**: `.toISOString().split('T')[0]` pode mostrar dia anterior em UTC-3. Verificar durante testes se o comportamento é aceitável.
