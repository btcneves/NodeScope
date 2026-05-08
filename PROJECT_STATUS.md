# NodeScope Project Status

## Delivery Status

Status: Hackathon-ready
Release: v1.1.0
Docker quickstart: validated
Smoke test: passing (PASS=15 FAIL=0 WARN=0)
Frontend build: passing (TypeScript + Vite)
Python tests: passing (54 unit tests — 38 prior + 16 storage)
CI: passing (GitHub Actions — backend, frontend Node 18/20/24, public-clean check)

## Official Evaluator Flow

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open:

```text
http://localhost:5173
```

## Delivered Capabilities

| Area | Status | Notes |
|---|---|---|
| Bitcoin Core regtest | Ready | Compose starts Bitcoin Core 26 without mainnet, wallet keys, or external services. |
| RPC snapshot | Ready | FastAPI reads chain and mempool state through Bitcoin Core RPC. |
| ZMQ rawtx/rawblock | Ready | Monitor subscribes to real regtest ZMQ events. |
| NDJSON event logs | Ready | Monitor writes append-only logs under `logs/`. |
| Event classification | Ready | Blocks and transactions are classified from captured events. |
| FastAPI API | Ready | Health, summary, mempool, recent events, classifications, blocks, tx, intelligence, SSE and all lab endpoints. |
| React dashboard | Ready | Vite dashboard reads the API and shows live event state. |
| Smoke validation | Ready | Dockerized smoke covers RPC, ZMQ-derived counts, API endpoints, frontend build and Python tests. |
| Guided Demo | Ready | 14-step orchestrated demo: wallet, mining, tx, ZMQ detection, proof report. |
| Transaction Inspector Premium | Ready | Fee, vsize, weight, wtxid, inputs, outputs via direct RPC lookup. |
| ZMQ Event Tape | Ready | Live rawtx/rawblock event stream with topic filters and tx linking. |
| Mempool Policy Arena | Ready | 4 runnable scenarios: normal, low-fee, RBF (bumpfee), CPFP (raw tx pipeline). |
| Reorg Lab | Ready (experimental) | 10-step controlled reorg via invalidateblock/reconsiderblock in regtest. |
| Cluster Mempool Detector | Ready | Detects getmempoolcluster/getmempoolfeeratediagram availability; unavailable on BC26 (documented). |
| Proof Reports | Ready | JSON proof exported per demo/scenario/reorg run; copiável e downloadable. |
| Persistence (SQLite) | Ready | Local SQLite storage of proof reports, demo/policy/reorg run history. Memory fallback if SQLite unavailable. |
| Historical Dashboard | Ready | Browser dashboard listing all past runs across Proof Reports, Demo Runs, Policy Runs, and Reorg Runs with copy-proof support. |
| Fee Estimation Playground | Ready | Live estimatesmartfee from Bitcoin Core for 1/3/6/12-block targets. Shows BTC/kvB and sat/vB. Compares with scenario fee rates. Regtest limitations documented honestly. |
| PT-BR / EN-US | Ready | Full i18n toggle across all views; persisted via localStorage. |
| Tooltips | Ready | Hover/focus tooltips on technical terms in all views. |
| ExplainBox | Ready | Contextual explanation banners per page. |
| LearnMore | Ready | Expandable learn-more sections for key concepts. |
| Glossário Bitcoin | Ready | 27 Bitcoin terms with PT-BR/EN-US definitions. |
| Live Simulation Engine | Ready | Auto-mines blocks and sends transactions in regtest at configurable intervals. |
| Prometheus /metrics | Ready | Prometheus-compatible metrics endpoint at GET /metrics. |
| Operational Alerting | Ready | Dashboard AlertingPanel shows RPC status, simulation errors, and environment notes. |
| Reproducible Benchmark | Ready | `scripts/benchmark_nodescope.py` measures API latency for all key endpoints. |
| Optional API Key Auth | Ready | State-changing endpoints protected via `X-NodeScope-API-Key` header when `NODESCOPE_REQUIRE_API_KEY=true`. Read-only endpoints remain open. |
| Load Smoke Test | Ready | `scripts/load_smoke.py` runs concurrent requests against all read-only endpoints, reporting per-endpoint and aggregate latency and success rate. |
| CI/CD | Ready | GitHub Actions: Python 3.12 lint/test/audit, Node 18/20/24 build, public-clean check. |
| Browser favicon | Ready | Custom NodeScope icon in tab and apple-touch-icon. |
| README EN-US | Ready | Professional documentation with architecture, quick start, endpoints and roadmap. |
| README PT-BR | Ready | Portuguese documentation mirror. |

## Prometheus Metrics

The `/metrics` endpoint exposes Prometheus-compatible metrics when `prometheus-client` is installed:

- `nodescope_http_requests_total` — HTTP requests by method/endpoint/status
- `nodescope_http_request_duration_seconds` — request latency histogram
- `nodescope_http_errors_total` — 4xx/5xx responses
- `nodescope_rpc_requests_total` — RPC calls to Bitcoin Core
- `nodescope_rpc_errors_total` — RPC errors
- `nodescope_rpc_latency_seconds` — RPC call latency
- `nodescope_rpc_up` — 1 if Bitcoin Core is reachable
- `nodescope_zmq_rawtx_events_total` — rawtx ZMQ events captured
- `nodescope_zmq_rawblock_events_total` — rawblock ZMQ events captured
- `nodescope_zmq_last_event_timestamp_seconds` — last ZMQ event timestamp
- `nodescope_mempool_tx_count` — transactions in the mempool
- `nodescope_mempool_vsize_bytes` — mempool total vsize
- `nodescope_chain_height` — current chain height
- `nodescope_latest_block_timestamp_seconds` — latest block timestamp
- `nodescope_demo_runs_total` — Guided Demo full runs
- `nodescope_demo_failures_total` — Guided Demo step errors
- `nodescope_policy_scenarios_total` — Policy Arena scenario runs
- `nodescope_reorg_runs_total` — Reorg Lab runs
- `nodescope_proof_reports_total` — proof reports generated
- `nodescope_simulation_blocks_total` — auto-mined blocks
- `nodescope_simulation_txs_total` — auto-sent transactions
- `nodescope_history_proof_reports_total` — persisted proof reports (Gauge)
- `nodescope_history_demo_runs_total` — persisted demo run records (Gauge)
- `nodescope_history_policy_runs_total` — persisted policy run records (Gauge)
- `nodescope_history_reorg_runs_total` — persisted reorg run records (Gauge)
- `nodescope_storage_up` — 1 if the storage backend (SQLite or memory) is healthy (Gauge)
- `nodescope_storage_backend_info` — label `backend` identifies the active backend (`sqlite` or `memory`)
- `nodescope_fee_estimation_runs_total` — fee estimation playground requests
- `nodescope_fee_estimation_failures_total` — requests where no feerate was returned
- `nodescope_fee_estimation_last_success_timestamp_seconds` — last successful fee estimation timestamp

## Benchmark

Run against a live stack:

```bash
python3 scripts/benchmark_nodescope.py
# or
make benchmark
```

Output: latency table (min/mean/median/p95/max) per endpoint.
Results vary by environment. Numbers should be validated locally, not assumed from documentation.

## History API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/history/summary` | Storage health and row counts per table |
| GET | `/history/proofs` | Paginated list of proof reports (`limit`, `offset`, `source`, `success` filters) |
| GET | `/history/proofs/{report_id}` | Single proof report by ID |
| GET | `/history/demo-runs` | Paginated demo run history |
| GET | `/history/policy-runs` | Paginated policy run history (optional `scenario_id` filter) |
| GET | `/history/reorg-runs` | Paginated reorg run history |

Storage backend is selected via environment variables:

```
NODESCOPE_STORAGE_BACKEND=sqlite|memory   (default: sqlite)
NODESCOPE_SQLITE_PATH=.nodescope/history.db
```

If SQLite initialisation fails, the API transparently falls back to an in-memory store and records the error in `/history/summary`. All history endpoints remain functional in either backend.

## Known Limitations

- The official demo uses Bitcoin Core regtest only; signet/mainnet operation is intentionally out of scope.
- `logs/` is local runtime storage, not a production database.
- Local non-Docker mode is available for development, but Docker is the validated judging path.
- Cluster mempool RPCs (`getmempoolcluster`, `getmempoolfeeratediagram`) require Bitcoin Core v28+. BC26 returns `unavailable` (documented).
- Reorg Lab is experimental and runs only in regtest. Not suitable for production.
- `prometheus-client` must be installed for `/metrics` to return Prometheus data (included in `requirements.txt`).
- SQLite history database is local to the container volume. History does not survive `docker compose down -v` unless the volume is preserved.
- History stores run metadata only, not full event logs or raw NDJSON. For full event replay, use `logs/`.

## Presentation Pack

| Document | Status | Path |
|---|---|---|
| 1-minute pitch (EN-US / PT-BR) | Ready | `docs/presentation/pitch-1min.md` |
| 3-minute technical pitch (EN-US / PT-BR) | Ready | `docs/presentation/pitch-3min.md` |
| Technical walkthrough | Ready | `docs/presentation/technical-walkthrough.md` |
| Evaluator checklist | Ready | `docs/presentation/evaluator-checklist.md` |
| Demo script (1-min + 5-min, EN-US / PT-BR) | Ready | `docs/presentation/demo-script.md` |
| Submission text (EN-US / PT-BR) | Ready | `docs/presentation/submission-text.md` |
| Screenshots checklist | Ready | `docs/presentation/screenshots-checklist.md` |
| Video script (EN-US / PT-BR) | Ready | `docs/presentation/video-script.md` |
| Evaluator FAQ (EN-US / PT-BR) | Ready | `docs/presentation/faq.md` |
| Presentation pack index | Ready | `docs/presentation/README.md` |

## Roadmap

| Feature | Status |
|---|---|
| Presentation Pack | Ready (PR #9) |
| Postgres / TimescaleDB for event persistence | Planned |
| API keys for mutating endpoints (optional) | Ready (PR #8) |
| OpenTelemetry traces (RPC, ZMQ, API) | Planned |
| Multi-node support | Planned |
| Kubernetes manifests / Helm chart | Planned |
| Grafana integration | Planned |
| signet / mainnet read-only mode | Planned |
| Cluster mempool visualization (Bitcoin Core 28+) | Planned |
