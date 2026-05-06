# Dashboard Assets / Assets do Dashboard

This directory stores real visual evidence for NodeScope documentation.

Esta pasta armazena evidências visuais reais usadas na documentação do NodeScope.

## Stable Files / Arquivos Estáveis

| File | Description |
|---|---|
| `nodescope-dashboard.png` | Full dashboard after real regtest activity |
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

To run smoke tests, generate regtest activity and capture images:

```bash
make demo-screenshots
```

To run the broader validation flow and generate visual evidence:

```bash
make evidence
```

The capture script uses Chromium, viewport `1440x900`, `networkidle` page loads and full-page PNG screenshots.

O script usa Chromium, viewport `1440x900`, carregamento `networkidle` e screenshots PNG full-page.
