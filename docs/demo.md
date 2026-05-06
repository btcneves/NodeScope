# NodeScope Demo Guide

This guide walks through a complete end-to-end demonstration of NodeScope: starting all services, generating Bitcoin regtest activity, and observing real-time updates in the dashboard.

**Related guides:** [demo-checklist.md](demo-checklist.md) · [demo-script.md](demo-script.md) · [live-validation.md](live-validation.md)

---

## Prerequisites

Before starting, ensure the following are in place:

- **Bitcoin Core** installed and configured for regtest (see `docs/bitcoin-core-setup.md`)
- **`bitcoind`** running: `bitcoin-cli -regtest getblockchaininfo` should respond without error
- **Python 3.12+** with the project virtualenv: `.venv/` at the project root
- **Node.js 18+** for the frontend dev server
- At least one wallet created and 101 blocks mined (for spendable balance)

---

## Step 1 — Start the Backend

From the project root, start the FastAPI server:

```bash
./.venv/bin/python scripts/run_api.py
```

The server listens on `http://127.0.0.1:8000`. To confirm it is running:

```bash
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
```

You should see `"status": "ok"`.

Optional flags:

```bash
./.venv/bin/python scripts/run_api.py --host 127.0.0.1 --port 8000
```

---

## Step 2 — Start the Frontend

In a separate terminal, from the project root:

```bash
cd frontend && npm install && npm run dev
```

Vite will print:

```
  VITE v6.x.x  ready in NNNms

  ➜  Local:   http://localhost:5173/
```

The Vite dev server proxies all API paths to the FastAPI backend, so you do not need to configure CORS.

---

## Step 3 — Open the Dashboard

Open your browser at [http://localhost:5173](http://localhost:5173).

The dashboard displays:
- API and SSE connection status (top bar)
- KPI row: total events, rawtx count, rawblock count, coinbase count, OP_RETURN count, classified events
- Live event feed with classification badges
- Latest block and latest transaction details
- Analytics summary chips

At this point the dashboard may show empty or stale data if `monitor.py` has not run yet.

---

## Step 4 — Start the Monitor

In another terminal, from the project root:

```bash
./.venv/bin/python monitor.py
```

`monitor.py` subscribes to the ZMQ sockets and begins writing to `logs/YYYY-MM-DD-monitor.ndjson`. Each captured event is also printed to stdout as a NDJSON line.

Leave this running for the duration of the demo.

---

## Step 5 — Generate Regtest Activity

### Option A: Automated Demo Script

Run the provided script to generate a complete sequence of blocks, transactions, and confirmations:

```bash
bash scripts/demo_regtest.sh
```

The script:
1. Verifies `bitcoin-cli` and the API are available
2. Creates or loads the `nodescope-demo` wallet
3. Mines 101 initial blocks (only if balance is zero)
4. Sends 1.5 BTC to a new address
5. Queries the mempool to show the pending transaction
6. Mines 1 block to confirm
7. Prints a summary with the final block count

### Option B: Manual Commands

```bash
# Get or create a receive address
ADDR=$(bitcoin-cli -regtest getnewaddress)

# Mine a block
bitcoin-cli -regtest generatetoaddress 1 $ADDR

# Send a transaction (leaves it in the mempool)
bitcoin-cli -regtest sendtoaddress $ADDR 1.0

# Confirm the transaction by mining another block
bitcoin-cli -regtest generatetoaddress 1 $ADDR
```

---

## Step 6 — Watch the Dashboard Update

As `monitor.py` captures events:

- New **blocks** appear in the latest block section
- New **transactions** appear in the event feed, tagged with their classification (`coinbase_like`, `simple_payment_like`)
- **KPI counters** increment in real time via the SSE connection
- The **SSE status dot** in the top bar pulses to indicate an active stream

The dashboard updates without a manual page refresh.

---

## Step 7 — Run Automated Tests

To verify the full stack is functioning correctly:

```bash
./.venv/bin/python -m unittest discover -s tests -v
```

All tests run against local fixtures and the live log files. Expected output ends with:

```
----------------------------------------------------------------------
Ran 26 tests in X.XXXs

OK
```

---

## Quick Reference

| Service             | Command                                              | URL                        |
|---------------------|------------------------------------------------------|----------------------------|
| Bitcoin Core daemon | `bitcoind -daemon`                                   | RPC :18443                 |
| NodeScope API       | `./.venv/bin/python scripts/run_api.py`              | http://127.0.0.1:8000      |
| React dashboard     | `cd frontend && npm run dev`                         | http://localhost:5173      |
| Monitor             | `./.venv/bin/python monitor.py`                      | (writes to `logs/`)        |
| Demo script         | `bash scripts/demo_regtest.sh`                       | —                          |
| Tests               | `./.venv/bin/python -m unittest discover -s tests -v`| —                          |
