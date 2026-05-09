# NodeScope v1.1.0 — Professional Lab Release

**Released:** 2026-05-07

---

## What's New

v1.1.0 transforms NodeScope from a real-time observability dashboard into a full
**Bitcoin Core Professional Laboratory** — an interactive, auditable, bilingual platform
for understanding Bitcoin Core internals from the protocol layer up.

---

## Highlights

### Interactive Labs

**Guided Demo (14 steps)**
A complete orchestrated walkthrough of the Bitcoin transaction lifecycle: wallet creation,
block mining, transaction broadcast, mempool detection, ZMQ event capture, raw transaction
decoding, confirmation, and a downloadable JSON Proof Report. Every step is auditable.

**Mempool Policy Arena**
Four runnable scenarios that demonstrate Bitcoin Core's mempool policies side by side:
- Normal transaction (standard fee, standard path)
- Low-fee transaction (fee_rate=1 sat/vB, compares with standard)
- RBF Replacement (BIP125: replaceable → bumpfee → verify new TXID → confirm)
- CPFP Package (low-fee parent → raw child via createrawtransaction pipeline → package rate)

**Reorg Lab** *(experimental)*
A 10-step controlled chain reorganization using `invalidateblock` and `reconsiderblock`.
Demonstrates how Bitcoin Core handles chain tip invalidation and recovery — entirely in
regtest, ending with a Proof Report and a clean chain state.

**Transaction Inspector**
Premium RPC-powered analysis for any TXID: txid, wtxid, size, vsize, weight, fee in BTC,
fee rate in sat/vB, input/output count, script types, confirmation status, block hash, height.

**ZMQ Event Tape**
Compact real-time stream of ZMQ rawtx/rawblock events with topic filters and one-click
TXID linking to the Transaction Inspector.

**Fee Estimation Playground**
Live `estimatesmartfee` for 1, 3, 6, and 12-block targets in CONSERVATIVE and ECONOMICAL
modes. Results are honestly marked `success`, `limited`, or `unavailable` — no values are
invented. Regtest limitations are documented in the UI.

---

### Observability

**Prometheus Metrics** (`GET /metrics`)
24+ metrics covering HTTP requests, RPC calls, ZMQ events, mempool/chain state, demo/policy/reorg
run counts, proof report counts, simulation activity, and storage health. Middleware records
per-request latency automatically.

**Operational Alerting Panel**
Dashboard panel that polls the API every 15 seconds and surfaces actionable alerts:
RPC offline (critical), simulation errors (warning), cluster mempool unavailable (info).

**Cluster Mempool Detector**
Probes `getmempoolcluster` and `getmempoolfeeratediagram`. Returns an honest `unavailable`
on Bitcoin Core 26 — never a false positive. Ready for Bitcoin Core 31+.

---

### Persistence

**SQLite-backed History**
All Proof Reports, Guided Demo runs, Policy Arena runs, and Reorg Lab runs are persisted
to a local SQLite database (`.nodescope/history.db`). If SQLite fails to initialise, the
API transparently falls back to an in-memory store — no service disruption.

Six read-only history endpoints with pagination and filtering:
`/history/summary`, `/history/proofs`, `/history/demo-runs`, `/history/policy-runs`, `/history/reorg-runs`.

**Historical Dashboard**
A dedicated browser tab showing all past runs across all scenario types, with copy-proof
buttons for any stored Proof Report.

---

### Security

**Optional API Key Authentication**
All mutating endpoints (`POST`, `PUT`) can be protected with an API key via the
`X-NodeScope-API-Key` header, controlled by `NODESCOPE_REQUIRE_API_KEY=true` and
`NODESCOPE_API_KEY` environment variables. Read-only endpoints are never restricted.

---

### Interface

**Full Bilingual i18n (EN-US / PT-BR)**
Every label, button, status indicator, page title, description, and error message is
available in English and Portuguese. The toggle persists via localStorage.

**Tooltips, ExplainBox, and LearnMore**
- Hover/focus tooltips on 22+ technical terms (RPC, ZMQ, TXID, WTXID, Fee rate, vbytes, RBF, CPFP, Reorg, …)
- Contextual ExplainBox banners on every page answering: what the screen shows, why it matters, what to observe
- Expandable LearnMore sections with deeper Bitcoin concept explanations

**Bitcoin Glossary**
27 Bitcoin terms with EN-US and PT-BR definitions, accessible from any view.

---

### Presentation Pack

Complete evaluation and presentation materials for hackathon judges:

| Document | Description |
|---|---|
| `docs/presentation/pitch-1min.md` | 1-minute pitch (EN-US / PT-BR) |
| `docs/presentation/pitch-3min.md` | 3-minute technical pitch (EN-US / PT-BR) |
| `docs/presentation/technical-walkthrough.md` | Step-by-step technical walkthrough |
| `docs/presentation/evaluator-checklist.md` | Reproducible evaluation checklist |
| `docs/presentation/demo-script.md` | 1-min and 5-min demo scripts (EN-US / PT-BR) |
| `docs/presentation/submission-text.md` | Ready-to-paste submission text (EN-US / PT-BR) |
| `docs/presentation/video-script.md` | Scene-by-scene video script (EN-US / PT-BR) |
| `docs/presentation/faq.md` | Evaluator FAQ with honest answers (EN-US / PT-BR) |
| `docs/presentation/screenshots-checklist.md` | Dashboard screenshot validation |
| `docs/presentation/README.md` | Presentation pack index |

---

## Breaking Changes

None. All existing v1.0.x endpoints and Docker Compose configurations continue to work unchanged.

---

## Upgrade from v1.0.x

```bash
git pull
docker compose down
docker compose up -d --build
```

No database migrations required. SQLite history is created automatically on first run.

---

## Test Coverage

- **54 unit tests** (38 prior + 16 new storage tests for `api/storage.py`)
- **Smoke test:** PASS=15 FAIL=0 WARN=0
- **Frontend build:** TypeScript strict + Vite — passing on Node 18, 20, 24
- **CI:** Python 3.12 lint (ruff format + check), pip-audit, Node multi-version build, public-clean check

---

## Known Limitations

- Regtest-only for demo scenarios. Signet/mainnet support is planned.
- Cluster mempool RPCs require Bitcoin Core 31+. This release uses Bitcoin Core 26 — `getmempoolcluster` returns `unavailable`.
- Reorg Lab is marked experimental. Behavior may vary depending on wallet state.
- SQLite history is local to the container volume and does not survive `docker compose down -v`.
- `estimatesmartfee` returns `unavailable` or `limited` in regtest — no real fee market exists.

---

## Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete list of changes.
