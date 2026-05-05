# NodeScope

**Bitcoin Core Intelligence Dashboard**

Real-time observability for Bitcoin Core nodes using RPC, ZMQ, mempool monitoring, and regtest demos.

NodeScope is a standalone open source dashboard for demonstrating and inspecting live Bitcoin Core node behavior. It combines RPC snapshots, ZMQ events, append-only NDJSON storage, a classification engine, a FastAPI API and a React/Vite dashboard.

## Quickstart

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up --build
```

Open:

- Dashboard: http://localhost:5173
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local Development

```bash
bash scripts/quickstart.sh
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

## Demo

```bash
make demo
```

The demo creates or loads a regtest wallet, mines initial blocks, broadcasts a transaction, mines a block and lets NodeScope show the resulting RPC and ZMQ-derived state.

## Documentation

Start with [docs/README.md](docs/README.md).

## License

MIT. See [LICENSE](LICENSE).
