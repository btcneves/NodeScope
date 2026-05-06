# NodeScope — Project Status

## Current State

NodeScope is a hackathon-ready Bitcoin Core Intelligence Dashboard focused on a stable regtest demo and a professional public release.

Core product statement:

> NodeScope transforms Bitcoin Core raw data into real-time operational intelligence.

Technical statement:

> RPC gives the snapshot. ZMQ gives real time. NodeScope gives interpretation.

## Phase 1 — Demo Readiness

**Target date:** 2026-05-07
**Status:** Ready, pending final live rehearsal on the demo machine.

The local demo proves:

| Claim | Status | Evidence |
|---|---|---|
| Bitcoin Core RPC provides node snapshots | Ready | `/health`, `/mempool/summary`, dashboard KPIs |
| ZMQ provides real-time events | Ready | `monitor.py` subscribes to `rawtx` and `rawblock` |
| Events are stored append-only | Ready | Daily NDJSON files in `logs/` |
| Events are replayable | Ready | `engine/` snapshot pipeline and `scripts/replay_monitor_log.py` |
| Events are classified | Ready | `/events/classifications` and dashboard badges |
| API exposes structured data | Ready | FastAPI REST + SSE endpoints |
| Dashboard communicates the flow visually | Ready | Command Center, Node Health Score, Transaction Lifecycle, Live Feed |
| Regtest can create tx/block activity on demand | Ready | `make demo` locally, `make docker-demo` for Docker stack |

## Feature Inventory

| Component | Status | Notes |
|---|---|---|
| `monitor.py` — ZMQ subscriber | Ready | Captures `zmq_rawtx` and `zmq_rawblock`, enriches via RPC, writes NDJSON |
| `engine/` — replay pipeline | Ready | Reader, parser, classifier, snapshot, analytics |
| `api/` — FastAPI REST + SSE | Ready | Read-only endpoints with graceful offline fallback |
| `frontend/` — React dashboard | Ready | Command Center layout, polling and SSE live feed |
| Docker Compose stack | Ready | bitcoind, API, monitor and frontend services |
| Regtest demo script | Ready | Wallet, mining, send and confirm; idempotent for repeated rehearsals |
| CI pipeline | Ready | ruff format, ruff check, unittest, pip-audit, npm build, public-clean |
| Documentation | Ready | Setup, API, architecture, demo, deploy and troubleshooting guides |

## API Surface

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | API, storage and Bitcoin Core RPC status |
| `GET` | `/summary` | Event and classification analytics |
| `GET` | `/mempool/summary` | Live mempool stats via RPC |
| `GET` | `/events/recent` | Paginated raw events |
| `GET` | `/events/classifications` | Paginated classified events |
| `GET` | `/events/stream` | Server-Sent Events live stream |
| `GET` | `/blocks/latest` | Most recent block from ZMQ logs |
| `GET` | `/tx/latest` | Most recent transaction from ZMQ logs |
| `GET` | `/tx/{txid}` | Full transaction detail by txid when captured |

## Dashboard Components

1. `Header` — network, API, RPC and SSE status indicators
2. `KpiRow` — block height, mempool TXs, ZMQ TX events, ZMQ blocks, classified events, event store size
3. `NodeHealthScore` — 0-100 operational score
4. `TransactionLifecycle` — Created -> Broadcast -> Mempool -> ZMQ rawtx -> Block Mined -> Confirmed
5. `MempoolPanel` — mempool depth, bytes and fee floor
6. `BlocksPanel` — latest block height, hash and timestamp
7. `TxPanel` — latest transaction txid, outputs and classification
8. `LiveFeed` — real-time SSE event stream
9. `EventsTable` — paginated raw event log
10. `ReplayEnginePanel` — event store metrics
11. `RpcZmqSyncPanel` — RPC block height vs ZMQ captured blocks
12. `ClassificationsTable` — classified events with kind, confidence and signals

## What Is Not Being Added Before The Demo

| Item | Decision | Reason |
|---|---|---|
| Wallet API endpoints | Cut for Phase 1 | Scripted regtest flow is safer and easier to rehearse |
| Signet live mode | Saturday/Future | Demo priority is deterministic regtest |
| Mainnet support | Future | Product remains read-only by design |
| Authentication layer | Saturday/Future | Local demo does not expose the API publicly |
| Persistent database | Future | NDJSON is sufficient, replayable and easier to explain |

## Known Limitations

- Event store is file-based NDJSON, not SQL.
- Classification heuristics are conservative and optimized for explainability.
- API has no built-in authentication; keep it local or behind a trusted reverse proxy.
- Signet and mainnet are documented as read-only roadmap items, not primary demo scope.
- `make smoke` requires a running backend; it is expected to fail when the API is offline.

## Validation Commands

```bash
make test
make build
make public-clean
docker compose config
```

With a running backend:

```bash
make smoke
```

With a running Docker stack:

```bash
make docker-demo
```

## Phase 2 — Final Delivery Readiness

**Target date:** 2026-05-10
**Status:** In progress after demo rehearsal.

Saturday checklist:

- Final live rehearsal with local regtest.
- Update release notes and changelog from the final diff.
- Add screenshots or GIFs only after they are captured from the real dashboard.
- Confirm CI is green on the final branch.
- Confirm public-clean is green immediately before push.
- Prepare `v1.0.0` tag after manual review.

## Current Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Local Bitcoin Core port conflict | Demo startup delay | Use Docker stack or override `HOST_*` ports in `.env` |
| Missing local `bitcoin-cli` | Local demo blocked | Use `make docker-demo` with the Compose stack |
| ZMQ events not visible | Live feed appears inactive | Verify `getzmqnotifications`, restart monitor, use NDJSON replay as backup |
| Browser cannot reach API | Dashboard empty | Check Vite proxy and run `make smoke` |
| Public endpoint exposure | Security issue | Keep demo local or use documented tunnel/VPS guidance with access controls |

## Live Validation — 2026-05-06

Latest validation was run from a clean port state. The previous Docker stack was stopped first, then local processes were started from the current working tree. Docker was rebuilt afterward from the same code.

Ports checked:

| Port | Service | Result |
|---|---|---|
| `8000` | API | Released, then bound by the new API process and later by Docker |
| `5173` | Frontend | Released, then bound by Vite and later by Docker |
| `18443` | Bitcoin Core regtest RPC | Released, then bound by local regtest and later by Docker |
| `28332` | ZMQ rawblock | Released, then bound by local regtest and later by Docker |
| `28333` | ZMQ rawtx | Released, then bound by local regtest and later by Docker |

Commands executed successfully:

```bash
./.venv/bin/python -m compileall engine api scripts tests monitor.py
make test
make build
make public-clean
make docker-config
make smoke
make demo
docker compose config
docker compose up --build -d
make docker-demo
```

Validation results:

- 37 Python unit tests: 0 failures, 0 errors.
- `make build`: Python compileall clean; Vite bundle built with no TypeScript errors.
- `make public-clean`: CLEAN — 0 issues.
- `docker compose config`: valid.
- `make smoke`: PASS=7 FAIL=0 WARN=0.
- Ruff format check: 27 files already formatted.
- Ruff lint check: all checks passed.
- All four Docker containers up and healthy (bitcoind, api, monitor, frontend).
- `make docker-demo` created and confirmed a regtest transaction through the Docker bitcoind.

Issue found and fixed (2026-05-06):

- The API RPC client and ZMQ monitor were sending JSON-RPC version `1.1`, which Bitcoin Core rejected with HTTP 400 during real RPC calls. Both now use JSON-RPC `1.0`.

## Remaining Manual Steps Before Saturday

1. Open a pull request from `fix/demo-validation-readiness` to `main`.
2. Confirm CI is green (all jobs pass).
3. Merge the PR after review.
4. Apply the `v1.0.0` tag: `git tag v1.0.0 && git push origin v1.0.0`.
5. Create the GitHub release from the tag, linking `RELEASE_NOTES_v1.0.0.md`.
6. Run final live rehearsal on the demo machine using `docker compose up --build` and `make docker-demo`.

See `docs/final-delivery-checklist.md` for the full Saturday gate checklist.
