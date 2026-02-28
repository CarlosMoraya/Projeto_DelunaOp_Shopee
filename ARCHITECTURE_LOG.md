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
