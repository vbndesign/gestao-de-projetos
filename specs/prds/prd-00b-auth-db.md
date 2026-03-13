# PRD-00b — Auth + DB

> **Depende de:** PRD-00a (Setup) — deve estar concluido antes de iniciar
> **Contexto:** Configura o Prisma schema com todas as 12 entidades do dominio, o singleton do Prisma, a autenticacao via Supabase Auth (`@supabase/ssr`), a protecao de rotas (`proxy.ts`) e o layout autenticado. Ao final, `pnpm build` passa, o banco esta pronto para receber dados e rotas internas redirecionam para login quando nao autenticado.

---

## Escopo

### Inclui
- Schema Prisma completo com todas as 12 entidades, enums, relacoes e cascatas
- `lib/db.ts` — Prisma singleton com `globalThis` + `server-only`
- `lib/supabase.ts` — factories de Supabase client (server e browser)
- `lib/auth.ts` — `requireAuth()` com `React.cache()`, exportado como `const`
- `src/proxy.ts` — protecao de rotas (verificacao otimista de cookie), exporta `proxy()`
- `app/auth/callback/route.ts` — Route Handler para troca de code OAuth
- `app/login/page.tsx` — pagina minima de login com OAuth (Google)
- `app/(internal)/layout.tsx` — layout autenticado com `requireAuth()` + `SessionProvider`
- `components/providers/session-provider.tsx` — Client Component com contexto de sessao
- `.env.local.example` — documentacao das variaveis de ambiente necessarias

### Nao inclui
- CRUD de nenhuma entidade (PRD-01+)
- Queries, Actions ou Services de dominio
- Schemas Zod para entidades
- Componentes de UI de dominio (formularios, listagens, cards)
- Deploy, `vercel.json`, configuracao de env vars em producao (PRD-09)
- Pagina de dashboard (apenas redirect apos login)
- Portal publico — layout e rotas (PRD-08a)

---

## Arquivos

### Criar

```
prisma/schema.prisma                           — schema completo com 12 entidades, enums e relacoes
src/lib/db.ts                                  — Prisma singleton com globalThis + server-only
src/lib/supabase.ts                            — factories de Supabase client (server e browser)
src/lib/auth.ts                                — requireAuth() com React.cache()
src/proxy.ts                                   — protecao de rotas (verificacao otimista de cookie)
src/app/auth/callback/route.ts                 — Route Handler para OAuth code exchange
src/app/login/page.tsx                         — pagina minima de login com OAuth Google
src/app/(internal)/layout.tsx                  — layout autenticado com requireAuth() + SessionProvider
src/app/(internal)/dashboard/page.tsx          — pagina placeholder do dashboard
src/components/providers/session-provider.tsx  — Client Component com contexto de sessao
.env.local.example                             — template das variaveis de ambiente
```

### Modificar

```
src/app/page.tsx                               — substituir placeholder por redirect para /dashboard
package.json                                   — adicionar dependencias: prisma, @prisma/client, @supabase/ssr, @supabase/supabase-js, server-only
```

---

## Especificacao

### Schema Prisma

Datasource e generator:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // pooling via pgbouncer (queries)
  directUrl = env("DIRECT_URL")         // conexao direta (migrations)
}

generator client {
  provider = "prisma-client-js"
}
```

#### Enums

```prisma
enum StatusProjeto {
  rascunho
  ativo
  aguardando_cliente
  pausado
  concluido
  arquivado
}

enum StatusFase {
  nao_iniciada
  em_andamento
  aguardando_cliente
  concluida
  pausada
  cancelada
}

enum StatusTarefa {
  nao_iniciada
  em_andamento
  concluida
  cancelada
}

enum StatusPendencia {
  aberta
  em_andamento
  resolvida
  cancelada
}

enum TipoEventoTimeline {
  projeto_criado
  fase_iniciada
  fase_concluida
  reuniao_registrada
  decisao_registrada
  checkpoint_registrado
  pendencia_criada
  pendencia_resolvida
  documento_publicado
  mudanca_direcao
  atualizacao_manual
}
```

#### Entidades

**Cliente**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| nome | String | |
| empresa_organizacao | String? | |
| email_principal | String? | |
| telefone_contato | String? | |
| observacoes | String? | `@db.Text` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes: `projetos Projeto[]`

---

**Projeto**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| cliente_id | String | `@db.Uuid` |
| nome | String | |
| descricao | String? | `@db.Text` |
| status | StatusProjeto | |
| data_inicio | DateTime | `@db.Date` |
| previsao_entrega | DateTime? | `@db.Date` |
| data_conclusao_real | DateTime? | `@db.Date` |
| fase_atual_id | String? | `@db.Uuid` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `cliente Cliente @relation(fields: [cliente_id], references: [id], onDelete: Cascade)`
- `fases Fase[]`
- `lancamentos_horas LancamentoHoras[]`
- `reunioes Reuniao[]`
- `decisoes Decisao[]`
- `checkpoints Checkpoint[]`
- `pendencias Pendencia[]`
- `documentos Documento[]`
- `mudancas_direcao MudancaDirecao[]`
- `eventos_timeline EventoTimeline[]`

Indices: `@@index([cliente_id])`

---

**Fase**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| nome | String | |
| descricao | String? | `@db.Text` |
| ordem | Int | |
| status | StatusFase | |
| data_inicio_prevista | DateTime? | `@db.Date` |
| data_fim_prevista | DateTime? | `@db.Date` |
| data_inicio_real | DateTime? | `@db.Date` |
| data_fim_real | DateTime? | `@db.Date` |
| is_fase_geral | Boolean | |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `tarefas TarefaPlanejada[]`
- `lancamentos_horas LancamentoHoras[]`
- `reunioes Reuniao[]` (onDelete da fase no registro: SetNull)
- `decisoes Decisao[]`
- `checkpoints Checkpoint[]`
- `pendencias Pendencia[]`
- `documentos Documento[]`
- `mudancas_direcao MudancaDirecao[]`
- `eventos_timeline EventoTimeline[]`

Indices: `@@index([projeto_id])`

---

**TarefaPlanejada**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| fase_id | String | `@db.Uuid` |
| titulo | String | |
| descricao | String? | `@db.Text` |
| tempo_estimado_horas | Decimal? | `@db.Decimal(8, 2)` |
| ordem | Int | |
| status | StatusTarefa | |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `fase Fase @relation(fields: [fase_id], references: [id], onDelete: Cascade)`

Indices: `@@index([fase_id])`

---

**LancamentoHoras**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String | `@db.Uuid` |
| data_lancamento | DateTime | `@db.Date` |
| descricao | String | `@db.Text` |
| horas_gastas | Decimal | `@db.Decimal(8, 2)` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase @relation(fields: [fase_id], references: [id], onDelete: Cascade)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`

---

**Reuniao**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| titulo | String | |
| data_reuniao | DateTime | `@db.Date` |
| participantes | String? | `@db.Text` |
| link_referencia | String? | |
| resumo_executivo | String? | `@db.Text` |
| ata_resumida | String? | `@db.Text` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`
- `decisoes Decisao[]`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`

---

**Decisao**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| reuniao_id | String? | `@db.Uuid` |
| titulo | String | |
| descricao | String | `@db.Text` |
| contexto | String? | `@db.Text` |
| impacto | String? | `@db.Text` |
| data_decisao | DateTime | `@db.Date` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`
- `reuniao Reuniao? @relation(fields: [reuniao_id], references: [id], onDelete: SetNull)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`, `@@index([reuniao_id])`

---

**Checkpoint**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| titulo | String | |
| resumo | String | `@db.Text` |
| proximos_passos | String? | `@db.Text` |
| data_checkpoint | DateTime | `@db.Date` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`

---

**Pendencia**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| titulo | String | |
| descricao | String? | `@db.Text` |
| status | StatusPendencia | |
| prazo | DateTime? | `@db.Date` |
| data_resolucao | DateTime? | `@db.Date` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`

---

**Documento**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| titulo | String | |
| descricao | String? | `@db.Text` |
| tipo_documento | String? | |
| url_arquivo_ou_link | String | |
| data_publicacao | DateTime? | `@db.Date` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`

---

**MudancaDirecao**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| titulo | String | |
| descricao | String | `@db.Text` |
| motivo | String? | `@db.Text` |
| impacto_em_prazo | String? | `@db.Text` |
| impacto_em_escopo | String? | `@db.Text` |
| data_mudanca | DateTime | `@db.Date` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`

---

**EventoTimeline**

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| projeto_id | String | `@db.Uuid` |
| fase_id | String? | `@db.Uuid` |
| tipo_evento | TipoEventoTimeline | |
| titulo | String | |
| descricao | String? | `@db.Text` |
| data_evento | DateTime | `@db.Date` |
| origem_tipo | String? | |
| origem_id | String? | `@db.Uuid` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

Relacoes:
- `projeto Projeto @relation(fields: [projeto_id], references: [id], onDelete: Cascade)`
- `fase Fase? @relation(fields: [fase_id], references: [id], onDelete: SetNull)`

Indices: `@@index([projeto_id])`, `@@index([fase_id])`, `@@index([origem_id])`

---

#### Convencao de nomes Prisma

Os nomes dos models usam **PascalCase** e os campos usam **snake_case** conforme definido no dominio. O Prisma gera os nomes TypeScript em camelCase automaticamente via `@map` se necessario, mas neste projeto os campos no banco seguem snake_case e o Prisma client os acessa diretamente (ex: `db.cliente.findMany()`, `fase.projeto_id`).

> **Nota:** Usar `@@map("nome_tabela")` nos models para garantir que as tabelas no PostgreSQL usem snake_case plural (ex: `@@map("clientes")`). Os campos ja usam snake_case e nao precisam de `@map`.

### Cascatas — resumo

| Acao | Comportamento |
|---|---|
| Deletar Cliente | Cascade → Projeto → tudo abaixo |
| Deletar Projeto | Cascade → Fase, registros operacionais, timeline |
| Deletar Fase | Cascade → TarefaPlanejada, LancamentoHoras |
| Deletar Fase (em registros) | SetNull → fase_id nos registros operacionais e timeline |
| Deletar Reuniao (em Decisao) | SetNull → reuniao_id |
| Deletar registros operacionais | Timeline events removidos via service (nao Prisma cascade) |

### Queries / Actions / Services

Nao aplicavel neste PRD — apenas infraestrutura (`lib/`).

### Configuracao de infraestrutura

#### `src/lib/db.ts` — Prisma singleton

- `import 'server-only'` no topo
- Singleton via `globalThis` para evitar multiplas instancias em dev (hot reload)
- Log de queries apenas em desenvolvimento
- Exporta `db` como `const`
- Prisma 5.22.x — sem driver adapters

Referencia de implementacao em `specs/foundation/04_nextjs.md`, secao `server-only`.

#### `src/lib/supabase.ts` — Supabase clients

Duas factories:

**`createServerSupabaseClient()`** — para uso em Server Components, Server Actions e Route Handlers:
- Usa `createServerClient` do `@supabase/ssr`
- Recebe cookies via `cookies()` do `next/headers`
- Implementa `getAll` e `setAll` no objeto cookies
- `setAll` precisa de try/catch pois Server Components nao podem setar cookies

**`createBrowserSupabaseClient()`** — para uso em Client Components:
- Usa `createBrowserClient` do `@supabase/ssr`
- Usa as variaveis `NEXT_PUBLIC_*` automaticamente

Ambas usam `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

#### `src/lib/auth.ts` — requireAuth()

- `import 'server-only'` no topo
- Usa `cache()` do React para deduplicacao no mesmo render pass
- Exportado como `const` (nao `function`)
- Cria Supabase server client internamente (nao reutiliza `lib/supabase.ts` — precisa de acesso direto ao `cookies()`)
- Chama `supabase.auth.getUser()` para validacao real
- Se nao autenticado: `redirect('/login')`
- Se autenticado: retorna `user`

#### `src/proxy.ts` — protecao de rotas

- Exporta funcao `proxy()` (nao `middleware()`)
- Verificacao otimista: checa existencia do cookie `sb-access-token`
- Rotas internas protegidas: `/dashboard`, `/projetos`, `/clientes`
- Se cookie ausente em rota interna: redireciona para `/login`
- `config.matcher` exclui `_next/static`, `_next/image`, `favicon.ico`, `sitemap.xml`, `robots.txt`
- Nao faz validacao real da sessao — isso e responsabilidade do layout e das actions

#### `src/app/auth/callback/route.ts` — OAuth callback

- Route Handler GET
- Extrai `code` dos searchParams
- Extrai `next` dos searchParams (default: `/dashboard`)
- Cria Supabase server client com `getAll` e `setAll` nos cookies
- Troca code por sessao via `supabase.auth.exchangeCodeForSession(code)`
- Sucesso: redireciona para `next`
- Falha ou sem code: redireciona para `/login?error=auth_callback_failed`

Referencia de implementacao em `specs/foundation/04_nextjs.md`, secao `Route Handler — Auth Callback`.

#### `src/app/login/page.tsx` — pagina de login

- Server Component (sem `'use client'`)
- UI minima: titulo, botao "Entrar com Google"
- O botao precisa de interatividade — extrair para um Client Component inline ou separado
- Ao clicar: chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback' } })`
- Exibe mensagem de erro se searchParam `error` estiver presente
- Nao precisa de formulario de email/senha no MVP

#### `src/app/(internal)/layout.tsx` — layout autenticado

- Server Component async
- Chama `await requireAuth()` para obter o user
- Envolve `{children}` com `<SessionProvider user={user}>`
- Layout thin — sem sidebar ou navegacao complexa neste PRD (sera adicionado em PRDs futuros)

#### `src/app/(internal)/dashboard/page.tsx` — placeholder

- Pagina simples indicando que o usuario esta autenticado
- Exibe o email do usuario (via SessionProvider ou props)
- Sera substituida pelo dashboard real em PRDs futuros

#### `src/components/providers/session-provider.tsx`

- `'use client'` no topo
- Cria `SessionContext` com `createContext`
- Exporta `SessionProvider` que recebe `user` e `children`
- Exporta hook `useSession()` que retorna o user do contexto
- Tipo do user: `User` do `@supabase/supabase-js`

#### `src/app/page.tsx` — modificacao

- Substituir conteudo placeholder por `redirect('/dashboard')`
- Import `redirect` de `next/navigation`

#### `.env.local.example`

Documentar todas as variaveis necessarias:

```env
# Supabase — PostgreSQL connection
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase — Auth
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"
```

### Dependencias a instalar

```bash
# Prisma
pnpm add @prisma/client
pnpm add -D prisma

# Supabase
pnpm add @supabase/ssr @supabase/supabase-js

# Server-only guard
pnpm add server-only
```

> **Versoes:** Prisma 5.22.x (nao 6.x ou 7.x). `@supabase/ssr` latest estavel. Conferir `specs/foundation/03_arquitetura.md` para versoes pinadas.

---

## Regras de negocio aplicaveis

Nenhuma regra de negocio de dominio (R1-R5) se aplica neste PRD de infraestrutura. As regras de cascata estao definidas no schema Prisma e serao exercitadas a partir do PRD-01.

---

## Criterios de aceitacao

- [ ] `npx prisma generate` executa sem erros e gera o Prisma Client
- [ ] `npx prisma migrate dev --name init` cria a migration inicial e aplica ao banco
- [ ] `npx prisma studio` abre e exibe todas as 12 tabelas com campos corretos
- [ ] `pnpm build` completa com zero erros de TypeScript
- [ ] Acessar `/dashboard` sem estar autenticado redireciona para `/login`
- [ ] Acessar `/login` exibe a pagina com o botao de login Google
- [ ] Apos login OAuth com Google, o callback redireciona para `/dashboard`
- [ ] A pagina `/dashboard` exibe o email do usuario autenticado
- [ ] Acessar `/` redireciona para `/dashboard`
- [ ] `proxy.ts` exporta `proxy()` (nao `middleware()`) e `config.matcher`
- [ ] `lib/db.ts` usa `server-only` e singleton via `globalThis`
- [ ] `lib/auth.ts` exporta `requireAuth` como `const` com `React.cache()`

---

## Verificacao

### Build
```bash
npx prisma generate && pnpm build
```
Zero erros de TypeScript e pre-requisito para declarar o PRD concluido.

### Checklist manual

> PRD de infraestrutura — verificacao focada em auth e schema.

- [ ] **`npx prisma studio`** → todas as 12 tabelas visiveis com campos e relacoes corretos
- [ ] **Acessar `/dashboard` sem sessao** → redirecionado para `/login`
- [ ] **Clicar "Entrar com Google" na pagina de login** → redirecionado para o fluxo OAuth do Google
- [ ] **Completar o fluxo OAuth** → redirecionado para `/dashboard` com email do usuario visivel
- [ ] **Acessar `/` autenticado** → redirecionado para `/dashboard`
- [ ] **Acessar `/login` autenticado** → (aceita-se ficar na pagina de login ou redirecionar para dashboard — nao e requisito bloquear)

Verificar estado do banco via `npx prisma studio` quando necessario.
