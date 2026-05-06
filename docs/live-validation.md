# NodeScope — Live Validation Guide

This guide provides `curl` commands and expected API responses for evaluating NodeScope end-to-end. Run all commands with the API server on `http://localhost:8000`.

---

## Prerequisites

```bash
# API server running
./.venv/bin/python scripts/run_api.py

# Confirm it is reachable
curl -s http://localhost:8000/health | python3 -m json.tool
```

---

## 1. Health Check

```bash
curl -s http://localhost:8000/health
```

**Expected fields:**

| Field | Description |
|---|---|
| `status` | `"ok"` |
| `rpc_ok` | `true` if Bitcoin Core RPC is reachable |
| `chain` | `"regtest"` (or `"signet"` / `"main"`) |
| `blocks` | Current chain tip block height |
| `events_available` | Number of events loaded from NDJSON store |

**Example response:**
```json
{
  "status": "ok",
  "project": "NodeScope",
  "rpc_ok": true,
  "chain": "regtest",
  "blocks": 201,
  "events_available": 47
}
```

---

## 2. Mempool Summary

```bash
curl -s http://localhost:8000/mempool/summary
```

**Expected fields:** `size` (tx count), `bytes`, `rpc_ok: true` when Bitcoin Core is running.

```json
{
  "size": 3,
  "bytes": 1092,
  "rpc_ok": true
}
```

---

## 3. Summary / Engine Analytics

```bash
curl -s http://localhost:8000/summary
```

Returns event counts, classification breakdown, and replay engine state:

```json
{
  "total_events": 47,
  "rawtx_count": 42,
  "rawblock_count": 5,
  "classification_counts": {
    "coinbase_like": 5,
    "simple_payment_like": 34,
    "unknown": 3
  }
}
```

---

## 4. Recent Events

```bash
curl -s "http://localhost:8000/events/recent?limit=5"
```

Returns the 5 most recent NDJSON events (newest first):

```json
{
  "items": [
    {
      "ts": "2026-05-07T14:30:00Z",
      "event": "zmq_rawtx",
      "origin": "zmq",
      "data": { "txid": "abc123..." }
    }
  ],
  "total_items": 42
}
```

Filter by type:
```bash
curl -s "http://localhost:8000/events/recent?limit=5&event_type=zmq_rawblock"
```

---

## 5. Classifications

```bash
curl -s "http://localhost:8000/events/classifications?limit=5"
```

Filter by kind:
```bash
curl -s "http://localhost:8000/events/classifications?limit=10&kind=coinbase_like"
```

---

## 6. Latest Block

```bash
curl -s http://localhost:8000/blocks/latest
```

```json
{
  "ts": "2026-05-07T14:30:00Z",
  "height": 201,
  "hash": "00000...",
  "kind": "block_event"
}
```

---

## 7. Latest Transaction

```bash
curl -s http://localhost:8000/tx/latest
```

```json
{
  "ts": "2026-05-07T14:29:55Z",
  "txid": "abc123...",
  "inputs": 1,
  "outputs": 2,
  "total_out": 0.001,
  "kind": "simple_payment_like"
}
```

---

## 8. Transaction Lookup by TXID

```bash
TXID=$(curl -s http://localhost:8000/tx/latest | python3 -c "import sys,json; print(json.load(sys.stdin)['txid'])")
curl -s "http://localhost:8000/tx/${TXID}"
```

Returns full transaction detail for any TXID seen via ZMQ. Returns `404` if not found:

```bash
curl -s http://localhost:8000/tx/notarealthing
# {"detail":"Transaction notarealthing not found in event store"}
```

---

## 9. SSE Live Stream

```bash
curl -N http://localhost:8000/events/stream
```

Events arrive as `text/event-stream`. Each ZMQ event appears as:

```
event: nodescope_event
data: {"project":"NodeScope","mode":"live_ndjson_tail","event":{...},"classification":{...}}

event: ping
data: {"project":"NodeScope","source":"logs/2026-05-07-monitor.ndjson"}
```

---

## 10. Generate Regtest Activity

To populate all endpoints with real data, run:

```bash
bash scripts/demo_regtest.sh
```

This creates a wallet (if needed), mines 101 blocks, sends a transaction, and mines 1 more block to confirm it. Re-run for additional activity.

---

## Automated Smoke Tests

```bash
make smoke
```

See `docs/smoke-tests.md` for the full list of automated checks. The default smoke path is Dockerized and should be run after `docker compose up -d --build` and `make docker-demo`.

---

## Visual Evidence Validation — 2026-05-06

Visual evidence must be generated from a real running stack after smoke tests and regtest activity.

Commands:

```bash
make smoke
make docker-demo
make screenshots
```

Docker validation path:

```bash
docker compose config
docker compose up -d --build
make docker-demo
make smoke
make screenshots
```

Validated endpoints:

| Endpoint | Expected result |
|---|---|
| `/health` | `status: ok`, `rpc_ok: true`, `chain: regtest` |
| `/summary` | non-zero `rawtx_count` and `rawblock_count` after demo |
| `/mempool/summary` | RPC-backed mempool object |
| `/events/recent` | recent `zmq_rawtx` and `zmq_rawblock` events |
| `/events/classifications` | classified block and transaction events |
| `/blocks/latest` | latest block height and hash |
| `/tx/latest` | latest transaction txid and classification |

Generated screenshots:

| File | Source |
|---|---|
| `docs/assets/nodescope-dashboard.png` | Dashboard home |
| `docs/assets/nodescope-command-center.png` | Dashboard home |
| `docs/assets/nodescope-transaction-lifecycle.png` | Dashboard home |
| `docs/assets/nodescope-api-docs.png` | `/docs` |
| `docs/assets/nodescope-demo-page.png` | `/demo` |
| `docs/assets/nodescope-health.png` | `/health` |
| `docs/assets/nodescope-live-events.png` | `/events/recent?limit=20` |
| `docs/assets/nodescope-mempool-summary.png` | `/mempool/summary` |
| `docs/assets/nodescope-latest-block.png` | `/blocks/latest` |

Screenshot rules:

- Capture only from local trusted stacks.
- Do not include terminal windows with private paths or credentials.
- Do not edit screenshots to simulate data.
- Re-run the Docker demo flow and `make screenshots` whenever the dashboard layout changes.
