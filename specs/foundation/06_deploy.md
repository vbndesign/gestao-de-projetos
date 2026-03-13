# 06 — Deploy

Configurações obrigatórias para deploy. Stack: Vercel + Supabase + Prisma.

---

## `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "prisma generate && next build",
  "regions": ["gru1"],
  "fluid": true
}
```

**Por que `prisma generate && next build`:** o Vercel faz clone raso do repositório — o cliente gerado do Prisma não está commitado. Sem `prisma generate`, o build quebra com erro de import do `@prisma/client`.

Manter o mesmo valor no `package.json` para consistência local:
```json
"build": "prisma generate && next build"
```

**`devDependencies` são instaladas pelo Vercel** por padrão — o Prisma CLI disponível durante o build sem configuração extra.

**Node.js version:** configurar em **Project Settings → General → Node.js Version** → **Node.js 20.x**.

**`"fluid": true`:** garante Fluid Compute ativo (duração máxima de 300s, default 10-15s sem ele em planos antigos).

---

## Regiões

Funções Vercel rodam por padrão em `iad1` (EUA). Alinhar com a região do Supabase para minimizar latência.

| Supabase region | Vercel | Código |
|---|---|---|
| South America (São Paulo) | São Paulo | `gru1` |
| US East (N. Virginia) | Washington DC | `iad1` |
| EU West (Ireland) | Dublin | `dub1` |
| EU Central (Frankfurt) | Frankfurt | `fra1` |

Confirmar em: **Supabase Dashboard → Settings → General → Region**.

---

## Variáveis de ambiente

Configurar em **Project Settings → Environment Variables**. Nunca criar `.env.production` no repositório.

| Variável | Environments | Observação |
|---|---|---|
| `DATABASE_URL` | Production, Preview | URL com pgbouncer (porta 6543) |
| `DIRECT_URL` | Production, Preview | URL direta (porta 5432) — Prisma Migrate |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Pública — vai para o bundle do browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Pública por design |
| `SUPABASE_SERVICE_ROLE_KEY` | **Production only** | Nunca expor em Preview |
| `NEXT_PUBLIC_APP_URL` | All (valor diferente por env) | `https://seudominio.com` em prod |

**Formato das URLs Supabase:**
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"
```

> Alterações em env vars não se aplicam a deploys anteriores — apenas ao próximo deploy. Após salvar, faça redeploy.

**Pull local de variáveis:**
```bash
vercel env pull   # baixa variáveis do ambiente Development para .env.local
```

---

## GitHub → Vercel — branches

| Branch | Deploy | URL |
|---|---|---|
| `main` | Produção automático | `seudominio.com` |
| `dev` | Preview automático | `dev-[hash].vercel.app` |
| `feature/*` (via PR) | Preview automático por PR | URL única por PR |

---

## Supabase Auth — configuração

Em **Supabase Dashboard → Authentication → URL Configuration**:

```
Site URL:       https://seudominio.com
Redirect URLs:  https://seudominio.com/auth/callback
                https://*.vercel.app/auth/callback   ← para previews
```

---

## Prisma Migrate em produção

Migrations **não rodam automaticamente** no build — executar manualmente:

```bash
DATABASE_URL="..." npx prisma migrate deploy
```

Usar `DIRECT_URL` (sem pgbouncer) para migrations — Prisma exige conexão direta para DDL. O `directUrl` no `schema.prisma` aponta para `DIRECT_URL` automaticamente.

---

## Limites de Vercel Functions

| Limite | Valor | Relevância |
|---|---|---|
| Duração máxima (Fluid) | 300s | Mais que suficiente para Server Actions |
| Payload request/response | 4.5 MB | Formulários de texto: sem problema. Upload de arquivo: Supabase Storage direto do browser |
| Bundle por função | 250 MB | Prisma gera cliente pesado — manter schema enxuto |
| Memória | 1 GB / 1 vCPU (default) | Configurar via Project Settings se necessário |

`includeFiles`/`excludeFiles` não funcionam em Next.js via `vercel.json` — usar `next.config.ts`:
```ts
experimental: {
  outputFileTracingExcludes: { '*': ['./heavy-lib/**'] },
}
```

---

## Checklist de deploy

- [ ] `vercel.json` com `buildCommand`, `regions` e `fluid: true`
- [ ] `package.json > scripts > build` com `prisma generate && next build`
- [ ] Node.js 20.x em Project Settings → General
- [ ] Todas as env vars configuradas (ver tabela acima)
- [ ] Região do Vercel alinhada com a região do Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas em Production
- [ ] `NEXT_PUBLIC_APP_URL` com URL correta de produção
- [ ] Callback URL do Supabase Auth: `https://seudominio.com/auth/callback`
- [ ] `https://*.vercel.app/auth/callback` nos Redirect URLs do Supabase (para previews)
- [ ] Branch `main` protegida no GitHub
- [ ] `npx prisma migrate deploy` executado após migrations
