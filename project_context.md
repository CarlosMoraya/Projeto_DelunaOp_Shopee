
# Deluna Ops - Project Context

## Overview
Painel de controle logístico de alta performance para a operação Deluna, focado em métricas de sucesso de entrega (DS), volume de ATs, gestão de QLP e rankings de performance.

## Branding & Identity
- **Logo Header**: Implementação de sistema robusto.
    - Container "Dark Brand Box" (Verde Escuro) para contraste.
    - Suporte a links do Google Drive via conversão de URL automática.
    - **Fallback**: Se a imagem falhar, um logo tipográfico composto (Ícone + Texto) é renderizado via CSS, garantindo integridade visual.
- **Sidebar Identity**: Design limpo focado em navegação.

## Tech Stack
- **Framework**: React 19 (ESM via esm.sh)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (ResponsiveContainer)
- **Icons**: Material Symbols Outlined
- **Fonts**: Plus Jakarta Sans (Títulos), Inter (Dados/UI), Manrope (Métricas Financeiras/Acumulados)

## Navigation Structure (AppView)
O roteamento é gerenciado pelo estado `currentView` no `App.tsx`:
- `DELIVERY_SUCCESS`: Dashboard principal de indicadores globais.
- `COMPARATIVO`: Comparação de taxa de sucesso (%) entre períodos.
- `COMPARATIVO_ATS`: Comparação de volume bruto de ATs entre períodos, com integração de metas da aba "Metas" do Google Sheets.
- `QLP_MANAGEMENT`: Gestão de motoristas e metas de ativação.
- `PROTAGONISMO`: Avaliação mensal de excelência por Base.
- `LEADERBOARD`: Página **Campanha Acelera 30+** com acompanhamento progressivo de metas.

## Responsividade (Mobile-First)
- Layouts de grid adaptativos para visualização financeira em dispositivos móveis.
- Tabelas com `min-w-[1000px]` para preservar a legibilidade dos dados de faturamento.

## Sistema de Metas (Google Sheets - Aba "Metas")

### Estrutura da Planilha
A aba "Metas" contém as seguintes colunas principais:
- **A (Bases)**: Código do Hub/Base (ex: LRJ12, LES03)
- **B (Período)**: Mês de referência (ex: "Março", "03/2026", "MAR")
- **F (Tipo_Meta)**: Tipo da meta (1, 2, 3 - representando faixas de atingimento)
- **G (Valor_Meta_Mês)**: Meta mensal direta (valor absoluto para o mês)
- **H (Valor_Meta_dia)**: Meta diária calculada (Valor_Meta_Mês ÷ dias do mês)
- **I (Valor_Premio)**: Valor do prêmio em R$ para cada faixa

### Lógica de Cálculo das Metas

#### ComparativoATs.tsx
- **Meta 1**: Calculada proporcionalmente aos dias no período selecionado
- Fórmula: `target = Math.round(valorMetaDia * diffDays)`
- Períodos que cruzam meses retornam `null` (exibe "-")
- Suporte a múltiplos formatos de período na planilha: "Janeiro", "01/2026", "JAN/26", etc.

#### Leaderboard.tsx (Campanha Acelera 30+)
- **Cálculo Progressivo**: `target = valorMetaDia * diffDays`
- Permite acompanhamento diário do progresso da campanha
- O participante pode verificar em qualquer dia do mês se está no ritmo da meta
- **Faixas de Meta**:
  - Meta 1 (Tipo 1): Acesso à campanha
  - Meta 2 (Tipo 2): Prêmio intermediário
  - Meta 3 (Tipo 3): Prêmio máximo
- **Pilares de Pontuação**:
  1. Carregamento (Volume de ATs)
  2. Operacional (DS - Delivery Success)
  3. Captação (QLPs aptos)
  4. Perdas (Taxa PNR)
  5. Protagonismo (Nota de avaliação)

### Interface MetaGoalData
```typescript
export interface MetaGoalData {
  base: string;
  periodo: string; // Ex: "Janeiro", "Março"
  tipoMeta: number; // 1, 2, 3
  valorMetaDia: number; // Coluna H - valor diário calculado
  valorMetaMes: number; // Coluna G - meta mensal direta
  valorPremio: number; // Coluna I - prêmio em R$
}
```

### API - fetchMetasData
- Busca dados da aba "Metas" no Google Sheets
- Suporte a múltiplas variações de nomes de colunas
- Cache local por 12 horas (METAS_CACHE_KEY)
- Normalização de nomes de bases e períodos para comparação

