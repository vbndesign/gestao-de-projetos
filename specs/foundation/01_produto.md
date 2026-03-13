# Produto — Gestão de Projetos

> Escopo congelado do MVP. Fonte de verdade sobre o que o sistema faz e o que está fora.

---

## Problema

Projetos estratégicos têm informações dispersas entre documentos, calls e ferramentas genéricas. Isso gera três problemas:

1. **Falta de visibilidade para o cliente** — acompanha o projeto apenas em reuniões isoladas, sem visão contínua do progresso
2. **Histórico fragmentado** — decisões, reuniões e avanços ficam espalhados, sem linha do tempo estruturada
3. **Baixa rastreabilidade operacional** — não há forma clara de acompanhar planejamento, execução e esforço

---

## Proposta de valor

Sistema simples de acompanhamento de projetos que funciona simultaneamente como:

- **Ferramenta operacional interna** — planejamento, registro de execução, controle de esforço
- **Portal de acompanhamento para o cliente** — visibilidade filtrada, sem dados internos
- **Registro histórico estruturado** — timeline narrativa do projeto ao longo do tempo

---

## Dois contextos de uso

| Contexto | Quem acessa | O que vê |
|---|---|---|
| **Painel interno** | Equipe (autenticado) | Tudo: planejamento, horas, registros operacionais, timeline completa |
| **Portal do cliente** | Cliente (link público por slug) | Fases, tarefas, timeline filtrada, documentos — nunca horas ou dados internos |

---

## Escopo do MVP — o que está incluído

### Planejamento
- Cadastro de clientes (nome, empresa, email, telefone, observações)
- Cadastro e gestão de projetos com status e datas
- Estrutura de fases por projeto (com fase "Geral do projeto" automática)
- Tarefas planejadas por fase com status e ordenação manual

### Execução e histórico
- Registros operacionais: reunião, decisão, checkpoint, pendência, documento, mudança de direção
- Timeline narrativa do projeto (eventos relevantes em ordem cronológica)

### Esforço
- Registro de lançamentos de horas (interno, por fase)

### Portal do cliente
- Acesso público por slug — fases, tarefas, timeline filtrada, documentos publicados

---

## O que está fora do MVP

- Subtarefas, automações, notificações avançadas
- Sistema de permissões e múltiplos usuários internos
- Relatórios analíticos, billing, integrações externas
- Chat interno, aplicativo mobile
- Soft delete, histórico de alterações, lixeira
- Vínculo entre tarefas planejadas e lançamentos de tempo
- Upload de arquivos (documentos são links externos)
- Portal multi-projeto por cliente

---

## Módulos funcionais

| Módulo | Responsabilidade |
|---|---|
| **Clientes** | Cadastro e gestão de clientes vinculados aos projetos |
| **Projetos** | Unidade principal — status, datas, cliente, fase atual |
| **Fases** | Estrutura macro do projeto — ordenação, status, datas previstas/reais |
| **Tarefas planejadas** | Planejamento macro por fase — visível ao cliente |
| **Registros operacionais** | Reuniões, decisões, checkpoints, pendências, documentos, mudanças de direção |
| **Lançamentos de horas** | Registro interno de esforço por fase — nunca visível ao cliente |
| **Timeline** | Linha do tempo narrativa — gerada automaticamente pelos registros operacionais |
| **Portal do cliente** | Interface pública por slug — visão filtrada do projeto |
