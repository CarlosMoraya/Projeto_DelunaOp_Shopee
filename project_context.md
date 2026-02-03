
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
- `COMPARATIVO_ATS`: Comparação de volume bruto de ATs entre períodos.
- `QLP_MANAGEMENT`: Gestão de motoristas e metas de ativação.
- `PROTAGONISMO`: Avaliação mensal de excelência por Base.
- `LEADERBOARD`: Página **Campanha Acelera 30+**. 

## Responsividade (Mobile-First)
- Layouts de grid adaptativos para visualização financeira em dispositivos móveis.
- Tabelas com `min-w-[1000px]` para preservar a legibilidade dos dados de faturamento.
