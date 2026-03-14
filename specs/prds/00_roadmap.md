# Roadmap de PRDs

Sequência de implementação do MVP. Cada PRD é um input direto para o fluxo Research → Planning → Implementation.

---

## Sequência

| PRD | Módulo | Descrição |
|---|---|---|
| PRD-00a | Setup | Next.js + Tailwind + shadcn + folder structure (sem deploy) |
| PRD-00b | Auth + DB | Prisma + Supabase + proxy.ts + requireAuth + layout interno |
| PRD-01 | Clientes | CRUD completo (schema · queries · actions · UI) |
| PRD-02a | Projetos + Fases Backend | schema · migration · queries · service (R1/R2) · actions |
| PRD-02b | Projetos UI | lista · detalhe · create/edit |
| PRD-02c | Fases UI | add · edit · reorder · delete dentro do detalhe do projeto |
| PRD-03 | Tarefas | CRUD completo (schema · queries · actions · UI) |
| PRD-04a | Registros Op. I Backend | Reunião · Decisão · Checkpoint — schema · queries · actions |
| PRD-04b | Registros Op. I UI | forms + listagens dentro do projeto |
| PRD-05a | Pendência | Backend + UI — service R3 · actions · form com resolução |
| PRD-05b | Documento + Mudança de Direção | Backend + UI — ambos sem regra complexa |
| PRD-06 | Lançamentos de Horas | CRUD completo (schema · queries · actions · UI) |
| PRD-07a | Timeline Backend | queries internas + getTimelinePortal (R4) |
| PRD-07b | Timeline UI | renderização no painel interno |
| PRD-08a | Portal Estrutura | rota pública · slug · layout · visão geral do projeto |
| PRD-08b | Portal Conteúdo | fases · tarefas · timeline filtrada · documentos |
| PRD-09 | Deploy | vercel.json · env vars · região · Prisma migrate deploy |

---

## Critérios de divisão adotados

- **Backend separado da UI** quando o módulo tem serviço ou regras de negócio relevantes
- **Entidade própria** quando tem regra cross-entity que exige `$transaction` (R1, R2, R3)
- **Máximo 6 arquivos por PRD** para caber confortavelmente na janela de contexto do Claude Code
- **Dependência explícita** — cada PRD só começa após o anterior estar testado e funcionando

---

## Status

| PRD | Status |
|---|---|
| PRD-00a | ✅ concluído |
| PRD-00b | ✅ concluído |
| PRD-01 | ✅ concluído |
| PRD-02a | ✅ concluído |
| PRD-02b | ✅ concluído |
| PRD-02c | ✅ concluído |
| PRD-03 | pendente |
| PRD-04a | pendente |
| PRD-04b | pendente |
| PRD-05a | pendente |
| PRD-05b | pendente |
| PRD-06 | pendente |
| PRD-07a | pendente |
| PRD-07b | pendente |
| PRD-08a | pendente |
| PRD-08b | pendente |
| PRD-09 | pendente |
