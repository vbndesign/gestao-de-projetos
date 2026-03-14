# Git Workflow — Gestão de Projetos

Guia de branches e fluxo de desenvolvimento do repositório.

---

## Estrutura de Branches

```
main (produção)
  └── dev (integration)
       ├── modulo/clientes
       ├── modulo/projetos
       └── modulo/registros-operacionais
```

| Branch | Descrição |
|---|---|
| `main` | Produção. Somente merges de `dev` após aprovação. |
| `dev` | Integration. Agrupa múltiplos módulos prontos para release. |
| `modulo/{nome}` | Branch estável de um módulo. Criada apenas quando há **múltiplos PRDs** para aquela parte do sistema (ex: PRD-04a + PRD-04b). |
| `feature/{nome}-prdNN{letra}` | Branch de trabalho. Criada a partir de `modulo/{nome}` ou diretamente de `dev` (em caso de PRD único). |

### Regra: Quando criar `modulo/{nome}`

- ✅ **Crie** `modulo/{nome}` quando há **2+ PRDs** para a mesma funcionalidade (ex: PRD-04a Backend + PRD-04b UI)
- ❌ **Não crie** `modulo/{nome}` quando há apenas **1 PRD** para aquela parte — trabalhe direto em `feature/*` a partir de `dev`

### Nomenclatura de branches

- **Feature branch com múltiplos PRDs:** `feature/{nome}-prd{NN}{letra}`
  Exemplo: `feature/registros-operacionais-prd04a`

- **Feature branch com PRD único:** `feature/{nome}-prd{NN}`
  Exemplo: `feature/pendencias-prd05`

---

## Fluxo de Desenvolvimento

### Iniciar PRD em um módulo

```bash
# Para PRD-03 do módulo clientes
git checkout -b feature/clientes-prd03 modulo/clientes

# Trabalha, commita
git commit -m "feat(clientes): ..."

# Push
git push -u origin feature/clientes-prd03
```

### Completar PRD (merge no módulo)

1. **GitHub:** Abre PR `feature/clientes-prd03` → `modulo/clientes`
2. **Review e aprovação**
3. **Merge com `--no-ff`** em `modulo/clientes` (cria commit de merge, mantém árvore visível)
   ```bash
   git checkout modulo/clientes
   git merge --no-ff feature/clientes-prd03
   git tag -a vX.Y.0 -m "PRD-03: descrição"
   ```
4. **Local:** Sync
   ```bash
   git checkout modulo/clientes
   git pull origin modulo/clientes
   ```

---

## Fluxo de Integração (módulo → dev)

Quando o módulo está pronto (todas as PRDs completadas):

1. **GitHub:** Abre PR `modulo/clientes` → `dev`
2. **Review e aprovação**
3. **Merge com `--no-ff`** em `dev`
   ```bash
   git checkout dev
   git merge --no-ff modulo/clientes
   ```
4. **Local:** Sync
   ```bash
   git checkout dev
   git pull origin dev
   ```

---

## Fluxo de Release (dev → main)

Quando `dev` está estável com múltiplos módulos:

1. **GitHub:** Abre PR `dev` → `main`
2. **Review final e aprovação**
3. **Merge com `--no-ff`** em `main`
   ```bash
   git checkout main
   git merge --no-ff dev
   ```
4. **Local:** Sync
   ```bash
   git checkout main
   git pull origin main
   ```

---

## Casos de Uso

### Case 1: PRD **única** para uma funcionalidade
```bash
# PRD-05a é Pendência (único PRD para pendências — não há 05b, 05c, etc.)
git checkout -b feature/pendencias-prd05 dev

# Trabalha, commita
git commit -m "feat(pendencias): ..."

# Push
git push -u origin feature/pendencias-prd05

# PR: feature/pendencias-prd05 → dev (direto em dev, sem modulo/*)
# Merge em dev
```

### Case 2: Múltiplos PRDs para a mesma funcionalidade
```bash
# PRD-04a + PRD-04b são Registros Operacionais
# Passo 1: criar modulo/registros-operacionais
git checkout -b modulo/registros-operacionais dev
git push -u origin modulo/registros-operacionais

# Passo 2: trabalhar em PRD-04a
git checkout -b feature/registros-operacionais-prd04a modulo/registros-operacionais
# ... trabalha ...
# PR: feature/registros-operacionais-prd04a → modulo/registros-operacionais
# Merge em modulo/registros-operacionais

# Passo 3: trabalhar em PRD-04b (mesma branch modulo/registros-operacionais)
git checkout -b feature/registros-operacionais-prd04b modulo/registros-operacionais
# ... trabalha ...
# PR: feature/registros-operacionais-prd04b → modulo/registros-operacionais
# Merge em modulo/registros-operacionais

# Passo 4: quando ambos prontos, integrar no dev
# PR: modulo/registros-operacionais → dev
# Merge em dev
```

### Case 3: Duas PRDs em módulos diferentes (paralelo)
```bash
# Terminal 1: PRD de clientes
git checkout -b feature/clientes-prd04 modulo/clientes

# Terminal 2: PRD de projetos
git checkout -b feature/projetos-prd03 modulo/projetos

# Depois: 2 PRs simultâneas
# PR 1: feature/clientes-prd04 → modulo/clientes
# PR 2: feature/projetos-prd03 → modulo/projetos
```

### Case 4: Mudança que afeta 2 módulos (refactor, integração)
```bash
# Branch sai de dev (não de um módulo específico)
git checkout -b feature/refactor-auth dev

# Trabalha em clientes/ E projetos/
git push -u origin feature/refactor-auth

# PR: feature/refactor-auth → dev (uma PR única)
# Merge em dev
```

---

## Comandos Frequentes

```bash
# Ver estado de branches
git branch -v
git branch -vv  # com remote tracking

# Atualizar branch local com remoto
git pull origin modulo/clientes

# Listar branches remotas
git branch -r

# Deletar branch local
git branch -d feature/clientes-prd03

# Deletar branch remota
git push origin --delete feature/clientes-prd03

# Resetar para último commit remoto
git reset --hard origin/modulo/clientes

# Ver commits de uma branch
git log modulo/clientes --oneline -10
```

---

## Regras Críticas

❌ **NUNCA:**
- Committar direto em `main`, `dev`, `modulo/*`
- Fazer `git push --force` em branches compartilhadas
- Mergear `main` ← `dev` sem análise
- Criar `modulo/{nome}` quando há apenas **1 PRD** para aquela funcionalidade

✅ **SEMPRE:**
- Criar `modulo/{nome}` quando há **2+ PRDs** para a mesma funcionalidade
- Feature branches com múltiplos PRDs: derivar de `modulo/*`, não de `dev`
- Feature branches com PRD único: derivar direto de `dev`, sem `modulo/*`
- Faz PR para revisar antes de merge
- Puxa `git pull` antes de começar novo trabalho
- Commits com mensagens descritivas (type: descrição)

---

## Fluxo Resumido

### Para PRD com múltiplos sub-PRDs (ex: PRD-04a + PRD-04b)
```
1. git checkout -b modulo/{nome} dev
2. git push -u origin modulo/{nome}
3. git checkout -b feature/{nome}-prd{NN}a modulo/{nome}
4. (trabalha, commita)
5. git push -u origin feature/{nome}-prd{NN}a
6. Abre PR: feature/... → modulo/{nome} (review + merge --no-ff)
7. Repete passos 3-6 para cada sub-PRD (prd04b, etc.)
8. Quando todos PRDs prontos: PR modulo/{nome} → dev (review + merge --no-ff)
9. Quando dev estável: PR dev → main (review + merge --no-ff)
```

### Para PRD único (ex: PRD-05 Pendências)
```
1. git checkout -b feature/{nome}-prdNN dev
2. (trabalha, commita)
3. git push -u origin feature/{nome}-prdNN
4. Abre PR: feature/... → dev (review + merge --no-ff)
5. Quando dev estável: PR dev → main (review + merge --no-ff)
```

**Nota sobre merge strategy:** Usar `--no-ff` em **todos os merges** mantém a árvore de commits visível. Cada PRD fica como ramificação isolada e rastreável.

---

**Última atualização:** 2026-03-13 — Adicionada regra de `modulo/{nome}` apenas para múltiplos PRDs
