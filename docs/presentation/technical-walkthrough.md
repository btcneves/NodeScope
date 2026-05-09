# NodeScope — Technical Walkthrough

For advanced evaluators who want to understand the system architecture in depth.

---

## System Overview

NodeScope is a Bitcoin Core observability layer composed of four Docker services:

| Service | Container | Purpose |
|---|---|---|
| `bitcoind` | `nodescope-bitcoind` | Bitcoin Core 26 in regtest mode |
| `api` | `nodescope-api` | FastAPI backend on port 8000 |
| `monitor` | `nodescope-monitor` | ZMQ subscriber process |
| `frontend` | `nodescope-frontend` | React + Vite dashboard on port 5173 |

All services are defined in `docker-compose.yml`. No external services, APIs, or network connections are required.

---

## Bitcoin Core (regtest)

- Version: Bitcoin Core 26
- Network: regtest (deterministic, isolated, no real value)
- Exposed ports: RPC 18443, ZMQ 28332
- Config: `bitcoin.conf` mounted via Docker volume
- Wallet: auto-created on first `make docker-demo` run
- Security: RPC credentials are in `.env` (not in the repository; `.env.example` contains placeholders only)

Why regtest:

Regtest is the professional standard for controlled Bitcoin Core testing. Blocks are mined on demand, fees are predictable, and the environment is fully isolated. Using regtest does not imply a limitation — it demonstrates deliberate engineering discipline.

---

## FastAPI Backend (`api/`)

Entry point: `api/main.py`

Key modules:

| Module | Purpose |
|---|---|
| `api/rpc_client.py` | Bitcoin Core RPC client (urllib, no external SDK) |
| `api/fee_service.py` | `estimatesmartfee` wrapper with regtest annotations |
| `api/storage.py` | SQLite + memory storage abstraction |
| `api/history_service.py` | Proof reports and run history CRUD |
| `api/metrics.py` | Prometheus metrics registry |

The RPC client uses Python's built-in `urllib` with HTTP Basic Auth. No `python-bitcoinlib` or external Bitcoin SDK.

Dependency injection: FastAPI lifespan context initializes storage and metrics on startup.

---

## ZMQ Monitor (`monitor.py`)

- Subscribes to `rawtx` and `rawblock` on ZMQ port 28332
- Uses `pyzmq` to receive raw binary frames
- Decodes transaction IDs from raw bytes without full deserialization
- Appends events as NDJSON to `logs/rawtx_events.ndjson` and `logs/rawblock_events.ndjson`
- The API reads these logs on demand for `/events/recent` and `/tape/*` endpoints

ZMQ is treated as a notification source. RPC is used for final state validation (`getrawtransaction`, `gettransaction`, `getblock`).

---

## RPC + ZMQ Correlation

Flow for a detected transaction:

1. ZMQ fires `rawtx` with raw transaction bytes
2. Monitor extracts txid, writes to NDJSON log
3. Frontend SSE (`/events/stream`) picks up new log entries
4. User navigates to Transaction Inspector → API calls `getrawtransaction txid true` via RPC
5. API returns decoded tx: inputs, outputs, fee (if determinable), vsize, weight, wtxid, replaceable flag

ZMQ event and RPC result are correlated by txid.

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | RPC + ZMQ health check, Bitcoin Core version |
| GET | `/summary` | Chain info, mempool summary, node health score (0–100) |
| GET | `/blocks/latest` | Last N blocks from `getblockchaininfo` + `getblockhash`/`getblock` |
| GET | `/tx/latest` | Last N transactions from NDJSON logs |
| GET | `/tx/{txid}` | Full decoded transaction via RPC |
| GET | `/mempool/summary` | `getmempoolinfo` result |
| GET | `/mempool/cluster/compatibility` | Detect `getmempoolcluster`/`getmempoolfeeratediagram` availability |
| GET | `/events/recent` | Last N classified events from NDJSON logs |
| GET | `/events/stream` | SSE stream of new events |
| POST | `/demo/run` | Execute full 14-step guided demo |
| GET | `/demo/status` | Current demo step statuses |
| POST | `/simulation/start` \| `/simulation/stop` | Auto-mine simulation engine |
| POST | `/policy/run` | Run a named policy scenario |
| POST | `/reorg/run` | Run controlled reorg scenario |
| GET | `/tape/events` | ZMQ event tape (paginated) |
| GET | `/inspect/{txid}` | Premium transaction inspection |
| GET | `/fees/estimate` | `estimatesmartfee` for multiple targets |
| GET | `/metrics` | Prometheus metrics |
| GET | `/history/summary` | Storage health + row counts |
| GET | `/history/proofs` | Paginated proof report list |
| GET | `/history/demo-runs` | Paginated demo run history |
| GET | `/history/policy-runs` | Paginated policy run history |
| GET | `/history/reorg-runs` | Paginated reorg run history |

Full API docs: `http://localhost:8000/docs` (Swagger UI, available when the stack is running).

---

## Proof Reports

Each demo run, policy scenario, and reorg lab generates a JSON proof report containing:

- `scenario_name`, `network`, `bitcoin_core_version`
- `rpc_ok`, `zmq_rawtx_ok`, `zmq_rawblock_ok`
- `wallet`, `txids`, `fees`, `fee_rate`, `vbytes`, `weight`
- `block_height`, `block_hash`, `confirmations`
- `events`, `timestamps`, `success`, `warnings`, `unavailable_features`

Proof reports are stored in SQLite and exposed via `/history/proofs`. They are also exportable as JSON from the frontend (Copy button).

---

## Prometheus Metrics (`/metrics`)

28+ operational gauges. Selected highlights:

- `nodescope_rpc_up` — 1 if Bitcoin Core is reachable
- `nodescope_chain_height` — current block height
- `nodescope_mempool_tx_count` — mempool transaction count
- `nodescope_zmq_rawtx_events_total` — cumulative ZMQ rawtx events
- `nodescope_demo_runs_total` — total guided demo executions
- `nodescope_policy_scenarios_total` — total policy scenario runs
- `nodescope_reorg_runs_total` — total reorg lab runs
- `nodescope_proof_reports_total` — total proof reports generated
- `nodescope_storage_up` — 1 if storage backend is healthy
- `nodescope_fee_estimation_runs_total` — fee estimation requests

Requires `prometheus-client` (included in `requirements.txt`).

---

## Storage and Persistence

- Backend: SQLite (default) at `.nodescope/history.db`
- Fallback: in-memory store if SQLite initialization fails
- Selected via: `NODESCOPE_STORAGE_BACKEND=sqlite|memory`
- History does not survive `docker compose down -v` unless the volume is preserved

---

## Frontend (React 18 + TypeScript + Vite 6)

Location: `frontend/`

Key views:

| View | Description |
|---|---|
| Dashboard | Node health, chain state, mempool summary, live event feed |
| Guided Demo | 14-step orchestrated demo with per-step status and proof report |
| Transaction Inspector | Premium tx decoder: fee, vsize, weight, wtxid, inputs, outputs |
| ZMQ Event Tape | Live rawtx/rawblock stream with topic filters and tx links |
| Mempool Policy Arena | 4 runnable policy scenarios |
| Reorg Lab | Controlled reorg scenario (experimental) |
| Fee Estimation Playground | `estimatesmartfee` for 1/3/6/12 block targets |
| Historical Dashboard | Paginated list of all past runs and proof reports |
| Cluster Mempool Detector | Compatibility check for BC31+ RPCs |

i18n: PT-BR / EN-US toggle persisted via `localStorage`. All views are bilingual.

Explainability: Each view has an ExplainBox banner, Tooltip components on technical terms, and LearnMore expandable sections.

---

## Security Notes

- `.env` is not in the repository. Only `.env.example` with placeholder values.
- No private keys, seeds, mnemonic words, or real wallet credentials in the codebase.
- API key protection is available for mutating endpoints via `NODESCOPE_API_KEY` env var (optional).
- RPC credentials are injected via environment variables; never hardcoded.
- ZMQ does not expose private keys or wallet data.
- All demo scenarios use regtest. No real Bitcoin value at risk.

---

## Limitations

- Regtest only for all demo scenarios. Mainnet/signet operation is possible with configuration but not validated in this release.
- Cluster mempool RPCs (`getmempoolcluster`, `getmempoolfeeratediagram`) require Bitcoin Core 31+. BC26 returns `unavailable`.
- Reorg Lab is experimental.
- CPFP child construction requires the parent output to be in `listunspent minconf=0`. A fallback path exists if not found.
- `estimatesmartfee` in regtest returns limited data due to insufficient fee history. Limitations are documented inline in the Fee Estimation view.
- SQLite history is local to the container volume.
- ZMQ event log is append-only NDJSON; not a queryable database.

---

## Reproducing the Full Demo

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Additional validation:

```bash
python3 scripts/benchmark_nodescope.py
python3 scripts/load_smoke.py --concurrency 5 --requests 50
```

---

## Technical Roadmap

| Feature | Status |
|---|---|
| Cluster mempool visualization (BC31+) | Planned |
| Mempool eviction scenario | Planned |
| OpenTelemetry traces (RPC, ZMQ, API) | Planned |
| Postgres / TimescaleDB for event persistence | Planned |
| Multi-node topology | Planned |
| Kubernetes manifests / Helm chart | Planned |
| Grafana integration | Planned |
| Signet / testnet read-only mode | Planned |
| API keys / JWT for hosted deployments | Planned |
