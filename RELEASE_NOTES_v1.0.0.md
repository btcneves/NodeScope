# Release Notes — NodeScope v1.0.0

**Release date:** 2026-05-06
**Tag:** `v1.0.0`

---

## Overview

NodeScope v1.0.0 is the first stable release of the Bitcoin Core Intelligence Dashboard. It delivers a complete observability stack for Bitcoin Core nodes in regtest, combining RPC snapshots, ZMQ real-time events, a transaction classification engine, and a React dashboard into a single reproducible system.

> **RPC gives the snapshot. ZMQ gives real time. NodeScope gives interpretation.**

---

## What's New in v1.0.0

### Dashboard

- **Node Health Score** — weighted 0-100 score (RPC 40pts, ZMQ 30pts, mempool 20pts, block freshness 10pts) with a color-coded progress bar (green ≥ 80, yellow 50–79, red < 50)
- **Transaction Lifecycle** — animated 6-stage flow panel: Created → Broadcast → Mempool → ZMQ rawtx → Block Mined → Confirmed, driven by live node state
- **SSE auto-reconnect** — the dashboard SSE stream now reconnects automatically with exponential backoff (3s → 5s → 10s, up to 3 retries) instead of silently disconnecting

### Documentation

- [docs/demo-checklist.md](docs/demo-checklist.md) — step-by-step pre-demo verification for all services
- [docs/judges-guide.md](docs/judges-guide.md) — technical evaluation guide covering architecture, verification steps, and what to assess
- [docs/demo-script.md](docs/demo-script.md) — 4-minute demo narrative with live commands
- [CONTRIBUTING.md](CONTRIBUTING.md) — complete contribution guide: setup, code style, PR process
- [SECURITY.md](SECURITY.md) — security scope, known limitations, and responsible disclosure
- [ROADMAP.md](ROADMAP.md) — four-phase plan from regtest to mainnet read-only
- [README.pt-BR.md](README.pt-BR.md) — full Portuguese documentation
- [docs/deploy-vps.md](docs/deploy-vps.md) — VPS deployment with nginx reverse proxy
- [docs/deploy-cloudflare-tunnel.md](docs/deploy-cloudflare-tunnel.md) — zero-port-forward public demo via Cloudflare Tunnel
- [docs/signet.md](docs/signet.md) — observer mode guide for signet (Phase 2 preview)

### Infrastructure

- CI now runs `ruff format --check` and `ruff check` on every push and PR
- CI now runs `pip-audit` to check for known vulnerabilities in Python dependencies
- Node matrix in CI expanded to Node 18 and 20 for frontend build validation

---

## Full Feature Set

| Feature | Status |
|---------|--------|
| Bitcoin Core RPC health and mempool summary | ✅ |
| ZMQ monitor for `rawtx` and `rawblock` | ✅ |
| Append-only NDJSON event storage | ✅ |
| Snapshot rebuild from logs (offline replay) | ✅ |
| Transaction and block classification engine | ✅ |
| REST API with 8 endpoints | ✅ |
| Server-Sent Events real-time stream | ✅ |
| React/Vite/TypeScript dashboard | ✅ |
| Node Health Score panel | ✅ |
| Transaction Lifecycle visualization | ✅ |
| SSE auto-reconnect with backoff | ✅ |
| Regtest demo script | ✅ |
| Docker Compose demo stack | ✅ |
| 37 Python unit tests | ✅ |
| CI: tests, build, lint, audit, public-clean | ✅ |
| Bilingual documentation (EN + PT-BR) | ✅ |

---

## Breaking Changes

None. This is the first stable release.

---

## Upgrade from 0.1.0

```bash
git pull origin main
make setup   # reinstalls Python deps
cd frontend && npm ci && cd ..
```

No database migrations or configuration changes required.

---

## Known Limitations

- No API authentication (Phase 1 is loopback-only by design).
- Regtest is the primary supported network. Signet support is documented in Phase 2.
- NDJSON logs are not rotated automatically beyond daily file naming.
- No rate limiting on `/events/stream`.

See [SECURITY.md](SECURITY.md) for mitigation guidance.

---

## Checksums

Build validation:

```bash
make test          # 37 Python tests — all pass
make build         # TypeScript strict + Vite bundle — no errors
make public-clean  # 0 issues
docker compose config  # valid
```

---

## Repository

- Source: https://github.com/btcneves/NodeScope
- License: MIT
- Stack: Python 3.12, FastAPI, PyZMQ, React 18, TypeScript, Vite
