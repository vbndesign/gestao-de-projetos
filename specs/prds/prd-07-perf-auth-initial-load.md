# PRD-07 — Perf: Streaming do Layout Interno (Initial Load)

## Problema

O layout interno (`src/app/(internal)/layout.tsx`) bloqueia a renderização de todas as páginas internas porque executa `requireAuth()` de forma síncrona antes de renderizar qualquer conteúdo. Isso cria um waterfall:

```
request → requireAuth() (aguarda Supabase) → renderiza shell → renderiza página
```

Em dev-mode, a compilação sob demanda amplifica o problema, mas o waterfall existe também em produção.

Além disso, `dashboard/page.tsx` chama `requireAuth()` novamente de forma redundante — o layout já garantiu a autenticação.

## Diagnóstico

1. **Waterfall de autenticação no layout**: `requireAuth()` é `async` e bloqueia toda a árvore. O shell (sidebar, header) não depende dos dados do usuário para a estrutura visual — apenas para o nome/avatar.
2. **`requireAuth()` redundante no Dashboard**: O layout já valida auth; a page não precisa revalidar.
3. **`tw-animate-css`**: Analisado e **mantido** — é usado por componentes shadcn (dialog, select, alert-dialog). Não é um problema de performance relevante.

## Escopo

### Incluso

1. **Suspense boundary no layout interno**: Envolver a parte assíncrona (dados do usuário) em `<Suspense>` com um skeleton, permitindo que o shell renderize imediatamente.
2. **Shell skeleton**: Criar `src/components/shell-skeleton.tsx` — fallback visual para o shell enquanto auth carrega.
3. **Remover `requireAuth()` do Dashboard**: A page do dashboard não precisa chamar `requireAuth()` — o layout já garante isso. Se precisar de dados do usuário, usar o `useSession()` do `SessionProvider` que já existe no layout.

### Excluído

- Remover `tw-animate-css` (é necessário para shadcn)
- Otimizações de compilação dev-mode (problema do bundler, não do app)
- Prefetch de rotas ou outras otimizações de navegação
- Cache de sessão além do `React.cache()` existente

## Arquivos impactados

| Arquivo | Ação |
|---|---|
| `src/app/(internal)/layout.tsx` | Refatorar — envolver auth em Suspense boundary |
| `src/components/shell-skeleton.tsx` | Criar — skeleton do shell (sidebar + header placeholder) |
| `src/app/(internal)/dashboard/page.tsx` | Simplificar — remover `requireAuth()`, usar `useSession()` se precisar de dados do usuário |

## Fluxo após implementação

```
request → renderiza shell (imediato, com skeleton para dados do usuário)
        → requireAuth() em paralelo (dentro do Suspense)
        → streaming: substitui skeleton por dados reais
        → renderiza página filha
```

## Regras

- `requireAuth()` continua existindo no layout — ele **garante** autenticação. A mudança é envolvê-lo em Suspense para não bloquear o shell visual.
- Server Actions continuam chamando `requireAuth()` independentemente (regra existente — layout não re-renderiza em navegação).
- O skeleton deve usar tokens DS existentes (`--ds-color-*`, `--ds-spacing-*`).
- `useSession()` do `SessionProvider` já está disponível em Client Components — não criar novo provider.

## Métricas de sucesso

- Shell visual aparece antes da resolução de `requireAuth()`
- Dashboard não faz chamada redundante de auth
- Sem regressão funcional — auth continua protegendo todas as rotas internas

## Dependências

- Nenhuma dependência de PRD anterior (pode ser implementado a qualquer momento)
- Não bloqueia nenhum PRD futuro
