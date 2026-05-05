# Changelog

All notable changes to NodeScope are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.0] — 2026-05-04

### Added
- `frontend/` — React 18 + Vite + TypeScript dashboard
  - Real-time dashboard: KPI cards, mempool panel, live SSE feed, blocks, transactions, classifications
  - Dark theme, responsive layout (3→2→1 column grid)
  - Vite dev proxy to backend (no CORS issues in development)
- `api/rpc.py` — Bitcoin Core JSON-RPC client (stdlib only, no extra dependency)
  - Configurable via `BITCOIN_RPC_URL`, `BITCOIN_RPC_USER`, `BITCOIN_RPC_PASSWORD`
  - Regtest defaults: `http://127.0.0.1:18443`, user `nodescope`
- `GET /mempool/summary` — live mempool stats via RPC with graceful offline fallback
- CORS middleware for frontend development servers (ports 5173 and 3000)
- `GET /health` — extended with `rpc_ok`, `chain`, `blocks`, `rpc_error`
- `scripts/demo_regtest.sh` — idempotent regtest demo script (wallet, mining, send, confirm)
- `docs/architecture.md` — system architecture and data flow
- `docs/api.md` — complete API reference
- `docs/bitcoin-core-setup.md` — Bitcoin Core configuration guide
- `docs/demo.md` — end-to-end demo walkthrough
- `docs/troubleshooting.md` — common issues and fixes
- 8 new automated tests: RPC client (5), health with RPC (2), mempool endpoint (1)

### Changed
- `GET /health` now returns RPC connectivity status alongside existing fields
- `README.md` rewritten as professional public-facing documentation
- `Makefile`, Dockerfile, Docker Compose, CI workflow, public-clean check, smoke test, contribution/security docs, project status,  and regtest config example
- Transaction classification expanded with `possible_op_return` and `complex_transaction`

---

## [0.0.1] — 2026-04-23

### Added
- `monitor.py` — ZMQ subscriber with RPC enrichment; outputs append-only NDJSON
  - Captures `zmq_rawtx` and `zmq_rawblock` events
  - Enriches `rawtx` via `decoderawtransaction`: `coinbase_input_present`, `script_types`, `has_op_return`, output counts
- `engine/` — offline replay pipeline
  - `reader.py` — NDJSON validation with line-level error tracking
  - `parser.py` — normalizes `TxEvent` and `BlockEvent` from raw NDJSON
  - `classify.py` — conservative heuristics: `coinbase_like`, `simple_payment_like`, `block_event`, `unknown`
  - `snapshot.py` — `load_snapshot()`, single source of truth for API and scripts
  - `analytics.py` — aggregate counters: event types, classification kinds, script types, signal counts
  - `models.py` — typed dataclasses: `RawEvent`, `TxEvent`, `BlockEvent`, `ClassifiedEvent`
- `api/` — read-only FastAPI application
  - `GET /health` — API and storage status
  - `GET /summary` — aggregate analytics snapshot
  - `GET /events/recent` — filterable, paginated event list
  - `GET /events/classifications` — filterable, paginated classification list
  - `GET /events/stream` — Server-Sent Events stream (live NDJSON tail)
  - `GET /blocks/latest` — latest block seen via ZMQ
  - `GET /tx/latest` — latest transaction seen via ZMQ
  - Legacy web demo served at `/demo`
- `scripts/run_api.py` — Uvicorn launcher with configurable host and port
- `scripts/replay_monitor_log.py` — CLI to replay NDJSON logs through the engine
- `tests/` — 26 automated tests covering engine, API, SSE stream, monitor payload
- `requirements.txt` — `pyzmq`, `fastapi`, `uvicorn`, `httpx`
- `LICENSE` — MIT
- `.gitignore`

---

*Total: 35 automated tests passing.*
