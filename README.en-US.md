# NodeScope

[![CI](https://github.com/btcneves/NodeScope/actions/workflows/ci.yml/badge.svg)](https://github.com/btcneves/NodeScope/actions/workflows/ci.yml)
[![Python 3.12](https://img.shields.io/badge/python-3.12-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-ready-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React + Vite](https://img.shields.io/badge/React%20%2B%20Vite-ready-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bitcoin Core](https://img.shields.io/badge/Bitcoin%20Core-regtest-f7931a?logo=bitcoin&logoColor=white)](https://bitcoincore.org/)
[![RPC + ZMQ](https://img.shields.io/badge/RPC%20%2B%20ZMQ-observability-7c3aed)](https://github.com/btcneves/NodeScope)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-ready-2496ed?logo=docker&logoColor=white)](docker-compose.yml)
[![i18n](https://img.shields.io/badge/i18n-EN--US%20%7C%20PT--BR-blueviolet)](README.pt-BR.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Bitcoin Core Intelligence Dashboard**

Real-time observability for Bitcoin Core nodes using RPC, ZMQ, mempool monitoring, and regtest demos.

NodeScope is a standalone open source dashboard for demonstrating and inspecting live Bitcoin Core node behavior. It combines RPC snapshots, ZMQ events, append-only NDJSON storage, a classification engine, a FastAPI API and a React/Vite dashboard.

## Quickstart

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d
make docker-demo
make smoke
```

Open:

- Dashboard: http://localhost:5173
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local Development

```bash
make setup-local
make backend
make monitor
make frontend
```

## Validation

```bash
make test
make build
make public-clean
make smoke
```

These validation targets run in Docker by default. For host-local development, use `make test-local`, `make build-local`, and `make smoke-local`.

## Demo

```bash
make docker-demo
```

The demo creates or loads a regtest wallet, mines initial blocks, broadcasts a transaction, mines a block and lets NodeScope show the resulting RPC and ZMQ-derived state.

## Documentation

Start with [docs/README.md](docs/README.md).

## License

MIT. See [LICENSE](LICENSE).
