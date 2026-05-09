# NodeScope — Submission Text

Ready-to-use text for hackathon submissions, evaluation forms, and presentations.

---

## EN-US

### Short Title

NodeScope — Bitcoin Core Professional Lab

### Short Description (1–2 sentences)

NodeScope is a real-time observability dashboard and professional lab for Bitcoin Core, unifying RPC and ZMQ data into a guided, visual, and auditable experience. It demonstrates the full transaction lifecycle, mempool policy scenarios, fee estimation, and controlled chain reorganization — all in a reproducible Docker environment with no real funds involved.

### Long Description

NodeScope transforms Bitcoin Core from a powerful but opaque system into an observable, understandable, and auditable platform.

Bitcoin Core exposes rich data through two channels: RPC (structured state queries) and ZMQ (real-time transaction and block events). These channels are powerful but separate — there is no standard tool that unifies them into a visual, guided experience.

NodeScope fills that gap. It subscribes to ZMQ events, queries RPC for validation and state, classifies and stores events, and presents everything through a React dashboard with full Portuguese/English internationalization.

Key capabilities delivered:

- **Guided Demo**: 14-step orchestrated demo from wallet creation to confirmed transaction and proof report, runnable with one click.
- **Transaction Inspector Premium**: Deep inspection of any transaction via RPC — fee, vsize, weight, wtxid, inputs, outputs, replaceable flag.
- **ZMQ Event Tape**: Live stream of rawtx/rawblock events with RPC-based validation and direct links to the Transaction Inspector.
- **Mempool Policy Arena**: Four runnable scenarios — normal, low-fee, RBF (via `bumpfee`), and CPFP (via raw transaction pipeline).
- **Reorg Lab**: Controlled chain reorganization using `invalidateblock` and `reconsiderblock` in regtest (experimental).
- **Fee Estimation Playground**: Live `estimatesmartfee` results for 1/3/6/12 block targets in BTC/kvB and sat/vB.
- **Historical Dashboard**: SQLite-backed persistence of all proof reports, demo runs, policy runs, and reorg runs.
- **Prometheus /metrics**: 28+ operational gauges for RPC, ZMQ, chain, mempool, demo, policy, and storage state.
- **Proof Reports**: Auditable JSON documents generated for every demo and scenario run.

### The Problem

Bitcoin Core's internal machinery — mempool policy, RBF, CPFP, fee estimation, chain reorgs — is well-documented but invisible without custom tooling. Developers and node operators rely on manual RPC queries and raw ZMQ socket reads to understand what is happening inside their node.

There is no standard visual observability layer for Bitcoin Core.

### The Solution

NodeScope provides that layer: a real-time dashboard backed by direct Bitcoin Core RPC and ZMQ integration, with guided demonstrations, policy scenarios, and verifiable proof reports — all in a single Docker Compose stack.

### Technical Stack

| Component | Technology |
|---|---|
| Backend API | Python 3.12 + FastAPI + Uvicorn |
| Bitcoin integration | Custom RPC client (urllib, no external SDK) + pyzmq |
| Storage | SQLite (primary) + in-memory fallback |
| Observability | prometheus-client |
| Frontend | React 18.3.1 + TypeScript + Vite 6.0.5 |
| Bitcoin node | Bitcoin Core 26 (regtest) |
| Infrastructure | Docker Compose (4 services) |
| i18n | PT-BR / EN-US (all views) |
| CI | GitHub Actions (Python 3.12, Node 18/20/24, public-clean check) |

### Key Differentiators

1. **Real Bitcoin Core, real RPC, real ZMQ** — not a simulator, not a mock.
2. **Guided, visual, auditable** — evaluators see and reproduce results without terminal expertise.
3. **Honest engineering** — all limitations are documented inline (cluster mempool requires BC31+, regtest fee estimation caveats, experimental reorg).
4. **Proof reports** — every demo and scenario generates a verifiable JSON artifact.
5. **Professional observability** — Prometheus metrics, operational alerting, reproducible benchmark.
6. **Bilingual** — PT-BR / EN-US throughout.

### How to Test

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open `http://localhost:5173` and click "Run Full Demo" in the Guided Demo view.

Full evaluator guide: [docs/presentation/evaluator-checklist.md](evaluator-checklist.md)

### Limitations (Honest)

- All demo scenarios use Bitcoin Core regtest. No mainnet, no real value.
- Cluster mempool RPCs require Bitcoin Core 31+. BC26 (used here) returns `unavailable`.
- Reorg Lab is experimental — reproducible in regtest, behavior depends on wallet state.
- `estimatesmartfee` in regtest has limited historical data; some targets may return null fees.
- SQLite history is local to the container volume.

### Next Steps

- Cluster mempool visualization (Bitcoin Core 31+ compatibility)
- Signet / testnet read-only observation mode
- OpenTelemetry traces for RPC, ZMQ, and API calls
- Postgres / TimescaleDB for scalable event persistence
- Grafana integration for production metrics dashboards
- Multi-node topology support

### Repository

https://github.com/btcneves/NodeScope

---

## PT-BR

### Título Curto

NodeScope — Bitcoin Core Professional Lab

### Descrição Curta (1–2 frases)

NodeScope é um painel de observabilidade em tempo real e laboratório profissional para Bitcoin Core, unificando dados RPC e ZMQ em uma experiência visual, guiada e auditável. Demonstra o ciclo completo de transações, cenários de política de mempool, estimativa de taxas e reorganização de chain controlada — em ambiente Docker reproduzível, sem fundos reais.

### Descrição Longa

NodeScope transforma o Bitcoin Core de um sistema poderoso, mas opaco, em uma plataforma observável, compreensível e auditável.

O Bitcoin Core expõe dados ricos por dois canais: RPC (consultas de estado estruturadas) e ZMQ (eventos de transações e blocos em tempo real). Esses canais são poderosos, mas separados — não existe uma ferramenta padrão que os unifique em uma experiência visual e guiada.

NodeScope preenche essa lacuna. Ele assina eventos ZMQ, consulta o RPC para validação e estado, classifica e armazena eventos, e apresenta tudo por um dashboard React com internacionalização completa em português e inglês.

### Problema

A maquinaria interna do Bitcoin Core — política de mempool, RBF, CPFP, estimativa de taxas, reorgs — é bem documentada, mas invisível sem ferramental customizado. Desenvolvedores e operadores dependem de consultas RPC manuais e leituras brutas de socket ZMQ para entender o que acontece dentro do nó.

Não existe uma camada de observabilidade visual padrão para o Bitcoin Core.

### Solução

NodeScope fornece essa camada: um painel em tempo real com integração direta via RPC e ZMQ do Bitcoin Core, com demonstrações guiadas, cenários de política e proof reports verificáveis — tudo em uma stack Docker Compose.

### Diferenciais

1. Bitcoin Core real, RPC real, ZMQ real — não é simulador nem mock.
2. Guiado, visual, auditável — avaliadores veem e reproduzem resultados sem expertise em terminal.
3. Engenharia honesta — todas as limitações documentadas inline.
4. Proof reports — cada demo e cenário gera um artefato JSON verificável.
5. Observabilidade profissional — métricas Prometheus, alerting operacional, benchmark reproduzível.
6. Bilíngue — PT-BR / EN-US em todas as views.

### Como Testar

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Abrir `http://localhost:5173` e clicar em "Run Full Demo" na view Guided Demo.

Guia completo: [docs/presentation/evaluator-checklist.md](evaluator-checklist.md)

### Limitações (Honestas)

- Todos os cenários de demo usam Bitcoin Core regtest. Sem mainnet, sem valor real.
- RPCs de cluster mempool exigem Bitcoin Core 31+. BC26 retorna `unavailable`.
- Reorg Lab é experimental.
- `estimatesmartfee` em regtest tem histórico limitado; alguns alvos podem retornar taxas nulas.
- Histórico SQLite é local ao volume do container.

### Próximos Passos

- Visualização de cluster mempool (compatibilidade com BC31+)
- Modo de observação signet/testnet read-only
- Traces OpenTelemetry para RPC, ZMQ e API
- Postgres/TimescaleDB para persistência escalável de eventos
- Integração com Grafana
- Suporte a topologia multi-nó
