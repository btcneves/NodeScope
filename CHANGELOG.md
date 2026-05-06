# Changelog

All notable changes to NodeScope are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — Post-release polish

### Added
- `GET /intelligence/summary` — composite intelligence endpoint: node health score (0–100), RPC/ZMQ/SSE status, mempool pressure (low/medium/high), latest signal, event store info, classification summary, latest block and latest tx
- `api/schemas.py` — `IntelligenceSummaryResponse` and `EventStoreInfo` Pydantic models
- `api/service.py` — `get_intelligence_summary()` with mempool pressure computation
- `frontend/src/components/IntelligenceSummaryPanel.tsx` — intelligence summary card with score, status dots, pressure badge and classification breakdown
- `frontend/src/components/DemoView.tsx` — full-screen demo overlay (title, tagline, health ring, status rows, lifecycle, panels)
- `frontend/src/types/api.ts` — `IntelligenceData` interface
- `frontend/src/api/client.ts` — `api.intelligenceSummary()` method
- `frontend/src/components/Header.tsx` — "Demo View" button
- `docs/demo-transcript.md` — validated demo output (37 tests, smoke PASS=7 FAIL=0, replay summary, intelligence endpoint, Docker demo)
- `make replay-demo` — Makefile target that runs `replay_monitor_log.py` offline (no Bitcoin Core required)
- README: "Evaluate in 1 Minute" and "Why NodeScope Is Different" sections
- README: Release v1.0.0, Docker Compose and Bitcoin Core badges

### Changed
- `frontend/src/components/TransactionLifecycle.tsx` — expanded to 7 stages: Created → Broadcast → Mempool → ZMQ rawtx → Block Mined → ZMQ rawblock → Confirmed
- `frontend/src/App.tsx` — intelligence summary panel added alongside NodeHealthScore; demo view toggle wired to Header
- `frontend/src/index.css` — CSS for IntelligenceSummaryPanel, DemoView overlay, demo button and mempool pressure badges
- README: `GET /intelligence/summary` added to endpoints table

---

## [1.0.0] — 2026-05-06

### Added
- `frontend/src/components/TransactionLifecycle.tsx` — animated 6-stage transaction flow panel (Created → Broadcast → Mempool → ZMQ rawtx → Block Mined → Confirmed), driven by live RPC, ZMQ, and mempool state
- `frontend/src/components/NodeHealthScore.tsx` — 0-100 weighted score card (RPC 40pts, ZMQ 30pts, mempool 20pts, block freshness 10pts) with color-coded progress bar
- `frontend/src/utils/healthScore.ts` — isolated score computation logic
- `docs/demo-checklist.md` — step-by-step pre-demo verification
- `docs/judges-guide.md` — technical evaluation guide
- `docs/demo-script.md` — 4-minute demo narrative
- `docs/deploy-vps.md` — VPS deployment with nginx reverse proxy
- `docs/deploy-cloudflare-tunnel.md` — Cloudflare Tunnel zero-port-forward guide
- `docs/signet.md` — observer mode guide for signet (Phase 2 preview)
- `CONTRIBUTING.md` — complete contribution guide
- `SECURITY.md` — security scope, limitations, and responsible disclosure
- `ROADMAP.md` — four-phase development plan
- `README.pt-BR.md` — full Portuguese documentation
- `RELEASE_NOTES_v1.0.0.md` — detailed release notes
- `.env.signet.example` — signet environment template
- `bitcoin.signet.conf.example` — signet Bitcoin Core configuration example
- CI: `ruff format --check` and `ruff check` on every push and PR
- CI: `pip-audit` for Python dependency vulnerability scanning

### Fixed
- Applied `ruff format` to `engine/classify.py` and `engine/parser.py` (missed in initial Phase 2 commit)

### Changed
- `frontend/src/hooks/useSSE.ts` — auto-reconnect with exponential backoff (3s → 5s → 10s, up to 3 retries)
- `frontend/src/App.tsx` — NodeHealthScore, TransactionLifecycle, ReplayEnginePanel and RpcZmqSyncPanel integrated into main layout
- `frontend/src/index.css` — CSS for lifecycle animation, health score, replay engine and RPC/ZMQ sync panels
- `frontend/src/components/KpiRow.tsx` — restructured KPIs: Block Height (RPC snapshot), Mempool TXs, ZMQ TX Events, ZMQ Blocks, Classified, Event Store
- `README.md` — language switcher linking to Portuguese documentation
- `requirements-dev.txt` — added `pip-audit`

### Added (dashboard and API extensions)
- `frontend/src/components/ReplayEnginePanel.tsx` — event store metrics card (source file, totals, rawtx/rawblock/other/ignored/skipped counts)
- `frontend/src/components/RpcZmqSyncPanel.tsx` — side-by-side RPC vs ZMQ alignment with in-sync/behind badge
- `GET /tx/{txid}` — transaction lookup by txid; searches the event store and returns full transaction detail, or 404 if not found
- `docs/live-validation.md` — curl-based validation guide covering all 11 endpoints with expected responses, designed for evaluators
- `frontend/src/api/client.ts` — `api.txById(txid)` for direct transaction lookup from the frontend
- `frontend/src/types/api.ts` — `SummaryData` extended with optional `skipped_events` and `source` fields

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
- `Makefile`, Dockerfile, Docker Compose, CI workflow, public-clean check, smoke test, contribution/security docs, project status and regtest config example
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

*Total: 37 automated tests passing.*
