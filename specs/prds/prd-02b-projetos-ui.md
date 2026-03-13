# PRD-02b — Projetos UI

> **Depende de:** PRD-02a (Projetos + Fases Backend) — deve estar concluído antes de iniciar
> **Contexto:** Implementa as interfaces de listagem, criação e detalhe de projetos. Ao final, o usuário pode navegar por `/projetos`, criar um projeto via `/projetos/novo` (com redirect para `/projetos/[id]`) e visualizar, editar e excluir um projeto na visão geral do detalhe.

---

## Escopo

### Inclui
- `/projetos` — listagem com filtros server-side (status + cliente) via `searchParams`
- `/projetos/novo` — página de criação com formulário completo; redirect pós-criação para `/projetos/[id]`
- `/projetos/[id]/layout.tsx` — layout compartilhado: breadcrumb, título, badge de status, navegação por abas
- `/projetos/[id]` — Visão Geral: dados completos do projeto + modal de edição + exclusão com confirmação
- Arquivos triviais: `loading.tsx` (x2), `not-found.tsx`, `error.tsx`

### Não inclui
- `/projetos/[id]/fases` — PRD-02c
- `/projetos/[id]/timeline` — PRD-07b
- `/projetos/[id]/horas` — PRD-06
- Dashboard — permanece placeholder
- Paginação ou ordenação da lista de projetos

---

## Arquivos

### Criar

```
src/app/(internal)/projetos/page.tsx                                — Server Component: filtros + lista
src/app/(internal)/projetos/loading.tsx                             — skeleton da listagem
src/app/(internal)/projetos/_components/projetos-listagem.tsx       — Client Component: filtros interativos + lista
src/app/(internal)/projetos/novo/page.tsx                           — Server Component: busca clientes, renderiza form
src/app/(internal)/projetos/novo/_components/projeto-form.tsx       — Client Component: form de criação com redirect
src/app/(internal)/projetos/[id]/layout.tsx                         — layout do projeto: breadcrumb + tabs
src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx       — Client Component: tabs com aba ativa via usePathname()
src/app/(internal)/projetos/[id]/page.tsx                           — Visão Geral: detalhe do projeto
src/app/(internal)/projetos/[id]/loading.tsx                        — skeleton do detalhe
src/app/(internal)/projetos/[id]/not-found.tsx                      — projeto não encontrado
src/app/(internal)/projetos/[id]/error.tsx                          — error boundary (Client Component)
src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx    — Client Component: editar + excluir
```

### Modificar

```
(nenhum arquivo existente a modificar)
```

> **Dependências shadcn a instalar antes de implementar:**
> ```bash
> npx shadcn@latest add select badge
> ```

---

## Especificação

### Schema Prisma

Sem alterações — `Projeto`, `Fase` e enums já existem. Queries e actions foram implementadas em PRD-02a.

---

### Queries utilizadas (já existem em PRD-02a)

- `getProjetosFiltrados({ status?, clienteId? })` → lista com `cliente` aninhado, ordenada por `created_at desc`
- `getProjetoById(id)` → dados completos com `cliente` e `fases` aninhados — deduplica via `React.cache()` entre `layout.tsx` e `page.tsx`
- `getClientesParaSelect()` → `{ id, nome }[]` para popular selects

---

### UI — `projetos/page.tsx`

**Responsabilidade:** Server Component — lê filtros dos searchParams, busca dados, passa ao Client Component.

- Async Server Component:
  ```tsx
  export default async function ProjetosPage({
    searchParams,
  }: {
    searchParams: Promise<{ status?: string; cliente?: string }>
  }) {
    const { status, cliente } = await searchParams
    const [projetos, clientes] = await Promise.all([
      getProjetosFiltrados({
        status: status as StatusProjeto | undefined,
        clienteId: cliente,
      }),
      getClientesParaSelect(),
    ])
    return <ProjetosListagem projetos={projetos} clientes={clientes} />
  }
  ```
- `StatusProjeto` importado de `@prisma/client`

---

### UI — `projetos/_components/projetos-listagem.tsx`

**Responsabilidade:** Client Component — filtros interativos e lista de projetos.

- `'use client'`
- Props:
  ```ts
  {
    projetos: ProjetoListItem[]
    clientes: { id: string; nome: string }[]
  }
  ```
- `ProjetoListItem` definido localmente:
  ```ts
  type ProjetoListItem = {
    id: string
    nome: string
    status: string
    data_inicio: Date
    previsao_entrega: Date | null
    created_at: Date
    cliente: { id: string; nome: string }
  }
  ```
- Lê filtros atuais via `useSearchParams()` — chaves `status` e `cliente`
- Dois `Select` (shadcn) para filtro:
  - Status: opções com `STATUS_LABELS` + opção "Todos os status" (valor `""`)
  - Cliente: `clientes.map(c => <SelectItem value={c.id}>)` + opção "Todos os clientes" (valor `""`)
  - Ao mudar seleção: `router.replace('/projetos?' + params.toString())` com `useTransition`
- Botão "Novo projeto" → `<Link href="/projetos/novo"><Button>Novo projeto</Button></Link>`
- Botão "Limpar filtros" visível quando `status || cliente` estiver definido
- Lista: `divide-y rounded-lg border` com cada linha exibindo:
  - Nome do projeto (link para `/projetos/[id]`)
  - Nome do cliente (texto simples)
  - Badge de status (`STATUS_LABELS[projeto.status]`)
  - Data de início (`toLocaleDateString('pt-BR')`)
- Estado vazio: `"Nenhum projeto encontrado."` centralizado

**Constante de labels de status** (definida no arquivo, exportável se necessário):
```ts
const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  ativo: 'Ativo',
  aguardando_cliente: 'Aguardando cliente',
  pausado: 'Pausado',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
}
```

---

### UI — `projetos/novo/page.tsx`

**Responsabilidade:** Server Component — busca clientes para o select de criação.

- Async Server Component simples:
  ```tsx
  export default async function NovoProjetoPage() {
    const clientes = await getClientesParaSelect()
    return <ProjetoForm clientes={clientes} />
  }
  ```
- Sem `loading.tsx` próprio — formulário não tem dados pesados

---

### UI — `projetos/novo/_components/projeto-form.tsx`

**Responsabilidade:** Client Component — formulário de criação de projeto, redireciona após sucesso.

- `'use client'`
- Props: `{ clientes: { id: string; nome: string }[] }`
- `useForm<ProjetoFormData>` com:
  ```tsx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(ProjetoFormSchema as any),
  defaultValues: {
    nome: '',
    cliente_id: '',
    descricao: '',
    status: 'rascunho',
  },
  ```
- **Campos do formulário:**
  - `nome` — `<Input>` via `register('nome')` — exibe erro se vazio
  - `cliente_id` — `<Controller>` + shadcn `<Select>` — exibe erro se não selecionado
  - `descricao` — `<Textarea>` via `register('descricao')` — opcional
  - `status` — `<Controller>` + shadcn `<Select>` com `STATUS_LABELS` — padrão `rascunho`
  - `data_inicio` — `<input type="date">` via `register('data_inicio')` — exibe erro se vazio
  - `previsao_entrega` — `<input type="date">` via:
    ```tsx
    register('previsao_entrega', { setValueAs: (v) => (v === '' ? undefined : v) })
    ```
    Converte string vazia em `undefined` (válido com `.optional()` do Zod) — opcional
  - `data_conclusao_real` — **não exibido** no formulário de criação
- `onSubmit`:
  ```tsx
  function onSubmit(data: ProjetoFormData) {
    startTransition(async () => {
      const result = await criarProjetoAction(data)
      if (result.success) {
        router.push('/projetos/' + result.projetoId)
      } else {
        toast.error(result.error)
      }
    })
  }
  ```
- Breadcrumb no topo: "Projetos > Novo projeto" com link em "Projetos"
- Botão submit: `"Criar projeto"` / `"Criando..."` com `disabled={isPending}`
- Layout: `max-w-2xl mx-auto space-y-6` — página de formulário simples, sem container de modal

---

### UI — `projetos/[id]/layout.tsx`

**Responsabilidade:** Server Component — carrega o projeto, exibe breadcrumb, título e delega tabs ao Client Component.

- Async Server Component com `params: Promise<{ id: string }>`
- Chama `getProjetoById(id)` — se `null`, chama `notFound()`
- Renderiza:
  1. Breadcrumb: `<Link href="/projetos">Projetos</Link> / {projeto.nome}`
  2. Título: `{projeto.nome}` + `<Badge>{STATUS_LABELS[projeto.status]}</Badge>`
  3. `<ProjetoTabs id={id} />` — Client Component para tabs com aba ativa
  4. `{children}` — conteúdo da aba atual

---

### UI — `projetos/[id]/_components/projeto-tabs.tsx`

**Responsabilidade:** Client Component — renderiza tabs com destaque da aba ativa.

- `'use client'`
- Props: `{ id: string }`
- Usa `usePathname()` para determinar qual aba está ativa
- Abas definidas:
  ```ts
  const tabs = [
    { label: 'Visão Geral', href: `/projetos/${id}` },
    { label: 'Fases', href: `/projetos/${id}/fases` },
    { label: 'Timeline', href: `/projetos/${id}/timeline` },
    { label: 'Horas', href: `/projetos/${id}/horas` },
  ]
  ```
- Aba ativa: `pathname === tab.href`
- Estilização: links com classes diferenciadas para ativo (`border-b-2 border-primary font-medium`) e inativo (`text-muted-foreground hover:text-foreground`)

---

### UI — `projetos/[id]/page.tsx`

**Responsabilidade:** Server Component — Visão Geral do projeto.

- Async Server Component com `params: Promise<{ id: string }>`
- Chama `getProjetoById(id)` e `getClientesParaSelect()` em paralelo
- `getProjetoById(id)` é deduplcado pelo `React.cache()` — não faz nova query ao banco
- **Não verifica null**: o `layout.tsx` já chamou `notFound()` se projeto inexistente
- Renderiza `<ProjetoDetalhe projeto={projeto} clientes={clientes} />`

---

### UI — `projetos/[id]/_components/projeto-detalhe.tsx`

**Responsabilidade:** Client Component — exibe dados do projeto, permite editar e excluir.

- `'use client'`
- Props:
  ```ts
  {
    projeto: ProjetoData    // campos do projeto + cliente aninhado
    clientes: { id: string; nome: string }[]
  }
  ```
- `ProjetoData` definido localmente com os campos retornados por `getProjetoById()`:
  ```ts
  type ProjetoData = {
    id: string; nome: string; cliente_id: string; descricao: string | null
    status: string; data_inicio: Date; previsao_entrega: Date | null
    data_conclusao_real: Date | null; fase_atual_id: string | null
    created_at: Date; updated_at: Date
    cliente: { id: string; nome: string }
    fases: { id: string; nome: string; status: string; ordem: number; is_fase_geral: boolean }[]
  }
  ```

**Exibição de dados:**
- Grade de campos: cliente (link para `/clientes/[id]`), status (badge), data_inicio, previsao_entrega, data_conclusao_real, descrição (se houver), created_at, updated_at
- Lista de fases do projeto (somente nomes e status, sem interação — interação é PRD-02c)

**Botão "Editar" → Dialog com form:**
- `useState(open)` para controle do Dialog
- Form com `ProjetoFormSchema as any` pré-preenchido com os dados atuais
- Campos: todos, incluindo `data_conclusao_real` (para fechar o projeto)
- Datas pré-preenchidas: converter `Date` para string `YYYY-MM-DD` nos `defaultValues`:
  ```ts
  data_inicio: projeto.data_inicio.toISOString().split('T')[0],
  previsao_entrega: projeto.previsao_entrega?.toISOString().split('T')[0] ?? '',
  data_conclusao_real: projeto.data_conclusao_real?.toISOString().split('T')[0] ?? '',
  ```
- `onSubmit`: chama `editarProjetoAction(projeto.id, data)` com `startTransition`
- Em sucesso: `toast.success('Projeto atualizado.')`, `setOpen(false)`
- Em erro: `toast.error(result.error)`

**Botão "Excluir" → AlertDialog:**
- Confirmação: "Tem certeza que deseja excluir `{projeto.nome}`? Todos os dados vinculados serão removidos permanentemente."
- Ao confirmar: chama `excluirProjetoAction(projeto.id)` com `startTransition`
- Em sucesso: `toast.success('Projeto excluído.')`, `router.push('/projetos')`
- Em erro: `toast.error(result.error)`

---

### UI — `projetos/[id]/error.tsx`

```tsx
'use client'

export default function ProjetoError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground mb-4">Ocorreu um erro ao carregar o projeto.</p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}
```

---

## Regras de negócio aplicáveis

Nenhuma regra nova neste PRD — R1 e R2 foram implementadas nas actions/services do PRD-02a.

| Ação | Comportamento |
|---|---|
| Criar projeto (UI → `criarProjetoAction`) | R1 acionada automaticamente: fase Geral criada em `$transaction` |
| Excluir projeto | Cascade → fases, tarefas, registros (Prisma `onDelete: Cascade`) |

---

## Critérios de aceitação

- [ ] Acessar `/projetos` exibe lista com nome, cliente, status e data de início
- [ ] Filtrar por status atualiza a lista via nova request ao servidor (sem reload manual)
- [ ] Filtrar por cliente atualiza a lista corretamente
- [ ] "Limpar filtros" aparece quando há filtro ativo e remove os parâmetros da URL
- [ ] Clicar "Novo projeto" navega para `/projetos/novo`
- [ ] Campo `nome` vazio impede submit com mensagem "Nome é obrigatório"
- [ ] `cliente_id` sem seleção impede submit com mensagem "Cliente inválido"
- [ ] Criar projeto com dados válidos redireciona para `/projetos/[id]` do projeto criado
- [ ] O projeto criado tem fase "Geral do projeto" com `is_fase_geral: true`, `ordem: 1` (verificar via Prisma Studio)
- [ ] Em `/projetos/[id]`, layout exibe breadcrumb "Projetos > {nome}" e as 4 abas
- [ ] Aba "Visão Geral" está destacada como ativa quando em `/projetos/[id]`
- [ ] Visão Geral exibe todos os campos do projeto e a lista de fases
- [ ] Botão "Editar" abre modal com campos pré-preenchidos (incluindo datas formatadas)
- [ ] Editar status e salvar → badge do projeto atualiza sem reload
- [ ] Botão "Excluir" exibe diálogo de confirmação antes de deletar
- [ ] Confirmar exclusão remove o projeto e redireciona para `/projetos`
- [ ] Acessar `/projetos/[id]` com UUID inexistente renderiza `not-found.tsx`
- [ ] `pnpm build` completa com zero erros de TypeScript

---

## Verificação

### Build
```bash
npx prisma generate && pnpm build
```

Zero erros de TypeScript é pré-requisito.

### Checklist manual

- [ ] **Criar projeto** em `/projetos/novo` → redireciona para `/projetos/[id]` com dados corretos
- [ ] **`npx prisma studio`** → projeto criado tem fase Geral (`is_fase_geral: true`, `ordem: 1`)
- [ ] **Filtrar por status=ativo** → lista mostra apenas projetos ativos
- [ ] **Editar status** de rascunho para ativo → badge na visão geral reflete a mudança
- [ ] **Excluir projeto** → confirmação exibida → projeto removido → redirect para `/projetos`
- [ ] **UUID inválido** em `/projetos/[id]` → página not-found renderiza corretamente
- [ ] **`pnpm dev`** → sem erros de hidratação no console do browser
