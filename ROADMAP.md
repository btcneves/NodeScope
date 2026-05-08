# Roadmap

NodeScope is an educational and professional Bitcoin Core observability platform built for regtest.

---

## Implemented

Everything below is shipped and functional in the current release.

| Feature | Notes |
|---|---|
| RPC snapshot (chain, mempool, network) | FastAPI reads Bitcoin Core via JSON-RPC |
| ZMQ rawtx/rawblock monitoring | `monitor.py` subscribes and enriches events |
| NDJSON append-only event storage | Replayable source of truth under `logs/` |
| Transaction classification engine | coinbase\_like, simple\_payment\_like, block\_event, unknown |
| React 18 + TypeScript dashboard | Vite, SSE live feed, real-time updates |
| Node Health Score | Visual indicator derived from RPC + ZMQ signals |
| Transaction Lifecycle panel | Animated flow: broadcast → mempool → confirmation |
| Docker Compose stack | Four services: bitcoind, api, monitor, frontend |
| Guided Demo (14 steps) | Full lifecycle walkthrough with Proof Report |
| Transaction Inspector | Fee, vsize, weight, wtxid, inputs/outputs via RPC |
| ZMQ Event Tape | Live rawtx/rawblock stream with topic filters and tx linking |
| Mempool Policy Arena | 4 scenarios: Normal, Low-fee, RBF (BIP125), CPFP |
| Reorg Lab | 10-step controlled chain reorganization (experimental) |
| Cluster Mempool Detector | Probes getmempoolcluster/getmempoolfeeratediagram; honest unavailable on BC26 |
| Proof Reports | JSON audit trail per demo/scenario/reorg run; copyable and downloadable |
| Live Simulation Engine | Auto-mines blocks and sends transactions at configurable intervals |
| Prometheus metrics (`/metrics`) | 24+ metrics covering HTTP, RPC, ZMQ, mempool, chain, simulation, storage |
| Operational Alerting Panel | Polls API every 15 s; surfaces RPC offline, simulation errors, env notes |
| Configurable alert thresholds | CRUD API and dashboard controls for operational alert rules |
| Historical trend charts | Mempool size and minimum fee time-series charts |
| Read-only network guard | Blocks mutating lab operations outside regtest unless explicitly allowed |
| API rate limiting | Sliding-window protection with demo-friendly defaults |
| Visual cluster mempool view | Uses BC28+ cluster RPCs when available; otherwise displays honest fallback groups |
| Optional API key auth | Mutating endpoints protected via `X-NodeScope-API-Key` when `NODESCOPE_REQUIRE_API_KEY=true` |
| SQLite persistence | Proof reports, demo/policy/reorg run history; in-memory fallback if SQLite unavailable |
| Historical Dashboard | Paginated view of all past runs across all scenario types |
| Fee Estimation Playground | Live `estimatesmartfee` for 1/3/6/12-block targets; honest unavailable in regtest |
| Bilingual i18n (EN-US / PT-BR) | Full toggle with localStorage persistence |
| Tooltips and ExplainBox | Hover tooltips on 22+ terms; contextual explanation banners per page |
| LearnMore sections | Expandable deep-dive explanations on key Bitcoin concepts |
| Bitcoin Glossary | 27 terms with EN-US and PT-BR definitions |
| Reproducible Benchmark | `scripts/benchmark_nodescope.py` — latency table per endpoint |
| Load Smoke Test | `scripts/load_smoke.py` — concurrent load against all read-only endpoints |
| 80 unit tests + CI | Python 3.12 lint/test/audit; Node 18/20/24 build, lint, format check; public-clean check |
| Presentation Pack | 10 documents: pitches, demo scripts, evaluator checklist, FAQ, submission text |
| History export CSV/JSON | `GET /history/export.json`, `GET /history/export.csv`; export buttons in Historical Dashboard |
| Grafana + Prometheus observability pack | Optional `docker-compose.observability.yml`; pre-built dashboard with 30+ real metrics |
| Frontend lint + format | ESLint v9 flat config + Prettier; `npm run lint`, `npm run format:check` |

---

## In Progress

Nothing is currently in active development.

---

## Planned

| Feature | Notes |
|---|---|
| Signet/testnet observer mode | `BITCOIN_NETWORK=signet` flag; ZMQ + RPC without wallet or regtest operations |
| Dashboard adapted for signet | Remove "mine block" controls; read-only mode indicators |
| Mainnet read-only mode | `BITCOIN_NETWORK=mainnet` with explicit network safeguards |
| Hosted deployment tuning | Public rate-limit profiles, reverse proxy examples, and SSE sizing |
| Enhanced Bitcoin Core 28+ cluster views | More detailed diagrams when getmempoolcluster/getmempoolfeeratediagram are available |
| Mempool eviction scenario | Demonstrate fee-based eviction from the mempool |
| Advanced classification heuristics | UTXO consolidation, batch payments, Taproot script patterns |
| OpenTelemetry traces | RPC, ZMQ, and API request traces |
| Multi-node support | Monitor multiple Bitcoin Core instances simultaneously |

---

## Deferred

| Feature | Reason |
|---|---|
| Postgres / TimescaleDB for event persistence | SQLite covers the demo and evaluation use case; Postgres adds operational overhead with no benefit in regtest |
| Kubernetes manifests / Helm chart | Out of scope until multi-node or hosted deployment is needed |
| JWT authentication | Optional API key covers the security surface for single-operator deployments; JWT adds complexity without a current multi-user requirement |
| VPS / Cloudflare Tunnel deployment guides | Deferred until signet observer mode is implemented |

---

## Design Principles

- **Observable internals.** Every classification includes confidence signals. Every scenario generates a Proof Report.
- **Honest accounting.** Unavailable features (cluster mempool on BC26, fee estimation in regtest) are reported as `unavailable` — never hidden or faked.
- **Replayable data.** NDJSON logs are the durable source of truth; the engine can reprocess from scratch.
- **No custodial operations.** NodeScope never signs transactions or manages private keys in production mode.
- **Explicit network scoping.** regtest, signet, and mainnet will be explicitly configured and guarded.
