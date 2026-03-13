# PRD-01 — Clientes

> **Depende de:** PRD-00b (Auth + DB) — deve estar concluído antes de iniciar
> **Contexto:** Implementa o CRUD completo de Clientes — a entidade mais simples do domínio e sem regras de negócio cross-entity. Ao final, o usuário autenticado consegue listar, criar, editar, excluir e visualizar detalhes de clientes via painel interno.

---

## Escopo

### Inclui
- Query `getClientes()` — lista para a página `/clientes`
- Query `getClienteById(id)` — detalhe para `/clientes/[id]`
- Query `getProjetosDoCliente(clienteId)` — projetos vinculados exibidos no detalhe
- Zod schema `ClienteFormSchema` compartilhado entre form e action
- Actions: criar, editar, excluir cliente
- Página `/clientes` — listagem com busca client-side e modal de criação
- Página `/clientes/[id]` — detalhe completo + lista de projetos do cliente
- Componente modal reutilizável para criar e editar (recebe `cliente?` como prop)
- Arquivos triviais: `loading.tsx` e `not-found.tsx` das duas rotas

### Não inclui
- Dashboard (`/dashboard`) — permanece como placeholder
- Nenhuma integração com projetos (PRD-02a+)
- Relatórios, exportações, paginação
- Filtros por status de projetos do cliente

---

## Arquivos

### Criar

```
src/queries/cliente.queries.ts                                  — getClientes, getClienteById, getProjetosDoCliente
src/types/schemas/cliente.schema.ts                             — ClienteFormSchema (Zod)
src/actions/cliente.actions.ts                                  — criarClienteAction, editarClienteAction, excluirClienteAction
src/app/(internal)/clientes/_components/cliente-form-modal.tsx  — Client Component: Dialog + form criar/editar
src/app/(internal)/clientes/page.tsx                            — Server Component: lista + search client-side
src/app/(internal)/clientes/loading.tsx                         — skeleton da listagem
src/app/(internal)/clientes/[id]/page.tsx                       — Server Component: detalhe + projetos
src/app/(internal)/clientes/[id]/loading.tsx                    — skeleton do detalhe
src/app/(internal)/clientes/[id]/not-found.tsx                  — cliente não encontrado
```

### Modificar

```
(nenhum arquivo existente a modificar)
```

> **Dependências a instalar antes de implementar:**
> ```bash
> # npm
> pnpm add react-hook-form zod @hookform/resolvers
>
> # shadcn/ui
> npx shadcn@latest add dialog input label textarea form alert-dialog
> ```

---

## Especificação

### Schema Prisma

Sem alterações — o modelo `Cliente` já existe no schema do PRD-00b com todos os campos necessários.

---

### Queries (`queries/cliente.queries.ts`)

Todas as queries usam `import 'server-only'` e `import { db } from '@/lib/db'`.

---

**`getClientes()`**

- **Parâmetros:** nenhum
- **Retorna:** `{ id, nome, empresa_organizacao, email_principal, created_at }[]`
- **Ordenação:** `nome` asc
- **Contexto:** interno

---

**`getClienteById(id: string)`**

- **Parâmetros:** `id: string` (UUID)
- **Retorna:** `{ id, nome, empresa_organizacao, email_principal, telefone_contato, observacoes, created_at, updated_at }` ou `null`
- **Contexto:** interno

---

**`getProjetosDoCliente(clienteId: string)`**

- **Parâmetros:** `clienteId: string`
- **Retorna:** `{ id, nome, status, data_inicio, previsao_entrega }[]`
- **Ordenação:** `created_at` desc
- **Contexto:** interno — esta query é usada apenas na página de detalhe do cliente

---

### Zod Schema (`types/schemas/cliente.schema.ts`)

```ts
import { z } from 'zod'

export const ClienteFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  empresa_organizacao: z.string().optional(),
  email_principal: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  telefone_contato: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof ClienteFormSchema>
```

---

### Actions (`actions/cliente.actions.ts`)

Todas as actions:
- Iniciam com `'use server'`
- Chamam `await requireAuth()` antes de qualquer operação
- Revalidam com Zod via `ClienteFormSchema.safeParse`
- Retornam `{ success: true }` ou `{ success: false, error: string }`
- Nunca lançam exceção para a UI

---

**`criarClienteAction(data: ClienteFormData)`**

- **Input:** `ClienteFormSchema`
- **Efeitos:** cria registro em `Cliente`; `revalidatePath('/clientes')`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

---

**`editarClienteAction(id: string, data: ClienteFormData)`**

- **Input:** `id: string` + `ClienteFormSchema`
- **Efeitos:** atualiza o registro; `revalidatePath('/clientes')`; `revalidatePath('/clientes/' + id)`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

---

**`excluirClienteAction(id: string)`**

- **Input:** `id: string`
- **Efeitos:** deleta o cliente (`onDelete: Cascade` no schema Prisma cobre projetos e tudo abaixo); `revalidatePath('/clientes')`
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`
- **Nota:** a exclusão é irreversível e cascateia para todos os projetos, fases, tarefas e registros do cliente. A UI deve exibir um diálogo de confirmação antes de chamar esta action.

---

### UI — `clientes/_components/cliente-form-modal.tsx`

**Responsabilidade:** Client Component reutilizável para criar e editar um cliente.

- `'use client'`
- Props: `{ cliente?: ClienteData; trigger: React.ReactNode }`
  - Se `cliente` estiver presente: modo edição (pré-popula o form, chama `editarClienteAction`)
  - Se ausente: modo criação (form vazio, chama `criarClienteAction`)
- Usa shadcn `Dialog` + `DialogContent` como container
- `trigger` é renderizado como `DialogTrigger` — o pai controla o que dispara o modal
- Form com React Hook Form + `ClienteFormSchema` (Zod resolver)
- Campos: `nome` (obrigatório), `empresa_organizacao`, `email_principal`, `telefone_contato`, `observacoes` (textarea)
- Submit: chama a action correspondente; em sucesso fecha o dialog; em erro exibe mensagem inline

---

### UI — `clientes/page.tsx`

**Responsabilidade:** Server Component — busca dados do servidor e passa para o componente de listagem.

- Async Server Component — chama `getClientes()`
- Renderiza um `<ClientesListagem clientes={clientes} />` Client Component (inline ou arquivo separado dentro do mesmo arquivo via `'use client'`)
- O Client Component usa `useSearchParams` para filtrar a lista pelo campo `?busca=` client-side (sem nova request ao servidor)
- Botão "Novo cliente" abre `<ClienteFormModal trigger={<Button>Novo cliente</Button>} />`
- Botão "Editar" em cada linha abre `<ClienteFormModal cliente={c} trigger={<Button variant="ghost">Editar</Button>} />`
- Botão "Excluir" em cada linha abre um `AlertDialog` de confirmação antes de chamar `excluirClienteAction`
- Campo de busca filtra por `nome` ou `empresa_organizacao` (case-insensitive, client-side)

---

### UI — `clientes/[id]/page.tsx`

**Responsabilidade:** Server Component — detalhe completo do cliente + projetos vinculados.

- Async Server Component com `params: { id: string }`
- Chama `getClienteById(id)` — se `null`, chama `notFound()` do `next/navigation`
- Chama `getProjetosDoCliente(id)` em paralelo (`Promise.all`)
- Exibe todos os campos do cliente (incluindo `telefone_contato` e `observacoes`)
- Botão "Editar" abre `<ClienteFormModal cliente={cliente} trigger={...} />`
- Botão "Excluir" abre `AlertDialog` de confirmação; em sucesso redireciona para `/clientes`
- Lista de projetos do cliente: nome, status, data_inicio — com link para `/projetos/[id]` (a rota ainda não existe no PRD-01, mas o `<Link>` pode ser inserido normalmente)
- Breadcrumb: `Clientes > {cliente.nome}`

---

## Regras de negócio aplicáveis

Nenhuma regra de negócio cross-entity (R1–R5) se aplica a este PRD. O modelo Cliente é independente — criação, edição e exclusão não exigem `$transaction` nem `services/`.

A única implicação é a cascata de exclusão já definida no schema Prisma:

| Ação | Comportamento |
|---|---|
| Excluir cliente | Cascade → todos os projetos e tudo abaixo |

Isso é responsabilidade do schema, não do service. A action apenas chama `db.cliente.delete()`.

---

## Critérios de aceitação

- [ ] Acessar `/clientes` exibe a lista de clientes cadastrados
- [ ] Campo de busca filtra a lista por `nome` ou `empresa_organizacao` sem nova requisição ao servidor
- [ ] Clicar "Novo cliente" abre o modal com form vazio
- [ ] Submeter o form com `nome` vazio impede o envio com mensagem "Nome é obrigatório"
- [ ] Submeter o form com email inválido impede o envio com mensagem "Email inválido"
- [ ] Criar cliente com dados válidos fecha o modal e exibe o novo cliente na lista
- [ ] Clicar "Editar" abre o modal com os dados do cliente pré-preenchidos
- [ ] Editar cliente salva as alterações e atualiza a lista e o detalhe
- [ ] Clicar "Excluir" exibe um diálogo de confirmação antes de deletar
- [ ] Confirmar exclusão remove o cliente e redireciona (detalhe) ou atualiza a lista (listagem)
- [ ] Acessar `/clientes/[id]` de um cliente existente exibe todos os campos e os projetos vinculados
- [ ] Acessar `/clientes/[id]` de um UUID inexistente exibe a página `not-found`
- [ ] `pnpm build` completa com zero erros de TypeScript

---

## Verificação

### Build

```bash
npx prisma generate && pnpm build
```

Zero erros de TypeScript é pré-requisito para declarar o PRD concluído.

### Checklist manual

- [ ] **Criar cliente** com todos os campos preenchidos → aparece na lista em `/clientes`
- [ ] **Busca por nome** na listagem → filtra corretamente sem reload de página
- [ ] **Editar nome e email** de um cliente → alterações persistem após refresh
- [ ] **Acessar `/clientes/[id]`** → exibe campos completos + projetos vinculados (lista vazia se não houver)
- [ ] **Excluir cliente** via listagem → cliente some da lista; via detalhe → redireciona para `/clientes`
- [ ] **Cancelar exclusão** no diálogo de confirmação → cliente não é deletado
- [ ] **UUID inexistente** em `/clientes/[id]` → exibe página "não encontrado"
- [ ] **`npx prisma studio`** → registros criados/editados/deletados refletem no banco corretamente
