# Design Tokens Importer

Plugin de desenvolvimento do Figma para importar design tokens definidos no repositório.

Estado atual:
- importa `specs/design-system/tokens/typography.json`
- cria/atualiza as collections `Primitives` e `Semantic`
- cria apenas variables e aliases
- **não cria Text Styles**

## Estrutura

- `manifest.json` - manifest do plugin para o Figma Desktop
- `code.js` - lógica principal do plugin e sincronização de variables
- `ui.html` - interface para colar ou carregar um arquivo JSON

## Como rodar no Figma

Pré-requisito:
- usar o Figma Desktop

Passo a passo:
1. Abra qualquer arquivo no Figma Desktop.
2. Vá em `Plugins > Development > Import plugin from manifest...`.
3. Selecione [manifest.json](/C:/code/gestao-projetos/specs/design-system/figma-plugin/manifest.json).
4. Depois da importação, rode o plugin em `Plugins > Development > Design Tokens Importer`.
5. No plugin, clique em `Load JSON file` e selecione [typography.json](/C:/code/gestao-projetos/specs/design-system/tokens/typography.json), ou cole o conteúdo manualmente.
6. Clique em `Import typography variables`.

## Resultado esperado

O plugin cria ou atualiza:
- collection `Primitives`
- collection `Semantic`
- variables primitivas de tipografia
- variables semânticas de tipografia como aliases para os primitives

O plugin não cria:
- Text Styles
- Color Styles
- Effect Styles
- qualquer outro style do Figma

## Fluxo de desenvolvimento

Sempre que alterar os arquivos do plugin:
1. salve as mudanças no repositório
2. rode novamente o plugin pelo menu `Plugins > Development`

Se o Figma continuar usando uma versão antiga, reimporte o manifest.

## Próximos domínios

A estrutura foi pensada para crescer para:
- colors
- spacing
- shadows
- radius
- borders

O caminho recomendado é manter um arquivo JSON por domínio em `specs/design-system/tokens/` e estender o plugin para importar cada domínio sem sair do modelo `variables-only`.
