# Presentation Checklist

## Official Demo Commands

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open the dashboard at `http://localhost:5173`.

## Endpoints To Show

| Purpose | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| API docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |
| Summary | http://localhost:8000/summary |
| Recent events | http://localhost:8000/events/recent?limit=5 |
| Classifications | http://localhost:8000/events/classifications?limit=5 |
| SSE stream | http://localhost:8000/events/stream |

## Two-Minute Talk Track

Problem: Bitcoin Core delivers raw RPC and ZMQ signals, but those streams are hard to interpret during node operation.

Solution: NodeScope turns RPC snapshots plus ZMQ events into operational observability.

Architecture: Bitcoin Core regtest -> RPC/ZMQ -> monitor -> NDJSON -> FastAPI/SSE -> React dashboard.

Demo: Start the stack, generate blocks and transactions, then show live events, classifications, RPC health, mempool state, and the dashboard updating from real regtest activity.

Differential: This is not a mock. It is real Bitcoin Core in regtest with a complete stack and a reproducible smoke test.

## Pre-Presentation Checklist

- [ ] Docker is running.
- [ ] Ports 5173, 8000, 18443, 28332 and 28333 are free or overridden in `.env`.
- [ ] `docker compose up -d --build` completed.
- [ ] `make docker-demo` generated a transaction and mined a block.
- [ ] `make smoke` ended with `FAIL=0`.
- [ ] Dashboard loads at `http://localhost:5173`.
- [ ] `/events/recent?limit=5` and `/events/classifications?limit=5` return data.

## Plan B

If the dashboard does not load, use the API directly:

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/summary
curl -s "http://localhost:8000/events/recent?limit=5"
curl -s "http://localhost:8000/events/classifications?limit=5"
```

Explain the same architecture from the endpoint responses: RPC proves the Bitcoin Core connection, summary proves ZMQ-derived rawtx/rawblock counts, recent events show captured NDJSON activity, and classifications show NodeScope's interpretation layer.
