# NodeScope — Final Delivery Checklist

**Delivery target:** 2026-05-10  
**Status snapshot:** 2026-05-06

---

## How to Read This Checklist

| Symbol | Meaning |
|--------|---------|
| ✅ Ready | Validated and complete |
| ⚠️ Partial | Present but needs attention before delivery |
| ❌ Missing | Not done — action required |
| 🔒 Blocked | Depends on external factor or decision |

Priority: **P0** = must pass, **P1** = should pass, **P2** = nice to have.

---

## Demo Local

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `make backend` starts FastAPI on port 8000 | ✅ Ready | Port 8000 bound; smoke PASS=7 | None | P0 |
| `make monitor` starts ZMQ subscriber | ✅ Ready | Monitor running; NDJSON logs in `logs/` | None | P0 |
| `make frontend` starts Vite on port 5173 | ✅ Ready | Port 5173 bound | None | P0 |
| `make demo` runs regtest flow without error | ✅ Ready | Script creates wallet, tx, mines block | None | P0 |
| `make smoke` passes all 7 checks | ✅ Ready | PASS=7 FAIL=0 WARN=0 | None | P0 |
| SSE live stream updates dashboard after `make demo` | ✅ Ready | SSE auto-reconnect with backoff in `useSSE.ts` | Run full live rehearsal before Saturday | P0 |

---

## Docker Demo

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `docker compose config` validates without error | ✅ Ready | Config printed without errors | None | P0 |
| `docker compose up --build` starts all 4 services | ✅ Ready | All 4 containers Up 42+ min, bitcoind + api healthy | None | P0 |
| `nodescope-bitcoind` healthcheck passes | ✅ Ready | Status: healthy | None | P0 |
| `nodescope-api` healthcheck passes | ✅ Ready | Status: healthy | None | P0 |
| `nodescope-monitor` running | ✅ Ready | Container up, no crash-loop | None | P0 |
| `nodescope-frontend` accessible on port 5173 | ✅ Ready | Port 5173 bound | None | P0 |
| `make docker-demo` runs regtest flow through Docker bitcoind | ✅ Ready | Validated 2026-05-06 | None | P0 |
| `make smoke` passes against Docker stack | ✅ Ready | PASS=7 FAIL=0 WARN=0 | None | P0 |

---

## API

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `GET /health` returns `rpc_ok: true` with Bitcoin Core running | ✅ Ready | Smoke test passes | None | P0 |
| `GET /summary` returns non-zero event counts after demo | ✅ Ready | Engine replay working | None | P0 |
| `GET /mempool/summary` returns live RPC data | ✅ Ready | Endpoint tested in `test_api.py` | None | P0 |
| `GET /events/recent` returns paginated events | ✅ Ready | Tests pass | None | P0 |
| `GET /events/classifications` returns classified events | ✅ Ready | Tests pass | None | P0 |
| `GET /events/stream` emits SSE events | ✅ Ready | SSE test in `test_api.py` | None | P0 |
| `GET /blocks/latest` returns latest block | ✅ Ready | Tests pass | None | P0 |
| `GET /tx/latest` returns latest transaction | ✅ Ready | Tests pass | None | P0 |
| `GET /tx/{txid}` returns 404 for unknown txid | ✅ Ready | `test_tx_by_id_raises_404_when_not_found` | None | P0 |
| FastAPI `/docs` interactive documentation accessible | ✅ Ready | Swagger served by default | None | P1 |

---

## Dashboard

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| Header shows network, API, RPC, SSE status | ✅ Ready | `Header.tsx` component | None | P0 |
| KPI row: block height, mempool TXs, ZMQ events, classified | ✅ Ready | `KpiRow.tsx` with 6 KPIs | None | P0 |
| Node Health Score panel (0-100) | ✅ Ready | `NodeHealthScore.tsx` | None | P0 |
| Transaction Lifecycle panel (6 stages) | ✅ Ready | `TransactionLifecycle.tsx` | None | P0 |
| Mempool panel shows depth and fee floor | ✅ Ready | `MempoolPanel.tsx` | None | P0 |
| Blocks panel shows latest block | ✅ Ready | `BlocksPanel.tsx` | None | P0 |
| TX panel shows latest transaction | ✅ Ready | `TxPanel.tsx` | None | P0 |
| Live Feed shows SSE events with auto-reconnect | ✅ Ready | `LiveFeed.tsx` + backoff hook | None | P0 |
| Events Table and Classifications Table | ✅ Ready | Both components present | None | P0 |
| Replay Engine and RPC/ZMQ Sync panels | ✅ Ready | `ReplayEnginePanel.tsx`, `RpcZmqSyncPanel.tsx` | None | P1 |
| React app builds without TypeScript errors | ✅ Ready | `npm run build` passes | None | P0 |

---

## RPC / ZMQ

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| Bitcoin Core responds to RPC (regtest) | ✅ Ready | Port 18443 listening | None | P0 |
| ZMQ rawblock on port 28332 | ✅ Ready | Port 28332 listening | None | P0 |
| ZMQ rawtx on port 28333 | ✅ Ready | Port 28333 listening | None | P0 |
| monitor.py subscribes and writes NDJSON on events | ✅ Ready | NDJSON files present in `logs/` | None | P0 |
| JSON-RPC version 1.0 used (not 1.1) | ✅ Ready | Fixed 2026-05-06; validated in production | None | P0 |

---

## Regtest Flow

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| Wallet creation (idempotent) | ✅ Ready | `demo_regtest.sh` loads or creates `nodescope_demo` | None | P0 |
| Initial block mining (101 blocks) | ✅ Ready | Script checks balance before mining | None | P0 |
| Send transaction to regtest address | ✅ Ready | Broadcast and mempool confirmed | None | P0 |
| Mine confirmation block | ✅ Ready | Script mines 1 block after send | None | P0 |
| NDJSON log captures `zmq_rawtx` and `zmq_rawblock` | ✅ Ready | Logs present with both event types | None | P0 |

---

## Screenshots / Visual Evidence

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `docs/assets/nodescope-dashboard.png` | ✅ Ready | PNG 1440×2871, captured from real dashboard | Recapture if dashboard changes | P1 |
| `docs/assets/nodescope-command-center.png` | ✅ Ready | PNG 1440×2871 | Recapture if needed | P1 |
| `docs/assets/nodescope-transaction-lifecycle.png` | ✅ Ready | PNG 1440×2871 | Recapture if needed | P1 |
| `docs/assets/nodescope-api-docs.png` | ✅ Ready | PNG 1440×1613 | None | P1 |
| `docs/assets/nodescope-demo-page.png` | ✅ Ready | PNG 1440×1494 | None | P1 |
| `docs/assets/nodescope-health.png` | ✅ Ready | PNG 1440×900 | None | P2 |
| `docs/assets/nodescope-latest-block.png` | ✅ Ready | PNG 1440×900 | None | P2 |
| `docs/assets/nodescope-live-events.png` | ✅ Ready | PNG 1440×900 | None | P2 |
| `docs/assets/nodescope-mempool-summary.png` | ✅ Ready | PNG 1440×900 | None | P2 |
| Screenshots referenced in README.md | ✅ Ready | Three images linked in Demo Preview section | None | P0 |

---

## Tests

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| Python unit test suite runs without failures | ✅ Ready | 37 tests, 0 failures, 0 errors | None | P0 |
| `make test` completes cleanly | ✅ Ready | Ran 37 in 0.110s — OK | None | P0 |
| `make build` (compile + frontend build) passes | ✅ Ready | Vite bundle built, no TypeScript errors | None | P0 |
| `make public-clean` passes with 0 issues | ✅ Ready | Result: CLEAN (0 issues) | None | P0 |
| Ruff format check clean | ✅ Ready | 27 files already formatted | None | P0 |
| Ruff lint check clean | ✅ Ready | All checks passed | None | P0 |

---

## CI

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `.github/workflows/ci.yml` present | ✅ Ready | File in repo | None | P0 |
| CI triggers on push to `main`, `fix/**`, `feat/**`, `chore/**` | ✅ Ready | Branch patterns set | None | P0 |
| CI: ruff format + ruff check | ✅ Ready | Steps defined | None | P0 |
| CI: Python unit tests | ✅ Ready | `unittest discover` step | None | P0 |
| CI: `pip-audit` dependency scan | ✅ Ready | Step defined | None | P0 |
| CI: frontend build on Node 18, 20, 24 | ✅ Ready | Matrix defined | None | P0 |
| CI: public-clean check job | ✅ Ready | `clean-check` job defined | None | P0 |
| CI badge in README | ✅ Ready | Badge linked to Actions | Verify green before Saturday | P0 |

---

## Security

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `.env` is gitignored | ✅ Ready | `.gitignore` has `.env` entry | None | P0 |
| `.env` contains only example regtest credentials (no real secrets) | ✅ Ready | File is identical to `.env.example` | None | P0 |
| No real private keys or seed phrases in any tracked file | ✅ Ready | `make public-clean` passes | None | P0 |
| `SECURITY.md` present with scope and disclosure contact | ✅ Ready | GitHub Security Advisory link | None | P0 |
| API runs on loopback by default (`127.0.0.1`) | ✅ Ready | `.env.example` default | None | P0 |
| No API auth required (documented limitation for Phase 1) | ✅ Ready | SECURITY.md and docs note this | None | P0 |
| `NDJSON logs` gitignored | ✅ Ready | `logs/*.ndjson` in `.gitignore` | None | P0 |

---

## Docs PT-BR

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `README.pt-BR.md` exists | ✅ Ready | File in repo | None | P0 |
| Language switcher in `README.md` | ✅ Ready | `[Leia em Português](README.pt-BR.md)` | None | P1 |
| `docs/demo-checklist.md` in Portuguese | ✅ Ready | File in repo | None | P1 |

---

## Docs EN-US

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `README.en-US.md` exists | ✅ Ready | File in repo | None | P1 |
| `docs/live-validation.md` in English | ✅ Ready | File in repo | None | P1 |
| `docs/judges-guide.md` in English | ✅ Ready | File in repo | None | P0 |
| `docs/architecture.md` in English | ✅ Ready | File in repo | None | P0 |
| `docs/api.md` in English | ✅ Ready | File in repo | None | P0 |

---

## README / GitHub

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| Title, short description, CI and language badges | ✅ Ready | README.md header | None | P0 |
| Core product phrase present | ✅ Ready | "RPC gives the snapshot. ZMQ gives real time. NodeScope gives interpretation." | None | P0 |
| Demo Preview with real screenshots | ✅ Ready | Three PNG images in Demo Preview section | None | P0 |
| Quickstart with Docker | ✅ Ready | `docker compose up --build` block | None | P0 |
| Quickstart without Docker | ✅ Ready | `scripts/quickstart.sh` + make targets | None | P0 |
| API endpoints table | ✅ Ready | 9 endpoints documented | None | P0 |
| Architecture diagram (Mermaid) | ✅ Ready | Flowchart in README | None | P0 |
| Tests section with test count | ✅ Ready | "37 Python tests" mentioned | None | P0 |
| Troubleshooting section | ✅ Ready | Inline table + link to docs | None | P0 |
| License section | ✅ Ready | MIT | None | P0 |
| No AI/tool mentions in any public file | ✅ Ready | `make public-clean` passes | None | P0 |
| `v1.0.0` git tag applied | ❌ Missing | Not yet tagged | Run `git tag v1.0.0 && git push --tags` after final review | P0 |

---

## Release

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `RELEASE_NOTES_v1.0.0.md` present | ✅ Ready | File in repo | None | P0 |
| `CHANGELOG.md` complete and up to date | ✅ Ready | Three versions documented | None | P0 |
| `ROADMAP.md` present with 4 phases | ✅ Ready | File in repo | None | P1 |
| `CONTRIBUTING.md` present | ✅ Ready | File in repo | None | P1 |
| `SECURITY.md` present | ✅ Ready | File in repo | None | P0 |
| Final PR merged to `main` | ⚠️ Partial | Currently on `fix/demo-validation-readiness` | Open and merge PR before Saturday | P0 |
| `v1.0.0` GitHub release created | ❌ Missing | Tag not applied yet | Create tag + GitHub release after final review | P0 |

---

## VPS / Domain

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `docs/deploy-vps.md` present | ✅ Ready | File in repo | None | P2 |
| `docs/deploy-cloudflare-tunnel.md` present | ✅ Ready | File in repo | None | P2 |
| VPS deployment actually live | 🔒 Blocked | Not required for demo; local/Docker is primary | Optional P2 for evaluator access | P2 |

---

## Signet Observer Mode

| Item | Status | Evidence | Action | Priority |
|------|--------|----------|--------|----------|
| `docs/signet.md` present | ✅ Ready | File in repo | None | P2 |
| `.env.signet.example` present | ✅ Ready | File in repo | None | P2 |
| `bitcoin.signet.conf.example` present | ✅ Ready | File in repo | None | P2 |
| Signet live connectivity tested | 🔒 Blocked | Phase 2 item; not required for v1.0.0 | Post-delivery | P2 |

---

## Known Limitations (Honest)

| Limitation | Impact | Mitigation |
|------------|--------|-----------|
| No API authentication | Low for local demo | Documented; loopback-only by default |
| NDJSON file storage (not SQL) | No query flexibility | Sufficient for Phase 1; replayable |
| No rate limiting on SSE | Minor | Local use only; Phase 3 item |
| `make smoke` requires running backend | CI can't run smoke | Smoke excluded from CI; Docker demo handles it |
| `v1.0.0` tag not yet applied | GitHub release pending | Apply manually before Saturday |
| PR not yet merged to `main` | Branch divergence | Open PR, request review, merge after final check |
| Playwright screenshots require manual trigger | Not automated in CI | Run `make demo-screenshots` after `docker compose up` |

---

## Saturday Delivery Gates (P0 Only)

Before the demo:

```bash
# On the demo machine — fresh clone via Docker
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
docker compose up --build -d
# Wait ~30s for bitcoind healthcheck
make docker-demo
make smoke
# Open http://localhost:5173 and verify dashboard is live
```

Confirm:
- [ ] `make smoke` → PASS=7 FAIL=0 WARN=0
- [ ] Dashboard header shows API ✓, RPC ✓, SSE ✓
- [ ] Transaction Lifecycle advances after `make docker-demo`
- [ ] Live Feed shows `rawtx` and `rawblock` events
- [ ] CI badge is green on GitHub
