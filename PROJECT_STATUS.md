# NodeScope Project Status

## Current State

NodeScope is a working hackathon-ready prototype with:

- FastAPI backend exposing health, summary, mempool, event, block and transaction endpoints.
- ZMQ monitor for `rawtx` and `rawblock` streams.
- Append-only NDJSON event storage and replay engine.
- Transaction and block classification pipeline.
- React/Vite/TypeScript dashboard.
- Regtest demo script, Docker Compose demo stack, CI and smoke checks.

## Readiness Checklist

| Area | Status | Notes |
|---|---|---|
| Backend API | Ready | Handles missing Bitcoin Core with structured fallback responses. |
| ZMQ monitor | Ready | Uses configurable RPC and ZMQ endpoints. |
| Engine replay | Ready | Rebuilds snapshots from NDJSON logs. |
| Frontend | Ready | Builds production assets and shows offline/empty states. |
| Regtest demo | Ready | Generates wallet activity, mempool transaction and mined block. |
| Tests | Ready | Unit suite covers engine, parser, API, RPC and demo helpers. |
| CI | Ready | Runs Python tests, frontend build and public-clean check. |
| Documentation | Ready | README plus setup, API, architecture, demo and troubleshooting guides. |

## Hackathon Requirements

| Requirement | Status |
|---|---|
| Bitcoin Core backend | Ready |
| RPC data extraction | Ready |
| ZMQ event reaction | Ready |
| Backend API | Ready |
| Web interface | Ready |
| Real node data demonstration | Ready |
| Backend/frontend integration | Ready |
| Real-time event path | Ready |
| Public open source documentation | Ready |
|  | Pending recording |

## Validation

```bash
make test
make build
make public-clean
docker compose config
```

With the backend running:

```bash
make smoke
```

## Remaining Manual Steps

- Record the 3 to 5 minute  outside the repository.
- Run the regtest demo against a local or Docker Bitcoin Core node before the final demo.
- Push the feature branch and open a pull request manually.
