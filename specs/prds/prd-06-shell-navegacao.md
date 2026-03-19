# PRD-06 — Shell de Navegação Global

## Motivação

O painel interno não tem estrutura de navegação persistente. Todas as rotas protegidas são renderizadas full-width sem sidebar, sem indicação visual da seção ativa e sem forma clara de trocar entre módulos (Dashboard, Clientes, Projetos).

Este PRD define o **app shell do painel interno**: um sidebar fixo à esquerda com os itens de navegação principal, e uma área de conteúdo à direita que recebe as páginas existentes sem modificação.

---

## Design Reference

| Node Figma | Componente | URL |
|---|---|---|
| `3:111` | Tela completa — projetos/listagem | `node-id=3-111` |
| `4:1984` | Sidebar | `node-id=4-1984` |
| `120:792` | ContentPage | `node-id=120-792` |

Arquivo: `btH3ifcbrPgQ79elNeUPSt`

---

## Design Reference Analysis

### Estado atual vs. esperado

| Aspecto | Atual | Esperado |
|---|---|---|
| Layout | Full-width sem container lateral | Sidebar 320px + content flex-1 |
| Navegação global | Inexistente | Sidebar com itens e active state |
| Breadcrumbs | Presentes no PageHeader por rota | Mantidos — complementam a sidebar |
| Background canvas | Não aplicado no shell | `bg-ds-canvas` no container raiz |
| Logout | Inexistente na UI | Presente no bottom da sidebar |

### Notas sobre o Figma

- O padding da `contentPage` (`px-56 py-32`) já está implementado nos componentes de cada página (`ProjetosListagem`, `PageHeader`). O `<main>` do shell **não adiciona padding** — recebe os children sem modificação.
- O sidebar usa `justify-between` para separar os itens de navegação (top) dos itens de utilidade (bottom: Settings + Logout).
- O ícone do logo no Figma é da biblioteca Iconly/Bulk. Na implementação, usar lucide-react por consistência com o projeto.

---

## Inventário de componentes

### Criar

| Componente | Level | Localização | Tipo |
|---|---|---|---|
| `Sidebar` | 2 | `src/components/sidebar.tsx` | Client Component |
| `MenuItem` | interno | mesmo arquivo | — |
| `LogoutButton` | interno | mesmo arquivo | — |

### Modificar

| Arquivo | Mudança |
|---|---|
| `src/app/(internal)/layout.tsx` | Adicionar app shell com `<Sidebar>` + `<main>` |

---

## Especificação: Sidebar

### Estrutura

```
<aside> (w-320, bg-ds-surface, px-24, py-32, flex col, justify-between)
  ├── top
  │   ├── logo (ícone 56px + "Projetos" H5 semibold)
  │   └── nav (flex col, gap-16)
  │       ├── MenuItem: Dashboard
  │       ├── MenuItem: Clientes
  │       └── MenuItem: Projetos  ← active na tela de referência
  └── bottom (flex col, gap-16)
      ├── MenuItem: Settings
      └── LogoutButton
```

### Nav items

| Label | Rota | Active match |
|---|---|---|
| Dashboard | `/dashboard` | `pathname === '/dashboard'` |
| Clientes | `/clientes` | `pathname === '/clientes'` |
| Projetos | `/projetos` | `pathname.startsWith('/projetos')` |
| Settings | `/settings` | `pathname === '/settings'` |

### MenuItem — estados

| Estado | bg | text | rounded |
|---|---|---|---|
| default | `bg-ds-surface` | `text-ds-muted` | `rounded-md` |
| hover | `bg-ds-subtle` | `text-ds-muted` | `rounded-md` |
| active | `bg-ds-brand-500` | `text-white` | `rounded-md` |

Altura: `h-14` (56px). Padding interno: `px-4` (16px). Gap ícone/label: `gap-4` (16px).

### LogoutButton

- Renderiza como `<button>` (não `<Link>`)
- Texto: `"Logout"` em `text-[#CC5F5F]` (Action/Red — sem token DS formalizado ainda)
- Ação: `supabase.auth.signOut()` via `createClient()` de `@/lib/supabase-browser`
- Após signOut: `router.push('/login')`
- Ícone: `LogOut` de lucide-react

### Logo

- Ícone: `PieChart` de lucide-react (`size={56}`) — aproximação do Iconly/Bulk/Graph do Figma
- Texto: `"Projetos"`, tipografia H5 semibold (`text-ds-h5 font-semibold text-ds-heading`)
- Gap ícone/texto: `gap-2` (8px)

### Ícones (lucide-react)

| Item | Ícone |
|---|---|
| Logo | `PieChart` |
| Dashboard | `LayoutDashboard` |
| Clientes | `Users` |
| Projetos | `FolderOpen` |
| Settings | `Settings` |
| Logout | `LogOut` |

---

## Especificação: App Shell (`(internal)/layout.tsx`)

```tsx
<SessionProvider user={user}>
  <div className="flex h-screen bg-ds-canvas">
    <Sidebar />
    <main className="flex-1 min-h-0 overflow-y-auto">
      {children}
    </main>
  </div>
  <Toaster />
</SessionProvider>
```

- `min-h-0` necessário para o scroll funcionar dentro de um flex container com `h-screen`
- `Toaster` fora do `<main>` para não ser afetado pelo overflow

---

## Tokens DS

| Elemento | CSS Var | Utility Tailwind |
|---|---|---|
| Sidebar bg | `--ds-color-semantic-bg-surface` | `bg-ds-surface` |
| Canvas bg | `--ds-color-semantic-bg-canvas` | `bg-ds-canvas` |
| Hover bg | `--ds-color-semantic-bg-subtle` | `bg-ds-subtle` |
| Active bg | `--ds-color-primitive-brand-500` | `bg-ds-brand-500` |
| Default text | `--ds-color-semantic-text-muted` | `text-ds-muted` |
| Active text | — | `text-white` |
| Heading text | `--ds-color-semantic-text-heading` | `text-ds-heading` |
| Logo tipo | — | `text-ds-h5 font-semibold` |
| Logout text | `#CC5F5F` | literal — sem token DS formal |

> **Nota:** `#CC5F5F` (Action/Red) aparece no Figma como estilo `"Action/Red"`. Não há token DS formalizado para este valor. Usar literal por ora; formalizar em PRD de tokens de feedback quando necessário.

---

## Fluxo de implementação

Este PRD é **puramente visual** — não envolve queries, Server Actions, services ou Prisma.

```
Phase B: componentes semânticos
  → Sidebar (node 4:1984) — MenuItem, LogoutButton, logo
Phase C: composição de tela
  → (internal)/layout.tsx com app shell
Phase D: validação visual
  → Comparar contra node 3:111 (tela completa)
Phase E: Code Connect
  → Opcional, após estabilização visual
```

---

## Fora de escopo

- Responsividade / sidebar em mobile
- Sidebar colapsável
- Dark mode
- Página `/settings` (rota existe como link visual, sem implementação)
- Avatar / dados do usuário no sidebar
- Notificações
