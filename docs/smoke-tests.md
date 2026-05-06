# Smoke Tests

Smoke tests verify that the main Docker workflow is healthy from a clean clone.

## Run

Start the Compose stack and generate regtest activity:

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
cp .env.example .env
docker compose up -d --build
make docker-demo
```

Then run:

```bash
make smoke
```

`make smoke` does not require local Python packages, `node_modules`, `tsc`, `fastapi`, `pyzmq`, or `bitcoin-cli`. It uses the running Compose stack plus short-lived tool containers.

## Checks

The script validates:

- `GET /health`
- `GET /summary`
- `GET /mempool/summary`
- `GET /events/recent`
- `GET /events/classifications`
- frontend production build inside the Node container
- Python unit tests inside the API image

For intentional host-local development, run `make setup-local` once and then use `make smoke-local`.
