# Roadmap

NodeScope is structured in phases, each expanding the scope while preserving the core design principles: read-only observability, no custodial operations, and zero external database dependency in Phase 1.

---

## Phase 1 — Regtest Intelligence Dashboard (Current)

**Status:** Complete

Goals:
- Unified observability across RPC, ZMQ, and mempool
- Append-only NDJSON event storage with replay capability
- Transaction classification with confidence signals
- React dashboard with real-time SSE updates
- Node Health Score and Transaction Lifecycle visualization
- Docker Compose demo stack for reproducible setup
- 35+ unit tests and CI pipeline

---

## Phase 2 — Signet Observer Mode

**Target:** Read-only monitoring of Bitcoin signet network

Goals:
- `BITCOIN_NETWORK=signet` flag to switch from regtest
- Signet-specific configuration examples (`.env.signet.example`, `bitcoin.signet.conf.example`)
- Observer mode: ZMQ + RPC without any wallet or regtest-only operations
- Dashboard adapted for signet (no "mine block" demo controls)
- Persistent log storage with rotation and archival
- Deployment guides for VPS and Cloudflare Tunnel

No wallet, no transaction signing, no key management in this phase.

---

## Phase 3 — Mainnet Read-Only Mode

**Target:** Read-only monitoring of Bitcoin mainnet

Goals:
- `BITCOIN_NETWORK=mainnet` flag
- Explicit network safeguards: no regtest/signet operations allowed when mainnet is active
- Authentication layer for the NodeScope API (API key or HTTP Basic Auth via proxy)
- Rate limiting on `/events/stream`
- Persistent storage option (migration path from NDJSON to a time-series store)
- Prometheus metrics export endpoint
- Public demo deployment documentation

No transaction signing or wallet operations. NodeScope remains an observability tool.

---

## Phase 4 — Intelligence Layer Expansion

**Target:** Richer analysis and dashboard capabilities

Goals:
- Advanced classification heuristics (UTXO consolidation, batch payments, RBF detection, Taproot script patterns)
- Mempool pressure scoring (fee rate percentiles, congestion signals)
- Dashboard filters: event type, classification kind, confidence, script type
- Block statistics panel (tx count, total fees, size distribution)
- Historical trend charts (event rate, mempool depth, fee rate over time)
- Alert system: configurable thresholds for mempool size, fee rate, block interval

---

## Design Principles (All Phases)

- **Read-only by default.** NodeScope never signs transactions or manages keys.
- **No custodial operations.** No wallet keys, no signing authority, no wallet custody.
- **Observable internals.** Every classification includes confidence score and signals.
- **Replayable data.** NDJSON logs are the durable source of truth; the engine can reprocess from scratch.
- **Minimal dependencies.** Each phase adds only what is necessary.
- **Explicit network scoping.** regtest, signet, and mainnet are explicitly configured and guarded.

---

## Contributing to the Roadmap

Open an issue to discuss a feature before starting work. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.
