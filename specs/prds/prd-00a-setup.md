# PRD-00a — Setup

> **Depende de:** nenhum — primeiro PRD da sequência
> **Contexto:** Inicializa o projeto Next.js com TypeScript, Tailwind, shadcn/ui e a estrutura de pastas definida na arquitetura. Ao final, `pnpm dev` roda e `pnpm build` passa sem erros.

---

## Escopo

### Inclui
- Inicialização do projeto Next.js 16 com TypeScript strict e App Router
- Configuração do Tailwind CSS
- Instalação e init do shadcn/ui
- Estrutura de pastas conforme `specs/foundation/03_arquitetura.md` (camadas vazias)
- `lib/utils.ts` com `cn()` (gerado pelo shadcn/ui init)
- Layout raiz (`app/layout.tsx`) com metadata base e fonte
- Página placeholder no `/` para validar que o app roda
- Configuração de path aliases (`@/`)

### Não inclui
- Prisma, banco de dados, variáveis de ambiente de banco (PRD-00b)
- Supabase Auth, `proxy.ts`, `requireAuth()` (PRD-00b)
- Layout `(internal)` autenticado e layout `(portal)` (PRD-00b)
- Deploy, `vercel.json`, configuração de env vars em produção (PRD posterior)
- Componentes de domínio, formulários, schemas Zod (PRDs seguintes)

---

## Arquivos

### Criar

```
src/app/layout.tsx                  — layout raiz com metadata, fonte, Tailwind globals
src/app/page.tsx                    — página placeholder "/" confirmando que o app funciona
src/app/globals.css                 — estilos base do Tailwind + variáveis CSS do shadcn
src/lib/utils.ts                    — cn() helper (gerado pelo shadcn init)
```

### Criar (pastas vazias com .gitkeep)

```
src/actions/.gitkeep
src/services/.gitkeep
src/queries/.gitkeep
src/types/schemas/.gitkeep
src/components/ui/.gitkeep          — será populado pelos componentes shadcn/ui
```

> **Nota:** `components/ui/` será preenchido à medida que componentes shadcn forem adicionados nos PRDs seguintes. O `shadcn init` já pode gerar componentes base — aceitar o que ele criar.

---

## Especificação

### Schema Prisma
Não aplicável neste PRD.

### Queries / Actions / Services
Não aplicável neste PRD.

### Configuração do projeto

#### Next.js
- O repositório git já existe com `specs/` e `CLAUDE.md` — **não criar uma subpasta nova**
- Inicializar o Next.js na raiz do repo: `npx create-next-app@latest . --yes --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --skip-install`
- **Atenção:** `create next-app` recusa executar em diretório com arquivos existentes. Workaround: criar em `/tmp/` e copiar os arquivos gerados para o repo, depois restaurar `specs/`, `CLAUDE.md` e `.gitignore`.
- O flag `--yes` evita prompts interativos; `--eslint` inclui ESLint sem prompt
- App Router habilitado (`src/app/`)
- TypeScript strict (`strict: true` no `tsconfig.json`)
- Usar `src/` directory
- Path alias `@/` apontando para `src/`
- Import alias configurado no `tsconfig.json`

#### Tailwind CSS
- Versão 4.x — instalada pelo `create next-app` com Next.js 16
- `globals.css` com a diretiva `@import "tailwindcss"` (sintaxe Tailwind v4 — não usar `@tailwind base/components/utilities` que é v3)

#### shadcn/ui
- Executar `npx shadcn@latest init --defaults` (**não** usar `pnpm dlx` — não funciona neste ambiente)
- O flag `--defaults` usa preset `base-nova` com base neutral e CSS variables — equivalente ao antigo "New York"
- shadcn v4 não aceita `--style` nem `--base-color` — usar `--defaults`
- CSS variables: habilitadas por padrão
- Path aliases configurados para `@/components`, `@/lib/utils`
- O init gera `lib/utils.ts` com `cn()` e configura `components.json`
- Adicionar componentes futuros: `npx shadcn@latest add [componente]`
- **Nota:** shadcn não é um pacote npm — o CLI copia os componentes para o projeto. As dependências (`@base-ui/react`, `clsx`, `tailwind-merge`, `lucide-react`, etc.) são instaladas pelo próprio init. O `shadcn@latest` (v4) trabalha com Tailwind v4.

#### ESLint
- Usar a configuração padrão do Next.js (`eslint-config-next`)
- Sem customizações adicionais neste PRD

### UI — Layout raiz

**`src/app/layout.tsx`**
- `<html lang="pt-BR">`
- Font: Inter (do `next/font/google`) com `variable: "--font-sans"` — **não** usar `.className` direto, pois o shadcn v4 configura `--font-sans` no `@theme inline` do `globals.css`
- Manter Geist_Mono para `--font-geist-mono` (referenciado no globals.css do shadcn)
- Aplica `${inter.variable} ${geistMono.variable} antialiased` no `<body>`
- Metadata base: `title` (default) e `description`

**`src/app/page.tsx`**
- Página simples com texto indicando que o setup está funcionando
- Serve apenas para validar o build e o dev server
- Será substituída por redirect ao dashboard no PRD-00b

---

## Regras de negócio aplicáveis

Nenhuma regra de negócio se aplica neste PRD de infraestrutura.

---

## Critérios de aceitação

- [x] `pnpm dev` inicia o servidor local sem erros
- [x] `pnpm build` completa com zero erros de TypeScript
- [x] Acessar `http://localhost:3000` exibe a página placeholder
- [x] Diretório `src/` segue a estrutura de camadas: `app/`, `components/ui/`, `actions/`, `services/`, `queries/`, `lib/`, `types/schemas/`
- [x] `@/` resolve imports corretamente (ex: `import { cn } from "@/lib/utils"`)
- [x] `components.json` do shadcn/ui existe e está configurado
- [x] Tailwind CSS funciona (classes utilitárias aplicam estilos na página placeholder)
- [x] TypeScript está em modo strict

---

## Verificação

### Build
```bash
pnpm build
```
Zero erros de TypeScript é pré-requisito para declarar o PRD concluído.

### Checklist manual

> PRD de setup — verificação leve, sem regras de negócio.

- [x] `pnpm dev` → servidor inicia, página abre em `localhost:3000`
- [x] Página placeholder renderiza com estilos Tailwind aplicados
- [x] Estrutura de pastas `src/` contém todas as camadas previstas
