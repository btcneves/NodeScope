# NodeScope API Reference

Base URL: `http://127.0.0.1:8000`

Interactive documentation (Swagger UI): `http://127.0.0.1:8000/docs`

---

## Overview

The NodeScope API is a hybrid REST API. Read-only endpoints (observability, history, fee estimation) are always open. Mutating endpoints (demo, policy, reorg, simulation, session reset) are optionally protected by an API key.

**Methods in use:** `GET`, `POST`, `PUT`

---

## Authentication

Optional API key protection is controlled by two environment variables:

| Variable | Description |
|---|---|
| `NODESCOPE_REQUIRE_API_KEY` | Set to `true` to enforce the key. Default: `false` (open). |
| `NODESCOPE_API_KEY` | The expected key value. |

When enabled, all mutating endpoints (`POST`, `PUT`) require the header:

```
X-NodeScope-API-Key: <your-key>
```

Read-only endpoints (`GET`) are never protected regardless of this setting.

**Error responses when protection is active:**

| Status | Meaning |
|---|---|
| `401` | Missing or invalid `X-NodeScope-API-Key` header |
| `503` | Key protection is enabled but `NODESCOPE_API_KEY` is not set on the server |

Endpoints that require the key are marked **[protected]** throughout this document.

---

## Core Observability

### GET /health

Returns API operational status, RPC reachability, and log snapshot info.

**Response — 200 OK**

```json
{
  "status": "ok",
  "project": "NodeScope",
  "rpc_ok": true,
  "storage": "ndjson_append_only",
  "source": "logs/2026-05-07-monitor.ndjson",
  "events_available": 142,
  "ignored_lines": 0
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"ok"` when the API is reachable |
| `rpc_ok` | boolean | `true` if Bitcoin Core RPC responded successfully |
| `storage` | string | Storage mode identifier |
| `source` | string | Path of the NDJSON log file in use |
| `events_available` | integer | Valid events in the current snapshot |
| `ignored_lines` | integer | Lines skipped due to parse errors |

---

### GET /summary

Aggregate statistics for all events in the current log snapshot.

**Response — 200 OK**

```json
{
  "project": "NodeScope",
  "source": "logs/2026-05-07-monitor.ndjson",
  "total_events": 142,
  "rawtx_count": 98,
  "rawblock_count": 44,
  "classification_counts": {
    "block_event": 44,
    "coinbase_like": 44,
    "simple_payment_like": 53,
    "unknown": 1
  },
  "script_type_counts": {
    "pubkeyhash": 88,
    "witness_v0_keyhash": 55
  },
  "latest_block": { "height": 214, "hash": "0000000abc..." },
  "latest_tx": { "txid": "abc123...", "kind": "simple_payment_like" }
}
```

---

### GET /mempool/summary

Live mempool statistics via Bitcoin Core RPC.

**Response — 200 OK**

```json
{
  "size": 3,
  "bytes": 1254,
  "usage": 8192,
  "mempoolminfee": 0.00001000,
  "minrelaytxfee": 0.00001000,
  "rpc_ok": true
}
```

Returns `503` if Bitcoin Core RPC is unreachable.

---

### GET /intelligence/summary

Higher-level intelligence derived from the log snapshot: fee rate distribution, script type breakdown, coinbase ratio, and OP_RETURN count.

**Query parameters:** `log_dir`, `file` (see [Log Source Parameters](#log-source-parameters))

---

### GET /events/recent

Paginated raw events from the log snapshot, reverse-chronological.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `10` | Items to return (1–100) |
| `offset` | integer | `0` | Items to skip |
| `event_type` | string | — | Filter: `zmq_rawtx`, `zmq_rawblock` |

**Response — 200 OK**

```json
{
  "items": [
    {
      "ts": "2026-05-07T14:52:00Z",
      "event": "zmq_rawtx",
      "data": { "txid": "abc123...", "vsize": 141, "inputs": 1, "outputs": 2 }
    }
  ],
  "limit": 10,
  "offset": 0,
  "total_items": 97,
  "event_type": "zmq_rawtx"
}
```

---

### GET /events/classifications

Paginated classified events, reverse-chronological.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `10` | Items to return (1–100) |
| `offset` | integer | `0` | Items to skip |
| `kind` | string | — | Filter by classification kind |

**Classification kinds**

| Kind | Description |
|---|---|
| `coinbase_like` | Transaction with a coinbase input (block reward) |
| `simple_payment_like` | Standard payment with identifiable addresses |
| `block_event` | Block notification from ZMQ rawblock topic |
| `unknown` | Does not match any classification heuristic |

---

### GET /events/stream

Server-Sent Events stream. Tails the NDJSON log and pushes new events as they arrive. Heartbeat ping every 15 seconds when idle.

**Content-Type:** `text/event-stream`

| SSE event | When | Payload |
|---|---|---|
| `stream_open` | On connection | Project metadata, tracked event types |
| `nodescope_event` | Each new ZMQ event | Raw event + classification + latest tx/block |
| `ping` | Every 15 s idle | Project name, current log path |

Connect via Vite proxy (`http://localhost:5173/events/stream`) to avoid CORS issues in development.

---

### GET /events/tape

Recent ZMQ events in compact format, enriched at capture time by `monitor.py`.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `50` | Items to return (1–200) |
| `topic` | string | — | Filter: `rawtx` or `rawblock` |
| `log_dir` | string | — | Override log directory path |

**Response — 200 OK**

```json
{
  "items": [
    {
      "ts": "2026-05-07T14:52:00Z",
      "topic": "rawtx",
      "txid": "abc123...",
      "vsize": 141,
      "script_types": ["witness_v0_keyhash"],
      "has_op_return": false
    }
  ],
  "total": 97
}
```

---

### GET /events/tape/{txid}

Same as `/events/tape` but filtered to a single TXID.

---

### GET /blocks/latest

Most recent block event from the log snapshot. Returns `null` if no block has been seen yet.

**Response — 200 OK**

```json
{
  "ts": "2026-05-07T14:52:01Z",
  "height": 214,
  "hash": "0000000abc...",
  "kind": "block_event"
}
```

---

### GET /tx/latest

Most recent transaction event from the log snapshot. Returns `null` if no transaction has been seen yet.

**Response — 200 OK**

```json
{
  "ts": "2026-05-07T14:52:00Z",
  "txid": "abc123...",
  "inputs": 1,
  "outputs": 2,
  "total_out": 49.99998,
  "vsize": 141,
  "script_types": ["witness_v0_keyhash", "witness_v0_keyhash"],
  "has_op_return": false,
  "kind": "simple_payment_like",
  "vout": [
    { "value": 1.0, "address": "bcrt1q..." },
    { "value": 48.99998, "address": "bcrt1q..." }
  ]
}
```

---

### GET /tx/{txid}

Searches the log snapshot for a transaction by TXID. Returns `404` if not found.

---

## Transaction Inspector

### GET /tx/inspect/{txid}

Premium transaction analysis via direct Bitcoin Core RPC (`getrawtransaction` + `decoderawtransaction`).

**Path parameter:** `txid` — hex transaction ID

**Response — 200 OK**

```json
{
  "txid": "abc123...",
  "wtxid": "def456...",
  "size": 192,
  "vsize": 141,
  "weight": 561,
  "fee_btc": 0.00001410,
  "fee_rate_sat_vb": 10.0,
  "input_count": 1,
  "output_count": 2,
  "script_types": ["witness_v0_keyhash", "witness_v0_keyhash"],
  "confirmations": 1,
  "blockhash": "0000000abc...",
  "blockheight": 214,
  "rpc_status": "success",
  "zmq_events_seen": 1
}
```

Returns `404` if the TXID is not found in the mempool or chain.

---

## Guided Demo

### GET /demo/status

Returns the current status of the Guided Demo engine.

**Response — 200 OK**

```json
{
  "running": false,
  "current_step": null,
  "steps_completed": 14,
  "steps_total": 14,
  "proof": { "success": true, "txid": "abc123...", ... }
}
```

---

### POST /demo/run — [protected]

Runs all 14 demo steps sequentially. Blocks until completion.

**Response — 200 OK:** Same schema as `GET /demo/status`.

---

### POST /demo/step/{step_id} — [protected]

Runs a single demo step by ID. Step IDs: `rpc_check`, `zmq_check`, `wallet_create`, `address_mine`, `mine_blocks`, `address_dest`, `send_tx`, `mempool_detect`, `zmq_rawtx_detect`, `decode_tx`, `mine_confirm`, `zmq_rawblock_detect`, `confirm_tx`, `proof_report`.

**Response — 200 OK**

```json
{
  "step_id": "send_tx",
  "status": "success",
  "message": "Transaction broadcast",
  "technical_output": "sendtoaddress → txid: abc123...",
  "data": { "txid": "abc123..." }
}
```

Returns `400` if the step fails with a non-recoverable error.

---

### POST /demo/reset — [protected]

Resets demo state. Clears current step, proof, and step history.

**Response — 200 OK:** Same schema as `GET /demo/status`.

---

### GET /demo/proof

Returns the Proof Report from the most recent full demo run.

**Response — 200 OK**

```json
{
  "proof": {
    "success": true,
    "network": "regtest",
    "bitcoin_core_version": 260000,
    "txid": "abc123...",
    "wtxid": "def456...",
    "fee_btc": 0.00001410,
    "fee_rate_sat_vb": 10.0,
    "block_hash": "0000000abc...",
    "block_height": 214,
    "confirmations": 1,
    "zmq_rawtx_seen": true,
    "zmq_rawblock_seen": true,
    "steps": [ ... ],
    "generated_at": "2026-05-07T14:52:01Z"
  }
}
```

`proof` is `null` if no demo has been run yet.

---

## Mempool Policy Arena

### GET /policy/scenarios

Lists the four available scenarios.

**Response — 200 OK**

```json
{
  "scenarios": [
    { "id": "normal_transaction", "name": "Normal Transaction", "status": "idle" },
    { "id": "low_fee_transaction", "name": "Low Fee Transaction", "status": "idle" },
    { "id": "rbf_replacement", "name": "RBF Replacement (BIP125)", "status": "idle" },
    { "id": "cpfp_package", "name": "CPFP Package", "status": "idle" }
  ]
}
```

---

### POST /policy/run/{scenario_id} — [protected]

Runs a scenario to completion. Valid IDs: `normal_transaction`, `low_fee_transaction`, `rbf_replacement`, `cpfp_package`.

Returns `404` for unknown scenario IDs.

**Response — 200 OK**

```json
{
  "id": "rbf_replacement",
  "status": "success",
  "steps": [ ... ],
  "proof": {
    "success": true,
    "original_txid": "abc123...",
    "replacement_txid": "def456...",
    "original_fee_rate_sat_vb": 2.0,
    "replacement_fee_rate_sat_vb": 10.0
  }
}
```

---

### GET /policy/status/{scenario_id}

Returns the current status of a specific scenario without running it.

---

### POST /policy/reset/{scenario_id} — [protected]

Resets a single scenario to idle state.

---

### POST /policy/reset — [protected]

Resets all four scenarios to idle state.

**Response — 200 OK:** Same schema as `GET /policy/scenarios`.

---

### GET /policy/proof/{scenario_id}

Returns the Proof Report for the most recent run of a specific scenario.

**Response — 200 OK**

```json
{
  "scenario_id": "cpfp_package",
  "proof": {
    "success": true,
    "parent_txid": "abc123...",
    "child_txid": "def456...",
    "parent_fee_sat": 141,
    "child_fee_sat": 1000,
    "package_fee_rate_sat_vb": 8.2
  }
}
```

`proof` is `null` if the scenario has not been run.

---

## Reorg Lab

### GET /reorg/status

Returns the current status of the Reorg Lab engine.

**Response — 200 OK**

```json
{
  "running": false,
  "status": "idle",
  "steps_completed": 0,
  "proof": null
}
```

---

### POST /reorg/run — [protected]

Runs the full 10-step reorg sequence. Only available in regtest — returns `unavailable` on other networks.

**Response — 200 OK**

```json
{
  "status": "success",
  "steps_completed": 10,
  "proof": {
    "success": true,
    "txid": "abc123...",
    "invalidated_block": "0000000abc...",
    "recovery_block": "0000000def...",
    "mempool_return_confirmed": true,
    "reconfirmation_confirmed": true
  }
}
```

---

### POST /reorg/reset — [protected]

Resets Reorg Lab state.

---

### GET /reorg/proof

Returns the Proof Report from the most recent reorg run. `proof` is `null` if no run has occurred.

---

## Cluster Mempool

### GET /mempool/cluster/compatibility

Probes whether the connected Bitcoin Core node supports cluster mempool RPCs.

**Response — 200 OK**

```json
{
  "getmempoolcluster": "unavailable",
  "getmempoolfeeratediagram": "unavailable",
  "note": "Cluster mempool RPCs require Bitcoin Core 28+. This node runs 26.x."
}
```

| Field value | Meaning |
|---|---|
| `"available"` | RPC is supported and returned data |
| `"unavailable"` | RPC is not supported by this Bitcoin Core version |

---

## Live Simulation

### GET /simulation/status

Returns the current state of the auto-mining simulation engine.

**Response — 200 OK**

```json
{
  "running": true,
  "block_interval": 30,
  "tx_interval": 10,
  "blocks_mined": 42,
  "txs_sent": 87,
  "errors": 0
}
```

---

### POST /simulation/start — [protected]

Starts the simulation engine (auto-mines blocks and sends transactions at configured intervals).

**Response — 200 OK:** Same schema as `GET /simulation/status`.

---

### POST /simulation/stop — [protected]

Stops the simulation engine.

---

### PUT /simulation/config — [protected]

Updates simulation intervals without restarting the engine.

**Request body**

```json
{
  "block_interval": 30,
  "tx_interval": 10
}
```

| Field | Type | Description |
|---|---|---|
| `block_interval` | integer | Seconds between auto-mined blocks |
| `tx_interval` | integer | Seconds between auto-sent transactions |

**Response — 200 OK:** Same schema as `GET /simulation/status`.

---

## Session

### POST /session/reset — [protected]

Truncates today's NDJSON log file and resets simulation counters. Does not affect SQLite history.

**Response — 200 OK**

```json
{
  "ok": true,
  "truncated": true,
  "file": "/app/logs/2026-05-07-monitor.ndjson"
}
```

---

## History

All history endpoints are read-only and never require an API key.

### GET /history/summary

Returns storage health and row counts per table.

**Response — 200 OK**

```json
{
  "storage_up": true,
  "storage_backend": "sqlite",
  "proof_reports": 12,
  "demo_runs": 3,
  "policy_runs": 8,
  "reorg_runs": 1
}
```

| `storage_backend` | Meaning |
|---|---|
| `"sqlite"` | SQLite backend active (`.nodescope/history.db`) |
| `"memory"` | SQLite initialisation failed; using in-memory fallback |

---

### GET /history/proofs

Paginated list of proof reports.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `20` | Items to return (1–100) |
| `offset` | integer | `0` | Items to skip |
| `source` | string | — | Filter by scenario name |
| `success` | boolean | — | Filter by success flag |

**Response — 200 OK**

```json
{
  "items": [
    {
      "id": 1,
      "source": "guided_demo",
      "success": true,
      "txid": "abc123...",
      "block_height": 214,
      "created_at": "2026-05-07T14:52:01Z",
      "proof_json": { ... }
    }
  ],
  "total_returned": 1,
  "limit": 20,
  "offset": 0
}
```

---

### GET /history/proofs/{report_id}

Returns a single proof report by integer ID. Returns `404` if not found.

---

### GET /history/demo-runs

Paginated demo run history.

**Query parameters:** `limit` (default 20, max 100), `offset`

**Response — 200 OK**

```json
{
  "items": [
    {
      "id": 1,
      "status": "success",
      "steps_completed": 14,
      "duration_seconds": 8.3,
      "proof_report_id": 1,
      "created_at": "2026-05-07T14:52:01Z"
    }
  ],
  "total_returned": 1,
  "limit": 20,
  "offset": 0
}
```

---

### GET /history/policy-runs

Paginated policy run history.

**Query parameters:** `limit` (default 20, max 100), `offset`, `scenario` (filter by scenario ID)

**Response — 200 OK**

```json
{
  "items": [
    {
      "id": 1,
      "scenario_id": "rbf_replacement",
      "status": "success",
      "duration_seconds": 4.1,
      "proof_report_id": 2,
      "created_at": "2026-05-07T15:01:00Z"
    }
  ],
  "total_returned": 1,
  "limit": 20,
  "offset": 0
}
```

---

### GET /history/reorg-runs

Paginated reorg run history.

**Query parameters:** `limit` (default 20, max 100), `offset`

---

### GET /history/export.json

Full history export as a downloadable JSON file. Includes all proof reports, demo runs, policy runs, and reorg runs with metadata.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `source` | string | — | Filter by source (`demo`, `policy`, etc.) |
| `success` | boolean | — | Filter by outcome (`true` or `false`) |
| `since` | string | — | ISO date lower bound (`created_at >= since`) |
| `until` | string | — | ISO date upper bound (`created_at <= until`) |
| `limit` | integer | 1000 | Max rows per table (max 10000) |

**Response — 200 OK:** `application/json` with `Content-Disposition: attachment; filename="nodescope-history.json"`

---

### GET /history/export.csv

Full history export as a downloadable CSV file. All tables (proof_report, demo_run, policy_run, reorg_run) are flattened into a single CSV with a `table` column.

Accepts the same query parameters as `/history/export.json`.

**Response — 200 OK:** `text/csv` with `Content-Disposition: attachment; filename="nodescope-history.csv"`

---

## Fee Estimation

### GET /fees/estimate

Calls Bitcoin Core's `estimatesmartfee` for 4 confirmation targets (1, 3, 6, 12 blocks).

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `CONSERVATIVE` | `CONSERVATIVE` or `ECONOMICAL` |

**Response — 200 OK**

```json
{
  "estimates": [
    {
      "target_blocks": 1,
      "fee_rate_btc_kvb": null,
      "fee_rate_sat_vb": null,
      "status": "unavailable",
      "note": "insufficient data — regtest has no fee history"
    },
    {
      "target_blocks": 6,
      "fee_rate_btc_kvb": 0.00010000,
      "fee_rate_sat_vb": 10.0,
      "status": "success"
    }
  ],
  "mode": "CONSERVATIVE",
  "rpc_ok": true
}
```

| `status` | Meaning |
|---|---|
| `"success"` | `estimatesmartfee` returned a fee rate |
| `"limited"` | Returned a rate but with a warning (insufficient history) |
| `"unavailable"` | No data available for this target |

In regtest there is no real fee market. `unavailable` or `limited` results are expected and documented honestly — no values are invented.

---

### GET /fees/compare

Same as `/fees/estimate` but also includes fee rates from the most recent Guided Demo and Policy Arena runs for side-by-side comparison.

**Query parameters:** `mode` (same as `/fees/estimate`)

**Response — 200 OK:** Same schema as `/fees/estimate`, with an additional `scenario_rates` field:

```json
{
  "estimates": [ ... ],
  "scenario_rates": {
    "guided_demo": 10.0,
    "normal_transaction": 10.0,
    "low_fee_transaction": 1.0,
    "rbf_replacement_original": 2.0,
    "rbf_replacement_bumped": 10.0
  },
  "mode": "CONSERVATIVE",
  "rpc_ok": true
}
```

---

## Prometheus Metrics

### GET /metrics

Returns Prometheus-compatible metrics text when `prometheus-client` is installed.

```bash
curl http://127.0.0.1:8000/metrics
```

If `prometheus-client` is not installed, returns a plain-text `unavailable` notice. Not included in Swagger UI (`include_in_schema=false`).

Key metrics exposed:

| Metric | Type | Description |
|---|---|---|
| `nodescope_http_requests_total` | Counter | HTTP requests by method/endpoint/status |
| `nodescope_http_request_duration_seconds` | Histogram | Request latency |
| `nodescope_http_errors_total` | Counter | 4xx/5xx responses |
| `nodescope_rpc_up` | Gauge | 1 if Bitcoin Core RPC is reachable |
| `nodescope_rpc_requests_total` | Counter | RPC calls to Bitcoin Core |
| `nodescope_rpc_latency_seconds` | Histogram | RPC call latency |
| `nodescope_zmq_rawtx_events_total` | Counter | rawtx ZMQ events captured |
| `nodescope_zmq_rawblock_events_total` | Counter | rawblock ZMQ events captured |
| `nodescope_mempool_tx_count` | Gauge | Transactions in the mempool |
| `nodescope_chain_height` | Gauge | Current best chain height |
| `nodescope_demo_runs_total` | Counter | Guided Demo full runs |
| `nodescope_policy_scenarios_total` | Counter | Policy Arena runs by scenario |
| `nodescope_reorg_runs_total` | Counter | Reorg Lab runs |
| `nodescope_proof_reports_total` | Counter | Proof reports generated |
| `nodescope_simulation_blocks_total` | Counter | Auto-mined blocks |
| `nodescope_simulation_txs_total` | Counter | Auto-sent transactions |
| `nodescope_history_proof_reports_total` | Gauge | Persisted proof reports |
| `nodescope_history_demo_runs_total` | Gauge | Persisted demo run records |
| `nodescope_history_policy_runs_total` | Gauge | Persisted policy run records |
| `nodescope_history_reorg_runs_total` | Gauge | Persisted reorg run records |
| `nodescope_storage_up` | Gauge | 1 if the storage backend is healthy |
| `nodescope_storage_backend_info` | Info | Active backend label (`sqlite` or `memory`) |
| `nodescope_fee_estimation_runs_total` | Counter | Fee estimation requests |
| `nodescope_fee_estimation_failures_total` | Counter | Requests where no fee rate was returned |

---

## Log Source Parameters

Several read-only endpoints accept optional query parameters to override the default log source:

| Parameter | Type | Description |
|---|---|---|
| `log_dir` | string | Absolute path to a directory containing `.ndjson` files |
| `file` | string | Absolute path to a specific `.ndjson` file |

If neither is provided, the API uses the most recently modified file in the default `logs/` directory. These parameters are primarily used in tests and operational tooling.

Endpoints that support them: `/health`, `/summary`, `/events/recent`, `/events/classifications`, `/events/stream`, `/blocks/latest`, `/tx/latest`, `/tx/{txid}`, `/intelligence/summary`, `/events/tape`.

---

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Bad request — demo step returned a non-recoverable error |
| `401` | Invalid or missing API key (only when `NODESCOPE_REQUIRE_API_KEY=true`) |
| `404` | Resource not found (unknown scenario ID, TXID not in store, proof report ID) |
| `429` | Rate limit exceeded — response includes `Retry-After` |
| `422` | Unprocessable Entity — query parameter validation failed |
| `503` | Bitcoin Core RPC offline, or API key protection misconfigured |

FastAPI validation errors follow the standard format:

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["query", "limit"],
      "msg": "Input should be greater than or equal to 1",
      "input": "0"
    }
  ]
}
```

---

## Endpoint Index

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | open | API status and RPC reachability |
| GET | `/summary` | open | Aggregate event statistics |
| GET | `/network/mode` | open | Current Bitcoin network and read-only state |
| GET | `/mempool/summary` | open | Live mempool stats via RPC |
| GET | `/mempool/clusters` | open | Cluster mempool visualization data and fallback groups |
| GET | `/intelligence/summary` | open | Higher-level chain intelligence |
| GET | `/charts/mempool` | open | Mempool size historical chart points |
| GET | `/charts/fees` | open | Minimum mempool fee historical chart points |
| GET | `/alerts/config` | open | Alert rule configuration |
| POST | `/alerts/config` | protected | Create alert rule |
| PUT | `/alerts/config/{id}` | protected | Update alert rule |
| DELETE | `/alerts/config/{id}` | protected | Delete alert rule |
| GET | `/alerts/active` | open | Active operational alerts |
| GET | `/events/recent` | open | Paginated raw events |
| GET | `/events/classifications` | open | Paginated classified events |
| GET | `/events/stream` | open | Server-Sent Events stream |
| GET | `/events/tape` | open | ZMQ event tape (compact) |
| GET | `/events/tape/{txid}` | open | ZMQ tape filtered by TXID |
| GET | `/blocks/latest` | open | Most recent block event |
| GET | `/tx/latest` | open | Most recent transaction event |
| GET | `/tx/{txid}` | open | Transaction by TXID (log store) |
| GET | `/tx/inspect/{txid}` | open | Transaction Inspector (RPC) |
| GET | `/demo/status` | open | Guided Demo status |
| POST | `/demo/run` | protected | Run full 14-step demo |
| POST | `/demo/step/{step_id}` | protected | Run single demo step |
| POST | `/demo/reset` | protected | Reset demo state |
| GET | `/demo/proof` | open | Guided Demo Proof Report |
| GET | `/policy/scenarios` | open | List Policy Arena scenarios |
| POST | `/policy/run/{scenario_id}` | protected | Run a policy scenario |
| GET | `/policy/status/{scenario_id}` | open | Scenario status |
| POST | `/policy/reset/{scenario_id}` | protected | Reset a single scenario |
| POST | `/policy/reset` | protected | Reset all scenarios |
| GET | `/policy/proof/{scenario_id}` | open | Scenario Proof Report |
| GET | `/reorg/status` | open | Reorg Lab status |
| POST | `/reorg/run` | protected | Run reorg sequence |
| POST | `/reorg/reset` | protected | Reset Reorg Lab |
| GET | `/reorg/proof` | open | Reorg Proof Report |
| GET | `/mempool/cluster/compatibility` | open | Cluster mempool RPC probe |
| GET | `/simulation/status` | open | Simulation engine status |
| POST | `/simulation/start` | protected | Start auto-mining |
| POST | `/simulation/stop` | protected | Stop auto-mining |
| PUT | `/simulation/config` | protected | Update simulation intervals |
| POST | `/session/reset` | protected | Truncate log + reset stats |
| GET | `/history/summary` | open | Storage health and counts |
| GET | `/history/proofs` | open | Paginated proof reports |
| GET | `/history/proofs/{report_id}` | open | Single proof report |
| GET | `/history/demo-runs` | open | Demo run history |
| GET | `/history/policy-runs` | open | Policy run history |
| GET | `/history/reorg-runs` | open | Reorg run history |
| GET | `/fees/estimate` | open | Fee estimates (estimatesmartfee) |
| GET | `/fees/compare` | open | Fee estimates + scenario comparison |
| GET | `/metrics` | open | Prometheus metrics |
