# NodeScope — Project Status

## Current State (v1.0.0)

NodeScope is a production-ready hackathon prototype. All core features are implemented, tested and documented.

## Feature Inventory

| Component | Status | Notes |
|---|---|---|
| `monitor.py` — ZMQ subscriber | Ready | Captures `zmq_rawtx` and `zmq_rawblock`, enriches via RPC, writes NDJSON |
| `engine/` — replay pipeline | Ready | Reader, parser, classifier, snapshot, analytics |
| `api/` — FastAPI REST + SSE | Ready | 11 endpoints, read-only, graceful offline fallback |
| `frontend/` — React dashboard | Ready | 12 components, dark theme, 5-second polling + SSE live feed |
| Docker Compose stack | Ready | 4 services: bitcoind, api, monitor, frontend |
| Regtest demo script | Ready | Wallet, mining, send and confirm — idempotent |
| CI pipeline | Ready | ruff format, ruff check, unittest, pip-audit, npm build, public-clean |
| Documentation | Ready | 16 docs covering API, architecture, demo, deploy and troubleshooting |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | API and RPC status |
| `GET` | `/summary` | Event and classification analytics |
| `GET` | `/mempool/summary` | Live mempool stats via RPC |
| `GET` | `/events/recent` | Paginated raw events |
| `GET` | `/events/classifications` | Paginated classified events |
| `GET` | `/events/stream` | Server-Sent Events live stream |
| `GET` | `/blocks/latest` | Most recent block from ZMQ |
| `GET` | `/tx/latest` | Most recent transaction from ZMQ |
| `GET` | `/tx/{txid}` | Full transaction detail by txid |

## Test Suite

37 Python tests covering engine, API, RPC client, parser, classifier, SSE stream and monitor payloads. All passing.

## Dashboard Components

1. `Header` — network/RPC/ZMQ/SSE status indicators
2. `KpiRow` — Block Height, Mempool TXs, ZMQ TX Events, ZMQ Blocks, Classified, Event Store
3. `NodeHealthScore` — 0-100 weighted score (RPC 40pts, ZMQ 30pts, mempool 20pts, block freshness 10pts)
4. `TransactionLifecycle` — 6-stage animated flow: Created → Broadcast → Mempool → ZMQ rawtx → Block Mined → Confirmed
5. `MempoolPanel` — mempool depth, bytes, fee floor
6. `BlocksPanel` — latest block height, hash, timestamp
7. `TxPanel` — latest transaction txid, outputs, classification
8. `LiveFeed` — real-time SSE event stream with connection status
9. `EventsTable` — paginated raw event log
10. `ReplayEnginePanel` — event store metrics (source file, totals, ignored/skipped)
11. `RpcZmqSyncPanel` — RPC block height vs ZMQ captured events, in-sync badge
12. `ClassificationsTable` — classified events with kind, confidence, signals

## Known Limitations

- Event store is file-based (NDJSON append-only); no SQL or persistent database.
- Classification heuristics are conservative; tuned for regtest demo correctness.
- No authentication; designed for local or trusted-network deployment only.
- Signet/mainnet support is planned (Phase 2) but not implemented.

## Validation Commands

```bash
make test           # 37 Python tests
make build          # compileall + frontend TypeScript build
make public-clean   # scan for local artifacts and credentials
make smoke          # HTTP smoke tests (requires running backend)
make demo           # generate regtest wallet activity
docker compose config  # validate Docker Compose configuration
```

## Next Milestones

See [ROADMAP.md](../ROADMAP.md) for the full development plan.
