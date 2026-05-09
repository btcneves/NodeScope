# Dashboard Assets / Assets do Dashboard

This directory stores real visual evidence for NodeScope documentation.

Esta pasta armazena evidências visuais reais usadas na documentação do NodeScope.

## Stable Files / Arquivos Estáveis

| File | Description |
|---|---|
| `nodescope-dashboard.png` | Full dashboard after real regtest activity |
| `nodescope-charts.png` | Historical Charts tab with persisted snapshots |
| `nodescope-guided-demo.png` | Guided Demo tab with the 14-step Bitcoin Core workflow |
| `nodescope-tx-inspector.png` | Transaction Inspector tab for TXID analysis |
| `nodescope-zmq-tape.png` | ZMQ Event Tape tab with rawtx/rawblock events |
| `nodescope-policy-arena.png` | Mempool Policy Arena tab |
| `nodescope-reorg-lab.png` | Reorg Lab tab |
| `nodescope-history.png` | Historical Dashboard tab with persisted proof reports |
| `nodescope-fee-estimation.png` | Fee Estimation tab using Bitcoin Core estimatesmartfee |
| `nodescope-cluster-mempool.png` | Cluster Mempool tab with runtime compatibility/fallback state |
| `nodescope-command-center.png` | Command Center view from the dashboard |
| `nodescope-transaction-lifecycle.png` | Transaction Lifecycle view after a confirmed regtest transaction |
| `nodescope-live-events.png` | Recent events endpoint rendered in Chromium |
| `nodescope-mempool-summary.png` | Mempool summary endpoint rendered in Chromium |
| `nodescope-latest-block.png` | Latest block endpoint rendered in Chromium |
| `nodescope-api-docs.png` | FastAPI interactive API documentation |
| `nodescope-demo-page.png` | Legacy `/demo` page served by the API |
| `nodescope-health.png` | Health endpoint rendered in Chromium |

Do not add private screenshots, local terminal captures, credentials, `.env` values, wallet secrets, or temporary files.

Nao adicione capturas privadas, prints de terminal local, credenciais, valores de `.env`, segredos de wallet ou arquivos temporarios.

## Capture Rules / Regras de Captura

Screenshots must be updated only after:

1. The real NodeScope stack is running.
2. `make smoke` passes.
3. `make demo` or `make docker-demo` generates regtest activity.
4. RPC, ZMQ, API and dashboard data are visible.

As imagens devem ser atualizadas somente depois de:

1. A stack real do NodeScope estar rodando.
2. `make smoke` passar.
3. `make demo` ou `make docker-demo` gerar atividade regtest.
4. RPC, ZMQ, API e dashboard apresentarem dados reais.

## Setup / Instalacao

Install development dependencies:

```bash
./.venv/bin/python -m pip install -r requirements-dev.txt
./.venv/bin/python -m playwright install chromium
```

## Capture Commands / Comandos de Captura

With API, monitor, frontend and Bitcoin Core already running:

```bash
make screenshots
```

To run the validated Docker demo flow before capturing images:

```bash
docker compose up -d --build
make docker-demo
make smoke
make screenshots
```

The capture script uses Chromium, viewport `1440x900`, `networkidle` page loads and full-page PNG screenshots.

O script usa Chromium, viewport `1440x900`, carregamento `networkidle` e screenshots PNG full-page.
