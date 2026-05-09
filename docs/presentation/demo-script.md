# NodeScope — Demo Script

Two operational scripts for live demonstration.

---

## 1-Minute Version (Quick Showcase)

**Goal:** Show the core loop in 60 seconds.

### Setup (before demo)

Stack running: `docker compose up -d --build && make docker-demo`

### Script

| Time | Screen | Action | Say |
|---|---|---|---|
| 0:00–0:10 | Dashboard | Open `http://localhost:5173` | "NodeScope is a Bitcoin Core observability dashboard. Here you can see the node is live — RPC healthy, ZMQ active, chain at height [N]." |
| 0:10–0:20 | Guided Demo | Click "Guided Demo" → "Run Full Demo" | "This runs a 14-step guided demo using real Bitcoin Core RPC and ZMQ — wallet creation, transaction, block confirmation — no terminal required." |
| 0:20–0:40 | Demo running | Watch steps complete | "ZMQ just fired a rawtx event. RPC confirmed it entered the mempool. Now a block is being mined..." |
| 0:40–0:55 | Proof Report | Scroll to Proof Report, click Copy | "All 14 steps completed. This proof report captures the full audit trail: txid, fee, vbytes, block hash. It's stored in SQLite and reproducible." |
| 0:55–1:00 | Dashboard | Return to dashboard | "This is what Bitcoin Core's internal machinery looks like when made observable." |

---

## 5-Minute Version (Full Technical Demo)

**Goal:** Walk through the complete feature set, demonstrate depth, answer technical questions implicitly.

### Setup (before demo)

```bash
docker compose up -d --build
make docker-demo
make smoke
```

Confirm `PASS=15 FAIL=0 WARN=0`.

---

### Scene 1 — Dashboard (30s)

**Screen:** `http://localhost:5173`

**Actions:**
1. Show header: RPC ✓, ZMQ ✓, SSE ✓
2. Point to Node Health Score
3. Show block height, mempool TX count, latest block timestamp

**Say:**
> "The dashboard shows live state from Bitcoin Core. RPC gives us chain and mempool data. ZMQ gives us real-time transaction and block events. The health score aggregates both into a single operational indicator."

---

### Scene 2 — Guided Demo (60s)

**Screen:** Guided Demo view

**Actions:**
1. Click "Guided Demo" in navigation
2. Click "Run Full Demo"
3. Narrate steps as they complete

**Say:**
> "The Guided Demo runs 14 steps: it creates a wallet, generates addresses, mines blocks, sends a transaction, detects it in the mempool via RPC, captures the ZMQ rawtx event, mines a confirmation block, captures the ZMQ rawblock event, and generates a proof report."
>
> "Notice each step shows its timestamp, status, and technical output. This is deterministic and reproducible."

**After completion:**
> "The proof report at the bottom is a JSON document containing the full audit trail. Txid, fee, fee rate in sat/vB, vbytes, weight, block hash, confirmations. Click Copy to take it anywhere."

---

### Scene 3 — Transaction Inspector (30s)

**Screen:** Transaction Inspector

**Actions:**
1. Copy txid from the proof report
2. Paste into Transaction Inspector search
3. Show decoded transaction

**Say:**
> "The Transaction Inspector calls `getrawtransaction` with `verbose=true` directly via RPC. You get the decoded transaction: inputs, outputs, fee, vsize, weight, wtxid, and whether it was marked replaceable. Real data from the node."

---

### Scene 4 — ZMQ Event Tape (30s)

**Screen:** ZMQ Event Tape

**Actions:**
1. Show rawtx and rawblock event entries
2. Click a txid link

**Say:**
> "The ZMQ Event Tape shows every rawtx and rawblock event captured in real time. Events arrive from Bitcoin Core's ZMQ publisher — not polled, pushed. Clicking a txid navigates to the Transaction Inspector for RPC-based validation."

---

### Scene 5 — Mempool Policy Arena (60s)

**Screen:** Policy Arena

**Actions:**
1. Show 4 scenario cards
2. Run RBF scenario, show result
3. Show proof report

**Say:**
> "The Mempool Policy Arena is where the advanced Bitcoin Core mechanics live. Here are four runnable scenarios. Let me show RBF."
>
> [Run RBF]
>
> "RBF — Replace By Fee — uses Bitcoin Core's `bumpfee` RPC to replace a transaction with a higher-fee version. The proof records the original txid, replacement txid, old and new fee rates. This is a real mempool operation in regtest."
>
> "CPFP — Child Pays For Parent — constructs a raw child transaction spending an unconfirmed parent output to accelerate confirmation of the package."

---

### Scene 6 — Fee Estimation Playground (20s)

**Screen:** Fee Estimation

**Say:**
> "The Fee Estimation Playground calls `estimatesmartfee` for four block targets: 1, 3, 6, and 12. Returns BTC/kvB and sat/vB. The regtest limitation — insufficient historical fee data for conservative estimates — is documented inline. No false claims."

---

### Scene 7 — Reorg Lab (30s)

**Screen:** Reorg Lab

**Actions:**
1. Show the experimental badge
2. Run the reorg scenario
3. Show step-by-step: block invalidated → chain reorg → block reconsidered

**Say:**
> "The Reorg Lab uses `invalidateblock` to orphan a block and `reconsiderblock` to restore it. This is a real chain reorganization in regtest. It's marked experimental — the behavior is reproducible in regtest, but it depends on wallet state."

---

### Scene 8 — Observability (30s)

**Screen:** Terminal or browser, `http://localhost:8000/metrics`

**Say:**
> "The `/metrics` endpoint exposes Prometheus-compatible data: RPC status, chain height, mempool count, ZMQ event totals, demo and policy run counts, storage health. Any Prometheus/Grafana setup can scrape this directly."

Show:
- `nodescope_rpc_up 1.0`
- `nodescope_chain_height`
- `nodescope_zmq_rawtx_events_total`

---

### Scene 9 — Historical Dashboard (20s)

**Screen:** Historical Dashboard

**Say:**
> "Every run is persisted to SQLite. The Historical Dashboard lists all demo runs, policy scenarios, and reorg runs with their proof reports. You can retrieve any past proof by ID. Memory fallback ensures the API remains functional if SQLite fails."

---

### Scene 10 — Closing (20s)

**Screen:** Return to main Dashboard

**Say:**
> "NodeScope is a Bitcoin Core Professional Lab. Real RPC calls, real ZMQ events, real regtest environment, verifiable proof reports. Everything an evaluator, developer, or node operator needs to understand Bitcoin Core's internal machinery at a glance.
>
> The full demo runs from a single `docker compose up -d --build`. Documentation, source code, and all proof reports are reproducible."

---

## Technical Notes for Presenter

- If the Reorg Lab step hangs: cancel and show the proof from a previous run via Historical Dashboard.
- If ZMQ Event Tape shows empty: run `make docker-demo` again to generate events.
- If Fee Estimation returns `null` fees: expected in regtest — document it, do not avoid it.
- Cluster Mempool Detector will show `unavailable` on pre-31 nodes — show it honestly as a documented limitation.
- All timeouts and errors are shown in the UI; do not hide failures during demo.

---

## PT-BR — Script de 1 Minuto

| Tempo | Tela | Ação | Fala |
|---|---|---|---|
| 0:00–0:10 | Dashboard | Abrir `http://localhost:5173` | "NodeScope é um painel de observabilidade do Bitcoin Core. Aqui o nó está ativo — RPC saudável, ZMQ ativo, chain na altura [N]." |
| 0:10–0:20 | Guided Demo | Clicar "Guided Demo" → "Run Full Demo" | "Isso executa uma demo guiada em 14 etapas usando RPC e ZMQ reais do Bitcoin Core — sem terminal necessário." |
| 0:20–0:40 | Demo executando | Aguardar etapas completarem | "O ZMQ acabou de disparar um evento rawtx. O RPC confirmou a entrada na mempool. Agora um bloco está sendo minerado..." |
| 0:40–0:55 | Proof Report | Rolar até o Proof Report, clicar Copiar | "14 etapas concluídas. O proof report captura o rastro completo: txid, taxa, vbytes, hash do bloco. Armazenado no SQLite e reproduzível." |
| 0:55–1:00 | Dashboard | Voltar ao dashboard | "É assim que a maquinaria interna do Bitcoin Core parece quando tornada observável." |
