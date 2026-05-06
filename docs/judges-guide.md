# Judges Guide — NodeScope

Technical reference for evaluators. This document covers how to run, verify, and assess NodeScope independently.

---

## What NodeScope Does

NodeScope is a **Bitcoin Core Intelligence Dashboard** that unifies three data sources:

| Source | What it provides |
|--------|-----------------|
| Bitcoin Core RPC | Node state snapshot: chain info, mempool, block data |
| Bitcoin Core ZMQ | Real-time events: raw transactions and blocks as they occur |
| Engine (local) | Event storage, parsing, classification, and replay |

The result is a unified REST API + SSE stream + React dashboard that transforms raw Bitcoin Core output into structured, classified, replayable intelligence.

---

## Quickstart (Docker)

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
docker compose up
```

Wait ~30s for Bitcoin Core to initialize, then open:

- **Dashboard:** http://localhost:5173
- **API:** http://localhost:8000/health

---

## Quickstart (Local)

Requirements: Python 3.12+, Node.js 18+, Bitcoin Core with regtest enabled.

```bash
make setup      # creates .venv, installs Python deps, installs Node deps
make backend    # starts FastAPI on port 8000
make monitor    # starts ZMQ subscriber (separate terminal)
make frontend   # starts Vite dev server on port 5173
make demo       # generates regtest activity (wallet + tx + block)
```

Configuration via `.env` (copy from `.env.example`). Bitcoin Core config via `bitcoin.conf.example`.

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Node health: API status, RPC connection, chain info |
| `GET /summary` | Aggregated event counts and classification breakdown |
| `GET /mempool/summary` | Live mempool data via RPC with graceful fallback |
| `GET /events/recent` | Paginated raw events from NDJSON log |
| `GET /events/classifications` | Classified events with confidence and signals |
| `GET /events/stream` | Server-Sent Events for real-time updates |
| `GET /blocks/latest` | Latest block captured from ZMQ |
| `GET /tx/latest` | Latest transaction captured from ZMQ |

All endpoints are **read-only**. No authentication required for local regtest.

---

## Key Technical Claims — How to Verify

### 1. ZMQ real-time capture

```bash
# With monitor.py running, mine a block and watch the log update
bitcoin-cli -regtest generatetoaddress 1 $(bitcoin-cli -regtest getnewaddress)
tail -f logs/$(date +%Y-%m-%d)-monitor.ndjson
```

Expected: new JSON line within 1-2 seconds with `"event": "rawblock"`.

### 2. RPC enrichment

```bash
curl -s http://localhost:8000/tx/latest | jq '{txid, inputs, outputs, total_out, kind}'
```

Expected: decoded transaction with input/output counts and value (not raw hex).

### 3. Classification engine

```bash
curl -s "http://localhost:8000/events/classifications?limit=5" | \
  jq '.items[] | {kind, metadata}'
```

Expected: each item has `kind` (e.g. `simple_payment_like`, `coinbase_like`), `confidence` (`low`/`medium`/`high`), and `reason` explaining the classification signals.

### 4. NDJSON replay

```bash
./.venv/bin/python scripts/replay_monitor_log.py
```

Expected: summary of events reprocessed from NDJSON without needing Bitcoin Core online.

### 5. SSE live stream

```bash
curl -N http://localhost:8000/events/stream
# In another terminal, generate activity:
bitcoin-cli -regtest sendtoaddress $(bitcoin-cli -regtest getnewaddress) 0.1
```

Expected: SSE event appears within 1-2 seconds of the transaction being broadcast.

---

## Test Suite

```bash
# Python unit tests (35 tests)
./.venv/bin/python -m unittest discover -s tests -v

# Frontend build (TypeScript strict check + Vite bundle)
cd frontend && npm ci && npm run build

# Static compilation check
./.venv/bin/python -m compileall engine api scripts tests monitor.py
```

All 35 Python tests should pass. Frontend build should succeed with no TypeScript errors.

---

## Architecture Summary

```
Bitcoin Core
    ↓ ZMQ (rawtx, rawblock)        ↓ RPC (enrichment)
monitor.py
    ↓ append-only NDJSON logs
engine/ (reader → parser → classify → snapshot → analytics)
    ↓
FastAPI (REST + SSE)
    ↓
React Dashboard (polling 5s + SSE real-time)
```

**Design decisions:**
- No external database — NDJSON files are the source of truth
- No authentication — local regtest only (documented as Fase 1 scope)
- Graceful degradation — API returns partial data if Bitcoin Core is offline
- Read-only — no transaction signing, no key management, no custodial operations

---

## What to Evaluate

| Criterion | Where to look |
|-----------|--------------|
| Real-time data capture | Live Feed panel + `/events/stream` SSE |
| Classification intelligence | Classifications Table + `/events/classifications` |
| Replay / auditability | `scripts/replay_monitor_log.py` + NDJSON logs |
| Test coverage | `tests/` directory — 35 unit tests |
| Code quality | `engine/`, `api/` — typed Python with Pydantic schemas |
| Documentation | `docs/` — architecture, API reference, setup guides |
| Reproducibility | `docker compose up` or `make setup && make demo` |

---

## Repository

- GitHub: https://github.com/btcneves/NodeScope
- License: MIT
- Stack: Python 3.12, FastAPI, PyZMQ, React 18, TypeScript, Vite
- Bitcoin Core: v26+ (Docker), v31+ (local)
