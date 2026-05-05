# Smoke Tests

Smoke tests verify that the main local workflows are healthy.

## Run

Start the backend first:

```bash
make backend
```

Then run:

```bash
make smoke
```

## Checks

The script validates:

- `GET /health`
- `GET /summary`
- `GET /mempool/summary`
- `GET /events/recent`
- frontend production build
- Python unit tests

If Bitcoin Core is offline, `/health` should still respond and report `rpc_ok: false`. That is an expected fallback, not an API crash.
