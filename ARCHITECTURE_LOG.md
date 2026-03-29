# Deluna Ops - Architecture & Decision Log

This file records key technical decisions, major features, and architectural changes to maintain context across development sessions.

---

## [2026-02-21] Initial Memory Setup
- **Objective**: Establish a systematic context-retention strategy.
- **Decision**: Created this log and updated `.cursorrules` to enforce mandatory reading of context files (`project_context.md`, `design_system.md`, and this log) before any work.

## [2026-02-21] Recent Enhancements (Context Recovery)
- **QLP Management Charts**: 
    - Added interactive Donut Chart (Vehicle Types) and Bar Chart (Vehicles per Base).
    - Logic: Charts update in real-time based on sidebar filters.
- **Leaderboard (Campanha Acelera 30+)**:
    - Logic: Dynamic status ("Acesso a campanha" vs "Fora do Jogo") based on performance against "Meta 1".
    - Data: Fetching images and scores directly from Google Sheets integration.
- **Cross-Page Filters**: Syncing "Active QLP" data across `Comparativo.tsx` and `ComparativoATs.tsx`.

## [2026-02-28] New Feature: Monitoramento (Live View)
- **Objective**: Provide a real-time monitoring dashboard for the Shopee operation.
- **Data Source**: New tab `Monitoramento` in Google Sheets.
- **Key Components**:
    - Total Cards: Assigned, Delivered (#/%), On-hold, Drivers Count.
    - Charts: Delivery Rate per Station (Top 10) and General Progress (Pie Chart).
    - Detailed Table: Granular view with status indicators and search filter.
- **Technical Decision**: Leveraged `fetchBaseMetadata` to integrate coordinator info into the monitoring data.

## Technical Standards
- **Global State**: Navigation via `currentView` in `App.tsx`.
- **Data Source**: Deep integration with Google Sheets via custom API services.
- **UI/UX**: Premium "Dark Brand" look centered around `#1B4332`.
- **Responsive Tables**: Always use `min-w-[1000px]` with horizontal scroll to preserve data density.

## [2026-03-01] Google Sheets Rename: Base_Rotas_2026 → Base_Rotas
- **Cause**: User renamed the tab in Google Sheets and added a new `Id Driver` column.
- **Fix**: Updated `api.ts` `fetchDeliveryData` to fetch `?tab=Base_Rotas` (was `Base_Rotas_2026`).
- **Cache**: Incremented `CACHE_KEY` from `v5` to `v6` to force cache invalidation on all clients.
- **New field**: Added `driverId?: string` to `DeliveryData` interface (maps `Id Driver` column), enabling future cross-reference with the QLP tab's `Id Driver`.

## [2026-03-03] Fix: Valor PNR Formatting (Google Sheets Interpretation)
- **Problem**: Google Sheets intermittently interpreted "2.40" as dates (e.g., "02/04"), causing zeroes or mangled values in the PNR table.
- **Solution**:
    - **API Layer**: Improved `fetchPNRData` to classify values into numbers or text. Detects ISO dates and attempts recovery.
    - **Types**: Extended `PNRRow` and `PNROperationalDetail` to support mixed types (`number | string`) and `textValues` collection during grouping.
    - **UI Layer**: Implemented a custom formatter in `PNRStuck.tsx` that replaces `.` with `,` for both numbers and text, fulfilling the project's formatting requirements for the Brazilian locale.
    - **Visual**: The "Valor PNR" column now shows the numeric sum alongside a parenthetical list of any text-based values encountered.

## [2026-03-29] Migração Monitoramento: Google Sheets → BigQuery
- **Objetivo**: Migrar a fonte de dados da página `Monitoramento` do Google Sheets para o BigQuery, utilizando a infraestrutura de ELT já existente.
- **Contexto**: Projeto ETL-Shopee já extrai dados da Shopee e Google Sheets para o BigQuery diariamente/hourly.
- **Solução**:
    - **Backend**: Criação da Cloud Function `get-monitoramento` no projeto `etl-shopee-dashboard`.
    - **Query**: JOIN entre `shopee_monitoramento` (dados de entrega) e `liderancas_hub` (coordenador, localidade).
    - **Frontend**: Nova função `fetchMonitoramentoDataBigQuery()` no `api.ts`.
    - **Cache**: 30 minutos para dados do BigQuery (dados mais frescos).
- **Arquivos Criados**:
    - `ETL-Shopee/cloud_function_monitoramento.py`: Cloud Function com endpoint HTTP.
    - `ETL-Shopee/deploy_monitoramento.sh`: Script de deploy automatizado.
    - `ETL-Shopee/DEPLOY_MONITORAMENTO.md`: Documentação de deploy.
- **Arquivos Modificados**:
    - `services/api.ts`: Adicionada função `fetchMonitoramentoDataBigQuery()`.
    - `pages/Monitoramento.tsx`: Atualizado para usar nova função.
- **Próximos Passos**: Fazer deploy da Cloud Function e atualizar URL no `api.ts`.

## [2026-03-29] Otimização: Métricas Calculadas no BigQuery (Opção B)
- **Decisão**: Migrar cálculos de métricas do frontend para o BigQuery.
- **Motivo**: Usuários usam poucos filtros e dados são atualizados de 1 em 1 hora.
- **Trade-off Aceito**:
    - ✅ Performance melhor no frontend (dados já processados)
    - ✅ Menos tráfego de rede (agregados ao invés de dados brutos)
    - ✅ Cálculos centralizados no backend
    - ❌ Filtros no cliente exigem nova requisição (aceitável pois são pouco usados)
- **Implementação**:
    - **Cloud Function**: 4 queries separadas:
        1. `fetch_metrics_from_bigquery()`: Cards de métricas (totalAssigned, totalPending, openRoutes, totalDrivers, successRate)
        2. `fetch_top_stations_from_bigquery()`: Top 10 estações por taxa de entrega
        3. `fetch_progress_data_from_bigquery()`: Progresso (concluídas vs pendentes)
        4. `fetch_raw_data_from_bigquery()`: Dados brutos para tabela
    - **Frontend**: 
        - `totals`: Usa `apiData.metrics` (fallback: calcula no frontend)
        - `stationData`: Usa `apiData.topStations` (fallback: calcula no frontend)
        - `progressData`: Usa `apiData.progressData` (fallback: calcula no frontend)
- **Estrutura da Resposta API**:
```json
{
  "success": true,
  "metrics": {
    "totalAssigned": 2926,
    "totalPending": 1597,
    "openRoutes": 120,
    "totalDrivers": 121,
    "successRate": 45.4
  },
  "topStations": [...],
  "progressData": [...],
  "rawData": [...]
}
```
- **Decisão de Dados**: View deve mostrar **TODOS os registros** da tabela `shopee_monitoramento`, independente de:
    - Data preenchida ou null
    - `assigned_time` válido ou inválido
    - Estar associado a um hub ou não (LEFT JOIN com `liderancas_hub`)
- **Status**: ✅ Implementado e testado. Build aprovado.
