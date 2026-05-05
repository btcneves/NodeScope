# NodeScope

**Bitcoin Core Intelligence Dashboard** — real-time observability for Bitcoin Core nodes.

NodeScope captures live events from Bitcoin Core via ZMQ, enriches transaction data via RPC, persists the feed as append-only NDJSON, processes it through a classification engine, and exposes everything through a read-only REST API and a React dashboard.

---

## Overview

```
Bitcoin Core (regtest / signet / mainnet)
  ├── ZMQ rawtx  → tcp://127.0.0.1:28333
  └── ZMQ rawblock → tcp://127.0.0.1:28332
         │
     monitor.py  (ZMQ subscriber + RPC enrichment)
         │
   logs/YYYY-MM-DD-monitor.ndjson  (append-only)
         │
      engine/  (reader → parser → classify → snapshot)
         │
      api/     (FastAPI — REST + SSE)
         │
   frontend/   (React + Vite + TypeScript — port 5173)
```

| Component | Technology | Port |
|---|---|---|
| Bitcoin Core | v31.0.0+ | RPC 18443 / ZMQ 28332–28333 |
| Backend API | Python 3.12, FastAPI, Uvicorn | 8000 |
| Frontend | React 18, Vite, TypeScript | 5173 |

---

## Features

- **Live ZMQ ingestion** — captures `rawtx` and `rawblock` events as they happen
- **RPC enrichment** — decodes raw transactions via `bitcoin-cli decoderawtransaction`
- **Structured logging** — append-only NDJSON with UTC timestamps, replay-safe
- **Classification engine** — labels transactions: `coinbase_like`, `simple_payment_like`, `block_event`, `unknown`
- **Mempool stats** — live mempool size, bytes, and min fee via RPC
- **Server-Sent Events** — dashboard updates in real-time without polling
- **React dashboard** — dark-themed UI with KPI cards, live feed, blocks, transactions, classifications
- **34 automated tests** — covering engine, API, RPC client, SSE stream

---

## Quick Start

### 1. Bitcoin Core

See [docs/bitcoin-core-setup.md](docs/bitcoin-core-setup.md) for full setup.

Minimum `~/.bitcoin/bitcoin.conf`:

```ini
regtest=1
rpcuser=corecraft
rpcpassword=corecraft
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
zmqpubrawblock=tcp://127.0.0.1:28332
zmqpubrawtx=tcp://127.0.0.1:28333
txindex=1
```

Start the node:
```bash
bitcoind -daemon
bitcoin-cli -regtest getblockchaininfo  # verify
```

### 2. Backend

```bash
# Install dependencies
./.venv/bin/pip install -r requirements.txt

# Start the API (default: 127.0.0.1:8000)
./.venv/bin/python scripts/run_api.py

# Optional: start the ZMQ monitor in a separate terminal
./.venv/bin/python monitor.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

### 4. Demo

Run automated regtest activity:

```bash
bash scripts/demo_regtest.sh
```

Watch the dashboard at `http://localhost:5173` update in real-time.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Node status, RPC connectivity, event count |
| GET | `/summary` | Aggregate stats: events, classifications, script types |
| GET | `/mempool/summary` | Live mempool stats via RPC |
| GET | `/events/recent` | Recent NDJSON events (filterable, paginated) |
| GET | `/events/classifications` | Classified events (filterable, paginated) |
| GET | `/events/stream` | Server-Sent Events stream (live) |
| GET | `/blocks/latest` | Latest block seen via ZMQ |
| GET | `/tx/latest` | Latest transaction seen via ZMQ |

Full reference: [docs/api.md](docs/api.md)

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for component details and data flow.

Key decisions:
- **Append-only NDJSON** — no database required, replay-safe, zero ops overhead
- **Replay-first engine** — `load_snapshot()` is the single source of truth for API and scripts
- **Read-only API** — no writes, no auth required for local demo
- **SSE over WebSocket** — simpler, works with the NDJSON tail model

---

## Testing

```bash
# Run all 34 tests
./.venv/bin/python -m unittest discover -s tests -v

# Static validation
./.venv/bin/python -m compileall engine api scripts tests monitor.py
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BITCOIN_RPC_URL` | `http://127.0.0.1:18443` | Bitcoin Core RPC endpoint |
| `BITCOIN_RPC_USER` | `corecraft` | RPC username |
| `BITCOIN_RPC_PASSWORD` | `corecraft` | RPC password |

---

## Project Structure

```
NodeScope/
├── monitor.py              ZMQ subscriber + RPC enrichment
├── engine/                 NDJSON replay, parsing, classification, snapshot
├── api/                    FastAPI — REST endpoints + SSE + legacy demo
│   ├── rpc.py              Bitcoin Core JSON-RPC client
│   ├── app.py              Route definitions + CORS
│   ├── service.py          Business logic
│   └── schemas.py          Pydantic response models
├── frontend/               React + Vite + TypeScript dashboard
├── scripts/                Operational utilities
│   ├── run_api.py          Start the API server
│   ├── replay_monitor_log.py  Replay NDJSON logs through engine
│   └── demo_regtest.sh     Generate regtest activity for demos
├── tests/                  unittest suite (34 tests)
├── docs/                   Architecture, API, setup, demo, troubleshooting
├── logs/                   Runtime NDJSON logs (gitignored)
└── notes/                  Technical vault (ADRs, MOCs, backlog)
```

---

## Docs

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Bitcoin Core Setup](docs/bitcoin-core-setup.md)
- [Demo Guide](docs/demo.md)
- [Troubleshooting](docs/troubleshooting.md)

---

## License

MIT. See [LICENSE](LICENSE).
