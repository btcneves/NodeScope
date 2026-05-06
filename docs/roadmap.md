# NodeScope Roadmap

This document translates the project roadmap into execution phases for the demo and final public release.

## Product Direction

NodeScope transforms Bitcoin Core raw data into real-time operational intelligence.

RPC gives the snapshot. ZMQ gives real time. NodeScope gives interpretation.

## Phase 1 — Regtest Command Center

**Target:** 2026-05-07  
**Status:** Ready for final rehearsal.

Objective: deliver a stable, visual, deterministic demo on regtest.

Required capabilities:

- Bitcoin Core regtest RPC health and chain snapshot.
- ZMQ `rawtx` and `rawblock` capture through `monitor.py`.
- Append-only NDJSON event store.
- Replay engine that rebuilds state from logs.
- Classification engine with confidence and signals.
- FastAPI REST endpoints and SSE stream.
- React dashboard with Command Center layout.
- Transaction Lifecycle: Created -> Broadcast -> Mempool -> ZMQ rawtx -> Block Mined -> Confirmed.
- Local demo through `make demo`.
- Docker demo through `make docker-demo`.

Phase 1 cuts:

- No wallet API.
- No signet live dependency.
- No mainnet mode.
- No public unauthenticated remote API.
- No persistent database migration.

## Phase 2 — Public Release Package

**Target:** 2026-05-10  
**Status:** In progress.

Objective: make the repository feel like a complete open-source product.

Required capabilities:

- README in Portuguese and English.
- Documentation index in `docs/README.md`.
- Architecture, API, demo, Docker and troubleshooting guides.
- Judge guide and live validation commands.
- Changelog, release notes, contributing guide and security policy.
- CI with backend lint/tests/audit, frontend build and public-clean.
- Safe environment examples.
- Docker Compose reproducibility.
- Real screenshots/GIFs captured from the verified dashboard.
- Suggested `v1.0.0` release after manual review.

## Phase 3 — Signet Observer Mode

**Target:** after v1.0.0

Objective: observe a public Bitcoin network without wallet operations.

Scope:

- `BITCOIN_NETWORK=signet` configuration.
- Signet-specific examples.
- Read-only RPC and ZMQ observer mode.
- Dashboard labels and safeguards for signet.
- Log rotation and archival guidance.
- VPS and tunnel deployment hardening.

Out of scope:

- Transaction signing.
- Seed phrase handling.
- Custodial wallet behavior.

## Phase 4 — Mainnet Read-Only Mode

**Target:** future release.

Objective: support mainnet observability with explicit safety controls.

Scope:

- Mainnet read-only configuration.
- API authentication or reverse proxy auth.
- SSE rate limiting.
- Persistent storage option.
- Metrics export.
- Production deployment checklist.

Out of scope:

- Sending BTC.
- Hot wallet operations.
- Custody.

## Phase 5 — Intelligence Expansion

**Target:** future release.

Objective: deepen interpretation while keeping the system explainable.

Candidate work:

- Mempool pressure score.
- Fee percentile summaries.
- RBF and replacement detection.
- Batch payment and consolidation heuristics.
- Taproot script pattern summaries.
- Historical charts.
- Event filters by type, kind, confidence and script type.

## Final Delivery Gate

Before a public release:

```bash
git status --short
make test
make build
make public-clean
docker compose config
```

With the stack running:

```bash
make smoke
make docker-demo
```
