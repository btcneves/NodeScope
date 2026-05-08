# NodeScope v1.2 — Plano de Implementação

> Documento gerado em 2026-05-08. Serve como referência para continuidade da implementação.

## Funcionalidades a Implementar

| # | Feature | Status |
|---|---------|--------|
| 1 | Signet/Mainnet read-only mode + proteção por rede | Em andamento |
| 2 | Gráficos históricos (time-series SVG) | Pendente |
| 3 | Alertas configuráveis (CRUD dinâmico) | Pendente |
| 4 | Ordenação avançada em tabelas | Pendente |
| 5 | Rate limiting (sliding window) | **Arquivo criado** ✓ |
| 6 | Cluster mempool visual real (Bitcoin Core 28+) | Pendente |

## Estado Atual (2026-05-08)

### Arquivos já criados:
- `api/rate_limiter.py` ✓ — Rate limiting ASGI middleware completo
- `api/network_guard.py` ✓ — Network mode detection / read-only guard completo
- `docs/implementation-plan-v1.2.md` ✓ — Este documento

### Próximos passos imediatos (Feature 1 — continuação):
1. Modificar `api/app.py`:
   - Importar `RateLimitMiddleware` e registrar com `app.add_middleware(RateLimitMiddleware)` após linha 161
   - Importar `network_guard` e `NetworkModeResponse`
   - Adicionar `_guard_readonly` dependency + `_WRITE_PROTECTED = [Depends(_verify_api_key), Depends(_guard_readonly)]`
   - Substituir `dependencies=_PROTECTED` por `_WRITE_PROTECTED` nas seguintes rotas: `/demo/run`, `/demo/step/{step_id}`, `/demo/reset`, `/policy/run/{scenario_id}`, `/policy/reset/{scenario_id}`, `/policy/reset`, `/reorg/run`, `/reorg/reset`, `/simulation/start`, `/simulation/stop`, `/simulation/config`, `/session/reset`
   - No `lifespan`: adicionar `network_guard.refresh_network_mode()` e `if network_guard.is_read_only(): simulation_service.prevent_auto_start()`
   - Novo endpoint `GET /network/mode`
2. Modificar `api/simulation_service.py`: adicionar `_readonly_flag = False` e `def prevent_auto_start():`
3. Modificar `api/schemas.py`: adicionar `NetworkModeResponse`
4. Frontend completo (Feature 1)
5. Então avançar para FASE 2 (storage), FASE 3 (charts + alerts), FASE 4 (sorting + cluster)

---

## Sequência de Implementação

### FASE 1 — Infraestrutura (base para tudo)

#### Feature 5: Rate Limiting

**Novo arquivo:** `api/rate_limiter.py`
- Sliding window (60s) por IP cliente
- `RATE_LIMIT_ENABLED` (default `true`), `RATE_LIMIT_RPM=600`, `RATE_LIMIT_WRITE_RPM=30`
- `/events/stream`, `/static`, `/metrics`, `/demo` e `/` são isentos para evitar quebrar SSE, assets e páginas públicas
- `_client_ip(request)` → extrai de `X-Forwarded-For` ou `request.client.host`
- Classe `RateLimitMiddleware` (ASGI): retorna HTTP 429 com header `Retry-After`
- `deque` por IP para sliding window thread-safe com `threading.Lock`

**Modificar:** `api/app.py`
- Após `app.middleware("http")(metrics_middleware)`:
  ```python
  from .rate_limiter import RateLimitMiddleware
  app.add_middleware(RateLimitMiddleware)
  ```

**Modificar:** `api/metrics.py`
- Adicionar `RATE_LIMITED_TOTAL = Counter("nodescope_rate_limited_total", ..., ["method"])`

**Modificar:** `frontend/src/api/client.ts`
- Se `res.status === 429`, throw com mensagem incluindo `Retry-After`

#### Feature 1: Signet/Mainnet Read-Only Mode

**Novo arquivo:** `api/network_guard.py`
```python
def detect_network_mode() -> dict:  # {chain, read_only, reason}
def is_read_only() -> bool:         # cached
def refresh_network_mode() -> None: # chamado no lifespan
```
- `chain != 'regtest'` → read_only=True, reason="non_regtest_chain"
- `NODESCOPE_FORCE_READONLY=true` → read_only=True, reason="force_readonly_env"
- RPC offline → read_only=False (fail-open)

**Modificar:** `api/app.py`
- Adicionar `_guard_readonly` dependency + `_WRITE_PROTECTED`
- Substituir `_PROTECTED` por `_WRITE_PROTECTED` em todos os POST/PUT de escrita
- Novo endpoint `GET /network/mode`
- No `lifespan`: `refresh_network_mode()` + guard na simulação

**Modificar:** `api/simulation_service.py`
- Adicionar `prevent_auto_start()` com flag global

**Modificar:** `api/schemas.py` — `NetworkModeResponse(chain, read_only, reason)`

**Frontend:**
- `frontend/src/types/api.ts` — `NetworkModeData`
- `frontend/src/api/client.ts` — `networkMode()`
- `frontend/src/App.tsx` — state `networkMode`, `isReadOnly`, prop threading
- `frontend/src/components/ReadOnlyBanner.tsx` (novo) — banner âmbar full-width
- `GuidedDemo`, `MempoolPolicyArena`, `ReorgLab`, `SimulationPanel` — prop `readOnly?`

**i18n:** `network: { readOnlyBanner, modeLabel, readOnlyReason }` em `types.ts`, `enUS.ts`, `ptBR.ts`

---

### FASE 2 — Storage Extensions

**Modificar:** `api/storage.py` — acrescentar ao `_DDL`:
```sql
CREATE TABLE IF NOT EXISTS time_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_time_series_metric_ts ON time_series(metric, ts);

CREATE TABLE IF NOT EXISTS alert_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT NOT NULL,
    operator TEXT NOT NULL,
    threshold REAL NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);
```

Novas funções:
- `insert_time_series(metric, value)`, `query_time_series(metric, since_ts) -> list[dict]`
- `seed_default_alerts()`, `insert_alert_config(...)`, `list_alert_configs()`, `get_alert_config(id)`, `update_alert_config(id, ...)`, `delete_alert_config(id)`

`_MemStore`: campos `time_series: list[dict]` e `alert_configs: list[dict]` como fallback

---

### FASE 3 — Endpoints e Serviços

#### Feature 2: Historical Charts

**Novo arquivo:** `api/charts_service.py`
```python
def start_snapshot_loop() -> None:  # daemon thread, snapshot a cada 60s
def _take_snapshot() -> None:       # getmempoolinfo() + getblockchaininfo() → insert_time_series
def get_mempool_chart(range_str: str) -> dict:   # {range, points: [{ts, mempool_size, mempool_bytes}]}
def get_fees_chart(range_str: str) -> dict:      # {range, points: [{ts, minfee}]}
```
- Ranges: `1h` (3600s), `6h` (21600s), `24h` (86400s)
- RPCError silenciado em `_take_snapshot`

**Novos endpoints em app.py:**
- `GET /charts/mempool?range=1h|6h|24h`
- `GET /charts/fees?range=1h|6h|24h`

**Novo componente:** `frontend/src/components/HistoricalChartsPanel.tsx`
- SVG `<polyline>` puro (sem libs externas), viewBox 400×80
- Range selector: botões 1h/6h/24h
- Dois gráficos: mempool_size (verde `#22c55e`) e minfee sat/vb (âmbar `#f59e0b`)
- Nova view `'charts'` em `App.tsx` + `Header.tsx`

**i18n:** `charts: { navLabel, title, mempoolSize, mempoolBytes, feeRate, noData, waitingSnapshot, range1h, range6h, range24h }`

#### Feature 3: Configurable Alerts

**Novo arquivo:** `api/alerts_service.py`
```python
SUPPORTED_METRICS = {"mempool_size", "mempool_bytes", "minfee", "rpc_offline"}
SUPPORTED_OPERATORS = {"gt", "lt", "eq", "gte", "lte"}
def evaluate_alerts() -> list[dict]:
def _compare(value: float, operator: str, threshold: float) -> bool:
```
- Defaults: `mempool_size > 500 (warning)`, `minfee > 50 (warning)`, `rpc_offline eq 1 (critical)`

**Novos endpoints:** `GET/POST /alerts/config`, `PUT/DELETE /alerts/config/{id}`, `GET /alerts/active`

**Reescrita major:** `frontend/src/components/AlertingPanel.tsx`
- Alertas ativos via API
- Tabela de regras configuradas (edit inline, delete, enable toggle)
- Form "+ Add rule"
- Prop `readOnly?`

**i18n ext:** `alerts.configTitle`, `configuredRules`, `addRule`, `metricLabel`, `operatorLabel`, `thresholdLabel`, `severityLabel`, `enabledLabel`, `saveRule`, `cancelEdit`, `deleteRule`, `noRules`, `currentValue`, `ruleReadOnly`

---

### FASE 4 — Sorting & Cluster Visual

#### Feature 4: Advanced Sorting

**Modificar:** `api/service.py`
- `get_recent_events(sort_by="ts", sort_dir="desc", ...)` — sort antes do paginate
- `get_classifications(sort_by="ts", sort_dir="desc", ...)` — campos válidos: `ts`, `kind`, `confidence`, `inputs`, `outputs`, `total_out`

**Modificar:** `api/history_service.py` + `api/storage.py`
- `list_proof_reports(sort_by="id", sort_dir="desc")` — allowlist SQL

**Endpoints:** `sort_by` + `sort_dir` em `/events/recent`, `/events/classifications`, `/history/proofs`

**Frontend:** Headers clicáveis com ▲/▼/– em `ClassificationsTable`, `EventsTable`; sort control em `HistoricalDashboard`

**i18n:** `sort: { label, field, direction, asc, desc, byTs, byKind, byConfidence }`

#### Feature 6: Visual Mempool Cluster

**Modificar:** `api/service.py`
```python
def _build_clusters(mempool: dict[str, dict]) -> list[set[str]]:
    # BFS via "depends" + "spentby" — compatível com todas as versões do Bitcoin Core

def get_cluster_mempool_visual() -> dict:
    # {clusters, total_tx_count, cluster_count, rpc_ok, error}
```

**Novo endpoint:** `GET /mempool/clusters`

**Expansão major:** `frontend/src/components/ClusterMempoolPanel.tsx`
- `ClusterVisualGrid` sub-componente: flex-wrap de blocos coloridos por fee_rate
- Tamanho ∝ vsize (min 40px, max 160px)
- Verde ≥20 sat/vb, âmbar 5-20, vermelho <5
- Click → expandir lista de txids

**i18n ext:** `cluster.visualGrid`, `clustersFound`, `totalTx`, `clickToExpand`, `highFeeRate`, `medFeeRate`, `lowFeeRate`, `noMempool`, `versionNote`, `satVb`

---

## Arquivos Críticos

| Arquivo | Features |
|---------|----------|
| `api/app.py` | Todas |
| `api/storage.py` | 2, 3 |
| `api/network_guard.py` (novo) | 1 |
| `api/rate_limiter.py` (novo) | 5 |
| `api/charts_service.py` (novo) | 2 |
| `api/alerts_service.py` (novo) | 3 |
| `api/schemas.py` | 1, 2, 3, 6 |
| `api/service.py` | 4, 6 |
| `api/simulation_service.py` | 1 |
| `frontend/src/App.tsx` | 1, 2 |
| `frontend/src/components/Header.tsx` | 2 |
| `frontend/src/components/AlertingPanel.tsx` | 1, 3 |
| `frontend/src/components/ClusterMempoolPanel.tsx` | 6 |
| `frontend/src/components/ReadOnlyBanner.tsx` (novo) | 1 |
| `frontend/src/components/HistoricalChartsPanel.tsx` (novo) | 2 |
| `frontend/src/components/ClassificationsTable.tsx` | 4 |
| `frontend/src/components/EventsTable.tsx` | 4 |
| `frontend/src/components/HistoricalDashboard.tsx` | 4 |
| `frontend/src/api/client.ts` | Todas |
| `frontend/src/types/api.ts` | Todas |
| `frontend/src/i18n/types.ts` | Todas |
| `frontend/src/i18n/enUS.ts` | Todas |
| `frontend/src/i18n/ptBR.ts` | Todas |

---

## Verificação por Feature

1. **Rate limiting:** `for i in $(seq 70); do curl -s http://localhost:8000/health; done` → 429 após 60/min
2. **Read-only:** `NODESCOPE_FORCE_READONLY=true` → `GET /network/mode` retorna `{read_only: true}` → `POST /demo/run` retorna 403
3. **Charts:** Aguardar 2 snapshots (120s) → `GET /charts/mempool?range=1h` retorna points → SVG polyline visível
4. **Alerts:** `POST /alerts/config {metric: "mempool_size", operator: "gt", threshold: 1}` → `GET /alerts/active` dispara
5. **Sorting:** `GET /events/classifications?sort_by=kind&sort_dir=asc` → alfabético
6. **Cluster:** `GET /mempool/clusters` com mempool não-vazio → clusters corretos; grid visual colorido

---

## Restrições

- Sem novos pacotes npm
- Sem breaking changes em endpoints existentes
- Commits sem `Co-Authored-By`
- Dark theme: `#111`, `#1f2937`, `#374151`; verde `#22c55e`, âmbar `#f59e0b`, vermelho `#ef4444`
