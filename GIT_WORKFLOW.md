# Git Workflow — Gestão de Projetos

Guia simplificado de branches, commits e versionamento.

---

## Estrutura de Branches

```
main (produção)
  └── dev (integration)
       ├── feature/prd-NN-descricao
       ├── feature/ds-descricao
       ├── fix/escopo-descricao
       └── hotfix/descricao
```

| Branch | Propósito | Duração |
|---|---|---|
| `main` | Produção — stable releases | permanente |
| `dev` | Integration — staging pronto para release | permanente |
| `feature/*` | Desenvolvimento de PRD ou DS fundacional | curta (dias, não semanas) |
| `fix/*` | Correção rápida ou tweak de DS | curta |
| `hotfix/*` | Correção crítica em produção | muito curta |

---

## Nomenclatura de Branches

### Feature branches — PRDs de produto

```
feature/prd-NN-descricao        # PRD único (ex: prd-05-pendencias)
feature/prd-NNa-descricao       # PRD com letra (ex: prd-04a-registros-backend)
```

**Exemplos:**
- `feature/prd-05-pendencias`
- `feature/prd-06-horas-estimadas`
- `feature/prd-04a-registros-backend`
- `feature/prd-04b-registros-ui`

### Feature branches — Design System

```
feature/ds-descricao-tema      # DS fundacional ou tweak estrutural
```

**Exemplos:**
- `feature/ds-spacing-tokens`
- `feature/ds-dark-mode` (futuro)

Componentes criados **como parte de uma PRD de produto** não têm branch DS — ficam dentro da branch `feature/prd-*` do PRD.

### Fix branches

```
fix/escopo-descricao          # Correção ou tweak rápido
fix/ds-descricao              # Tweak de DS (ex: hover state, cor)
```

**Exemplos:**
- `fix/button-variant-hover`
- `fix/ds-button-outline-hover`
- `fix/projeto-form-validation`

### Hotfix branches

```
hotfix/descricao              # Apenas para produção (bug crítico)
```

---

## Fluxo de Desenvolvimento

### 1. Iniciar trabalho em um PRD

```bash
git checkout dev
git pull origin dev
git checkout -b feature/prd-05-pendencias
# ... trabalha, commita com Conventional Commits ...
git push -u origin feature/prd-05-pendencias
```

### 2. Abrir PR para review

GitHub: `feature/prd-05-pendencias` → `dev`

Review e aprovação.

### 3. Merge em dev

```bash
# Local
git checkout dev
git pull origin dev
git merge --no-ff feature/prd-05-pendencias
git push origin dev

# Deletar branch
git branch -d feature/prd-05-pendencias
git push origin --delete feature/prd-05-pendencias
```

### 4. Tags de marco (após múltiplos PRDs relacionados)

Quando **um módulo funcional completo** está pronto:

```bash
git checkout dev
git tag -a v0.5.0 -m "Módulo Pendências completo (PRD-05 + complementares)"
git push origin v0.5.0
```

---

## Design System — 3 Tiers

### Tier 1: Fundacional (tokens, primitives base)

Trabalho sem PRD de produto. Exemplo: implementar spacing tokens.

```bash
git checkout -b feature/ds-spacing-tokens dev
# ... edita colors.json, typography.json, spacing.json ...
# ... roda script generate-css-tokens.mjs ...
# ... commita ...
git push -u origin feature/ds-spacing-tokens
# PR → dev → merge --no-ff
```

**Documentação:** atualizar `specs/design-system/foundations/design-system-frontend-implementation.md` após merge.

### Tier 2: Feature-driven (componentes criados para um PRD)

Trabalho dentro da branch `feature/prd-NN-*` do PRD.

Exemplo: PRD-05 de Pendências precisa de um componente `PendenciaTimeline`.

```
feature/prd-05-pendencias
  ├── src/components/pendencia-timeline.tsx (novo)
  ├── src/app/(internal)/pendencias/_components/pendencia-form.tsx (novo)
  └── ... implementação do PRD incluindo DS ...
```

**Documentação:** PRD doc inclui seção "Design Reference" listando componentes criados.

### Tier 3: Tweak/fix (ajustes rápidos)

Ad-hoc em tempo de execução. Exemplo: cor de hover errada.

```bash
git checkout -b fix/ds-button-outline-hover dev
# ... ajusta a cor em globals.css ou badge.tsx ...
git push -u origin fix/ds-button-outline-hover
# PR → dev → merge --no-ff (ou direct push se trivial)
```

**Commit:** `fix(design-system): ajustar hover state do button outline`. Sem PRD.

---

## Conventional Commits

Formato obrigatório:

```
tipo(escopo): descrição breve no imperativo
```

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `chore` | Config, deps, build |
| `docs` | Documentação |
| `test` | Testes |
| `perf` | Performance |
| `style` | Formatação, lint |

**Escopos:** `cliente` · `projeto` · `fase` · `tarefa` · `pendencia` · `horas` · `registros` · `timeline` · `portal` · `auth` · `db` · `ui` · `design-system` · `config`

**Exemplos:**
```
feat(pendencia): criar modelo e queries de pendências
feat(pendencia): implementar form de criação com validação
fix(fase): impedir exclusão de fase marcada como geral
refactor(queries): separar queries de portal e interno
fix(design-system): ajustar hover state do button outline
chore(deps): atualizar tailwindcss para v4.1
docs(readme): adicionar instruções de setup
```

---

## Estratégia de Merge

- `feature/*` → `dev` — **`git merge --no-ff`** (cria commit de merge, mantém histórico visível)
- `dev` → `main` — **`git merge --no-ff`** (apenas para releases estáveis)
- `hotfix/*` → `main` + `dev` — cherry-pick ou rebase-merge

**Por que `--no-ff`?** Preserva a árvore de commits. Cada PRD fica como ramificação isolada e rastreável no histórico.

---

## Versionamento Semver

Tags marcam **conclusão de um módulo funcional completo**, não de cada sub-PRD.

| Tag | Significado |
|---|---|
| `v0.0.0-specs` | Specs finalizadas, zero código ✅ |
| `v0.1.0` | Setup completo (PRD-00a + 00b) |
| `v0.2.0` | Módulo Clientes (PRD-01) |
| `v0.3.0` | Módulo Projetos (PRD-02a + 02b + 02c + PRD-03) |
| `v0.4.0` | Módulo Registros (PRD-04a + 04b) |
| `v0.5.0` | Módulo Pendências (PRD-05 + complementares) |
| … | continua por módulo |
| `v1.0.0` | MVP completo |

```bash
# Após módulo concluído e testado
git tag -a v0.5.0 -m "Módulo Pendências completo"
git push origin v0.5.0
```

Em produção, Vercel detecta tags e faz deploy.

---

## Proteção de Branches (GitHub)

| Branch | Regras |
|---|---|
| `main` | ✅ Require PR before merge · ✅ Require 1 approval · ✅ Dismiss stale reviews · ❌ Force push |
| `dev` | ✅ Require PR before merge · ✅ Require 1 approval · ❌ Force push |

---

## Casos de Uso

### Case 1: PRD única para uma funcionalidade

Exemplo: PRD-05 Pendências (nenhuma 05b, 05c, etc.)

```bash
git checkout -b feature/prd-05-pendencias dev
# ... trabalha (dados, UI, DS) ...
git push -u origin feature/prd-05-pendencias
# PR → dev → merge --no-ff → tag v0.5.0 quando pronto
```

### Case 2: PRD com múltiplas sub-PRDs

Exemplo: PRD-04a (backend) + PRD-04b (UI)

```bash
# PRD-04a
git checkout -b feature/prd-04a-registros-backend dev
# ... trabalha ...
# PR → dev → merge --no-ff

# PRD-04b (novo trabalho, nova branch)
git checkout -b feature/prd-04b-registros-ui dev
# ... trabalha (pode referencia componentes de 04a) ...
# PR → dev → merge --no-ff

# Quando ambos prontos
git tag -a v0.4.0 -m "Módulo Registros completo"
```

### Case 3: DS fundacional

Exemplo: implementar spacing tokens

```bash
git checkout -b feature/ds-spacing-tokens dev
# ... edita tokens/spacing.json, roda script, testa ...
git push -u origin feature/ds-spacing-tokens
# PR → dev → merge --no-ff
# Atualiza docs/design-system/foundations/design-system-frontend-implementation.md
```

### Case 4: Tweak de DS em tempo de execução

Exemplo: hover state errado no button

```bash
git checkout -b fix/ds-button-outline-hover dev
# ... ajusta CSS ...
git push -u origin fix/ds-button-outline-hover
# PR → dev (ou direct push se 1 commit trivial)
# Merge --no-ff
```

### Case 5: Dois PRDs em desenvolvimento paralelo

```bash
# Terminal 1
git checkout -b feature/prd-05-pendencias dev

# Terminal 2 (novo shell)
git checkout -b feature/prd-06-horas dev

# Ambos mergeados em dev quando prontos (sem conflito esperado, escopos diferentes)
```

### Case 6: Mudança que afeta múltiplos PRDs (refactor)

Exemplo: refatorar queries de portal

```bash
git checkout -b feature/refactor-portal-queries dev
# ... muda queries/projeto.queries.ts e queries/fase.queries.ts ...
# ... atualiza pages que usam essas queries ...
git push -u origin feature/refactor-portal-queries
# PR → dev → merge --no-ff

# Notar: refactores são `feature/*`, não `refactor/*`
# (refactor/* é tipo de commit, não tipo de branch)
```

---

## Comandos Frequentes

```bash
# Listar branches locais
git branch -v

# Listar branches remotas
git branch -r

# Atualizar local com remoto
git pull origin dev

# Deletar branch local após merge
git branch -d feature/prd-05-pendencias

# Deletar branch remota
git push origin --delete feature/prd-05-pendencias

# Ver commits da branch
git log feature/prd-05-pendencias --oneline -10

# Resetar para remoto (se messed up local)
git reset --hard origin/dev

# Ver qual branch rastreia qual remoto
git branch -vv

# Cherry-pick commit de outra branch
git cherry-pick abc1234

# Criar tag anotada
git tag -a v0.5.0 -m "Módulo Pendências"

# Listar tags
git tag -l

# Deletar tag local
git tag -d v0.5.0

# Deletar tag remota
git push origin --delete v0.5.0
```

---

## Checklist Antes de Começar uma PR

- [ ] Branch criada a partir de `dev` atualizado (`git pull origin dev`)
- [ ] Commits com tipos e escopos corretos (Conventional Commits)
- [ ] Nenhum commit `merge` local (rebase ao invés de merge --no-ff local)
- [ ] Branch foi feita push com `-u` (tracked)
- [ ] PR descrita com contexto e checklist de testes
- [ ] Nenhuma mudança em `main`

---

## Regras Críticas

❌ **NUNCA:**
- Committar ou fazer push direto em `main` ou `dev`
- `git push --force` em branches compartilhadas
- Mergear `main` ← `dev` sem que `dev` esteja estável
- Deixar feature branches abertas por mais de 2 semanas sem comunicação

✅ **SEMPRE:**
- Feature branches nomeadas descritivamente
- Commits com tipo e escopo (Conventional Commits)
- PR antes de merge em `dev`
- `git pull` antes de começar novo trabalho
- Deletar branches locais e remotas após merge

---

**Última atualização:** 2026-03-19 — Simplificado: removido `modulo/*`, integrado DS em 3 tiers
