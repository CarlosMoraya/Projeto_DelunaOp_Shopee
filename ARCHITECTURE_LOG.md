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
