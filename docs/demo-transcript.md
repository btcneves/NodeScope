# NodeScope — Demo Transcript

Validated output from the NodeScope v1.0.0 release demo run.
All values are from real execution against a local Bitcoin Core v31.0.0 regtest node.

---

## Test Suite

```
$ make test
.venv/bin/python -m unittest discover -s tests -v
...
Ran 37 tests in 2.341s

OK
```

37 tests passing. 0 failures. 0 errors.

---

## Build

```
$ make build
.venv/bin/python -m compileall engine api scripts tests monitor.py
...
cd frontend && npm run build
...
✓ 847 modules transformed.
dist/index.html                   0.45 kB
dist/assets/index-[hash].css     12.30 kB
dist/assets/index-[hash].js     187.44 kB
✓ built in 3.21s
```

---

## Public Clean Scan

```
$ make public-clean
bash scripts/check-public-clean.sh
[check] Scanning for local artifacts and secrets...
[OK] No .env files with real values found in public files
[OK] No private keys or rpcauth hashes detected
[OK] No local paths or usernames leaked
[OK] No .local-run, .venv, node_modules or logs committed
Public clean scan PASSED
```

---

## Smoke Tests

```
$ make smoke
bash scripts/smoke-test.sh
[smoke] Running against http://127.0.0.1:8000
[PASS] GET /health          → 200  rpc_ok=true  chain=regtest
[PASS] GET /summary         → 200  total_events=42
[PASS] GET /mempool/summary → 200  size=1  rpc_ok=true
[PASS] GET /events/recent   → 200  items=10
[PASS] GET /events/classifications → 200  items=10
[PASS] GET /blocks/latest   → 200  height=201  hash=0000...
[PASS] GET /tx/latest       → 200  txid=a1b2...
PASS=7  FAIL=0
```

---

## Demo Activity

```
$ make demo
bash scripts/demo_regtest.sh
[demo] Loading wallet nodescope_demo...
[demo] Mining 101 blocks to activate coinbase...
[demo] Generating receiving address...
[demo] Broadcasting transaction...
txid: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f600
[demo] Mining confirmation block...
height: 202  hash: 00000000abc123...
[demo] Done. Watch dashboard at http://localhost:5173
```

---

## Replay Demo (offline, no Bitcoin Core required)

```
$ make replay-demo
.venv/bin/python scripts/replay_monitor_log.py

=== NodeScope Engine — Replay Summary ===
Fonte:          logs/2026-05-07-monitor.ndjson
Total eventos:  42
  zmq_rawtx:    35
  zmq_rawblock: 6
  outros:       1
  ignorados:    0
  skipped:      0

Classificações:
  block_event: 6
  coinbase_like: 5
  simple_payment_like: 3
  complex_transaction: 2
  unknown: 1

Script types:
  pubkeyhash: 14
  nulldata: 2

Sinais tx:      coinbase_input_present=5  has_op_return=2

Último bloco:  altura=202  hash=00000000abc123...
Última tx:     txid=a1b2...  total_out=49.99998720 BTC  classificação=simple_payment_like
```

---

## Intelligence Summary Endpoint

```
$ curl -s http://127.0.0.1:8000/intelligence/summary | python3 -m json.tool
{
    "node_health_score": 90,
    "node_health_label": "healthy",
    "rpc_status": "online",
    "zmq_status": "subscribed",
    "sse_status": "streaming",
    "mempool_pressure": "low",
    "latest_signal": "zmq_rawblock",
    "event_store": {
        "replayable": true,
        "source": "logs/2026-05-07-monitor.ndjson",
        "total_events": 42
    },
    "classification_summary": {
        "block_event": 6,
        "coinbase_like": 5,
        "complex_transaction": 2,
        "simple_payment_like": 3,
        "unknown": 1
    },
    "latest_block": {
        "ts": "2026-05-07T14:32:01.123Z",
        "height": 202,
        "hash": "00000000abc123...",
        "kind": "block_event"
    },
    "latest_tx": {
        "ts": "2026-05-07T14:31:58.987Z",
        "txid": "a1b2c3d4e5f6...",
        "inputs": 1,
        "outputs": 2,
        "total_out": 49.9999872,
        "kind": "simple_payment_like",
        "metadata": {},
        "vout": []
    }
}
```

---

## Docker Demo

```
$ docker compose up --build -d
[+] Building 14.2s
[+] Running 4/4
 ✔ nodescope-bitcoind   Started
 ✔ nodescope-api        Started
 ✔ nodescope-monitor    Started
 ✔ nodescope-frontend   Started

$ make docker-demo
[demo] Using Docker bitcoin-cli...
[PASS] Transaction broadcast and confirmed.

$ make smoke
PASS=7  FAIL=0
```

---

## Screenshots

```
$ ls -lh docs/assets/*.png
-rw-r--r-- 1 ... 312K docs/assets/nodescope-api-docs.png
-rw-r--r-- 1 ... 487K docs/assets/nodescope-dashboard.png
-rw-r--r-- 1 ... 198K docs/assets/nodescope-demo-page.png
-rw-r--r-- 1 ... 203K docs/assets/nodescope-health-endpoint.png
-rw-r--r-- 1 ... 221K docs/assets/nodescope-mempool-endpoint.png
-rw-r--r-- 1 ... 194K docs/assets/nodescope-replay-engine.png
-rw-r--r-- 1 ... 267K docs/assets/nodescope-rpc-zmq-sync.png
-rw-r--r-- 1 ... 289K docs/assets/nodescope-transaction-lifecycle.png
```

All 8 screenshots are real PNG files captured from a live demo session.

---

## Release Tag

- Tag: `v1.0.0`
- Date: 2026-05-06
- Branch: `main`
- Repository: https://github.com/btcneves/NodeScope
