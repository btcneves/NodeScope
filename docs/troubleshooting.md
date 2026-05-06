# NodeScope Troubleshooting

---

## 1. "Connection refused" when accessing the API

**Symptom:** `curl http://127.0.0.1:8000/health` returns `Connection refused`.

**Cause:** The FastAPI backend is not running or the Docker service is still starting.

**Fix:**
```bash
docker compose up -d --build
docker compose ps
make smoke
```

For local development without Docker:

```bash
make setup-local
make backend
```

If the API exits immediately, check the output for a Python import error or a port conflict:

```bash
# Check if something else is already using port 8000
lsof -i :8000
```

---

## 2. Dashboard shows "RPC offline"

**Symptom:** The health indicator in the dashboard shows Bitcoin Core as unreachable.

**Causes and fixes:**

**a) `bitcoind` is not running:**
```bash
bitcoind -daemon
# Wait a few seconds, then verify:
bitcoin-cli -regtest getblockchaininfo
```

**b) Wrong RPC credentials:**
Check `~/.bitcoin/bitcoin.conf` and confirm `rpcuser` and `rpcpassword` match what NodeScope expects. The defaults are both `nodescope`. Override with environment variables if needed:
```bash
export BITCOIN_RPC_USER=youruser
export BITCOIN_RPC_PASSWORD=yourpassword
```

**c) `rpcbind` or `rpcallowip` blocking connections:**
Confirm your `bitcoin.conf` includes:
```
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
```

---

## 3. SSE stream not connecting

**Symptom:** The live event dot in the dashboard is grey or the SSE status shows disconnected.

**Cause:** Connecting directly to `http://127.0.0.1:8000/events/stream` from the browser triggers a CORS error.

**Fix:** Always access the dashboard through the Vite dev server at `http://localhost:5173`. The Vite proxy handles CORS transparently. Do not open the API port directly in the browser for SSE.

If the Vite dev server is not running:
```bash
cd frontend && npm run dev
```

---

## 4. ZMQ events are not arriving in `monitor.py`

**Symptom:** `monitor.py` starts but no `zmq_rawtx` or `zmq_rawblock` events appear even after mining blocks or sending transactions.

**Checks:**

**a) Verify ZMQ is configured:**
```bash
bitcoin-cli -regtest getzmqnotifications
```
The output should list `pubrawblock` on port 28332 and `pubrawtx` on port 28333. If the array is empty, add the following to `~/.bitcoin/bitcoin.conf` and restart `bitcoind`:
```
zmqpubrawblock=tcp://127.0.0.1:28332
zmqpubrawtx=tcp://127.0.0.1:28333
```

**b) Restart `bitcoind` after changing `bitcoin.conf`:**
```bash
bitcoin-cli -regtest stop
bitcoind -daemon
```

**c) Verify the port is bound:**
```bash
ss -tlnp | grep 28332
```

---

## 5. No log files found — API returns empty data

**Symptom:** `/health` shows `events_available: 0` or the dashboard displays no events.

**Cause:** `monitor.py` has not been run yet, or it was run in a different working directory.

**Fix:** Start the monitor from the project root and generate some activity:
```bash
./.venv/bin/python monitor.py
```

Log files are written to `logs/YYYY-MM-DD-monitor.ndjson` relative to the project root. Verify the directory exists and contains files:
```bash
ls logs/
```

---

## 6. `monitor.py` fails with "command not found: bitcoin-cli"

**Symptom:** `monitor.py` starts but immediately logs an error about `bitcoin-cli` not being found.

**Cause:** Bitcoin Core is not installed or `bitcoin-cli` is not on `PATH`.

**Fix:**

1. Download and install Bitcoin Core from [bitcoincore.org](https://bitcoincore.org/en/download/).
2. Verify the binary is accessible:
   ```bash
   which bitcoin-cli
   bitcoin-cli --version
   ```
3. If installed to a non-standard location, add it to your `PATH`:
   ```bash
   export PATH="/path/to/bitcoin/bin:$PATH"
   ```

---

## 7. Frontend build fails

**Symptom:** `npm run dev` or `npm run build` exits with an error.

For the Docker quickstart, run the build inside Compose:

```bash
make build
```

**Checks:**

**a) Node.js version:**
```bash
node --version
```
Node.js 18 or later is required.

**b) Dependencies not installed:**
```bash
cd frontend && npm install
```
Run this once before `npm run dev` or after pulling changes that modify `package.json`.

**c) TypeScript errors blocking the build:**
```bash
cd frontend && npx tsc --noEmit
```
Fix any type errors reported before running the build again.

---

## 8. Tests fail

**Symptom:** `./.venv/bin/python -m unittest discover -s tests -v` reports errors or failures.

For the Docker quickstart, run tests inside the API image:

```bash
make test
```

**Checks:**

**a) Virtual environment not activated or dependencies missing:**
```bash
./.venv/bin/pip install -r requirements.txt
```

**b) Running from the wrong directory:**
Always run tests from the project root:
```bash
cd $PROJECT_ROOT
./.venv/bin/python -m unittest discover -s tests -v
```

**c) Python version mismatch:**
```bash
./.venv/bin/python --version
```
Python 3.12 is required. If the venv was created with a different version, recreate it:
```bash
python3.12 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

**d) Syntax error after editing a module:**
```bash
./.venv/bin/python -m compileall .
```
This will surface any syntax errors across all `.py` files.
