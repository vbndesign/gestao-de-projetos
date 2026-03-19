# Decisões do Projeto — Histórico e Rationale

Documento de referência para o "por quê" das decisões técnicas e de processo. Dividido em decisões fundacionais (estáticas) e adaptações descobertas durante implementação (com IDs rastreáveis).

**Seções:**
1. [Decisões Fundacionais](#1-decisões-fundacionais)
2. [Padrões de Código](#2-padrões-de-código)
3. [Design System](#3-design-system)
4. [Git e Workflow](#4-git-e-workflow)
5. [Adaptações e Refinamentos](#5-adaptações-e-refinamentos)

---

## 1. Decisões Fundacionais

Decisões de arquitetura tomadas antes da implementação. Estáticas — mudar exige revisão explícita.

| Decisão | Alternativa descartada | Rationale |
|---|---|---|
| Next.js App Router | Pages Router | Server Components nativos, layouts aninhados, melhor DX de loading/error |
| Prisma como ORM | Supabase Client para queries | Type-safety completa, migrations versionadas, queries compostas sem SQL raw |
| Supabase Auth | NextAuth.js | Integração nativa com RLS do Postgres; sem sessão em banco próprio para manter |
| shadcn/ui | Mantine / MUI | Componentes copiados (você possui o código), sem lock-in, estilo "base-nova" compacto |
| Server Actions (mutações) | API Routes | Colocation com o componente, sem endpoint exposto, revalidação integrada |
| `queries/` flat sem Repository Pattern | Repository classes | Projeto de complexidade média — abstração extra sem benefício real |
| Branches curtas `feature/*` → `dev` | `modulo/*` de longa duração | Merge frequente, sem divergência acumulada, histórico linear legível (D-21) |

---

## 2. Padrões de Código

Padrões canônicos estabelecidos. Detalhes em `03_arquitetura.md` e `04_nextjs.md`.

### Server Actions

```ts
// rawData: unknown + safeParse obrigatório — nunca confiar no input do cliente
export async function minhaAction(rawData: unknown) {
  const parsed = MeuSchema.safeParse(rawData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }
  // ...
}
```

Ver D-15, D-16 para origem desse padrão.

### Cross-entity com `$transaction`

Regras de negócio que envolvem múltiplas entidades ficam em `services/` usando `$transaction`. Actions chamam o service — nunca acessam `lib/db` diretamente com lógica cross-entity.

### Deduplicação de queries

`React.cache()` envolve funções de query para deduplicar requests no mesmo render pass. `requireAuth()` também usa `React.cache()`.

### Proteção de rotas

`proxy.ts` (não `middleware.ts`) — verificação otimista de cookie. Export `proxy()`, não `middleware()`. Ver D-05 para o padrão de detecção de cookie Supabase.

---

## 3. Design System

Detalhes em `specs/design-system/foundations/design-system-frontend-implementation.md`.

### Source of truth

Tokens em `specs/design-system/tokens/` (JSON). Repositório é a origem — Figma consome os tokens, não é a fonte. Nunca editar `src/app/design-system-tokens.css` manualmente (arquivo gerado).

### 3 tiers de componentes

| Tier | Localização | Tipo |
|---|---|---|
| Level 1 | `src/components/ui/` | Primitivos shadcn + variantes DS |
| Level 2 | `src/components/` | Semânticos reutilizáveis (`PageHeader`, `DataRow`, etc.) |
| Level 3 | `src/app/(internal)/[feature]/_components/` | Específicos de feature |

### Integração com Figma

DS integrado no fluxo de PRDs a partir de agora. Workflow definido em `07_design_ui.md`: PRD → research (UI Delta) → create_plan (inventário de componentes) → implement_plan (dados → DS → telas → validação → Code Connect).

---

## 4. Git e Workflow

Detalhes completos em `GIT_WORKFLOW.md`.

### Branches curtas

Toda feature usa `feature/prd-NN-descricao` criada a partir de `dev` e mergeada de volta por PR com `--no-ff`. Sem branches de módulo de longa duração (D-21).

### DS em 3 tiers de branch

| Tipo | Branch | Fluxo |
|---|---|---|
| Fundacional (tokens, primitivos) | `feature/ds-descricao` | `dev` → PR → `dev` |
| Feature-driven (componente para PRD) | Dentro da `feature/prd-NN-*` | Sem branch extra |
| Tweak/fix | `fix/ds-descricao` | `dev` → PR → `dev` |

### Tags por módulo completo

Tags de versão marcam conclusão de um módulo funcional, não de sub-PRDs individuais. Ex: `v0.3.0` = Módulo Projetos (PRD-02a + 02b + 02c + PRD-03).

---

## 5. Adaptações e Refinamentos

Adaptações descobertas durante implementação — divergências entre o planejado e o que funcionou na prática. Referenciadas por ID nas memórias do projeto.

---

### D-01 | 2026-03-12 | shadcn v4: estilo `base-nova`

**Origem:** PRD-00a

**Contexto:** Setup planejado com estilo "New York" do shadcn.

**Decisão:** shadcn v4 renomeou "New York" para `base-nova`. O `components.json` gerado usa `"style": "base-nova"`. CLI não aceita `--style new-york` — usar `--defaults`.

**Por quê:** Mudança de nomenclatura na v4 — sem impacto funcional, só naming.

---

### D-02 | 2026-03-12 | `pnpm dlx` não funciona no Windows

**Origem:** PRD-00a

**Contexto:** Docs shadcn usam `pnpm dlx shadcn@latest`.

**Decisão:** Usar `npx shadcn@latest add [componente]` em todos os ambientes.

**Por quê:** `pnpm dlx` retorna `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` no Windows neste projeto.

**Impacto:** CLAUDE.md documenta `npx` como padrão.

---

### D-03 | 2026-03-12 | Inter font: `variable` em vez de `className`

**Origem:** PRD-00a

**Contexto:** Plano usava `inter.className` direto no `<body>`.

**Decisão:** Usar `variable: "--font-sans"` com a classe aplicada ao body.

**Por quê:** shadcn v4 configura `--font-sans` no `@theme inline` do `globals.css`. Usar `className` diretamente desconecta a fonte do sistema de CSS variables do shadcn.

**Antes → Depois:**
```tsx
// Antes
const inter = Inter({ subsets: ['latin'] })
<body className={inter.className}>

// Depois
const inter = Inter({ variable: '--font-sans', subsets: ['latin'] })
<body className={`${inter.variable} antialiased`}>
```

---

### D-04 | 2026-03-12 | `supabase.ts` dividido em dois arquivos

**Origem:** PRD-00b

**Contexto:** PRD especificava um único `lib/supabase.ts` com dois exports (server + browser).

**Decisão:** Dois arquivos separados: `lib/supabase.ts` (server, com `import 'server-only'`) e `lib/supabase-browser.ts` (browser, sem).

**Por quê:** `import 'server-only'` em arquivo com exports browser causa erro de build quando Client Components importam o arquivo.

**Impacto:** `03_arquitetura.md`, `04_nextjs.md`, `CLAUDE.md` atualizados.

---

### D-05 | 2026-03-12 | `proxy.ts`: cookie Supabase com nome dinâmico

**Origem:** PRD-00b

**Contexto:** Proxy checava `request.cookies.get('sb-access-token')` — nome do cliente Supabase legado.

**Decisão:** Helper `hasSupabaseSession()` que detecta qualquer cookie `sb-*-auth-token`.

**Por quê:** `@supabase/ssr` salva com nome dinâmico `sb-[project-ref]-auth-token` (pode ser chunked: `.0`, `.1`). Cookie com nome fixo nunca era encontrado após login OAuth.

**Antes → Depois:**
```ts
// Antes
request.cookies.get('sb-access-token')

// Depois
request.cookies.getAll().some(
  (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
)
```

---

### D-06 | 2026-03-12 | shadcn v4: `form.tsx` não existe no registry

**Origem:** PRD-01

**Contexto:** Plano listava `npx shadcn@latest add form` como dependência.

**Decisão:** Usar React Hook Form diretamente com `useForm` + `zodResolver` sem wrapper.

**Por quê:** `form.tsx` não existe no registry do shadcn v4. O padrão de formulário documentado em `04_nextjs.md` já reflete isso.

---

### D-07 | 2026-03-12 | `zodResolver` + Zod 4.3.x: cast `as any`

**Origem:** PRD-01

**Contexto:** `@hookform/resolvers` v5 suporta Zod v4, mas tipos TypeScript têm inconsistência de versão.

**Decisão:** `zodResolver(schema as any)` com eslint-disable comment em todos os formulários.

**Por quê:** Overload Zod v4 espera `_zod.version.minor: 0` (Zod 4.0.x), mas Zod 4.3.x tem `minor: 3`. TypeScript rejeita sem cast. Runtime funciona corretamente.

**Antes → Depois:**
```tsx
// Antes (erro TypeScript)
resolver: zodResolver(MeuSchema)

// Depois
// eslint-disable-next-line @typescript-eslint/no-explicit-any
resolver: zodResolver(MeuSchema as any)
```

---

### D-08 | 2026-03-12 | `PageProps<'/rota/[param]'>` não existe em Next.js 16

**Origem:** PRD-01

**Contexto:** `04_nextjs.md` documentava `PageProps<'/rota/[param]'>` como tipo global gerado.

**Decisão:** Tipagem inline em todas as pages com params.

**Por quê:** O tipo não está disponível em Next.js 16.1.6 neste projeto (pode ser gerado em certas configs, mas não nesta).

**Antes → Depois:**
```tsx
// Antes
export default async function Page(props: PageProps<'/clientes/[id]'>) { ... }

// Depois
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

---

### D-09 | 2026-03-12 | base-ui `Select.onValueChange`: tipo `string | null`

**Origem:** PRD-01

**Contexto:** Select esperava `onValueChange: (value: string) => void`.

**Decisão:** Sempre usar coalescing ao receber o valor.

**Por quê:** `@base-ui/react/select` tem `onValueChange: (value: string | null) => void`. Sem coalescing, TypeScript rejeita e runtime pode passar `null`.

**Antes → Depois:**
```tsx
// Antes
<Select onValueChange={(v) => handleFiltro('status', v)} />

// Depois
<Select onValueChange={(v) => handleFiltro('status', v ?? '')} />
```

---

### D-10 | 2026-03-13 | base-ui `DialogTrigger`: Fragment não aceita props extras

**Origem:** PRD-02b

**Contexto:** Componentes passavam o trigger como `<>{trigger}</>` para o `DialogTrigger`.

**Decisão:** O `trigger` deve ser `React.ReactElement` (não `ReactNode`), passado diretamente via prop `render`.

**Por quê:** `@base-ui/react` injeta props extras (como `type`, `onClick`) via `render`. Fragment não aceita essas props e gera erro em runtime.

**Antes → Depois:**
```tsx
// Antes
type Props = { trigger: React.ReactNode }
<DialogTrigger render={<>{trigger}</>} />

// Depois
type Props = { trigger: React.ReactElement }
<DialogTrigger render={trigger} />
```

---

### D-11 | 2026-03-13 | `z.coerce.date()` defaultValues: cast `as unknown as Date`

**Origem:** PRD-02b

**Contexto:** Campos de data do schema inferem tipo `Date`, mas `defaultValues` precisam ser strings para `<input type="date">`.

**Decisão:** Cast duplo `as unknown as Date` no defaultValues.

**Por quê:** `z.coerce.date()` aceita strings em runtime, mas TypeScript rejeita string onde espera Date. Runtime correto; problema apenas de tipos.

**Antes → Depois:**
```tsx
// Antes (erro TypeScript)
data_inicio: projeto.data_inicio.toISOString().split('T')[0]

// Depois
data_inicio: new Date(projeto.data_inicio).toLocaleDateString('sv-SE') as unknown as Date
// sv-SE retorna YYYY-MM-DD no fuso local (toISOString() usaria UTC, causando bug de -1 dia)
```

---

### D-12 | 2026-03-13 | Skeletons: sem `<Skeleton>` no shadcn v4

**Origem:** PRD-02b

**Contexto:** Plano usava `<Skeleton>` do shadcn para loading states.

**Decisão:** Divs com classes Tailwind diretamente.

**Por quê:** `skeleton.tsx` não existe no registry do shadcn v4 deste projeto.

**Antes → Depois:**
```tsx
// Antes
<Skeleton className="h-8 w-48" />

// Depois
<div className="h-8 w-48 animate-pulse rounded bg-muted" />
```

---

### D-13 | 2026-03-13 | `<DndContext>`: hydration mismatch com `useId()`

**Origem:** PRD-02c

**Contexto:** `@dnd-kit/core` gera IDs internamente com contador incremental — diferente entre SSR e cliente.

**Decisão:** Sempre passar `id={useId()}` ao `<DndContext>`.

**Por quê:** IDs diferentes entre servidor e cliente geram hydration mismatch no React. `useId()` garante sincronização. String literal fixa pode conflitar com múltiplas instâncias.

**Antes → Depois:**
```tsx
// Antes (hydration mismatch)
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>

// Depois
const dndId = useId()
<DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
```

---

### D-14 | 2026-03-14 | Zod v4: `required_error` → `error` em `z.coerce.date()`

**Origem:** PRD-04a

**Contexto:** Zod v3 usava `required_error` para mensagem de campo obrigatório.

**Decisão:** Usar `error` em vez de `required_error`.

**Por quê:** Zod v4 unificou as opções de erro — `required_error` não existe mais. `error` substitui tanto `required_error` quanto `invalid_type_error`.

**Antes → Depois:**
```ts
// Antes (Zod v3)
z.coerce.date({ required_error: 'Data obrigatória' })

// Depois (Zod v4)
z.coerce.date({ error: 'Data obrigatória' })
```

---

### D-15 | 2026-03-14 | Field-level errors: `issues[0]?.message`

**Origem:** PRD-04a

**Contexto:** Erros de validação eram retornados como string genérica da action.

**Decisão:** Retornar `parsed.error.issues[0]?.message` para erros específicos de campo.

**Por quê:** Mensagem genérica não ajuda o usuário a identificar qual campo falhou. `issues[0]?.message` expõe a mensagem do primeiro erro de validação do schema Zod.

---

### D-16 | 2026-03-14 | Actions: `rawData: unknown` + `safeParse()` obrigatório

**Origem:** PRD-04a

**Contexto:** Actions recebiam dados tipados diretamente do cliente.

**Decisão:** Parâmetro sempre `rawData: unknown`, validação sempre com `safeParse()`.

**Por quê:** Client Components podem ser alterados ou bypassados. A action é a última linha de defesa — nunca confiar que os dados chegam com o tipo esperado.

---

### D-17 | 2026-03-13 | `TarefaFormDialog` co-localizado

**Origem:** PRD-03

**Contexto:** Plano considerava `src/components/tarefas/` para o dialog de tarefas.

**Decisão:** `TarefaFormDialog` em `src/app/(internal)/tarefas/_components/`.

**Por quê:** Componente usado exclusivamente na feature de tarefas — sem reutilização cross-feature confirmada. Co-localização é preferível à extração prematura.

---

### D-18 | 2026-03-13 | `tempo_estimado_horas`: `step="any"`

**Origem:** PRD-03

**Contexto:** Campo de horas estimadas com `step="0.5"` para incrementos de meia hora.

**Decisão:** `step="any"` para aceitar qualquer decimal.

**Por quê:** `step="0.5"` bloqueia valores válidos como 1.25h. Usuários precisam de liberdade para registrar durações como 1.5h, 2.75h, etc.

---

### D-19 | 2026-03-19 | DS Etapas 4-6: roadmap separado → absorvido por `07_design_ui.md`

**Origem:** DS Etapa 3

**Contexto:** Roadmap previa Etapas 4 (validação Figma MCP), 5 (Code Connect) e 6 (spacing tokens) como itens separados pós-Etapa 3.

**Decisão:** Etapas 4-6 absorvidas no workflow padrão de desenvolvimento definido em `07_design_ui.md`. Não são mais itens de roadmap — são parte do processo de cada PRD.

**Por quê:** Separar validação Figma e Code Connect do ciclo de desenvolvimento cria overhead de planejamento sem benefício. Integrados ao fluxo: cada PRD com UI já inclui validação MCP e Code Connect ao final.

**Impacto:** `specs/design-system/foundations/design-system-frontend-implementation.md` reescrito de roadmap para referência de contratos. `07_design_ui.md` é o novo documento de workflow.

---

### D-20 | 2026-03-19 | `ProjectSummaryCard` movido para `src/components/`

**Origem:** DS Etapa 3

**Contexto:** `ProjectSummaryCard` estava em `src/app/(internal)/projetos/_components/`.

**Decisão:** Movido para `src/components/` (Level 2 semântico).

**Por quê:** Componente estável com contrato bem definido (`fields` array com `label`, `value`, `href?`, `colSpan?: 2`). Candidato a reutilização em outras features (clientes, fases). Critério Level 2: padrão estável mesmo que usado só em 1 lugar por enquanto.

---

### D-21 | 2026-03-19 | Git: `modulo/*` → `feature/*`

**Origem:** GIT_WORKFLOW.md

**Contexto:** Modelo anterior usava branches `modulo/xxx` de longa duração com sub-branches por PRD.

**Decisão:** Branches curtas `feature/prd-NN-descricao` criadas a partir de `dev`, mergeadas por PR com `--no-ff`. Tags por módulo completo substituem o agrupamento visual de `modulo/*`.

**Por quê:** `modulo/*` criava divergência acumulada (semanas sem merge em `dev`), conflitos difíceis de resolver, e complexidade de rastreamento. Na prática, a branch `modulo/design-system-frontend` durou meses. Branches curtas com merge frequente são mais sustentáveis.

**Impacto:** `GIT_WORKFLOW.md` completamente reescrito. `03_arquitetura.md` seção Git atualizada.
