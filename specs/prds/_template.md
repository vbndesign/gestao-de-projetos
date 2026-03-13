# PRD-XX — [Nome do módulo]

> **Depende de:** PRD-XX (nome) — deve estar concluído antes de iniciar
> **Contexto:** Uma frase explicando o que este PRD entrega e por que existe neste ponto da sequência.

---

## Escopo

### Inclui
- O que será implementado neste PRD

### Não inclui
- O que ficará para outro PRD ou está fora do MVP
- Evita ambiguidade sobre o que o Claude deve ou não implementar

---

## Arquivos

Lista explícita de todos os arquivos a criar ou modificar. Máximo 6.

### Criar
```
src/[camada]/[arquivo].[ext]     — descrição do que contém
```

### Modificar
```
src/[camada]/[arquivo].[ext]     — o que muda e por quê
```

---

## Especificação

### Schema Prisma (se aplicável)
Campos, tipos, relações e `onDelete` relevantes para este PRD.
Apenas o que muda — não repetir o schema inteiro.

### Queries (`queries/`)
Para cada função:
- **Nome:** `getNomeDoRecurso()`
- **Parâmetros:** id, filtros
- **Retorna:** campos explícitos (sem `select *`)
- **Contexto:** interno ou portal

### Actions (`actions/`)
Para cada action:
- **Nome:** `criarRecursoAction()`
- **Input:** schema Zod de referência
- **Efeitos:** o que persiste, o que revalida
- **Retorna:** `{ success: true }` ou `{ success: false, error: string }`

### Service (`services/`) — apenas se há lógica cross-entity
- **Regra:** qual regra de negócio (R1, R2, R3...)
- **Transação:** o que entra no `$transaction`
- **Chamado por:** qual action invoca este service

### UI (`components/` + `app/`)
- Rotas envolvidas (referência a `specs/foundation/05_urls.md`)
- Componentes a criar com responsabilidade de cada um
- Schema Zod compartilhado com a action

---

## Regras de negócio aplicáveis

Referência rápida às regras do domínio que impactam este PRD.
Ver definição completa em `specs/foundation/02_dominio.md`.

| Regra | Resumo | Onde implementar |
|---|---|---|
| R? | descrição curta | `services/xxx.service.ts` |

---

## Critérios de aceitação

O que deve ser verdade quando o PRD estiver concluído.
Cada item é verificável — não "deve funcionar", mas "ao fazer X, acontece Y".

- [ ] Ao fazer **[ação]**, o resultado é **[estado esperado]**
- [ ] Ao fazer **[ação inválida]**, retorna **[erro esperado]**
- [ ] Campo **[campo obrigatório]** vazio impede submissão com mensagem **"[mensagem]"**

---

## Verificação

### Build
```bash
pnpm build
```
Zero erros de TypeScript é pré-requisito para declarar o PRD concluído.

### Checklist manual
> *Incluir apenas em PRDs com `services/` ou regras de negócio (R1–R4).*
> *PRDs de setup ou UI pura: apenas o build é suficiente.*

Execute na ordem. Cada item tem uma ação e um resultado esperado.

- [ ] **[Ação concreta]** → **[resultado esperado no banco/UI]**
- [ ] **[Ação concreta]** → **[resultado esperado no banco/UI]**

Verificar estado do banco via `npx prisma studio` quando necessário.
