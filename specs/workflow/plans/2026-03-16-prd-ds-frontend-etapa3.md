# Design System Etapa 3 — Completar Migração de Clientes

## Overview

Completar os 30% restantes da Etapa 3 do Design System: mover `ProjectSummaryCard` para `src/components/`, criar o `DataRow` genérico, e migrar as duas páginas de Clientes (`ClientesListagem` e `ClienteDetalhe`) para usar os componentes DS com tokens CSS.

---

## Current State Analysis

**O que já existe:**
- 273 CSS vars geradas em `src/app/design-system-tokens.css` (nunca editar)
- `PageHeader` (`src/components/page-header.tsx`) — usado em Projetos
- `PageTabs` (`src/components/page-tabs.tsx`) — usado em Projetos
- `Button` com variantes DS (`src/components/ui/button.tsx`)
- `Badge` com 7 variantes DS (`src/components/ui/badge.tsx`)
- `DataRowProjects` (`src/app/(internal)/projetos/_components/data-row-projects.tsx`) — específico de projetos
- `ProjectSummaryCard` (`src/app/(internal)/projetos/_components/project-summary-card.tsx`) — **será movido**

**O que falta:**
- `DataRow` genérico (`src/components/data-row.tsx`) — não existe
- `ClientesListagem` — usa classes shadcn (`text-muted-foreground` 2x, `text-primary`, `font-medium`), zero DS tokens
- `ClienteDetalhe` — usa classes shadcn (`text-muted-foreground` 9x, `text-foreground`, `text-primary`), zero DS tokens

**Constraint crítico:**
- `ProjectSummaryCard` atualmente em `projetos/_components/` — importado apenas em `projetos/[id]/_components/projeto-detalhe.tsx:14`
- Para ser reutilizado em `ClienteDetalhe` sem cross-feature coupling, deve ser movido para `src/components/`

---

## Desired End State

Após este plano:

- `src/components/data-row.tsx` existe e exporta `DataRow`
- `src/components/project-summary-card.tsx` existe (movido de `projetos/_components/`)
- `clientes-listagem.tsx` usa `PageHeader` + `DataRow`, zero classes shadcn de cor/tipografia
- `cliente-detalhe.tsx` usa `PageHeader` + `ProjectSummaryCard` + `DataRow`, zero classes shadcn de cor/tipografia
- `pnpm build` passa sem erros de tipo

**Verificação:**
```bash
grep -r "text-muted-foreground\|text-foreground\|text-primary\|font-medium\|font-semibold" \
  src/app/(internal)/clientes/
# deve retornar zero resultados nos _components migrados
```

---

## Key Discoveries

- `DataRowProjects` (`data-row-projects.tsx:21-53`) é o template exato para o `DataRow` genérico — mesmos tokens, mesma estrutura, apenas props genéricas
- Tokens usados: `--ds-color-component-data-row-{default|hover}-{bg|border|title}` (6 vars)
- `ProjectSummaryCard` tem apenas 1 consumidor atual: `projetos/[id]/_components/projeto-detalhe.tsx:14`
- `ClientesListagem` é `"use client"` (search + transitions) — `DataRow` e `PageHeader` são Server Components sem `"use server"`, compatíveis
- `ClienteDetalhe` é `"use client"` (router + transitions para delete) — mesma compatibilidade
- `empresa_organizacao` aparecia como subtítulo no header de `ClienteDetalhe` — decisão: mostrar apenas no `ProjectSummaryCard` como campo "Empresa", não duplicar no header
- Heading de seção "Projetos" dentro de `ClienteDetalhe`: usar DS typography tokens (`text-ds-lg` + `font-semibold` + `text-ds-heading`)
- Queries suficientes: `getClientes()` e `getClienteById()` retornam todos os campos necessários, sem alterações

---

## What We're NOT Doing

- **Refatorar `DataRowProjects`** para usar o `DataRow` genérico — decisão de migração posterior, não bloqueia Etapa 3
- **Adicionar prop `subtitle` ao `PageHeader`** — a empresa do cliente será exibida apenas no `ProjectSummaryCard`
- **Atualizar queries** — `getClientes()` e `getClienteById()` já retornam os dados necessários
- **Etapa 4 (Figma MCP)** — validação contra Figma é etapa separada, aguarda URL do file
- **Etapa 5 (Code Connect)** — mapeamentos Figma ↔ código são etapa separada
- **Etapa 6 (Spacing Tokens)** — não bloqueia esta etapa

---

## Implementation Approach

Fases na ordem de dependência: primeiro mover `ProjectSummaryCard` (sem o qual `ClienteDetalhe` não pode ser migrado), depois criar `DataRow` (sem o qual ambas as páginas não podem ser migradas), depois migrar as páginas, finalmente validar.

---

## Phase 1: Mover ProjectSummaryCard para src/components/

### Overview

`ProjectSummaryCard` é reutilizável por design mas está em `projetos/_components/`, criando coupling entre módulos. Mover para `src/components/` e atualizar o único import existente.

### Changes Required:

#### 1. Mover o arquivo

**Arquivo destino**: `src/components/project-summary-card.tsx`

Conteúdo idêntico ao atual (`src/app/(internal)/projetos/_components/project-summary-card.tsx`). Nenhuma alteração no código do componente.

#### 2. Atualizar import em projeto-detalhe.tsx

**Arquivo**: `src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx`

**Mudança** (linha 14):
```tsx
// antes
import { ProjectSummaryCard } from '../../_components/project-summary-card'

// depois
import { ProjectSummaryCard } from '@/components/project-summary-card'
```

#### 3. Remover arquivo original

Apagar `src/app/(internal)/projetos/_components/project-summary-card.tsx`.

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` passa sem erros de tipo ou módulo

#### Manual Verification:
- [ ] Página `/projetos/[id]` ainda exibe `ProjectSummaryCard` corretamente

---

## Phase 2: Criar DataRow Genérico

### Overview

Criar o componente base reutilizável `DataRow` com composição por props. Padrão copiado de `DataRowProjects`, mas com `href`, `title`, `metadata` e `trailing` como interface genérica.

### Changes Required:

#### 1. Criar src/components/data-row.tsx

**Arquivo**: `src/components/data-row.tsx`

```tsx
import Link from "next/link"
import { cn } from "@/lib/utils"

type DataRowProps = {
  href: string
  title: string
  metadata?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}

export function DataRow({
  href,
  title,
  metadata,
  trailing,
  className,
}: DataRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 border-b px-4 py-3 transition-colors",
        "border-[var(--ds-color-component-data-row-default-border)]",
        "bg-[var(--ds-color-component-data-row-default-bg)]",
        "hover:border-[var(--ds-color-component-data-row-hover-border)]",
        "hover:bg-[var(--ds-color-component-data-row-hover-bg)]",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className={cn(
            "text-[length:var(--ds-typography-size-base)] font-medium leading-[var(--ds-typography-line-height-base)]",
            "text-[var(--ds-color-component-data-row-default-title)]",
            "group-hover:text-[var(--ds-color-component-data-row-hover-title)]",
          )}
        >
          {title}
        </Link>
        {metadata && (
          <div className="flex gap-3 text-[length:var(--ds-typography-size-sm)] leading-[var(--ds-typography-line-height-sm)] text-ds-muted">
            {metadata}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` passa sem erros de tipo

---

## Phase 3: Migrar ClientesListagem

### Overview

Substituir o header manual e as rows manuais por `PageHeader` + `DataRow`. Manter lógica de busca, filtro, e botões de ação (editar/excluir) intactos.

### Changes Required:

#### 1. Atualizar clientes-listagem.tsx

**Arquivo**: `src/app/(internal)/clientes/_components/clientes-listagem.tsx`

**Imports a adicionar:**
```tsx
import { PageHeader } from '@/components/page-header'
import { DataRow } from '@/components/data-row'
```

**Substituições:**

1. **Header** (linhas 70-73) — substituir `<div>` com `<h1>` + `<ClienteFormModal>` por `PageHeader`:
```tsx
// antes
<div className="flex items-center justify-between gap-4">
  <h1 className="text-2xl font-semibold">Clientes</h1>
  <ClienteFormModal trigger={<Button>Novo cliente</Button>} />
</div>

// depois
<PageHeader
  title="Clientes"
  actions={<ClienteFormModal trigger={<Button variant="filled-brand">Novo cliente</Button>} />}
/>
```

2. **Empty state** (linha 83) — substituir `text-muted-foreground` por `text-ds-muted`:
```tsx
// antes
<p className="text-muted-foreground py-8 text-center">

// depois
<p className="py-8 text-center text-ds-muted">
```

3. **Container da lista** (linha 87) — atualizar borda para token DS:
```tsx
// antes
<div className="divide-y rounded-lg border">

// depois
<div className="overflow-hidden rounded-lg border border-[var(--ds-color-component-data-row-default-border)]">
```

4. **Rows** (linhas 88-148) — substituir cada `<div>` manual por `<DataRow>`:
```tsx
// antes
<div key={cliente.id} className="flex items-center justify-between gap-4 px-4 py-3">
  <div className="min-w-0 flex-1">
    <Link href={`/clientes/${cliente.id}`} className="font-medium text-primary hover:underline">
      {cliente.nome}
    </Link>
    <div className="flex gap-3 text-sm text-muted-foreground">
      {cliente.empresa_organizacao && <span>{cliente.empresa_organizacao}</span>}
      {cliente.email_principal && <span>{cliente.email_principal}</span>}
    </div>
  </div>
  <div className="flex items-center gap-1">
    <ClienteFormModal ... />
    <AlertDialog>...</AlertDialog>
  </div>
</div>

// depois
<DataRow
  key={cliente.id}
  href={`/clientes/${cliente.id}`}
  title={cliente.nome}
  metadata={
    <>
      {cliente.empresa_organizacao && <span>{cliente.empresa_organizacao}</span>}
      {cliente.email_principal && <span>{cliente.email_principal}</span>}
    </>
  }
  trailing={
    <div className="flex items-center gap-1">
      <ClienteFormModal
        cliente={{ ...cliente, telefone_contato: null, observacoes: null }}
        trigger={<Button variant="ghost" size="sm">Editar</Button>}
      />
      <AlertDialog>
        <AlertDialogTrigger render={
          <Button variant="destructive" size="sm" disabled={isPending}>
            Excluir
          </Button>
        } />
        ...
      </AlertDialog>
    </div>
  }
/>
```

**Nota:** o `key` prop vai no `DataRow`, não no `<div>` interno que o `DataRow` renderiza. Isso é correto — o `key` pertence ao elemento do map.

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` passa sem erros de tipo

#### Manual Verification:
- [ ] Lista de clientes renderiza com hover states no DataRow
- [ ] Busca por nome/empresa funciona (filtro client-side)
- [ ] Botões Editar e Excluir funcionam por linha
- [ ] Link para `/clientes/[id]` funciona
- [ ] Empty state exibe texto correto

---

## Phase 4: Migrar ClienteDetalhe

### Overview

Substituir breadcrumb manual + header + info grid + lista de projetos pelos componentes DS. Ações de editar/excluir migram para o `actions` slot do `PageHeader`.

### Changes Required:

#### 1. Atualizar cliente-detalhe.tsx

**Arquivo**: `src/app/(internal)/clientes/_components/cliente-detalhe.tsx`

**Imports a adicionar:**
```tsx
import { PageHeader } from '@/components/page-header'
import { ProjectSummaryCard } from '@/components/project-summary-card'
import { DataRow } from '@/components/data-row'
```

**Imports a remover:**
```tsx
import Link from 'next/link'  // remover se não for mais usado
```

**Substituições:**

1. **Breadcrumb + Header** (linhas 64-112) — substituir bloco inteiro por `PageHeader`:
```tsx
// antes: <nav> manual (l.65-72) + <div> header (l.74-112) separados

// depois: único PageHeader com breadcrumbs + actions
<PageHeader
  title={cliente.nome}
  breadcrumbs={[
    { label: 'Clientes', href: '/clientes' },
    { label: cliente.nome },
  ]}
  actions={
    <div className="flex items-center gap-2">
      <ClienteFormModal
        cliente={cliente}
        trigger={<Button variant="outline">Editar</Button>}
      />
      <AlertDialog>
        <AlertDialogTrigger render={
          <Button variant="destructive" disabled={isPending}>
            Excluir
          </Button>
        } />
        <AlertDialogContent>
          ...conteúdo idêntico ao atual...
        </AlertDialogContent>
      </AlertDialog>
    </div>
  }
/>
```

2. **Info grid** (linhas 114-142) — substituir por `ProjectSummaryCard`:
```tsx
// antes: <div className="grid gap-4 sm:grid-cols-2"> com labels manuais

// depois:
<ProjectSummaryCard
  fields={[
    ...(cliente.empresa_organizacao
      ? [{ label: 'Empresa', value: cliente.empresa_organizacao }]
      : []),
    ...(cliente.email_principal
      ? [{ label: 'Email', value: cliente.email_principal }]
      : []),
    ...(cliente.telefone_contato
      ? [{ label: 'Telefone', value: cliente.telefone_contato }]
      : []),
    ...(cliente.observacoes
      ? [{ label: 'Observações', value: cliente.observacoes, colSpan: 2 as const }]
      : []),
    { label: 'Criado em', value: new Date(cliente.created_at).toLocaleDateString('pt-BR') },
    { label: 'Atualizado em', value: new Date(cliente.updated_at).toLocaleDateString('pt-BR') },
  ]}
/>
```

3. **Seção de Projetos** (linhas 144-169) — atualizar heading + container + rows:
```tsx
// antes:
<div className="space-y-4">
  <h2 className="text-lg font-semibold">Projetos</h2>
  ...
  <div className="divide-y rounded-lg border">
    {projetos.map((projeto) => (
      <div key={projeto.id} className="flex items-center justify-between px-4 py-3">
        <div>
          <Link href={`/projetos/${projeto.id}`} className="font-medium text-primary hover:underline">
            {projeto.nome}
          </Link>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>{projeto.status}</span>
            <span>{new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

// depois:
<div className="space-y-4">
  <h2 className="text-[length:var(--ds-typography-size-lg)] font-semibold leading-[var(--ds-typography-line-height-lg)] text-ds-heading">
    Projetos
  </h2>
  {projetos.length === 0 ? (
    <p className="py-8 text-center text-ds-muted">Nenhum projeto vinculado.</p>
  ) : (
    <div className="overflow-hidden rounded-lg border border-[var(--ds-color-component-data-row-default-border)]">
      {projetos.map((projeto) => (
        <DataRow
          key={projeto.id}
          href={`/projetos/${projeto.id}`}
          title={projeto.nome}
          metadata={
            <>
              <span>{projeto.status}</span>
              <span>{new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</span>
            </>
          }
        />
      ))}
    </div>
  )}
</div>
```

**Nota:** `Link` import pode ser removido se não houver mais usos diretos após a migração.

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` passa sem erros de tipo

#### Manual Verification:
- [ ] Breadcrumb "Clientes / [nome]" renderiza com hover no link
- [ ] `ProjectSummaryCard` exibe campos condicionais (empresa, email, telefone, observações, datas)
- [ ] Campos opcionais ausentes não exibem linha vazia
- [ ] Lista de projetos do cliente renderiza com hover states
- [ ] Botão Editar abre modal com dados do cliente
- [ ] Botão Excluir exibe AlertDialog, exclui e redireciona para `/clientes`

---

## Phase 5: Validação Final

### Overview

Confirmar que zero classes shadcn de cor/tipografia restam nos componentes migrados, e que o build continua passando.

### Success Criteria:

#### Automated Verification:
- [x] Zero ocorrências de classes shadcn nos componentes migrados:
  ```bash
  grep -n "text-muted-foreground\|text-foreground\|text-primary\|font-medium\|font-semibold" \
    src/app/(internal)/clientes/_components/clientes-listagem.tsx \
    src/app/(internal)/clientes/_components/cliente-detalhe.tsx
  ```
  (nota: `font-semibold` em `cliente-detalhe.tsx:127` é intencional — usado com tokens DS para o heading "Projetos", sem equivalente Tailwind no DS)
- [x] `pnpm build` passa sem erros

#### Manual Verification:
- [ ] `/clientes` — layout visual consistente com `/projetos`
- [ ] `/clientes/[id]` — layout visual consistente com `/projetos/[id]`
- [ ] Hover states funcionam em DataRow nas duas páginas
- [ ] Ações (editar/excluir) funcionam em ambas as páginas

---

## Testing Strategy

### Manual Testing Steps:
1. Acessar `/clientes` — verificar header, lista, busca, empty state
2. Clicar em um cliente — verificar que link funciona
3. Em `/clientes/[id]` — verificar breadcrumb, SummaryCard, lista de projetos
4. Testar editar cliente em ambas as páginas
5. Testar excluir cliente (com projetos vinculados para verificar cascade)
6. Acessar `/projetos/[id]` e verificar que `ProjectSummaryCard` ainda funciona após a mudança de localização

---

## References

- PRD: `specs/prds/prd-ds-frontend-implementation.md`
- Research: `specs/workflow/research/2026-03-16-prd-ds-frontend-implementation.md`
- Padrão DataRow: `src/app/(internal)/projetos/_components/data-row-projects.tsx`
- Padrão PageHeader: `src/components/page-header.tsx`
- Padrão migração completa: `src/app/(internal)/projetos/_components/projetos-listagem.tsx`
- Tokens disponíveis: `src/app/design-system-tokens.css`
