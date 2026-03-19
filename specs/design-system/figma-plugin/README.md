# Design Tokens Importer

Plugin de desenvolvimento do Figma para importar design tokens definidos no repositório.

Estado atual:
- importa `specs/design-system/tokens/typography.json`
- cria/atualiza as collections `Primitives` e `Semantic`
- cria variables e aliases de tipografia
- cria Text Styles locais vinculados a essas variables
- usa `font/family/primary` diretamente nos Text Styles, sem duplicar `family` em `Semantic`

## Estrutura

- `manifest.json` - manifest do plugin para o Figma Desktop
- `code.js` - lógica principal do plugin, sincronização de variables e geração de Text Styles
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
6. Clique em `Import typography`.

## Resultado esperado

O plugin cria ou atualiza:
- collection `Primitives`
- collection `Semantic`
- variables primitivas de tipografia
- variables semânticas de tipografia como aliases para os primitives
- Text Styles locais em `Typography/Heading/*` e `Typography/Body/*`

O plugin remove quando encontrar:
- semantic variables antigas `text/*/*/family` criadas pela versão anterior do fluxo

## Fluxo de desenvolvimento

Sempre que alterar os arquivos do plugin:
1. salve as mudanças no repositório
2. reimporte o manifest no Figma se o plugin já estiver carregado
3. rode novamente o plugin pelo menu `Plugins > Development`

## Próximos domínios

A estrutura foi pensada para crescer para:
- colors
- spacing
- shadows
- radius
- borders

O caminho recomendado é manter um arquivo JSON por domínio em `specs/design-system/tokens/` e estender o plugin para importar cada domínio com variables como source of truth e styles locais quando fizer sentido para o uso dentro do Figma.