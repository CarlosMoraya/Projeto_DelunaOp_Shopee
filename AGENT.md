# Deluna Ops - Contexto do Projeto

## Visão Geral

**Deluna Ops** é um painel de controle logístico de alta performance para a operação Deluna (parceria com Shopee). O sistema fornece métricas de sucesso de entrega (DS), gestão de volume de ATs (veículos), acompanhamento de QLP (motoristas), rankings de performance e monitoramento em tempo real.

A aplicação é uma **Single Page Application (SPA)** construída com React 19, TypeScript e Vite, com integração direta a uma API Google Sheets que serve como backend de dados.

## Stack Tecnológico

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | React 19.2.4 |
| **Linguagem** | TypeScript 5.8.2 |
| **Build Tool** | Vite 6.2.0 |
| **Estilização** | Tailwind CSS (classes utilitárias) |
| **Gráficos** | Recharts 3.7.0 |
| **Ícones** | Material Symbols Outlined |
| **Fontes** | Plus Jakarta Sans (títulos), Inter (UI), Manrope (métricas) |

## Estrutura do Projeto

```
Projeto_DelunaOp_Shopee/
├── components/          # Componentes reutilizáveis
│   ├── Header.tsx       # Cabeçalho com seletor de datas
│   └── Sidebar.tsx      # Navegação lateral com identidade visual
├── pages/               # Páginas/Views da aplicação
│   ├── DeliverySuccess.tsx      # Dashboard principal de Delivery Success
│   ├── Comparativo.tsx          # Comparação de taxa de sucesso (%)
│   ├── ComparativoATs.tsx       # Comparação de volume de ATs
│   ├── QLPManagement.tsx        # Gestão de motoristas e metas
│   ├── Protagonismo.tsx         # Ranking de excelência por Base
│   ├── Leaderboard.tsx          # Campanha Acelera 30+
│   ├── PNRStuck.tsx             # Gestão de PNRs (pendências)
│   ├── VirtualBank.tsx          # Banco Virtual de acumulado
│   ├── Monitoramento.tsx        # Live View de entregas
│   ├── CapacityManagement.tsx   # Gestão de capacidade
│   └── Login.tsx                # Tela de autenticação
├── services/
│   └── api.ts           # Integração com Google Sheets API
├── App.tsx              # Componente raiz com roteamento por estado
├── types.ts             # Definições de tipos e enum AppView
├── index.tsx            # Ponto de entrada
├── vite.config.ts       # Configuração do Vite
└── tsconfig.json        # Configuração do TypeScript
```

## Arquitetura

### Roteamento

O roteamento é gerenciado via estado `currentView` no `App.tsx` usando o enum `AppView`:

```typescript
enum AppView {
  DELIVERY_SUCCESS = 'delivery_success',
  COMPARATIVO = 'comparativo',
  COMPARATIVO_ATS = 'comparativo_ats',
  QLP_MANAGEMENT = 'qlp_management',
  PROTAGONISMO = 'protagonismo',
  LEADERBOARD = 'leaderboard',
  PNR_STUCK = 'pnr_stuck',
  BANCO_VIRTUAL = 'banco_virtual',
  MONITORAMENTO = 'monitoramento',
  CAPACITY_MANAGEMENT = 'capacity_management'
}
```

### Fonte de Dados

Todos os dados são obtidos de uma **Google Sheets API** via Google Apps Script:
- **URL Base**: `https://script.google.com/macros/s/AKfycbxyVb9TMALRPhF5ir1h_A6DY3w03F8H88owvGz4d_oTaYzVv_y3oPOSL9LTu26IS_DGng/exec`
- **Tabs principais**: `Base_Rotas`, `QLP`, `Monitoramento`, `PNR`, `Metas`, `Acessos`, etc.
- **Cache**: Implementado via `localStorage` com duração de 12 horas por tab

### Autenticação

Sistema simples baseado em e-mail:
- Credenciais validadas contra a tab `Acessos` no Google Sheets
- Persistência via `localStorage` (`deluna_user_email`, `deluna_user_name`)

## Design System

### Paleta de Cores

| Token | Hex | Uso |
|-------|-----|-----|
| `deluna-primary` | `#1B4332` | Sidebar, headers, elementos primários |
| `deluna-primary-light` | `#2D6A4F` | Tons secundários |
| `deluna-accent` | `#40916C` | Status ativo, sucesso |
| `deluna-teal` | `#2C7A7B` | Tendências, elementos informativos |
| `deluna-gold` | `#C5A059` | Rankings, medalhas, prêmios |
| `deluna-alert` | `#BC4749` | Alertas, quedas, insucessos |
| Background | `#F8FAFC` | Fundo das páginas |

### Padrões de Componentes

**Tabelas:**
- Header: fundo `deluna-primary`, texto branco, font 10-11px, uppercase
- Rows: alternância `bg-white` / `bg-slate-50`, hover com transparência verde
- Responsividade: usar `min-w-[1000px]` com scroll horizontal

**Cards de Métrica:**
- Fundo branco, borda `slate-200`, sombra `shadow-sm`
- Valor principal: `text-3xl font-extrabold`
- Badge de variação com fundo suave (ex: `bg-green-100`)

## Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (porta 3000)
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

### Variáveis de Ambiente

Criar arquivo `.env.local` na raiz:

```
GEMINI_API_KEY=sua_chave_aqui
```

## Convenções de Desenvolvimento

### Tipos e Interfaces

Todas as definições estão em `types.ts`. Principais interfaces:

- `DeliveryData`: Dados de entrega por motorista
- `QLPData`: Cadastro de motoristas/veículos
- `MonitoramentoData`: Dados em tempo real
- `PNRRow`: Pendências de entrega
- `VirtualBankData`: Acumulado financeiro por base
- `CapacityData`: Gestão de capacidade de motoristas

### Helper Functions (api.ts)

```typescript
// Extrair valor de coluna (case-insensitive)
getVal(row, 'NomeDaColuna')

// Parse numérico (suporta formato BR: "1.234,56")
parseNum(valor)
```

### Cache

Cada endpoint tem sua própria chave de cache:
- `delivery_data_cache_v6`
- `qlp_data_cache_v5`
- `pnr_data_cache_v12`
- etc.

Para invalidar cache: incrementar o número da versão ou chamar `clearApiCache()`.

## Funcionalidades Principais

### 1. Delivery Success (Dashboard)
- Visão geral de indicadores globais de entrega
- Filtros por período (startDate/endDate)

### 2. Comparativo & Comparativo ATs
- Comparação de performance entre períodos
- Taxa de sucesso (%) e volume bruto de ATs

### 3. QLP Management
- Gestão de motoristas ativos
- Gráficos interativos (Donut: tipos de veículo, Barra: veículos por base)
- Filtros sincronizados entre páginas

### 4. Protagonismo
- Ranking mensal de excelência por Base
- Avaliação baseada em metas estabelecidas

### 5. Leaderboard (Campanha Acelera 30+)
- Status dinâmico baseado em performance
- Imagens e scores do Google Sheets

### 6. PNR Stuck
- Gestão de pendências de entrega
- Valores formatados para locale brasileiro (vírgula decimal)

### 7. Monitoramento (Live View)
- Cards totais: atribuídos, entregues, on-hold
- Gráficos: Delivery Rate por Station (Top 10)
- Tabela detalhada com indicadores de status

### 8. Virtual Bank
- Acumulado financeiro por base
- Previsão de bônus

### 9. Capacity Management
- Gestão de capacidade de motoristas
- Status e informações de veículos

## Histórico de Mudanças Recentes

- **[2026-03-03]** Fix: Formatação de Valor PNR para interpretação correta do Google Sheets
- **[2026-03-01]** Rename: Tab `Base_Rotas_2026` → `Base_Rotas`, adição de campo `driverId`
- **[2026-02-28]** Nova feature: Monitoramento (Live View) com dados em tempo real
- **[2026-02-21]** Setup inicial com estratégia de retenção de contexto

## Links Úteis

- **AI Studio App**: https://ai.studio/apps/drive/1eD8SSTGvuUl234WMpofoHW0Ix8CZWEtD
