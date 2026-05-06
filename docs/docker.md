# Docker Guide

NodeScope includes a Docker Compose stack for a full local demo.

## Services

| Service | Description | Port |
|---|---|---|
| `nodescope-bitcoind` | Bitcoin Core regtest node with RPC and ZMQ enabled | `18443`, `28332`, `28333` |
| `nodescope-api` | FastAPI backend | `8000` |
| `nodescope-monitor` | ZMQ subscriber and NDJSON writer | internal |
| `nodescope-frontend` | Vite development server | `5173` |

## Start

```bash
cp .env.example .env
docker compose up -d --build
make docker-demo
make smoke
```

If those host ports are already occupied by local services, edit `.env` before starting:

```bash
HOST_BITCOIN_RPC_PORT=18444
HOST_ZMQ_RAWBLOCK_PORT=28342
HOST_ZMQ_RAWTX_PORT=28343
HOST_API_PORT=18000
HOST_FRONTEND_PORT=15173
```

The containers still use the standard internal ports; only the host-facing ports change.

## Stop

```bash
docker compose down
```

## Validate Configuration

```bash
make docker-config
```

## Smoke Test

`make smoke` is Dockerized. It checks the host-facing API, confirms Bitcoin Core RPC is connected on regtest, builds the frontend in a Node container and runs Python tests in the API image.

```bash
make smoke
```

No host `node_modules`, `tsc`, `fastapi`, `pyzmq` or virtualenv is required.

## Notes

- Runtime event logs are mounted at `./logs`.
- The Compose stack uses example regtest credentials only.
- For local non-Docker Bitcoin Core, use `bitcoin.conf.example` instead.
