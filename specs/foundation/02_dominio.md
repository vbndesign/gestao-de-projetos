# 02 — Domínio

Entidades, relacionamentos, regras de negócio, fluxos e regras de exclusão do sistema.

---

## Entidades

### 1. Cliente

Pessoa, empresa ou organização associada a um ou mais projetos.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| nome | string | sim |
| empresa_organizacao | string | não |
| email_principal | string | não |
| telefone_contato | string | não |
| observacoes | text | não |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- Um cliente pode ter vários projetos
- Um projeto pertence a um único cliente

---

### 2. Projeto

Unidade principal de acompanhamento.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| cliente_id | uuid | sim |
| nome | string | sim |
| descricao | text | não |
| status | enum | sim |
| data_inicio | date | sim |
| previsao_entrega | date | não |
| data_conclusao_real | date | não |
| fase_atual_id | uuid | não |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Status possíveis:** `rascunho` · `ativo` · `aguardando_cliente` · `pausado` · `concluido` · `arquivado`

**Regras**
- Ao criar um projeto, o sistema cria automaticamente a fase **Geral do projeto** (`is_fase_geral = true`)
- `fase_atual_id` deve apontar para uma fase pertencente ao próprio projeto

---

### 3. Fase

Etapa macro do projeto.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| nome | string | sim |
| descricao | text | não |
| ordem | integer | sim |
| status | enum | sim |
| data_inicio_prevista | date | não |
| data_fim_prevista | date | não |
| data_inicio_real | date | não |
| data_fim_real | date | não |
| is_fase_geral | boolean | sim |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Status possíveis:** `nao_iniciada` · `em_andamento` · `aguardando_cliente` · `concluida` · `pausada` · `cancelada`

**Regras**
- Cada projeto tem exatamente uma fase com `is_fase_geral = true`
- A fase geral sempre ocupa a primeira posição e não pode ser reordenada
- As demais fases podem ser reordenadas pelo usuário

---

### 4. Tarefa Planejada

Atividade macro planejada dentro de uma fase.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| fase_id | uuid | sim |
| titulo | string | sim |
| descricao | text | não |
| tempo_estimado_horas | decimal | não |
| ordem | integer | sim |
| status | enum | sim |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Status possíveis:** `nao_iniciada` · `em_andamento` · `concluida` · `cancelada`

**Regras**
- Granularidade macro — não operacional
- Tarefas podem ser reordenadas dentro da fase
- Tarefas são visíveis ao cliente no portal
- Tarefas não têm vínculo obrigatório com lançamentos de horas no MVP
- Tarefas não geram eventos na timeline

---

### 5. Lançamento de Horas

Registro manual de esforço executado.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | sim |
| data_lancamento | date | sim |
| descricao | text | sim |
| horas_gastas | decimal | sim |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- `fase_id` deve pertencer ao `projeto_id` informado
- Para registros sem fase específica, usar a fase **Geral do projeto**
- Lançamentos são internos — nunca aparecem para o cliente
- Lançamentos não geram evento na timeline
- Ordenação por `data_lancamento`; empate resolvido por `created_at`

---

### 6. Reunião

Encontro, call ou sessão relevante do projeto.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| titulo | string | sim |
| data_reuniao | date | sim |
| participantes | text | não |
| link_referencia | string | não |
| resumo_executivo | text | não |
| ata_resumida | text | não |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- Reunião pode originar evento na timeline
- Reunião pode servir de base para decisões, pendências ou checkpoints

---

### 7. Decisão

Decisão formal ou relevante tomada no projeto.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| reuniao_id | uuid | não |
| titulo | string | sim |
| descricao | text | sim |
| contexto | text | não |
| impacto | text | não |
| data_decisao | date | sim |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- Pode ter origem em reunião, mas não é obrigatório
- Decisão pode gerar evento na timeline

---

### 8. Checkpoint

Marco resumido do projeto.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| titulo | string | sim |
| resumo | text | sim |
| proximos_passos | text | não |
| data_checkpoint | date | sim |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- Checkpoint pode gerar evento na timeline
- Adequado para comunicação de avanço ao cliente

---

### 9. Pendência

Algo que precisa ser resolvido, enviado, aprovado ou respondido.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| titulo | string | sim |
| descricao | text | não |
| status | enum | sim |
| prazo | date | não |
| data_resolucao | date | não |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Status possíveis:** `aberta` · `em_andamento` · `resolvida` · `cancelada`

**Regras — timeline de pendência**

Quando uma pendência é **criada**: o sistema registra o evento internamente (pode aparecer na timeline enquanto aberta).

Quando uma pendência é **resolvida**:
1. Remove o evento `pendencia_criada` da timeline
2. Mantém a pendência no banco
3. Cria evento `pendencia_resolvida` na timeline

Resultado: apenas o evento de resolução aparece na timeline — sem duplicação.

---

### 10. Documento

Arquivo, link, entregável ou material relevante.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| titulo | string | sim |
| descricao | text | não |
| tipo_documento | string | não |
| url_arquivo_ou_link | string | sim |
| data_publicacao | date | não |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- Documento pode gerar evento na timeline quando publicado
- Pode ser usado como entregável visível ao cliente

---

### 11. Mudança de Direção

Mudança de escopo, prioridade, estratégia ou rota do projeto.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| titulo | string | sim |
| descricao | text | sim |
| motivo | text | não |
| impacto_em_prazo | text | não |
| impacto_em_escopo | text | não |
| data_mudanca | date | sim |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Regras**
- Mudança de direção pode gerar evento na timeline

---

### 12. Evento de Timeline

Acontecimento relevante exibido na linha do tempo do projeto. Entidade explícita no banco.

**Campos**

| Campo | Tipo | Obrigatório |
|---|---|---|
| id | uuid | sim |
| projeto_id | uuid | sim |
| fase_id | uuid | não |
| tipo_evento | enum | sim |
| titulo | string | sim |
| descricao | text | não |
| data_evento | date | sim |
| origem_tipo | string | não |
| origem_id | uuid | não |
| created_at | timestamp | sim |
| updated_at | timestamp | sim |

**Tipos de evento**

`projeto_criado` · `fase_iniciada` · `fase_concluida` · `reuniao_registrada` · `decisao_registrada` · `checkpoint_registrado` · `pendencia_criada` · `pendencia_resolvida` · `documento_publicado` · `mudanca_direcao` · `atualizacao_manual`

**Regras**
- Timeline ordenada por `data_evento`; empate resolvido por `created_at`
- Lançamentos de horas **nunca** geram evento
- Microações operacionais **não** entram na timeline
- A timeline representa: avanços, marcos, decisões, entregas e resoluções de pendências

---

## Relacionamentos

```
Cliente (1) ──── (N) Projeto
Projeto (1) ──── (N) Fase
Fase    (1) ──── (N) Tarefa Planejada
Projeto (1) ──── (N) Lançamento de Horas
Fase    (1) ──── (N) Lançamento de Horas
Projeto (1) ──── (N) Reunião / Decisão / Checkpoint / Pendência / Documento / Mudança de Direção
Projeto (1) ──── (N) Evento de Timeline
```

---

## Fluxos principais

### Fluxo 1 — Criação do projeto

1. Usuário seleciona cliente existente ou cria novo
2. Informa dados do projeto (nome, status, data_inicio, etc.)
3. Sistema cria automaticamente a fase **Geral do projeto** (`is_fase_geral = true`, ordem = 1, status = `nao_iniciada`)
4. Usuário pode criar fases adicionais e reordená-las (exceto a Geral)
5. Usuário pode definir `fase_atual_id` quando fizer sentido

**Resultado:** projeto com cliente vinculado, dados básicos e fase Geral pronta para receber tarefas e registros.

---

### Fluxo 2 — Atualização do projeto

O projeto é mantido vivo em duas camadas: **planejamento** e **histórico narrativo**.

**Dados editáveis do projeto:** nome · descrição · status · previsão de entrega · data de conclusão real · fase atual

**Fases:** criar · editar · alterar status · preencher datas · reordenar (exceto Geral)

**Tarefas planejadas:** criar · editar · alterar status · reordenar dentro da fase

**Registros operacionais:** reunião · decisão · checkpoint · pendência · documento · mudança de direção

Sempre que um registro relevante for criado, o sistema gera ou atualiza eventos na timeline conforme as regras de cada entidade.

---

### Fluxo 3 — Lançamento de horas

1. Usuário acessa o projeto
2. Seleciona a fase (obrigatório — usar Geral se não houver fase específica)
3. Informa data, descrição e horas gastas
4. Sistema salva vinculado ao projeto e à fase, sem gerar evento na timeline

**Resultado:** total de horas calculável por fase e por projeto, sem exposição ao cliente.

---

### Fluxo 4 — Portal do cliente

O cliente acessa o projeto via slug público e visualiza:

- Visão geral: nome, status, fase atual em destaque
- Fases: nome · status · posição · tarefas planejadas com status
- Timeline: eventos relevantes em ordem cronológica
- Documentos publicados e entregáveis

O cliente **nunca vê:** lançamentos de horas, tempo gasto, observações internas.

---

### Fluxo 5 — Fechamento do projeto

1. Revisão das fases (concluídas, pausadas, canceladas)
2. Conclusão ou cancelamento das tarefas restantes
3. Revisão e resolução das pendências abertas
4. Criação opcional de checkpoint final
5. Atualização do status para `concluido` ou `arquivado`
6. Registro de `data_conclusao_real`

**Resultado:** projeto encerrado com planejamento histórico, timeline e documentos preservados.

---

## Regras de exclusão (MVP)

O MVP usa **exclusão direta** — sem soft delete, lixeira ou histórico de exclusão. Exclusões são permanentes.

### Fases

- Qualquer fase criada manualmente pode ser excluída
- A fase **Geral do projeto não pode ser excluída**
- Ao excluir uma fase: todas as tarefas planejadas e lançamentos de horas vinculados são excluídos em cascata (`onDelete: Cascade` no schema Prisma)
- Eventos de timeline associados à fase permanecem (perdem a referência à fase)

### Tarefas planejadas

- Qualquer tarefa pode ser excluída
- Nenhum impacto na timeline

### Lançamentos de horas

- Qualquer lançamento pode ser excluído
- Os totais de horas do projeto e da fase são recalculados automaticamente
- Nenhum impacto na timeline

### Registros operacionais (reunião, decisão, checkpoint, pendência, documento, mudança de direção)

- Podem ser excluídos pelo usuário
- Eventos de timeline associados devem ser removidos junto

---

## Restrições absolutas da fase Geral

- Não pode ser excluída
- Não pode ser reordenada
- Sempre ocupa a primeira posição (`ordem = 1`)
- Sempre deve existir (exatamente uma por projeto)
