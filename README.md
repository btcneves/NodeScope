# NodeScope

[![CI](https://github.com/btcneves/NodeScope/actions/workflows/ci.yml/badge.svg)](https://github.com/btcneves/NodeScope/actions/workflows/ci.yml)
[![Python 3.12](https://img.shields.io/badge/python-3.12-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-ready-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React + Vite](https://img.shields.io/badge/React%20%2B%20Vite-ready-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bitcoin Core](https://img.shields.io/badge/Bitcoin%20Core-regtest-f7931a?logo=bitcoin&logoColor=white)](https://bitcoincore.org/)
[![RPC + ZMQ](https://img.shields.io/badge/RPC%20%2B%20ZMQ-observability-7c3aed)](https://github.com/btcneves/NodeScope)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-ready-2496ed?logo=docker&logoColor=white)](docker-compose.yml)
[![Prometheus](https://img.shields.io/badge/Prometheus-metrics-e6522c?logo=prometheus&logoColor=white)](https://github.com/btcneves/NodeScope)
[![i18n](https://img.shields.io/badge/i18n-EN--US%20%7C%20PT--BR-blueviolet)](README.pt-BR.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Leia em Português](README.pt-BR.md)

**Bitcoin Core Professional Lab** — A visual, guided, and auditable laboratory for understanding
Bitcoin Core internals in real time using RPC, ZMQ, mempool analysis, and controlled test scenarios.

---

## What is NodeScope?

NodeScope connects directly to a Bitcoin Core node via JSON-RPC and ZMQ, exposing every layer of
the transaction lifecycle in a browser-based dashboard. It is designed as an educational and
professional observability tool — not a wallet, not a payment processor.

Key properties:
- **Real Bitcoin Core** — no simulation, no mocking. Every data point comes from RPC or ZMQ.
- **Regtest environment** — safe, controlled, reproducible. No real funds, no mainnet risk.
- **Auditable** — every scenario generates a copyable Proof Report (JSON) with full technical output.
- **Self-contained** — one `docker compose up` brings up Bitcoin Core, the API, ZMQ monitor, and frontend.

---

## Why NodeScope is Different

Most Bitcoin developer tools focus on wallet management or payment flows. NodeScope focuses on the
**protocol layer**: what happens inside Bitcoin Core when a transaction is broadcast, how it enters
the mempool, how it gets confirmed, what fee policies accept or reject it, and what happens during a
chain reorganization.

NodeScope is built for developers and operators who want to understand Bitcoin Core from the inside out.

---

## Evaluate in 1 Minute

```bash
git clone https://github.com/btcneves/NodeScope
cd NodeScope
docker compose up -d --build
open http://localhost:5173
```

Click **Guided Demo** → **Run Full Demo** and watch 14 steps execute live, ending with a Proof Report.

---

## Architecture

```
Bitcoin Core (regtest)
  ├── JSON-RPC :18443   ──► FastAPI (api/)        ──► React (frontend/)
  └── ZMQ :28332/:28333 ──► monitor.py (logs/)    ──► SSE stream → browser
```

- **api/** — Python 3.12 + FastAPI. All RPC calls, scenario orchestration, proof assembly.
- **frontend/** — React 18 + TypeScript + Vite. Browser UI, no build step required for Docker.
- **monitor.py** — Subscribes to ZMQ rawtx + rawblock, enriches via RPC, writes NDJSON to logs/.
- **docker-compose.yml** — Four services: `bitcoind`, `api`, `monitor`, `frontend`.

---

## RPC + ZMQ

NodeScope uses the following Bitcoin Core RPCs:

| Category     | RPCs Used |
|-------------|-----------|
| Chain        | `getblockchaininfo`, `getblockcount`, `getblockhash`, `getblock` |
| Network      | `getnetworkinfo`, `getzmqnotifications` |
| Mempool      | `getmempoolinfo`, `getrawmempool`, `getmempoolentry` |
| Transactions | `sendtoaddress`, `gettransaction`, `getrawtransaction`, `decoderawtransaction` |
| Raw Tx       | `createrawtransaction`, `fundrawtransaction`, `signrawtransactionwithwallet`, `sendrawtransaction` |
| Wallet       | `createwallet`, `loadwallet`, `listwallets`, `getnewaddress`, `getwalletinfo`, `listunspent` |
| Mining       | `generatetoaddress` |
| RBF          | `bumpfee` |
| Reorg        | `invalidateblock`, `reconsiderblock` |

ZMQ topics subscribed: `rawtx`, `rawblock`.

---

## Guided Demo

A 14-step guided walkthrough of the full Bitcoin transaction lifecycle:

1. Check Bitcoin Core RPC connectivity
2. Check ZMQ rawtx/rawblock subscriptions
3. Create or load the demo wallet
4. Generate a mining address
5. Mine initial blocks (ensure mature balance)
6. Create a destination address
7. Send a demo transaction
8. Detect mempool entry (`getmempoolentry`)
9. Detect ZMQ rawtx event
10. Decode the raw transaction (version, inputs, outputs, script types)
11. Mine a confirmation block
12. Detect ZMQ rawblock event
13. Confirm the transaction (`gettransaction`)
14. Generate a Proof Report (JSON with all technical data)

Each step produces: status, timestamp, friendly message, technical output, and a data payload
included in the final Proof Report.

---

## Transaction Inspector

Premium transaction analysis from TXID:

- `txid` and `wtxid`
- `size`, `vsize`, `weight` (in weight units)
- Fee in BTC and fee rate in sat/vbyte
- Input count, output count, script types
- Confirmation status, block hash, block height
- RPC validation status
- Related ZMQ events seen for this TXID
- Links to inspect any TXID from ZMQ Tape or Policy Arena

---

## ZMQ Event Tape

Real-time stream of ZMQ events with enrichment:

- Each `rawtx` event shows: txid (short), vsize, script types, OP\_RETURN presence
- Each `rawblock` event shows: block hash (short), height
- Filter by topic (rawtx / rawblock) or by specific TXID
- Click any txid to inspect it in the Transaction Inspector
- Events are enriched via RPC at capture time by `monitor.py`

---

## Mempool Policy Arena

Four interactive scenarios to explore Bitcoin Core's mempool policies:

### Normal Transaction
Standard `sendtoaddress` → mempool entry → mine block → confirm.
Captures: fee, vsize, fee rate (sat/vb), block hash.

### Low Fee Transaction
Send with `fee_rate=1 sat/vbyte` → compare actual fee rate vs standard → mine → confirm.
Demonstrates Bitcoin Core 26+ `fee_rate` parameter in `sendtoaddress`.

### RBF Replacement (BIP125)
Send replaceable transaction → verify `bip125-replaceable=true` in mempool →
call `bumpfee` to replace with higher-fee version → verify new TXID → mine → confirm.

### CPFP Package
Send low-fee parent → construct child that spends unconfirmed parent output →
submit child with high fee rate → compute package rate → mine → confirm both.
Uses the raw transaction pipeline: `createrawtransaction` → `fundrawtransaction` →
`signrawtransactionwithwallet` → `sendrawtransaction`.

Each scenario produces a copyable Proof Report.

---

## RBF Playground

Available within the Mempool Policy Arena (RBF Replacement scenario).

- Sends a BIP125-replaceable transaction (`replaceable=true` in `sendtoaddress`)
- Calls `bumpfee` to replace it before confirmation
- Verifies the new TXID in the mempool with a higher fee rate
- Mines a block and confirms the replacement

---

## CPFP Playground

Available within the Mempool Policy Arena (CPFP Package scenario).

- Sends a low-fee parent transaction
- Locates the unconfirmed parent output via `listunspent(minconf=0)`
- Constructs a child transaction spending that output with a high fee rate
- Computes the package fee rate: (parent\_fee + child\_fee) / (parent\_vsize + child\_vsize)
- Mines a block and confirms both transactions

---

## Reorg Lab

**Experimental** — controlled chain reorganization in regtest.

Sequence:
1. Verify network is regtest
2. Ensure wallet and mature balance
3. Broadcast a transaction
4. Mine a block (tx confirmed)
5. Call `invalidateblock` on that block — tx returns to mempool
6. Verify tx mempool status after invalidation (`getmempoolentry`)
7. Mine a recovery block — tx re-confirmed
8. Verify re-confirmation (`gettransaction`)
9. Call `reconsiderblock` — recovery chain remains active (it is longer)
10. Assemble Proof Report with full timeline

The chain is always left in a clean state. If recovery fails, the API returns an explicit error
with a warning — it does not mask failure.

> Reorg Lab only runs in regtest. On any other network, it returns `unavailable`.

---

## Cluster Mempool Compatibility

NodeScope automatically probes whether the connected Bitcoin Core node supports
cluster mempool RPCs:

- `getmempoolcluster`
- `getmempoolfeeratediagram`

If supported, they are used and results are displayed. If unavailable (Bitcoin Core 26 and earlier),
NodeScope returns an honest `unavailable` status with a clear explanation — never a false positive.

Available via `GET /mempool/cluster/compatibility` and in the **Policy Arena** tab.

> Cluster mempool RPCs are expected in Bitcoin Core 28+. This build uses Bitcoin Core 26.

---

## Fee Estimation Playground

The **Fee Estimation Playground** calls Bitcoin Core's `estimatesmartfee` RPC for multiple confirmation targets and displays the results side-by-side.

**What it shows:**

| Target | Fee rate (BTC/kvB) | Fee rate (sat/vB) | Status |
|---|---|---|---|
| 1 block | live RPC data | converted | success / limited / unavailable |
| 3 blocks | live RPC data | converted | success / limited / unavailable |
| 6 blocks | live RPC data | converted | success / limited / unavailable |
| 12 blocks | live RPC data | converted | success / limited / unavailable |

**Conversion:** `sat/vB = BTC/kvB × 100,000`

**Estimation modes:** Conservative (higher fee, safer confirmation) and Economical (lower fee, potentially slower).

**Comparison:** When a Guided Demo or Policy Arena scenario has been run, the playground optionally displays those fee rates alongside the estimates.

**Regtest limitations:** In regtest there is no real fee market. `estimatesmartfee` may return `insufficient data` or have no historical transactions to learn from. Results are marked `success`, `limited`, or `unavailable` — no values are invented. This is documented honestly in the UI.

**API endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/fees/estimate` | Fee estimates for 4 confirmation targets |
| GET | `/fees/estimate?mode=ECONOMICAL` | Economical mode estimates |
| GET | `/fees/compare` | Estimates + comparison with recent scenario fee rates |

---

## Persistence and Historical Dashboard

NodeScope automatically persists run metadata to a local SQLite database (`.nodescope/history.db`).
Every Guided Demo, Policy Arena scenario, and Reorg Lab run stores:

- Proof report JSON (scenario name, source, status, TXIDs, block data)
- Run record (status, duration, linked proof report ID)

The **Historical Dashboard** tab in the UI shows a paginated view of all past runs with:

- Summary cards: row counts per table and storage health (SQLite or memory)
- Proof Reports table: scenario, source, success/fail badge, TXID, block height, timestamp
- Demo Runs, Policy Runs, Reorg Runs tables with full metadata
- Copy Proof JSON button for any proof report

**API endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/history/summary` | Storage health and counts |
| GET | `/history/proofs` | Paginated proof reports |
| GET | `/history/proofs/{id}` | Single proof report by ID |
| GET | `/history/demo-runs` | Demo run history |
| GET | `/history/policy-runs` | Policy run history |
| GET | `/history/reorg-runs` | Reorg run history |

Storage backend is configurable via `NODESCOPE_STORAGE_BACKEND=sqlite|memory`. If SQLite fails,
the API falls back to an in-memory store transparently — no service disruption.

---

## Proof Reports

Every major scenario generates a Proof Report — a JSON document containing:

- Network name and Bitcoin Core version
- All TXIDs involved
- Fee rates, vsizes, weights
- Block hashes and heights
- Confirmation counts
- Timestamps
- Step-by-step technical outputs
- Warnings and unavailable features (honest accounting)

Proof Reports are:
- Copyable to clipboard from the UI
- Downloadable as JSON (Guided Demo)
- Auditable — all values come from live RPC responses, not simulated data

---

## Quick Start

**Requirements:** Docker, Docker Compose.

```bash
# Clone
git clone https://github.com/btcneves/NodeScope
cd NodeScope

# Start everything
docker compose up -d --build

# Verify
curl http://localhost:8000/health
curl http://localhost:8000/mempool/cluster/compatibility

# Open UI
open http://localhost:5173
```

**Environment:** copy `.env.example` to `.env` if you need to customize RPC credentials.

**Smoke test:**
```bash
make smoke
```

---

## Security

- This project uses **regtest** — a fully local, isolated Bitcoin network.
- No real funds are used. No mainnet transactions are made in the demo.
- RPC credentials are local and configurable via `.env` (never committed).
- No private keys, seeds, or wallet data are exposed via the API.
- ZMQ data is enriched locally and served only on localhost by default.
- The Reorg Lab scenario only operates in regtest and includes chain recovery.

---

## Internationalization (PT-BR / EN-US)

NodeScope includes a built-in internationalization layer supporting **Portuguese (PT-BR)** and **English (EN-US)**.

- Language selector visible in the top-right corner of the header
- Persisted across page reloads via `localStorage`
- Covers all navigation labels, action buttons, status indicators, page titles, descriptions, and error messages
- Falls back to EN-US for any missing key

Switch between languages at any time without page reload.

---

## Explainability Layer

Each page and view includes a contextual explanation panel that answers:

1. **What does this screen show?**
2. **Why does it matter in Bitcoin?**
3. **What should you observe during the demo?**

This layer is designed for technical evaluators who want to understand the system quickly without reading source code.

---

## Tooltips and Contextual Learning

Technical terms across the interface include interactive tooltips. Hover over (or focus) any **ⓘ** icon to see a clear definition. Terms with tooltips include:

`RPC` · `ZMQ` · `Mempool` · `TXID` · `WTXID` · `Fee` · `Fee rate` · `vbytes` · `Weight` · `Block hash` · `Block height` · `Confirmation` · `rawtx` · `rawblock` · `RBF` · `CPFP` · `Reorg` · `Cluster mempool` · `Proof Report` · `Wallet` · `Input` · `Output` · `replaceable`

**Learn More** sections are available in Policy Arena, ZMQ Tape, Reorg Lab, Transaction Inspector, Cluster Mempool, and Proof Report — each providing a deeper explanation of the Bitcoin concept demonstrated.

---

## Observability

### Prometheus Metrics

NodeScope exposes a Prometheus-compatible `/metrics` endpoint when `prometheus-client` is installed (included in `requirements.txt`):

```bash
curl http://127.0.0.1:8000/metrics
```

Key metrics:

| Metric | Type | Description |
|---|---|---|
| `nodescope_http_requests_total` | Counter | HTTP requests by method/endpoint/status |
| `nodescope_http_request_duration_seconds` | Histogram | Request latency |
| `nodescope_rpc_up` | Gauge | 1 if Bitcoin Core RPC is reachable |
| `nodescope_rpc_requests_total` | Counter | RPC calls to Bitcoin Core |
| `nodescope_zmq_rawtx_events_total` | Counter | rawtx ZMQ events captured |
| `nodescope_zmq_rawblock_events_total` | Counter | rawblock ZMQ events captured |
| `nodescope_mempool_tx_count` | Gauge | Transactions in the mempool |
| `nodescope_chain_height` | Gauge | Current best chain height |
| `nodescope_demo_runs_total` | Counter | Guided Demo full runs |
| `nodescope_policy_scenarios_total` | Counter | Policy Arena runs by scenario |
| `nodescope_reorg_runs_total` | Counter | Reorg Lab runs |
| `nodescope_proof_reports_total` | Counter | Proof reports generated |
| `nodescope_history_proof_reports_total` | Gauge | Persisted proof reports in storage |
| `nodescope_history_demo_runs_total` | Gauge | Persisted demo run records |
| `nodescope_history_policy_runs_total` | Gauge | Persisted policy run records |
| `nodescope_history_reorg_runs_total` | Gauge | Persisted reorg run records |
| `nodescope_storage_up` | Gauge | 1 if the storage backend is healthy |
| `nodescope_storage_backend_info` | Info | Active storage backend label (`sqlite` or `memory`) |

### Operational Alerting

The dashboard includes an **Operational Alerts** panel that polls the API every 15 seconds and surfaces:

- Bitcoin Core RPC offline (critical)
- Live simulation errors (warning)
- Cluster mempool RPCs unavailable (info — expected on BC26)
- Reorg Lab experimental note (info)

Alerts are displayed in EN-US or PT-BR according to the active language toggle.

### Benchmark

Measure API latency against a running stack:

```bash
python3 scripts/benchmark_nodescope.py
# or
make benchmark
```

Output: latency table (min/mean/median/p95/max) per endpoint. Results vary by host.

---

## Limitations

- **Regtest-only** for demo scenarios. Mainnet/signet/testnet observability is possible with configuration changes but not validated in this release.
- **Cluster mempool RPCs** (`getmempoolcluster`, `getmempoolfeeratediagram`) require Bitcoin Core 28+. This build uses Bitcoin Core 26 — these RPCs return `unavailable` with an honest explanation.
- **Reorg Lab** is marked **experimental**: the scenario is reproducible in regtest but may behave differently depending on wallet state.
- **CPFP child construction** requires the parent output to be tracked in the wallet (`listunspent minconf=0`). If not found, a fallback path is used and the proof records it.
- **ZMQ events** are stored as NDJSON in `logs/`. There is no persistence across container restarts.
- **SQLite history** (`.nodescope/history.db`) is local to the container volume. History does not survive `docker compose down -v` unless the volume is preserved.
- **Prometheus metrics** require `prometheus-client` (included in `requirements.txt`). If not installed, `/metrics` returns a plain-text unavailability notice.

---

## Roadmap

| Feature | Status |
|---|---|
| Signet/testnet support | Planned |
| Cluster mempool visualization (Bitcoin Core 28+) | Planned |
| Mempool eviction scenario | Planned |
| Multi-node topology | Planned |
| Postgres / TimescaleDB for event persistence | Planned |
| Historical dashboards | Ready (SQLite-backed) |
| API keys / JWT for hosted deployments | Planned |
| OpenTelemetry traces | Planned |
| Kubernetes manifests / Helm chart | Planned |
| Grafana integration | Planned |
| Fee estimation analysis (`estimatesmartfee`) | Planned |

---

## Presentation and Evaluation

Complete materials for hackathon judges and evaluators:

| Document | Description |
|---|---|
| [1-minute pitch](docs/presentation/pitch-1min.md) | Short pitch — EN-US and PT-BR |
| [3-minute technical pitch](docs/presentation/pitch-3min.md) | Full technical pitch with architecture and demo flow |
| [Evaluator checklist](docs/presentation/evaluator-checklist.md) | Step-by-step checklist to reproduce and assess all features |
| [Demo script](docs/presentation/demo-script.md) | Operational demo — 1-minute and 5-minute versions |
| [Video script](docs/presentation/video-script.md) | Scene-by-scene script for a 2–3 minute demo video |
| [Submission text](docs/presentation/submission-text.md) | Ready-to-use text for submission forms — EN-US and PT-BR |
| [FAQ](docs/presentation/faq.md) | Honest answers to the most common evaluator questions |
| [Presentation pack index](docs/presentation/README.md) | Full index of presentation materials |

---

## License

MIT — see [LICENSE](LICENSE).

---

*NodeScope is a developer observability tool. It does not provide financial advice,
custody services, or mainnet transaction execution. Demo scenarios use regtest only.*
