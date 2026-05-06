# NodeScope Project Status

## Final Delivery Status

Status: Hackathon-ready
Release: v1.0.0
Docker quickstart: validated
Smoke test: passing
Frontend build: passing
Python tests: passing

## Official Evaluator Flow

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

Open:

```text
http://localhost:5173
```

## Delivered Capabilities

| Area | Status | Notes |
|---|---|---|
| Bitcoin Core regtest | Ready | Compose starts Bitcoin Core 26 without mainnet, wallet keys, or external services. |
| RPC snapshot | Ready | FastAPI reads chain and mempool state through Bitcoin Core RPC. |
| ZMQ rawtx/rawblock | Ready | Monitor subscribes to real regtest ZMQ events. |
| NDJSON event logs | Ready | Monitor writes append-only logs under `logs/`. |
| Event classification | Ready | Blocks and transactions are classified from captured events. |
| FastAPI API | Ready | Health, summary, mempool, recent events, classifications, blocks, tx, intelligence and SSE endpoints. |
| React dashboard | Ready | Vite dashboard reads the API and shows live event state. |
| Smoke validation | Ready | Dockerized smoke covers RPC, ZMQ-derived counts, API endpoints, frontend build and Python tests. |

## Known Limitations

- The official demo uses Bitcoin Core regtest only; signet/mainnet operation is intentionally out of scope for v1.0.0.
- `logs/` is local runtime storage, not a production database.
- Local non-Docker mode is available for development, but Docker is the validated judging path.
