# Git Workflow — Gestão de Projetos

Guia de branches e fluxo de desenvolvimento do repositório.

---

## Estrutura de Branches

```
main (produção)
  └── dev (integration)
       ├── modulo/clientes
       └── modulo/projetos
```

| Branch | Descrição |
|---|---|
| `main` | Produção. Somente merges de `dev` após aprovação. |
| `dev` | Integration. Agrupa múltiplos módulos prontos para release. |
| `modulo/clientes` | Branch estável do módulo clientes. Contém todas as PRDs de clientes. |
| `modulo/projetos` | Branch estável do módulo projetos. Contém todas as PRDs de projetos. |
| `feature/*` | Branch de trabalho. Sempre criada a partir de um `modulo/*`. |

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

### Case 1: Desenvolver PRD isolada em um módulo
```bash
git checkout -b feature/clientes-prd04 modulo/clientes
# ... trabalha ...
# PR: feature/clientes-prd04 → modulo/clientes
# Merge em modulo/clientes
```

### Case 2: Duas PRDs em módulos diferentes (paralelo)
```bash
# Terminal 1: PRD de clientes
git checkout -b feature/clientes-prd04 modulo/clientes

# Terminal 2: PRD de projetos
git checkout -b feature/projetos-prd03 modulo/projetos

# Depois: 2 PRs simultâneas
# PR 1: feature/clientes-prd04 → modulo/clientes
# PR 2: feature/projetos-prd03 → modulo/projetos
```

### Case 3: Mudança que afeta 2 módulos (refactor, integração)
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

✅ **SEMPRE:**
- Cria feature branch a partir de `modulo/*`
- Faz PR para revisar antes de merge
- Puxa `git pull` antes de começar novo trabalho
- Commits com mensagens descritivas (type: descrição)

---

## Fluxo Resumido

```
1. git checkout -b feature/modulo-prdNN modulo/modulo
2. (trabalha, commita)
3. git push -u origin feature/modulo-prdNN
4. Abre PR: feature/... → modulo/modulo (review + merge --no-ff)
5. Quando módulo pronto: PR modulo/modulo → dev (review + merge --no-ff)
6. Quando dev estável: PR dev → main (review + merge --no-ff)
```

**Nota sobre merge strategy:** Usar `--no-ff` em **todos os merges** mantém a árvore de commits visível. Cada PRD fica como ramificação isolada e rastreável.

---

**Última atualização:** 2026-03-13
