# Visual Changelog — Tweaks

Registro de ajustes visuais simples que não justificam PRD completo.

## Formato

```
## YYYY-MM-DD — Título do ajuste
- **Problema:** o que estava errado visualmente
- **Solução:** o que foi feito
- **Branch:** fix/visual-descricao | PR: #NN
```

---

## 2026-03-19 — Padding da área de conteúdo principal
- **Problema:** `<main>` no layout interno sem padding — conteúdo colado nas bordas
- **Solução:** adicionado `px-ds-56 py-ds-32` via tokens de spacing do DS (56px horizontal, 32px vertical), conforme Figma node `120:792`
- **Branch:** fix/visual-content-padding | PR: —

## 2026-03-19 — Alinhamento de tamanho dos botões outline na PageToolbar
- **Problema:** `SelectTrigger` dos filtros ("Selecionar status" / "Selecionar cliente") aparecia menor que o botão filled "Novo projeto" — base do componente tem `data-[size=default]:h-8` com especificidade de atributo, sobrescrevendo `h-14`; além disso, padding (`py-2 pl-2.5 pr-2`), gap (`gap-1.5`) e font-size (`text-sm`) abaixo do padrão DS
- **Solução:** adicionado `data-[size=default]:h-14` para sobrescrever o seletor de atributo; ajustado para `p-4`, `gap-4`, `text-base` e ícone chevron com `size-6` + cor brand — alinhado com o componente Button do Figma (node `61:480`, `p-16px / gap-16px / text-body-md`)
- **Branch:** fix/visual-outline-button-sizing | PR: —

## 2026-03-19 — Layout responsivo da tabela de projetos
- **Problema:** tabela ocupava largura fixa (~1420px) e transbordava container; conteúdo saía para fora quando viewport era menor; colunas "Horas" e "Orçamento" não adicionavam valor visual
- **Solução:** remover colunas "Horas" e "Orçamento"; fazer `primaryInfo` fluido (`flex-1 min-w-[380px]`); adicionar `overflow-x-auto` ao container; substituir spacing hardcoded por tokens DS (`gap-ds-64`, `p-ds-24`, `gap-ds-16`, etc). Tabela agora respeita espaço disponível e mostra scroll horizontal apenas quando necessário
- **Branch:** fix/visual-outline-button-sizing | PR: —

<!-- Novos registros acima desta linha -->
