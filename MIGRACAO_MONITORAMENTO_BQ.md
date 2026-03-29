# Migração Monitoramento: Google Sheets → BigQuery

## Resumo da Implementação

Esta documentação descreve a migração da página `Monitoramento` do frontend DelunaOps para consumir dados diretamente do BigQuery, utilizando a infraestrutura de ELT já existente.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    BigQuery (etl-shopee-dashboard)              │
│  ┌──────────────────────┐    ┌─────────────────────────────┐   │
│  │ shopee_monitoramento │    │ liderancas_hub              │   │
│  │ - driver_id          │    │ - hub (PK)                  │   │
│  │ - driver_name        │───▶│ - supervisor_|_coordenador  │   │
│  │ - driver_station     │    │ - lider                     │   │
│  │ - assigned           │    │ - localidade                │   │
│  │ - deliverednum       │    └─────────────────────────────┘   │
│  │ - deliveredperc      │                                      │
│  │ - assigned_time      │                                      │
│  │ - on-hold            │                                      │
│  └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JOIN via SQL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloud Function (get-monitoramento)                 │
│  - Endpoint HTTP público                                        │
│  - Cache em memória (5 minutos)                                 │
│  - Retorna JSON formatado para o frontend                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ fetch()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend DelunaOps                                 │
│  - fetchMonitoramentoDataBigQuery() em api.ts                   │
│  - Cache localStorage (30 minutos)                              │
│  - Página Monitoramento.tsx                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos Criados/Modificados

### Projeto ETL-Shopee

| Arquivo | Descrição |
|---------|-----------|
| `cloud_function_monitoramento.py` | Cloud Function que serve os dados via HTTP |
| `deploy_monitoramento.sh` | Script de deploy automatizado |
| `DEPLOY_MONITORAMENTO.md` | Documentação completa de deploy |
| `check_schema.py` | Script para verificar schema de tabelas |
| `check_schema_liderancas.py` | Script para verificar schema da tabela liderancas_hub |

### Projeto DelunaOps

| Arquivo | Mudança |
|---------|---------|
| `services/api.ts` | Adicionada função `fetchMonitoramentoDataBigQuery()` |
| `pages/Monitoramento.tsx` | Atualizado import para nova função |
| `ARCHITECTURE_LOG.md` | Documentada a decisão arquitetural |

## Passo a Passo para Deploy

### 1. Deploy da Cloud Function

```bash
cd /home/cmoraya/Documentos/Projetos/ETL-Shopee
./deploy_monitoramento.sh
```

Ou manualmente:

```bash
gcloud functions deploy get-monitoramento \
  --gen2 \
  --runtime=python311 \
  --region=southamerica-east1 \
  --source=. \
  --entry-point=get_monitoramento \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=60s \
  --set-env-vars=GCP_PROJECT_ID=etl-shopee-dashboard,BQ_DATASET_ID=raw_data
```

### 2. Obter URL do Endpoint

```bash
gcloud functions describe get-monitoramento \
  --region=southamerica-east1 \
  --format="value(serviceConfig.uri)"
```

### 3. Atualizar URL no Frontend

No arquivo `services/api.ts`, a URL já está atualizada:

```typescript
const MONITORAMENTO_BQ_URL = 'https://get-monitoramento-4fffvflp3q-rj.a.run.app';
```

### 4. Testar no Frontend

```bash
cd /home/cmoraya/Documentos/Projetos/Projeto_DelunaOp_Shopee
npm run dev
```

Navegue até a página **Monitoramento** e verifique se os dados estão carregando.

## Query SQL Utilizada

```sql
SELECT 
    m.driver_id,
    m.driver_name,
    m.driver_station,
    m.assigned,
    m.delivery_progress,
    m.deliverednum,
    m.deliveredperc,
    m.on-hold,
    m.assigned_time,
    m.time_since_last_delivery,
    l.localidade,
    l.supervisor_|_coordenador AS coordinator
FROM `etl-shopee-dashboard.raw_data.shopee_monitoramento` m
LEFT JOIN `etl-shopee-dashboard.raw_data.liderancas_hub` l
    ON m.driver_station = l.hub
WHERE DATE(m.assigned_time, 'America/Sao_Paulo') = CURRENT_DATE('America/Sao_Paulo')
ORDER BY m.assigned_time DESC
```

## Cache Implementado

| Camada | Duração | Local |
|--------|---------|-------|
| Cloud Function | 5 minutos | Memória da função |
| Frontend | 30 minutos | localStorage do navegador |

## Vantagens Desta Abordagem

1. **Dados em Tempo Real**: Atualização hourly via Cloud Run Jobs
2. **JOIN no Backend**: Coordenador e localidade já vêm prontos do BigQuery
3. **Performance**: Cache em duas camadas reduz consultas ao BigQuery
4. **Serverless**: Sem infraestrutura para gerenciar
5. **Custo Baixo**: BigQuery cobra por consulta, Cloud Function tem free tier generoso

## Troubleshooting

### Dados não carregam no frontend

1. Verifique o console do navegador (F12) por erros
2. Teste a API diretamente: `curl https://SEU_ENDPOINT.a.run.app`
3. Verifique os logs da Cloud Function:

```bash
gcloud functions logs read get-monitoramento \
  --region=southamerica-east1 \
  --limit=50
```

### Erro de permissão no BigQuery

Verifique se a Service Account tem permissão `bigquery.jobs.create`:

```bash
gcloud projects add-iam-policy-binding etl-shopee-dashboard \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/bigquery.jobUser
```

## Próximas Melhorias Possíveis

1. **Filtro por data no backend**: Adicionar parâmetro `?date=2026-03-29` na API
2. **Webhook de atualização**: Invalidar cache automaticamente quando o ELT rodar
3. **Metrics/Logs**: Adicionar tracking de latência e erro da API
4. **Rate Limiting**: Proteger a API contra abuso
