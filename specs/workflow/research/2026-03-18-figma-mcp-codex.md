# 2026-03-18 — Figma MCP no Codex

## Objetivo

Padronizar o uso do MCP oficial remoto do Figma no Codex para referência de telas e componentes por link, sem replicar o setup `figma-console-mcp` usado no Claude.

## Estado validado

- O Codex deste ambiente já está configurado globalmente com o servidor oficial do Figma em `C:\Users\vbnde\.codex\config.toml`
- Configuração validada:

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
```

- A autenticação respondeu com sucesso via `whoami`
- Nenhuma alteração no repositório é necessária para habilitar a conexão MCP em si

## Decisão operacional

Para este projeto, o workflow oficial no Codex passa a ser:

- usar o MCP remoto oficial do Figma
- trabalhar por link de frame ou node com `node-id`
- usar `get_design_context` como ferramenta principal
- usar `get_metadata` e `get_screenshot` como apoio para inspeção estrutural e validação visual
- tratar Code Connect como etapa separada da conexão MCP

Não faz parte deste setup no Codex:

- `figma-console-mcp`
- personal access token manual
- desktop bridge/plugin do tutorial do Claude
- seleção ao vivo no app desktop como requisito inicial

## Teste executado

### Conectividade

Validações concluídas com sucesso:

- `whoami` retornou o usuário autenticado no Figma
- o servidor `figma` está disponível nesta sessão do Codex

### Teste com link real

Foi encontrado um link real de Figma nas notas locais:

- origem: `C:\Users\vbnde\Obsidian\journey\design\mba\research ops\Research Ops.md`
- file key identificado no link: `rQyT8SI10mz6cVZkDC4DtB`
- node id identificado no link: `1:21`

Ferramentas testadas:

- `get_design_context`
- `get_screenshot`
- `get_metadata`

Resultado:

- todas retornaram erro de acesso ao arquivo
- isso confirmou que a conexão e a autenticação estão saudáveis, mas o arquivo referenciado não está acessível para a conta autenticada via MCP

## Interpretação correta do erro

`This figma file could not be accessed` não significa que o MCP está quebrado.

Neste contexto, significa que:

- o MCP está ativo
- a conta autenticada existe e responde
- o arquivo testado não pertence a um contexto acessível para essa conta, ou a permissão efetiva de leitura não está disponível via MCP

## Workflow recomendado para o time

Quando quiser usar Figma no Codex:

1. copiar o link exato do frame, componente ou variant no Figma
2. garantir que o link tenha `node-id`
3. colar esse link na conversa com o Codex
4. pedir implementação ou refinamento com base nesse node
5. se houver erro de acesso, trocar para um arquivo que a conta autenticada realmente consiga abrir

## Fronteira com Code Connect

A conexão MCP resolve agora:

- contexto de tela e componente
- screenshot
- metadata
- variáveis, quando consultadas

O que continua pendente para etapa futura:

- mapear componentes do Figma para arquivos reais do repositório
- fazer o MCP devolver referências concretas de componentes do código
- usar Code Connect como camada de fidelidade extra

## Resultado prático

O Codex já está pronto para usar Figma como contexto de implementação por link.

O próximo passo operacional, quando necessário, é fornecer um link de Figma que esteja acessível para a conta autenticada no MCP.