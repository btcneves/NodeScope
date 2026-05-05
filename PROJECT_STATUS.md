# NodeScope Project Status

## Current State

NodeScope is a working hackathon-ready prototype with:

- FastAPI backend exposing health, summary, mempool, event, block and transaction endpoints.
- ZMQ monitor for `rawtx` and `rawblock` streams.
- Append-only NDJSON event storage and replay engine.
- Transaction and block classification pipeline.
- React/Vite/TypeScript dashboard.
- Regtest demo script, Docker backend stack, CI and smoke checks.

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

## Remaining Manual Steps

- Add the GitHub repository About text:
  `Bitcoin Core intelligence dashboard for real-time node observability using RPC, ZMQ, mempool monitoring, and regtest demos.`
- Record the 3 to 5 minute  using ``.
- Push the feature branch and open the pull request manually.
