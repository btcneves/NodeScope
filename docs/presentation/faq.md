# NodeScope — Evaluator FAQ

Short, accurate answers to the most common evaluator questions.

---

## Does this use real Bitcoin?

Yes and no. NodeScope uses a **real Bitcoin Core node** with **real RPC calls** and **real ZMQ events**. However, the demo runs on the **regtest network** — a private, isolated blockchain with no real economic value. No mainnet Bitcoin is used, held, or transacted at any point.

---

## Does this involve real money?

No. The regtest network is completely isolated. Any coins mined or transacted in the demo have zero monetary value. There is no financial risk, no wallet custody, and no external financial system involved.

---

## Why regtest and not mainnet or testnet?

Regtest is the professional standard for controlled Bitcoin Core development and testing. It allows:

- On-demand block mining (no waiting)
- Deterministic fee behavior
- Complete isolation from external networks
- Reproducibility across environments

Using regtest is a deliberate technical choice, not a limitation. All demonstrated features (RBF, CPFP, Reorg, Fee Estimation) are behaviors of the Bitcoin Core protocol — they work identically on mainnet.

---

## What does NodeScope do that a wallet cannot do?

A wallet manages coins and signs transactions. NodeScope does none of that. NodeScope **observes and explains** the internal operation of a Bitcoin Core node:

- It shows how a transaction moves from mempool to confirmation.
- It captures and displays ZMQ events in real time.
- It runs policy scenarios (RBF, CPFP) to demonstrate protocol mechanics.
- It generates auditable proof reports of what happened and why.
- It exposes Prometheus metrics for operational monitoring.

NodeScope is an observability and education tool, not a financial application.

---

## What is the difference between RPC and ZMQ?

**RPC (Remote Procedure Call):** A request/response interface. You ask Bitcoin Core a question ("what is the current chain height?", "decode this transaction") and it responds with structured JSON. RPC gives you state on demand.

**ZMQ (ZeroMQ):** A push notification system. Bitcoin Core publishes events (new transaction broadcast, new block mined) as raw binary messages over a socket. ZMQ gives you real-time events without polling.

NodeScope uses both: ZMQ to detect events as they happen, RPC to validate and enrich those events with structured data.

---

## What is a Proof Report?

A Proof Report is a JSON document generated automatically after every demo run or policy scenario. It records:

- The scenario name and network
- Bitcoin Core version
- RPC and ZMQ health status at execution time
- Transaction IDs, fees, fee rates, vbytes, weight
- Block height, block hash, confirmations
- Timestamps for each step
- Any warnings or unavailable features

Proof reports are stored in SQLite and accessible via the `/history/proofs` API endpoint. They serve as a verifiable, auditable record of what the system observed and executed.

---

## What is RBF?

RBF (Replace By Fee) is a Bitcoin protocol feature that allows a transaction in the mempool to be replaced by a new version with a higher fee, if the original transaction signaled replaceability (BIP 125).

NodeScope demonstrates RBF using Bitcoin Core's `bumpfee` RPC. The proof records both the original txid and the replacement txid, along with the old and new fee rates.

---

## What is CPFP?

CPFP (Child Pays For Parent) is a fee-bumping technique where the recipient of an unconfirmed low-fee transaction creates a new transaction (the "child") spending the unconfirmed output with a high enough fee to incentivize miners to confirm both the parent and child as a package.

NodeScope demonstrates CPFP by constructing a raw child transaction via `createrawtransaction`, signing with `signrawtransactionwithwallet`, and broadcasting with `sendrawtransaction`. If the parent output is not found in `listunspent minconf=0`, a fallback path is used and documented in the proof.

---

## What is Fee Estimation?

Fee Estimation is the process of calculating the fee rate (in sat/vByte or BTC/kvByte) needed for a transaction to be confirmed within a target number of blocks. Bitcoin Core provides this via the `estimatesmartfee` RPC.

NodeScope's Fee Estimation Playground calls `estimatesmartfee` for 1, 3, 6, and 12 block targets and displays the results in both BTC/kvB and sat/vB. The view honestly documents that regtest environments have limited fee history, which may result in null estimates for some targets.

---

## What is the Reorg Lab?

The Reorg Lab simulates a chain reorganization (reorg) — a scenario where the Bitcoin network adopts a different chain tip, orphaning previously confirmed blocks.

In regtest, this is done safely using:

- `invalidateblock` to orphan a block
- `reconsiderblock` to restore it

The Reorg Lab runs 10 controlled steps and generates a proof report. It is marked **experimental** because behavior may vary depending on wallet state.

---

## Does this work on mainnet?

The architecture supports mainnet with configuration changes (different RPC endpoint, credentials, and ZMQ socket). However, mainnet operation is not validated in this release and is intentionally out of scope for the demo. All claimed features are demonstrated and validated in regtest.

---

## Does this depend on any external API?

No. The entire demo stack is self-contained:

- Bitcoin Core runs locally inside Docker.
- The API calls Bitcoin Core's own RPC and ZMQ.
- No external APIs, no cloud services, no internet connection required for the demo.

---

## How can I validate that the data is real?

1. Run `curl http://localhost:8000/health` — it shows the actual Bitcoin Core version and chain height.
2. Run `curl http://localhost:8000/metrics` — it shows live operational metrics.
3. Compare the txid in a proof report with the output of `bitcoin-cli -regtest gettransaction <txid>` inside the Docker container.
4. Run `make smoke` — 15 independent checks validate RPC, ZMQ-derived counts, API responses, frontend build, and Python tests.
5. Every proof report is stored in SQLite and retrievable via `/history/proofs`.

---

## What are the limitations?

- **Regtest only**: All demo scenarios use Bitcoin Core regtest. No mainnet or signet validation.
- **Cluster mempool**: `getmempoolcluster` and `getmempoolfeeratediagram` require Bitcoin Core 28+. BC26 (used here) does not support them — the UI shows this clearly.
- **Reorg Lab**: Experimental. Results depend on wallet state.
- **Fee Estimation**: `estimatesmartfee` in regtest may return null fees for some targets due to limited fee history.
- **History**: SQLite is local to the container volume and does not survive `docker compose down -v`.
- **ZMQ log**: Append-only NDJSON; not a queryable event database.

---

## What is the roadmap?

| Feature | Status |
|---|---|
| Cluster mempool visualization (Bitcoin Core 28+) | Planned |
| Signet / testnet read-only mode | Planned |
| OpenTelemetry traces (RPC, ZMQ, API) | Planned |
| Postgres / TimescaleDB for event persistence | Planned |
| Multi-node topology | Planned |
| Kubernetes manifests / Helm chart | Planned |
| Grafana integration | Planned |
| API keys / JWT for hosted deployments | Planned |

---

## PT-BR

### Este projeto usa Bitcoin real?

Sim e não. NodeScope usa um nó Bitcoin Core real com chamadas RPC e eventos ZMQ reais. Mas a demo roda na rede regtest — um blockchain privado e isolado, sem valor econômico real.

### Isso envolve dinheiro real?

Não. A rede regtest é completamente isolada. As moedas mineradas ou transacionadas na demo não têm valor monetário algum.

### Por que regtest e não mainnet?

Regtest é o padrão profissional para desenvolvimento e testes controlados com Bitcoin Core. Permite mineração de blocos sob demanda, comportamento de taxas determinístico e reprodutibilidade entre ambientes. É uma escolha deliberada, não uma limitação.

### O que o NodeScope faz que uma wallet não faz?

Uma wallet gerencia moedas. O NodeScope observa e explica a operação interna de um nó Bitcoin Core: ciclo de vida de transações, eventos ZMQ em tempo real, cenários de política (RBF, CPFP), e proof reports auditáveis.

### (Demais perguntas)

Ver versão EN-US acima — as respostas técnicas são equivalentes.
