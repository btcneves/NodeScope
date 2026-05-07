# NodeScope — Video Script

Suggested script for a 2–3 minute demo video.

---

## EN-US

### Pre-production Checklist

- [ ] Stack running: `docker compose up -d --build && make docker-demo && make smoke`
- [ ] Browser at `http://localhost:5173`
- [ ] Screen recording at 1280×800 or 1920×1080
- [ ] Terminal visible for smoke output (optional)

---

### Scene 1 — Introduction (0:00–0:15)

**Screen:** Dashboard — `http://localhost:5173`

**Narration:**
> "NodeScope is a Bitcoin Core Professional Lab — a real-time observability dashboard that transforms raw RPC and ZMQ data into structured, auditable intelligence."

**On screen:** Scroll slowly through dashboard header. Node health score visible. RPC and ZMQ indicators green.

**Expected result:** Dashboard fully loaded with node health, chain height, mempool count.

---

### Scene 2 — Guided Demo (0:15–0:55)

**Screen:** Guided Demo view

**Narration:**
> "The Guided Demo runs 14 steps using real Bitcoin Core RPC and ZMQ — no manual terminal work required."

**Action:** Click "Run Full Demo" button.

**Narration (while steps run):**
> "Step 3: wallet created. Step 5: initial blocks mined. Step 7: transaction broadcast. Step 8: mempool entry detected via RPC. Step 9: ZMQ rawtx event captured. Step 11: confirmation block mined. Step 12: ZMQ rawblock event captured. Step 14: proof report generated."

**After completion:**
> "Every step is timestamped and verified. The proof report at the bottom captures the full audit trail — txid, fee, vbytes, block hash — reproducible and exportable as JSON."

**Expected result:** All 14 steps show green success status. Proof report visible.

---

### Scene 3 — Transaction Inspector (0:55–1:15)

**Screen:** Transaction Inspector

**Action:** Paste txid from proof report into the Inspector search.

**Narration:**
> "The Transaction Inspector calls `getrawtransaction` directly via Bitcoin Core RPC. Here we see the decoded transaction: fee in satoshis, vsize, weight, wtxid, inputs, and outputs. Real data from the node."

**Expected result:** Decoded transaction displayed with fee, vsize, weight, wtxid.

---

### Scene 4 — ZMQ Event Tape (1:15–1:30)

**Screen:** ZMQ Event Tape

**Narration:**
> "The ZMQ Event Tape shows every rawtx and rawblock event captured from Bitcoin Core's ZMQ publisher. Events arrive pushed, not polled. Clicking any txid opens the Transaction Inspector for RPC-based validation."

**Expected result:** Event list with rawtx and rawblock topic badges.

---

### Scene 5 — Mempool Policy Arena (1:30–2:00)

**Screen:** Mempool Policy Arena

**Action:** Run RBF scenario.

**Narration:**
> "The Mempool Policy Arena has four runnable scenarios. RBF — Replace By Fee — uses Bitcoin Core's `bumpfee` RPC to replace a transaction with a higher-fee version. The proof records the original txid, replacement txid, and fee rates. CPFP constructs a raw child transaction to accelerate an unconfirmed parent."

**Expected result:** RBF scenario completes with proof showing both txids.

---

### Scene 6 — Fee Estimation and Reorg Lab (2:00–2:20)

**Screen:** Fee Estimation, then Reorg Lab

**Narration:**
> "The Fee Estimation Playground calls `estimatesmartfee` for multiple block targets. The Reorg Lab uses `invalidateblock` and `reconsiderblock` to simulate a chain reorganization in regtest — marked experimental, fully documented."

**Expected result:** Fee estimates visible. Reorg Lab experimental badge visible.

---

### Scene 7 — Observability (2:20–2:35)

**Screen:** Terminal — `curl http://localhost:8000/metrics | head -20`

**Narration:**
> "The `/metrics` endpoint exposes Prometheus-compatible data: RPC health, chain height, ZMQ event totals, demo run counts, storage health. Any Prometheus or Grafana setup can scrape this directly."

**Expected result:** Prometheus text output visible with `nodescope_rpc_up 1.0`.

---

### Scene 8 — Closing (2:35–2:50)

**Screen:** Return to Dashboard

**Narration:**
> "NodeScope makes Bitcoin Core's internal machinery observable, understandable, and auditable. Real RPC. Real ZMQ. Real regtest. Verifiable proof reports. One docker compose command to start."

**On screen:** Dashboard overview with health score and ZMQ event count.

---

### Scene 9 — Call to Action (2:50–3:00)

**Screen:** GitHub repository or README

**Narration:**
> "Source code, documentation, and the full evaluator guide are available at github.com/btcneves/NodeScope."

**Expected result:** Repository or README visible.

---

## PT-BR

### Lista de pré-produção

- [ ] Stack rodando: `docker compose up -d --build && make docker-demo && make smoke`
- [ ] Browser em `http://localhost:5173`
- [ ] Gravação de tela em 1280×800 ou 1920×1080

---

### Cena 1 — Apresentação (0:00–0:15)

**Tela:** Dashboard

**Narração:**
> "NodeScope é um Bitcoin Core Professional Lab — um painel de observabilidade em tempo real que transforma dados brutos de RPC e ZMQ em inteligência estruturada e auditável."

---

### Cena 2 — Demo Guiada (0:15–0:55)

**Tela:** Guided Demo

**Narração:**
> "A demo guiada executa 14 etapas usando RPC e ZMQ reais do Bitcoin Core — sem terminal manual necessário."

**Ação:** Clicar "Run Full Demo".

**Durante execução:**
> "Etapa 3: wallet criada. Etapa 5: blocos iniciais minerados. Etapa 7: transação transmitida. Etapa 8: entrada na mempool detectada via RPC. Etapa 9: evento ZMQ rawtx capturado. Etapa 11: bloco de confirmação minerado. Etapa 14: proof report gerado."

**Ao terminar:**
> "O proof report captura o rastro completo — txid, taxa, vbytes, hash do bloco — reproduzível e exportável como JSON."

---

### Cenas 3–9

Equivalentes às cenas EN-US. Adaptar narração para português conforme o estilo.

---

## Notes for Recording

- Keep the browser clean — no personal extensions or bookmarks visible.
- Record at a steady pace — pause 2 seconds after each key action before continuing narration.
- Do not narrate loading states — wait for results before speaking.
- If a step fails during recording: stop, reset with `make docker-demo`, record again. Do not include failure footage.
- Keep the terminal window minimal if shown — show only the relevant output.
- Video length target: 2:30–3:00 minutes. Do not exceed 3 minutes.
