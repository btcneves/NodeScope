# NodeScope Project Status

## Delivery Status

Status: Hackathon-ready
Release: v1.0.1
Docker quickstart: validated
Smoke test: passing (PASS=15 FAIL=0 WARN=0)
Frontend build: passing (TypeScript + Vite)
Python tests: passing (38 unit tests)
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
| PT-BR / EN-US | Ready | Full i18n toggle across all views; persisted via localStorage. |
| Tooltips | Ready | Hover/focus tooltips on technical terms in all views. |
| ExplainBox | Ready | Contextual explanation banners per page. |
| LearnMore | Ready | Expandable learn-more sections for key concepts. |
| Glossário Bitcoin | Ready | 27 Bitcoin terms with PT-BR/EN-US definitions. |
| Live Simulation Engine | Ready | Auto-mines blocks and sends transactions in regtest at configurable intervals. |
| Prometheus /metrics | Ready | Prometheus-compatible metrics endpoint at GET /metrics. |
| Operational Alerting | Ready | Dashboard AlertingPanel shows RPC status, simulation errors, and environment notes. |
| Reproducible Benchmark | Ready | `scripts/benchmark_nodescope.py` measures API latency for all key endpoints. |
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

## Benchmark

Run against a live stack:

```bash
python3 scripts/benchmark_nodescope.py
# or
make benchmark
```

Output: latency table (min/mean/median/p95/max) per endpoint.
Results vary by environment. Numbers should be validated locally, not assumed from documentation.

## Known Limitations

- The official demo uses Bitcoin Core regtest only; signet/mainnet operation is intentionally out of scope.
- `logs/` is local runtime storage, not a production database.
- Local non-Docker mode is available for development, but Docker is the validated judging path.
- Cluster mempool RPCs (`getmempoolcluster`, `getmempoolfeeratediagram`) require Bitcoin Core v28+. BC26 returns `unavailable` (documented).
- Reorg Lab is experimental and runs only in regtest. Not suitable for production.
- `prometheus-client` must be installed for `/metrics` to return Prometheus data (included in `requirements.txt`).

## Roadmap

The following features are planned for future phases and are **not yet implemented**:

| Feature | Status |
|---|---|
| Postgres / TimescaleDB for event persistence | Planned |
| Historical dashboards | Planned |
| API keys / JWT for hosted deployments | Planned |
| OpenTelemetry traces (RPC, ZMQ, API) | Planned |
| Multi-node support | Planned |
| Kubernetes manifests / Helm chart | Planned |
| Grafana integration | Planned |
| signet / mainnet read-only mode | Planned |
