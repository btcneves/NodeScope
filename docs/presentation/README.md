# NodeScope — Presentation Pack

Complete materials for hackathon presentation and professional evaluation.

---

## Documents

| Document | Purpose |
|---|---|
| [pitch-1min.md](pitch-1min.md) | 1-minute pitch — EN-US and PT-BR |
| [pitch-3min.md](pitch-3min.md) | 3-minute technical pitch — full structure EN-US and PT-BR |
| [technical-walkthrough.md](technical-walkthrough.md) | Architecture and technical deep dive for advanced evaluators |
| [evaluator-checklist.md](evaluator-checklist.md) | Step-by-step checklist to reproduce and assess all features |
| [demo-script.md](demo-script.md) | Operational demo script — 1-minute and 5-minute versions, EN-US and PT-BR |
| [submission-text.md](submission-text.md) | Ready-to-use text for hackathon submission forms — EN-US and PT-BR |
| [screenshots-checklist.md](screenshots-checklist.md) | Objective list of screenshots needed for the presentation |
| [video-script.md](video-script.md) | Scene-by-scene video script — EN-US and PT-BR |
| [faq.md](faq.md) | Evaluator FAQ — honest answers to the most common questions |

---

## Quickstart for Evaluators

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open `http://localhost:5173` → click "Run Full Demo" in Guided Demo.

---

## Key Facts

| Fact | Value |
|---|---|
| Network | Bitcoin Core regtest (no real value) |
| Bitcoin Core version | 26 |
| Backend | Python 3.12 + FastAPI |
| Frontend | React 18.3.1 + TypeScript + Vite 6.0.5 |
| Docker services | 4 (bitcoind, api, monitor, frontend) |
| Guided Demo steps | 14 |
| Smoke tests | PASS=15 FAIL=0 |
| Python unit tests | 80 |
| Prometheus metrics | 28+ |
| i18n | PT-BR / EN-US |
| Cluster mempool (BC31+ RPCs) | Available on BC31; fallback on pre-31 nodes (documented) |
| Reorg Lab | Ready (experimental) |

---

## What is Validated

- `make smoke` — PASS=15 FAIL=0 WARN=0
- `python3 -m py_compile api/*.py` — no syntax errors
- `npm run build` (frontend) — TypeScript + Vite build passes
- `docker compose config` — valid Compose configuration
- `python3 scripts/benchmark_nodescope.py` — latency table per endpoint
- `python3 scripts/load_smoke.py --concurrency 5 --requests 50` — concurrent load smoke
- GitHub Actions CI — Python 3.12, Node 18/20/24, public-clean check

---

## Honest Limitations

- Regtest only for all demo scenarios.
- Cluster mempool RPCs require Bitcoin Core 31+.
- Reorg Lab is experimental.
- `estimatesmartfee` in regtest may return null for some targets.
- SQLite history is local to the container volume.

See [faq.md](faq.md) for detailed answers.

---

## Related Documentation

- [../README.md](../../README.md) — Main project README
- [../architecture.md](../architecture.md) — System architecture
- [../api.md](../api.md) — API reference
- [../judges-guide.md](../judges-guide.md) — Original evaluator guide
- [../../PROJECT_STATUS.md](../../PROJECT_STATUS.md) — Live project status
