# Changelog

All notable changes to NodeScope are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- `GET /history/export.json` — full history export in JSON format with metadata and optional filters (source, success, since, until, limit)
- `GET /history/export.csv` — full history export in CSV format for spreadsheet tooling
- Export JSON / Export CSV buttons in Historical Dashboard (EN-US / PT-BR)
- Grafana + Prometheus optional observability pack (`docker-compose.observability.yml`, `observability/`)
- Pre-built Grafana dashboard `nodescope-overview.json` with panels for all 30+ real NodeScope metrics
- `make observability-up` and `make observability-down` Makefile targets
- ESLint (v9 flat config) + Prettier for frontend — `npm run lint`, `npm run format:check`
- CI now runs `npm run lint` and `npm run format:check` in the frontend job

### Changed
- Python unit test count updated to 80 (71 prior + 9 new export tests)
- README and documentation updated to reflect new endpoints and observability pack

---

## [1.1.0] — 2026-05-07

**Professional Lab release.** Major expansion from the v1.0.x observability dashboard into a
full interactive Bitcoin Core laboratory with guided scenarios, persistence, observability
instrumentation, and a complete bilingual interface.

### Added — Interactive Labs

- **Guided Demo** (14 steps) — `api/demo_service.py`, `frontend/src/components/GuidedDemo.tsx`
  - Full Bitcoin transaction lifecycle: wallet create → mine → send → mempool detect → ZMQ rawtx → decode → mine confirm → ZMQ rawblock → confirm → Proof Report
  - Each step returns status, timestamp, friendly message, technical output, and data payload
  - Proof Report: downloadable JSON with all TXIDs, fees, vsizes, block hashes, ZMQ signals

- **Transaction Inspector** — `GET /tx/inspect/{txid}`, `TransactionInspector.tsx`
  - Premium RPC analysis: txid, wtxid, size, vsize, weight, fee BTC, fee rate sat/vB, input/output count, script types, confirmations, block hash, block height, ZMQ events seen

- **ZMQ Event Tape** — `GET /events/tape`, `GET /events/tape/{txid}`, `ZmqEventTape.tsx`
  - Compact real-time stream with topic filters (rawtx/rawblock) and TXID linking to Inspector

- **Mempool Policy Arena** — `api/policy_service.py`, `MempoolPolicyArena.tsx`
  - Normal Transaction: standard sendtoaddress → mempool → confirm
  - Low-Fee Transaction: fee_rate=1 sat/vB, compares with standard rate
  - RBF Replacement (BIP125): replaceable tx → bumpfee → verify new TXID → confirm
  - CPFP Package: low-fee parent → raw child via createrawtransaction pipeline → package rate → confirm
  - Each scenario generates a copyable Proof Report

- **Reorg Lab** (experimental) — `api/reorg_service.py`, `ReorgLab.tsx`
  - 10-step controlled chain reorganization: send tx → mine → invalidateblock → mempool return → recovery mine → re-confirm → reconsiderblock → Proof Report
  - Only available in regtest; returns `unavailable` on other networks

- **Fee Estimation Playground** — `api/fee_service.py`, `GET /fees/estimate`, `GET /fees/compare`, `FeeEstimationPlayground.tsx`
  - Live `estimatesmartfee` for 1/3/6/12-block targets in CONSERVATIVE and ECONOMICAL modes
  - BTC/kvB and sat/vB displayed; honest `success`/`limited`/`unavailable` status (no invented values)
  - `/fees/compare` shows estimates alongside fee rates from most recent demo/policy runs

- **Cluster Mempool Detector** — `GET /mempool/cluster/compatibility`, `ClusterMempoolPanel.tsx`
  - Probes `getmempoolcluster` and `getmempoolfeeratediagram`; reports `unavailable` on BC26 without false positives

### Added — Live Simulation

- **Live Simulation Engine** — `api/simulation_service.py`, `SimulationPanel.tsx`
  - Auto-mines blocks and sends transactions at configurable intervals
  - `GET /simulation/status`, `POST /simulation/start`, `POST /simulation/stop`, `PUT /simulation/config`
  - Auto-starts on API boot; interval configurable without restart

### Added — Observability

- **Prometheus metrics** — `api/metrics.py`, `GET /metrics`
  - 24+ metrics: HTTP counters/histograms, RPC up/latency, ZMQ event counts, mempool/chain gauges, demo/policy/reorg run counters, proof report counter, simulation block/tx counters, storage health gauges
  - Middleware records per-request latency automatically

- **Operational Alerting Panel** — `AlertingPanel.tsx`
  - Polls API every 15 s; surfaces RPC offline (critical), simulation errors (warning), cluster mempool unavailable (info), Reorg Lab experimental note (info)

- **Intelligence Summary** — `GET /intelligence/summary`, `IntelligenceSummaryPanel.tsx`
  - Composite node health score (0–100), RPC/ZMQ/SSE status, mempool pressure (low/medium/high), event store info, classification summary

- **Reproducible Benchmark** — `scripts/benchmark_nodescope.py`
  - Latency table (min/mean/median/p95/max) per endpoint against a live stack; `make benchmark`

- **Load Smoke Test** — `scripts/load_smoke.py`
  - Concurrent requests against all read-only endpoints; per-endpoint and aggregate latency and success rate

### Added — Persistence

- **SQLite storage** — `api/storage.py`
  - Stores proof reports, demo runs, policy runs, and reorg runs in `.nodescope/history.db`
  - Transparent in-memory fallback if SQLite initialisation fails; `/history/summary` records backend type

- **History API** — `api/history_service.py`
  - `GET /history/summary` — storage health and row counts
  - `GET /history/proofs` — paginated proof reports with `source` and `success` filters
  - `GET /history/proofs/{id}` — single proof report by ID
  - `GET /history/demo-runs` — paginated demo run history
  - `GET /history/policy-runs` — paginated policy run history with `scenario` filter
  - `GET /history/reorg-runs` — paginated reorg run history

- **Historical Dashboard** — `HistoricalDashboard.tsx`
  - Browser tab showing all past runs: summary cards, proof reports table, demo/policy/reorg tables with copy-proof button

### Added — Security

- **Optional API key auth** — `api/app.py` (`_verify_api_key`, `_PROTECTED`)
  - All mutating endpoints (`POST`, `PUT`) protected via `X-NodeScope-API-Key` header when `NODESCOPE_REQUIRE_API_KEY=true`
  - Read-only endpoints always open

- **Session reset** — `POST /session/reset`
  - Truncates today's NDJSON log and resets simulation counters; requires API key when protection is enabled

### Added — Internationalization and Explainability

- **Full bilingual i18n** — `frontend/src/i18n/enUS.ts`, `ptBR.ts`
  - EN-US / PT-BR toggle in header; persisted via localStorage
  - Covers all navigation labels, action buttons, status indicators, page titles, descriptions, error messages

- **Bitcoin Glossary** — `frontend/src/i18n/glossary.ts`
  - 27 terms with EN-US and PT-BR definitions

- **Tooltips** — `frontend/src/components/ui/InfoTooltip.tsx`
  - Hover/focus tooltips on 22+ technical terms (RPC, ZMQ, Mempool, TXID, WTXID, Fee, Fee rate, vbytes, Weight, RBF, CPFP, Reorg, Cluster mempool, Proof Report, etc.)

- **ExplainBox** — `frontend/src/components/ui/ExplainBox.tsx`
  - Contextual explanation banners on every page: what the screen shows, why it matters in Bitcoin, what to observe

- **LearnMore** — `frontend/src/components/ui/LearnMore.tsx`
  - Expandable deep-dive sections on Policy Arena, ZMQ Tape, Reorg Lab, Transaction Inspector, Cluster Mempool, Proof Report

### Added — Presentation Pack

- `docs/presentation/pitch-1min.md` — 1-minute pitch (EN-US / PT-BR)
- `docs/presentation/pitch-3min.md` — 3-minute technical pitch (EN-US / PT-BR)
- `docs/presentation/technical-walkthrough.md` — step-by-step technical walkthrough
- `docs/presentation/evaluator-checklist.md` — reproducible evaluation checklist
- `docs/presentation/demo-script.md` — 1-minute and 5-minute demo scripts (EN-US / PT-BR)
- `docs/presentation/submission-text.md` — ready-to-paste submission text (EN-US / PT-BR)
- `docs/presentation/screenshots-checklist.md` — dashboard screenshot validation
- `docs/presentation/video-script.md` — scene-by-scene video script (EN-US / PT-BR)
- `docs/presentation/faq.md` — evaluator FAQ with honest answers (EN-US / PT-BR)
- `docs/presentation/README.md` — presentation pack index

### Added — Other

- **Browser favicon** — NodeScope icon in browser tab and apple-touch-icon
- `frontend/src/components/DemoView.tsx` — full-screen demo overlay (health ring, status rows, lifecycle, panels)
- `GET /intelligence/summary` extended with `IntelligenceSummaryResponse` and `EventStoreInfo` Pydantic models
- `frontend/src/components/TransactionLifecycle.tsx` expanded to 7 stages: Created → Broadcast → Mempool → ZMQ rawtx → Block Mined → ZMQ rawblock → Confirmed
- `make replay-demo` — offline NDJSON replay target (no Bitcoin Core required)
- CI: `public-clean` check updated to allow presentation pack patterns

### Changed

- `api/app.py` — version bumped to `1.1.0`; `lifespan` hook auto-starts simulation on boot; Prometheus middleware added
- `api/schemas.py` — 15+ new Pydantic response models (demo, policy, reorg, simulation, history, fee, cluster, inspector, tape)
- `pyproject.toml` — version bumped to `1.1.0`
- README.md, README.pt-BR.md — full rewrite to Professional Lab level; parity between EN-US and PT-BR; v1.1.0 release badge
- README.en-US.md — replaced with redirect to README.md
- ROADMAP.md — restructured as Implemented / In Progress / Planned / Deferred
- docs/api.md — complete rewrite documenting all 43 endpoints, authentication, and Prometheus metrics
- PROJECT_STATUS.md — capabilities table and roadmap updated to reflect v1.1.0 delivery
- Tests: 71 unit tests as of v1.1.0 (38 prior + 16 storage + 17 fee_service)

---

## [1.0.1] — 2026-05-07

### Fixed

- CI `public-clean` check: allow presentation pack patterns in the allowlist

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
