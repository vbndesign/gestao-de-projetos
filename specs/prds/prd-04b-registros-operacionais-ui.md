# PRD-04b — Registros Operacionais I — UI

> **Depende de:** PRD-04a (Registros Operacionais Backend) — deve estar concluído antes de iniciar
> **Contexto:** UI completa da aba `/projetos/[id]/timeline` para criar, listar, editar e excluir Reuniões, Decisões e Checkpoints. Todo o backend (schemas Zod, queries, service, actions) foi entregue no PRD-04a. PRD-07b adicionará a visualização consolidada da timeline sobre esta mesma rota.

---

## Escopo

### Inclui
- Página `/projetos/[id]/timeline` com três seções (Reuniões · Decisões · Checkpoints)
- `loading.tsx` com skeleton da página
- Componente manager `registros-manager.tsx` com listagem e ações por seção
- Dialog reutilizável por tipo: `reuniao-form-dialog.tsx`, `decisao-form-dialog.tsx`, `checkpoint-form-dialog.tsx`
- Confirmação de exclusão via `AlertDialog` por item
- Instalação do componente shadcn `select` (para selects de `fase_id` e `reuniao_id`)

### Não inclui
- Backend — actions, queries, service e schemas já existem (PRD-04a)
- Visualização consolidada da timeline (`EventoTimeline`) — PRD-07b
- Pendência, Documento, Mudança de Direção — PRDs-05a e 05b
- Nenhum novo pacote npm (apenas componente shadcn)

---

## Arquivos

### Instalar (shadcn — pré-requisito)
```bash
npx shadcn@latest add select
```

### Criar
```
src/app/(internal)/projetos/[id]/timeline/page.tsx                           — Server Component; busca as 3 listagens + fases e passa ao manager
src/app/(internal)/projetos/[id]/timeline/loading.tsx                        — Skeleton da página (3 seções)
src/app/(internal)/projetos/[id]/timeline/_components/registros-manager.tsx  — Client Component principal; renderiza seções, lista, edit/delete
src/app/(internal)/projetos/[id]/timeline/_components/reuniao-form-dialog.tsx    — Dialog criar/editar Reunião
src/app/(internal)/projetos/[id]/timeline/_components/decisao-form-dialog.tsx    — Dialog criar/editar Decisão
src/app/(internal)/projetos/[id]/timeline/_components/checkpoint-form-dialog.tsx — Dialog criar/editar Checkpoint
```

**Total: 6 arquivos novos · 0 modificados**

---

## Especificação

### Dependência: componente shadcn select

Antes de implementar, adicionar o componente Select do shadcn:

```bash
npx shadcn@latest add select
```

Isso cria `src/components/ui/select.tsx` (código copiado — sem pacote npm adicional).

---

### `page.tsx` — Server Component

Rota: `/projetos/[id]/timeline`

```tsx
// Recebe params: Promise<{ id: string }>
// Faz:
//   const { id } = await params
//   const [reunioes, decisoes, checkpoints, fases] = await Promise.all([
//     getReunioesByProjeto(id),
//     getDecisoesByProjeto(id),
//     getCheckpointsByProjeto(id),
//     getFasesByProjeto(id),
//   ])
// Renderiza:
//   <RegistrosManager
//     projetoId={id}
//     reunioes={reunioes}
//     decisoes={decisoes}
//     checkpoints={checkpoints}
//     fases={fases.map(f => ({ id: f.id, nome: f.nome, is_fase_geral: f.is_fase_geral }))}
//   />
```

Sem `notFound()` — o layout pai (`projetos/[id]/layout.tsx`) já trata projeto inexistente.

> **Nota de datas:** Prisma retorna campos `Date` normalmente — sem conversão de `Decimal` necessária neste módulo (diferente de `tempo_estimado_horas`). As datas chegam como `Date` e são serializadas automaticamente.

---

### `loading.tsx` — Skeleton

Três seções com `animate-pulse` e `bg-muted`. Estrutura:

```
[ header section 1 ] ── [ button placeholder ]
  card skeleton (2–3 linhas)

[ header section 2 ] ── [ button placeholder ]
  card skeleton (2–3 linhas)

[ header section 3 ] ── [ button placeholder ]
  card skeleton (2–3 linhas)
```

Usar `div` com `animate-pulse` e `rounded bg-muted` (sem componente `<Skeleton>` — padrão estabelecido no PRD-02b).

---

### `registros-manager.tsx` — Client Component principal

Props e tipos:

```ts
type FaseItem = {
  id: string
  nome: string
  is_fase_geral: boolean
}

type ReuniaoItem = {
  id: string
  titulo: string
  data_reuniao: Date
  fase_id: string | null
  participantes: string | null
  link_referencia: string | null
  resumo_executivo: string | null
  ata_resumida: string | null
  created_at: Date
}

type DecisaoItem = {
  id: string
  titulo: string
  descricao: string
  contexto: string | null
  impacto: string | null
  data_decisao: Date
  fase_id: string | null
  reuniao_id: string | null
  created_at: Date
}

type CheckpointItem = {
  id: string
  titulo: string
  resumo: string
  proximos_passos: string | null
  data_checkpoint: Date
  fase_id: string | null
  created_at: Date
}

type RegistrosManagerProps = {
  projetoId: string
  reunioes: ReuniaoItem[]
  decisoes: DecisaoItem[]
  checkpoints: CheckpointItem[]
  fases: FaseItem[]
}
```

**Responsabilidades:**
1. Renderizar três seções verticais: Reuniões · Decisões · Checkpoints
2. Cada seção: header com título + botão "Nova X" + lista de itens (ou empty state)
3. Cada item: título, data formatada, botões Editar e Excluir
4. Editar: abre o dialog do tipo correspondente com dados do item (`registro` prop)
5. Excluir: AlertDialog de confirmação; ao confirmar, chama a action correspondente + `toast.success/error`
6. Exclusão usa `useTransition()` para desabilitar botões enquanto pendente

**Layout por seção:**
```
┌─────────────────────────────────────────────────────┐
│ Reuniões                              [ Nova reunião ]│
├─────────────────────────────────────────────────────┤
│ [ data ]  Título da reunião           [ Editar ] [ X ]│
│ [ data ]  Título da reunião           [ Editar ] [ X ]│
│ (vazio: "Nenhuma reunião registrada")               │
└─────────────────────────────────────────────────────┘
```

**Layout por item (card simples):**
```
[ data formatada (dd/MM/yyyy) ]  Título                [ Editar ] [ Excluir ]
```

Datas formatadas com `toLocaleDateString('pt-BR')`.

**Empty state por seção:**
- Reuniões: `"Nenhuma reunião registrada."`
- Decisões: `"Nenhuma decisão registrada."`
- Checkpoints: `"Nenhum checkpoint registrado."`

**Exclusão — padrão:**
```tsx
// Para cada tipo, reutilizar AlertDialog com useTransition()
const [isPending, startTransition] = useTransition()

function handleExcluir(id: string) {
  startTransition(async () => {
    const result = await excluirReuniaoAction(id)
    if (result.success) {
      toast.success('Reunião excluída')
    } else {
      toast.error(result.error)
    }
  })
}
```

---

### `reuniao-form-dialog.tsx` — Dialog de Reunião

Props:
```ts
type ReuniaoFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  reuniao?: ReuniaoItem     // se presente → modo edição
  onSuccess?: () => void
}
```

Campos do formulário:

| Campo | Input | Obrigatório | Notas |
|-------|-------|-------------|-------|
| `titulo` | `<Input>` | sim | max 200 |
| `data_reuniao` | `<Input type="date">` | sim | `z.coerce.date({ error: '...' })` |
| `fase_id` | `<Select>` | não | options: fases do projeto; valor null → "Sem fase" |
| `participantes` | `<Textarea>` | não | — |
| `link_referencia` | `<Input>` | não | — |
| `resumo_executivo` | `<Textarea>` | não | — |
| `ata_resumida` | `<Textarea>` | não | — |

**defaultValues no modo edição:**
```ts
defaultValues: reuniao ? {
  titulo: reuniao.titulo,
  data_reuniao: reuniao.data_reuniao.toLocaleDateString('sv-SE') as unknown as Date,
  fase_id: reuniao.fase_id ?? null,
  participantes: reuniao.participantes ?? '',
  link_referencia: reuniao.link_referencia ?? '',
  resumo_executivo: reuniao.resumo_executivo ?? '',
  ata_resumida: reuniao.ata_resumida ?? '',
} : {
  titulo: '',
  data_reuniao: undefined,
  fase_id: null,
}
```

**Comportamento:**
- Criar: `criarReuniaoAction(projetoId, data)` → `toast.success('Reunião criada')` + `setOpen(false)` + `onSuccess?.()`
- Editar: `editarReuniaoAction(reuniao.id, data)` → `toast.success('Reunião atualizada')` + `setOpen(false)` + `onSuccess?.()`
- Erro: `toast.error(result.error)`
- `zodResolver(ReuniaoFormSchema as any)` (padrão do projeto)
- `useState(false)` para open/onOpenChange
- `useTransition()` para isPending → desabilita botão submit e mostra "Salvando..."
- `<DialogTrigger render={trigger} />`

**Select de fase_id:**
```tsx
<Controller
  name="fase_id"
  control={control}
  render={({ field }) => (
    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
      <SelectTrigger>
        <SelectValue placeholder="Sem fase" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Sem fase</SelectItem>
        {fases.map(f => (
          <SelectItem key={f.id} value={f.id}>
            {f.is_fase_geral ? `${f.nome} (Geral)` : f.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

---

### `decisao-form-dialog.tsx` — Dialog de Decisão

Props:
```ts
type DecisaoFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  reunioes: ReuniaoItem[]    // para popular o select reuniao_id
  decisao?: DecisaoItem      // se presente → modo edição
  onSuccess?: () => void
}
```

Campos do formulário:

| Campo | Input | Obrigatório | Notas |
|-------|-------|-------------|-------|
| `titulo` | `<Input>` | sim | max 200 |
| `descricao` | `<Textarea>` | sim | — |
| `data_decisao` | `<Input type="date">` | sim | `z.coerce.date({ error: '...' })` |
| `fase_id` | `<Select>` | não | mesma lógica de Reunião |
| `reuniao_id` | `<Select>` | não | options: reuniões existentes do projeto |
| `contexto` | `<Textarea>` | não | — |
| `impacto` | `<Textarea>` | não | — |

**Select de reuniao_id:**
```tsx
<Controller
  name="reuniao_id"
  control={control}
  render={({ field }) => (
    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
      <SelectTrigger>
        <SelectValue placeholder="Sem reunião de origem" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Sem reunião de origem</SelectItem>
        {reunioes.map(r => (
          <SelectItem key={r.id} value={r.id}>
            {r.titulo} ({r.data_reuniao.toLocaleDateString('pt-BR')})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

**defaultValues no modo edição:**
```ts
defaultValues: decisao ? {
  titulo: decisao.titulo,
  descricao: decisao.descricao,
  data_decisao: decisao.data_decisao.toLocaleDateString('sv-SE') as unknown as Date,
  fase_id: decisao.fase_id ?? null,
  reuniao_id: decisao.reuniao_id ?? null,
  contexto: decisao.contexto ?? '',
  impacto: decisao.impacto ?? '',
} : { titulo: '', descricao: '', data_decisao: undefined, fase_id: null, reuniao_id: null }
```

Ações: `criarDecisaoAction(projetoId, data)` / `editarDecisaoAction(decisao.id, data)`

---

### `checkpoint-form-dialog.tsx` — Dialog de Checkpoint

Props:
```ts
type CheckpointFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  checkpoint?: CheckpointItem    // se presente → modo edição
  onSuccess?: () => void
}
```

Campos do formulário:

| Campo | Input | Obrigatório | Notas |
|-------|-------|-------------|-------|
| `titulo` | `<Input>` | sim | max 200 |
| `resumo` | `<Textarea>` | sim | — |
| `data_checkpoint` | `<Input type="date">` | sim | `z.coerce.date({ error: '...' })` |
| `fase_id` | `<Select>` | não | mesma lógica de Reunião |
| `proximos_passos` | `<Textarea>` | não | — |

**defaultValues no modo edição:**
```ts
defaultValues: checkpoint ? {
  titulo: checkpoint.titulo,
  resumo: checkpoint.resumo,
  data_checkpoint: checkpoint.data_checkpoint.toLocaleDateString('sv-SE') as unknown as Date,
  fase_id: checkpoint.fase_id ?? null,
  proximos_passos: checkpoint.proximos_passos ?? '',
} : { titulo: '', resumo: '', data_checkpoint: undefined, fase_id: null }
```

Ações: `criarCheckpointAction(projetoId, data)` / `editarCheckpointAction(checkpoint.id, data)`

---

## Regras de negócio aplicáveis

| Regra | Resumo | Onde implementar |
|-------|--------|------------------|
| Criar registro → cria EventoTimeline | Já implementado no service (PRD-04a); UI só chama a action | `actions/registro-operacional.actions.ts` (já existe) |
| Excluir registro → exclui EventoTimeline | Já implementado no service (PRD-04a); UI só chama a action | `actions/registro-operacional.actions.ts` (já existe) |
| `fase_id` opcional em todos os tipos | Select com opção "Sem fase"; valor null enviado à action | `reuniao-form-dialog.tsx` / `decisao-form-dialog.tsx` / `checkpoint-form-dialog.tsx` |
| `reuniao_id` opcional em Decisão | Select com opção "Sem reunião de origem"; valor null enviado | `decisao-form-dialog.tsx` |

---

## Critérios de aceitação

- [ ] Ao acessar `/projetos/[id]/timeline`, as três seções (Reuniões, Decisões, Checkpoints) são exibidas
- [ ] Seção vazia exibe empty state: "Nenhuma reunião registrada.", etc.
- [ ] Clicar "Nova reunião" → modal abre com campos em branco
- [ ] Campo `titulo` vazio → mensagem "Título é obrigatório", modal não fecha
- [ ] Campo `data_reuniao` vazio → mensagem "Data é obrigatória", modal não fecha
- [ ] Salvar nova reunião → item aparece na listagem + toast "Reunião criada"
- [ ] Clicar "Editar" em reunião → modal abre com dados preenchidos
- [ ] Salvar edição → dados atualizados na listagem + toast "Reunião atualizada"
- [ ] Clicar "Excluir" em reunião → AlertDialog de confirmação aparece
- [ ] Confirmar exclusão → item removido da listagem + toast "Reunião excluída"
- [ ] Idem para Decisão: campo `descricao` vazio → "Descrição é obrigatória"
- [ ] Idem para Checkpoint: campo `resumo` vazio → "Resumo é obrigatório"
- [ ] Select de `fase_id` exibe todas as fases do projeto; escolher fase vincula o registro
- [ ] Select de `reuniao_id` (Decisão) exibe reuniões existentes; deixar vazio → `null` no banco
- [ ] `pnpm build` sem erros de TypeScript

---

## Verificação

### Pré-requisito
```bash
npx shadcn@latest add select
```

### Build
```bash
pnpm build
```
Zero erros de TypeScript é pré-requisito para declarar o PRD concluído.

### Checklist manual

- [ ] **Acessar `/projetos/[id]/timeline`** → página carrega com 3 seções
- [ ] **Nova reunião → título vazio → salvar** → erro "Título é obrigatório" visível, modal não fecha
- [ ] **Nova reunião → preencher título + data → salvar** → reunião aparece na listagem + EventoTimeline criado (verificar via Prisma Studio)
- [ ] **Editar reunião → alterar título → salvar** → título atualizado na listagem + EventoTimeline atualizado
- [ ] **Excluir reunião → confirmar** → reunião removida + EventoTimeline removido (verificar via Prisma Studio)
- [ ] **Nova decisão com reuniao_id** → decisão vinculada à reunião no banco
- [ ] **Nova decisão sem reuniao_id** → `reuniao_id = null` no banco
- [ ] **Novo checkpoint → preencher dados → salvar** → checkpoint aparece na listagem

Verificar estado do banco via `npx prisma studio` quando necessário.
