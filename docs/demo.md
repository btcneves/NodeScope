# NodeScope Demo Guide

This is the official evaluator demo path for NodeScope v1.0.0. It runs a real Bitcoin Core regtest node, captures RPC and ZMQ activity, stores NDJSON events, serves them through FastAPI/SSE, and renders the React dashboard.

## Official Docker Flow

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open the dashboard:

```text
http://localhost:5173
```

The same flow is available as one Make target:

```bash
make docker-full-demo
```

## What The Demo Does

`docker compose up -d --build` starts:

- Bitcoin Core 26 in regtest mode
- ZMQ publishers for `rawtx` and `rawblock`
- NodeScope monitor writing append-only NDJSON logs
- FastAPI backend with REST and SSE endpoints
- React/Vite dashboard on port 5173

`make docker-demo` creates or loads the `nodescope_demo` wallet, ensures spendable regtest balance, broadcasts a transaction, reads the mempool, mines a confirmation block, and lets the monitor capture the transaction and block through ZMQ.

`make smoke` validates the API/RPC path, ZMQ-derived summary counts, recent events, classified events, frontend production build, and Python unit tests.

## Endpoints To Open

| View | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| API docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |
| Summary | http://localhost:8000/summary |
| Recent events | http://localhost:8000/events/recent?limit=5 |
| Classifications | http://localhost:8000/events/classifications?limit=5 |
| SSE stream | http://localhost:8000/events/stream |

## Expected Signals

After `make docker-demo`:

- `/health` reports `status: ok`, `rpc_ok: true`, and `chain: regtest`.
- `/summary` includes positive `rawtx_count` and `rawblock_count`.
- `/events/recent?limit=5` returns recent ZMQ events.
- `/events/classifications?limit=5` returns classified block or transaction events.
- The dashboard shows node health, RPC/ZMQ sync, mempool state, live events, classifications, and transaction/block details.

## Optional Local Development

The Docker flow above is the supported evaluation path. Local mode is for development only and requires host-installed Python, Node.js, Bitcoin Core regtest, RPC credentials, ZMQ ports, and frontend dependencies.

```bash
make setup-local
make backend
make monitor
make frontend
make demo
make smoke-local
```

Use Docker for judging unless you intentionally need to debug host-local services.
