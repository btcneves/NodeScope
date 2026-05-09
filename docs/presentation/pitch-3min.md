# NodeScope — 3-Minute Technical Pitch

---

## EN-US

### 1. Opening (20s)

Bitcoin Core exposes the most complete picture of what a transaction does from the moment it's broadcast to the moment it's confirmed. RPC gives you state snapshots. ZMQ gives you real-time events. Together, they describe the complete lifecycle — but only if you know how to wire them together.

NodeScope wires them together.

---

### 2. The Problem (20s)

Node operators and developers face raw, siloed data:

- RPC returns structured JSON, but you have to query it.
- ZMQ pushes binary events, but you have to decode and correlate them.
- Mempool state, fee rates, RBF replacements, and CPFP packages are invisible unless you build the tooling.

No professional-grade observability layer exists for Bitcoin Core out of the box.

---

### 3. The Solution (20s)

NodeScope is a unified observability dashboard that:

- Subscribes to Bitcoin Core ZMQ (rawtx, rawblock)
- Queries Bitcoin Core RPC for state and validation
- Classifies, stores, and presents events through a React dashboard
- Runs 14-step guided demos, policy scenarios, fee estimation, and reorg labs
- Generates auditable proof reports for every run

All in a reproducible Docker stack, no manual terminal steps required for evaluation.

---

### 4. Architecture (30s)

```
Bitcoin Core regtest
├── RPC (port 18443) ──────── FastAPI (api/)
│                             ├── /health, /summary
│                             ├── /demo/*, /policy/*, /reorg/*
│                             ├── /fees/estimate, /tape/*, /inspect/*
│                             ├── /history/*, /metrics
│                             └── SSE /events/stream
└── ZMQ (port 28332) ──────── Monitor (monitor.py)
                              └── NDJSON logs → API reads

React + TypeScript + Vite ─── Dashboard (frontend/)
SQLite ──────────────────── Persistent proof storage (.nodescope/)
```

Stack: Python 3.12 + FastAPI · React 18.3.1 + TypeScript + Vite 6 · Bitcoin Core 31 · Docker Compose (4 services)

---

### 5. Guided Demo (20s)

The Guided Demo runs 14 steps automatically:

1. RPC health check
2. ZMQ rawtx/rawblock check
3. Wallet creation / load
4. Mining address generation
5. Initial block mining
6. Destination address
7. Transaction broadcast
8. Mempool detection
9. ZMQ rawtx capture
10. Transaction decode (fee, vbytes, weight, wtxid)
11. Block mining
12. ZMQ rawblock capture
13. Confirmation
14. Proof report generation

Each step shows status, timestamp, and technical output. One click runs the full demo.

---

### 6. Mempool Policy Arena (20s)

Four runnable scenarios:

| Scenario | RPC Used |
|---|---|
| Normal transaction | `sendtoaddress` |
| Low-fee transaction | `sendtoaddress` with explicit fee rate |
| RBF replacement | `bumpfee` on a replaceable tx |
| CPFP package | raw transaction pipeline (`createrawtransaction`, `signrawtransactionwithwallet`, `sendrawtransaction`) |

Each scenario produces a timestamped proof report stored in SQLite.

---

### 7. RBF / CPFP (15s)

RBF uses Bitcoin Core's `bumpfee` RPC on a replaceable transaction. The proof records the original txid, replacement txid, old fee rate, and new fee rate.

CPFP creates a child transaction spending an unconfirmed parent output. If the parent output is not found in `listunspent minconf=0`, a fallback path is used and recorded honestly in the proof.

---

### 8. Fee Estimation Playground (15s)

Calls `estimatesmartfee` for 1, 3, 6, and 12 block targets. Returns BTC/kvB and sat/vB. Compares estimates against the fee rates used in policy scenarios. Regtest limitations (insufficient historical data for conservative estimation) are documented inline.

---

### 9. Reorg Lab (15s)

Uses `invalidateblock` to orphan a block and `reconsiderblock` to restore it. Runs 10 controlled steps in regtest. Marked experimental — reproducible in regtest, behavior may differ with wallet state.

---

### 10. Observability: Metrics, Alerting, Benchmark (15s)

- **Prometheus `/metrics`**: 28+ operational gauges (RPC, ZMQ, chain, mempool, demo, policy, reorg, history, storage, fee estimation)
- **Alerting panel**: dashboard shows RPC status, simulation errors, cluster mempool availability, and environment notes
- **Benchmark**: `scripts/benchmark_nodescope.py` measures latency per endpoint (min, mean, median, p95, max)
- **Load smoke**: `scripts/load_smoke.py` — concurrent requests to validate API throughput

---

### 11. Historical Dashboard / Proof Storage (10s)

SQLite-backed persistence stores proof reports, demo runs, policy runs, and reorg runs. The Historical Dashboard lists all past runs with copy-proof support. Memory fallback if SQLite is unavailable. Six `/history/*` API endpoints.

---

### 12. Security and Limitations (15s)

- Demo uses Bitcoin Core regtest only. No mainnet. No real money.
- Cluster mempool RPCs (`getmempoolcluster`, `getmempoolfeeratediagram`) require Bitcoin Core 31+. pre-31 nodes return `unavailable` with an honest explanation.
- Reorg Lab is experimental.
- ZMQ is treated as a notification source; RPC is used for final validation.
- No private keys, seeds, or wallet credentials in the repository.

---

### 13. Closing (10s)

NodeScope demonstrates that Bitcoin Core's internal machinery is observable, understandable, and auditable — with real RPC calls, real ZMQ events, and verifiable proof reports. Every evaluator can reproduce the full demo in under five minutes with a single `docker compose up -d --build`.

---

## PT-BR

### 1. Abertura (20s)

O Bitcoin Core expõe a imagem mais completa do que uma transação faz — do momento em que é transmitida até o momento em que é confirmada. RPC dá snapshots de estado. ZMQ dá eventos em tempo real. Juntos, descrevem o ciclo completo — mas apenas se você souber como conectá-los.

O NodeScope faz essa conexão.

---

### 2. O Problema (20s)

Operadores de nó e desenvolvedores lidam com dados brutos e isolados:

- RPC retorna JSON estruturado, mas você precisa consultá-lo manualmente.
- ZMQ envia eventos binários, mas você precisa decodificá-los e correlacioná-los.
- Estado da mempool, taxas, substituições RBF e pacotes CPFP são invisíveis sem ferramental próprio.

Não existe uma camada de observabilidade profissional para o Bitcoin Core out of the box.

---

### 3. A Solução (20s)

NodeScope é um painel de observabilidade unificado que:

- Assina eventos ZMQ do Bitcoin Core (rawtx, rawblock)
- Consulta o RPC do Bitcoin Core para estado e validação
- Classifica, armazena e apresenta eventos via dashboard React
- Executa demos guiadas em 14 etapas, cenários de política, estimativa de taxas e reorg labs
- Gera proof reports auditáveis para cada execução

Tudo em uma stack Docker reproduzível, sem passos manuais de terminal para avaliação.

---

### 4. Arquitetura (resumida)

Stack: Python 3.12 + FastAPI · React 18.3.1 + TypeScript + Vite 6 · Bitcoin Core 31 · Docker Compose (4 serviços: bitcoind, api, monitor, frontend)

---

### 5–13. (Conteúdo técnico equivalente ao EN-US acima)

Ver versão EN-US para detalhes completos de cada seção. Todo comportamento documentado é real e verificável.
