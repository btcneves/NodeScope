# NodeScope — Evaluator Checklist

Complete this checklist to fully assess NodeScope in under 10 minutes.

---

## Prerequisites

| Step | Command / Action | Expected Result |
|---|---|---|
| [ ] Clone repository | `git clone https://github.com/btcneves/NodeScope.git && cd NodeScope` | Directory `NodeScope/` created |
| [ ] Copy env | `cp .env.example .env` | `.env` created with default values |

---

## Start the Stack

| Step | Command | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Start services | `docker compose up -d --build` | All 4 containers start (bitcoind, api, monitor, frontend) | `docker ps` — all containers running |
| [ ] Seed regtest data | `make docker-demo` | Wallet created, blocks mined, tx sent, ZMQ events captured | Terminal output — no errors |
| [ ] Run smoke tests | `make smoke` | `PASS=15 FAIL=0 WARN=0` | Terminal output |

---

## Open the Frontend

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open dashboard | Navigate to `http://localhost:5173` | Dashboard loads with node health and chain data | Browser |
| [ ] Check node health | Look at the health score card | Score 0–100, RPC ✓ indicator | Dashboard header |
| [ ] Check language toggle | Click PT-BR / EN-US toggle | All labels switch language | Top-right corner |

---

## Guided Demo

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open Guided Demo | Click "Guided Demo" in navigation | 14-step demo view loads | Browser |
| [ ] Run full demo | Click "Run Full Demo" button | All 14 steps complete with status indicators | Step list — green checkmarks |
| [ ] Review proof report | Scroll to Proof Report section | JSON proof with txid, fee, vbytes, block hash | Bottom of demo view |
| [ ] Copy proof | Click "Copy Proof" button | Proof JSON copied to clipboard | Clipboard / browser notification |

---

## Transaction Inspector

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Navigate to Inspector | Click "Transaction Inspector" | Search input loads | Browser |
| [ ] Inspect a txid | Paste a txid from the proof report and search | Transaction details: fee, vsize, weight, wtxid, inputs, outputs | Inspector view |
| [ ] Check RPC indicator | Look at data source label | Data comes from RPC (not cached) | Inspector card header |

---

## ZMQ Event Tape

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open ZMQ Event Tape | Click "ZMQ Event Tape" in navigation | Event list loads with rawtx/rawblock entries | Browser |
| [ ] Check event topics | Look at topic badges | Entries labeled `rawtx` or `rawblock` | Event list badges |
| [ ] Click a txid link | Click a txid in the event list | Navigates to Transaction Inspector for that txid | Browser |

---

## Mempool Policy Arena

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open Policy Arena | Click "Mempool Policy Arena" | 4 scenario cards load | Browser |
| [ ] Run Normal scenario | Click "Run" on Normal transaction | Transaction confirmed, proof generated | Scenario result card |
| [ ] Run RBF scenario | Click "Run" on RBF replacement | Original txid replaced, new txid + fee rates shown | Scenario result card |
| [ ] Run CPFP scenario | Click "Run" on CPFP package | Parent and child txids shown, effective fee rate | Scenario result card |
| [ ] Check proof | Click "Copy Proof" on any scenario | Proof JSON copied | Clipboard |

---

## Fee Estimation Playground

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open Fee Estimation | Click "Fee Estimation" in navigation | Playground loads | Browser |
| [ ] View estimates | Look at the estimation table | Estimates for 1, 3, 6, and 12 block targets | Estimation table |
| [ ] Check regtest note | Look for the limitation notice | Honest note about regtest fee history limitations | Inline documentation |

---

## Reorg Lab

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open Reorg Lab | Click "Reorg Lab" in navigation | 10-step reorg scenario loads | Browser |
| [ ] Run reorg | Click "Run Reorg" | Steps execute: block invalidated, chain reorganized, block reconsidered | Step list |
| [ ] Check experimental marker | Look for the experimental badge | "Experimental" label visible | Page header |

---

## Prometheus Metrics

| Step | Command / Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Fetch metrics | `curl http://localhost:8000/metrics` | Prometheus text format with 28+ metrics | Terminal or browser |
| [ ] Check RPC up | Look for `nodescope_rpc_up 1.0` | Value is 1.0 (Bitcoin Core reachable) | Metrics output |
| [ ] Check chain height | Look for `nodescope_chain_height` | Non-zero value matching demo blocks | Metrics output |

---

## Historical Dashboard

| Step | Action | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Open History | Click "Historical Dashboard" | List of past demo runs, policy runs, reorg runs | Browser |
| [ ] Check proof count | Look at the summary row | Proof reports count matches runs executed | Page header |
| [ ] Copy historical proof | Click "Copy Proof" on a past run | Proof JSON retrieved from SQLite | Clipboard |

---

## Benchmark and Load Test (Optional)

| Step | Command | Expected Result | Where to Observe |
|---|---|---|---|
| [ ] Run benchmark | `python3 scripts/benchmark_nodescope.py` | Latency table per endpoint (min/mean/median/p95/max) | Terminal |
| [ ] Run load smoke | `python3 scripts/load_smoke.py --concurrency 5 --requests 50` | All requests succeed, no 5xx errors | Terminal |

---

## What to Verify Manually

- [ ] All 14 guided demo steps show success status
- [ ] Proof report contains real txid, fee, vbytes, block hash — not placeholder data
- [ ] ZMQ Event Tape shows events generated during `make docker-demo`
- [ ] Policy Arena proof records the real RPC call results
- [ ] `/metrics` shows `nodescope_rpc_up 1.0`
- [ ] No secrets, tokens, or private keys visible in the browser or logs
- [ ] Cluster Mempool Detector shows `unavailable` for BC28+ RPCs (expected on BC26)
- [ ] Reorg Lab is marked experimental
- [ ] Fee Estimation shows regtest limitations honestly

---

## Notes for Evaluators

- All data is from Bitcoin Core regtest. No real Bitcoin, no mainnet, no external services.
- ZMQ events are real — generated by Bitcoin Core's internal event system.
- RPC calls are real — executed against a running Bitcoin Core 26 instance.
- Proof reports are deterministic and auditable.
- The entire stack starts from a single `docker compose up -d --build` command.
