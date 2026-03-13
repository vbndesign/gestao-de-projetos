# 05 — URL Map

Mapa completo de rotas. Define URLs, acesso, parâmetros e arquivos Next.js correspondentes.

| Símbolo | Significado |
|---|---|
| `[id]` | Segmento dinâmico — UUID do registro |
| `[slug]` | Segmento dinâmico — identificador público |
| `?param` | Query string opcional |
| 🔒 | Requer autenticação |
| 🌐 | Público |
| 📄 | `loading.tsx` obrigatório |

---

## Visão geral

```
/                        → redirect via proxy.ts
├── login/               🌐
├── dashboard/           🔒 📄
├── clientes/            🔒 📄
│   └── [id]/            🔒 📄
├── projetos/            🔒 📄
│   ├── novo/            🔒
│   └── [id]/            🔒 📄
│       ├── fases/       🔒 📄
│       ├── timeline/    🔒 📄
│       └── horas/       🔒 📄
└── p/[slug]/            🌐 📄
```

---

## `/` — Raiz

- Comportamento: redirect via `proxy.ts` — autenticado → `/dashboard`, anônimo → `/login`
- Sem `page.tsx`

```ts
// proxy.ts
if (pathname === '/') {
  const session = request.cookies.get('sb-access-token')
  return NextResponse.redirect(new URL(session ? '/dashboard' : '/login', request.url))
}
```

---

## `/login`

| Campo | Valor |
|---|---|
| Acesso | 🌐 Público |
| Arquivo | `app/(auth)/login/page.tsx` |
| Route group | `(auth)` — sem layout do painel interno |
| Redirect após login | `/dashboard` |

---

## Painel Interno `(internal)` 🔒

Todas as rotas abaixo exigem autenticação. `proxy.ts` verifica cookie; `app/(internal)/layout.tsx` confirma sessão real.

### `/dashboard`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/dashboard/page.tsx` |
| Loading | `app/(internal)/dashboard/loading.tsx` 📄 |
| Dados | `getProjetosAtivos()`, `getPendenciasAbertas()` |

---

### `/clientes`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/clientes/page.tsx` |
| Loading | `app/(internal)/clientes/loading.tsx` 📄 |
| Query string | `?busca=termo` — filtro client-side via `useSearchParams` |
| Criação | Modal — usuário permanece na listagem |
| Dados | `getClientes()` |

---

### `/clientes/[id]`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/clientes/[id]/page.tsx` |
| Loading | `app/(internal)/clientes/[id]/loading.tsx` 📄 |
| Not found | `app/(internal)/clientes/[id]/not-found.tsx` |
| Parâmetro | `id` — UUID do cliente |
| Dados | `getClienteById(id)`, `getProjetosDoCliente(id)` |
| Breadcrumb | Clientes > {cliente.nome} |

---

### `/projetos`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/projetos/page.tsx` |
| Loading | `app/(internal)/projetos/loading.tsx` 📄 |
| Query string | `?status=ativo&cliente=id` — filtros server-side via `searchParams` |
| Criação | Página dedicada `/projetos/novo` |
| Dados | `getProjetosFiltrados({ status, clienteId })` |

---

### `/projetos/novo`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/projetos/novo/page.tsx` |
| Loading | Não necessário |
| Redirect após criação | `/projetos/[id]` do projeto criado |
| Dados | `getClientes()` — para o select de cliente |
| Breadcrumb | Projetos > Novo projeto |

> Página dedicada (não modal) porque o formulário é complexo, tem URL compartilhável e o browser back funciona naturalmente.

---

### `/projetos/[id]`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/projetos/[id]/page.tsx` |
| Layout | `app/(internal)/projetos/[id]/layout.tsx` — carrega projeto, renderiza nav por abas |
| Loading | `app/(internal)/projetos/[id]/loading.tsx` 📄 |
| Error | `app/(internal)/projetos/[id]/error.tsx` |
| Not found | `app/(internal)/projetos/[id]/not-found.tsx` |
| Dados | `getProjetoById(id)`, `getTimelineInterna(id)` |
| Breadcrumb | Projetos > {projeto.nome} |

**Abas do layout:**
```
/projetos/[id]           → Visão Geral
/projetos/[id]/fases     → Fases
/projetos/[id]/timeline  → Timeline
/projetos/[id]/horas     → Horas
```

O layout carrega dados do projeto uma vez (via `React.cache()`) e disponibiliza para todas as sub-rotas.

---

### `/projetos/[id]/fases`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/projetos/[id]/fases/page.tsx` |
| Loading | `app/(internal)/projetos/[id]/fases/loading.tsx` 📄 |
| Dados | `getFasesByProjeto(id)` com tarefas aninhadas |
| Criação de fase | Modal |
| Criação de tarefa | Modal dentro da fase |
| Reordenação | `@dnd-kit` — drag and drop, batch update de `ordem` |

---

### `/projetos/[id]/timeline`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/projetos/[id]/timeline/page.tsx` |
| Loading | `app/(internal)/projetos/[id]/timeline/loading.tsx` 📄 |
| Dados | `getTimelineInterna(id)` — ordenada por `data_evento`, desempate `created_at` |
| Criação de registros | Modais por tipo: reunião, decisão, checkpoint, pendência, documento, mudança de direção |

---

### `/projetos/[id]/horas`

| Campo | Valor |
|---|---|
| Arquivo | `app/(internal)/projetos/[id]/horas/page.tsx` |
| Loading | `app/(internal)/projetos/[id]/horas/loading.tsx` 📄 |
| Dados | `getTotalHorasPorFase(id)`, `getTotalHorasPorProjeto(id)` |
| Criação | Modal — data, fase, descrição, horas |
| Restrição | **Nunca acessível no portal** (R4) |

---

## Portal do Cliente `(portal)` 🌐

Acesso público por slug. Sem autenticação. Filtro de dados nas queries, não nos componentes.

### `/p/[slug]`

| Campo | Valor |
|---|---|
| Arquivo | `app/(portal)/p/[slug]/page.tsx` |
| Loading | `app/(portal)/p/[slug]/loading.tsx` 📄 |
| Not found | `app/(portal)/p/[slug]/not-found.tsx` |
| Componentes | `app/(portal)/p/[slug]/_components/` |
| Parâmetro | `slug` — campo no banco, gerado do nome do projeto com sufixo único |
| Dados | `getProjetoParaPortal(slug)` — nunca retorna horas ou dados internos |

**O portal exibe:** nome, status, fases (exceto fase Geral), tarefas por fase, timeline filtrada, documentos.
**O portal nunca exibe:** lançamentos de horas, dados operacionais internos, dados de sessão.

---

## Mapa de navegação — fluxos principais

```
Criação de projeto
/projetos → [Novo Projeto] → /projetos/novo → submit → /projetos/[id]

Gestão de fases
/projetos/[id] → [aba Fases] → /projetos/[id]/fases
  ├── [Nova Fase] → modal
  ├── drag and drop → reordenação
  └── [Nova Tarefa] → modal dentro da fase

Registro operacional
/projetos/[id]/timeline → [Registrar] → modal por tipo
  → salva → revalida → modal fecha → lista atualizada

Portal
cliente recebe: https://app.com/p/[slug] → acessa sem login
```

---

## Relação rotas × arquivos

```
app/
├── (auth)/login/page.tsx                              → /login
├── (internal)/
│   ├── layout.tsx                                     → shell + requireAuth()
│   ├── dashboard/page.tsx                             → /dashboard
│   ├── dashboard/loading.tsx
│   ├── clientes/page.tsx                              → /clientes
│   ├── clientes/loading.tsx
│   ├── clientes/[id]/page.tsx                        → /clientes/[id]
│   ├── clientes/[id]/loading.tsx
│   ├── clientes/[id]/not-found.tsx
│   ├── projetos/page.tsx                              → /projetos
│   ├── projetos/loading.tsx
│   ├── projetos/novo/page.tsx                         → /projetos/novo
│   └── projetos/[id]/
│       ├── layout.tsx                                 → shell do projeto + nav abas
│       ├── page.tsx                                   → /projetos/[id]
│       ├── loading.tsx
│       ├── error.tsx
│       ├── not-found.tsx
│       ├── fases/page.tsx                             → /projetos/[id]/fases
│       ├── fases/loading.tsx
│       ├── timeline/page.tsx                          → /projetos/[id]/timeline
│       ├── timeline/loading.tsx
│       ├── horas/page.tsx                             → /projetos/[id]/horas
│       └── horas/loading.tsx
└── (portal)/p/[slug]/
    ├── page.tsx                                       → /p/[slug]
    ├── loading.tsx
    ├── not-found.tsx
    └── _components/
        ├── projeto-portal-header.tsx
        ├── fases-portal.tsx
        └── timeline-portal.tsx
```

---

## Decisões registradas

| Decisão | Motivo |
|---|---|
| `/` redireciona via `proxy.ts` | Redirect antes do render — sem custo de Server Component |
| `/login` em route group `(auth)` | Isola layout de autenticação do layout do painel |
| `/projetos/novo` como página | Formulário complexo, URL compartilhável, browser back funciona |
| Fases/tarefas/registros como modais | Criação dentro do contexto do projeto — sem perda de localização |
| `/p/[slug]` para o portal | Curto, legível, claramente separado das rotas internas |
| `loading.tsx` obrigatório em rotas dinâmicas | Sem skeleton bloqueia navegação — sem feedback visual |
