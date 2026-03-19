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

<!-- Novos registros acima desta linha -->
