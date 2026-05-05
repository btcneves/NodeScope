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
docker compose up --build
```

## Stop

```bash
docker compose down
```

## Validate Configuration

```bash
docker compose config
```

## Notes

- Runtime event logs are mounted at `./logs`.
- The Compose stack uses example regtest credentials only.
- For local non-Docker Bitcoin Core, use `bitcoin.conf.example` instead.
