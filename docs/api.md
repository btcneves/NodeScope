# NodeScope API Reference

Base URL: `http://127.0.0.1:8000`

The NodeScope API is **read-only**. It serves data derived from NDJSON log files produced by `monitor.py`. All endpoints reload the log snapshot on each request — there is no shared in-memory state between requests.

Interactive documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

---

## Endpoints

### GET /health

Returns the operational status of the API and the number of events available in the current log snapshot.

**Query parameters:** none required

**Response — 200 OK**

```json
{
  "status": "ok",
  "project": "NodeScope",
  "api_mode": "read_only_local",
  "storage": "ndjson_append_only",
  "source": "logs/2026-04-23-monitor.ndjson",
  "events_available": 142,
  "ignored_lines": 0
}
```

| Field             | Type    | Description                                              |
|-------------------|---------|----------------------------------------------------------|
| `status`          | string  | Always `"ok"` when the API is running                    |
| `project`         | string  | Always `"NodeScope"`                                     |
| `api_mode`        | string  | Always `"read_only_local"`                               |
| `storage`         | string  | Always `"ndjson_append_only"`                            |
| `source`          | string  | Relative path of the log file being read                 |
| `events_available`| integer | Total valid events in the current snapshot               |
| `ignored_lines`   | integer | Lines skipped due to invalid JSON or missing fields      |

---

### GET /summary

Returns aggregate statistics for all events in the current log snapshot, including classification counts, script type distribution, and the latest block and transaction.

**Query parameters:** none required

**Response — 200 OK**

```json
{
  "project": "NodeScope",
  "source": "logs/2026-04-23-monitor.ndjson",
  "total_events": 142,
  "rawtx_count": 98,
  "rawblock_count": 44,
  "other_count": 0,
  "ignored_lines": 0,
  "skipped_events": 0,
  "event_type_counts": {
    "monitor_start": 1,
    "zmq_rawblock": 44,
    "zmq_rawtx": 97
  },
  "classification_counts": {
    "block_event": 44,
    "coinbase_like": 44,
    "simple_payment_like": 53,
    "unknown": 1
  },
  "coinbase_input_present_count": 44,
  "op_return_count": 2,
  "script_type_counts": {
    "pubkeyhash": 88,
    "scripthash": 12,
    "witness_v0_keyhash": 55
  },
  "available_event_types": ["monitor_start", "zmq_rawblock", "zmq_rawtx"],
  "available_classification_kinds": ["block_event", "coinbase_like", "simple_payment_like", "unknown"],
  "latest_block": {
    "ts": "2026-04-23T14:52:01.123456+00:00",
    "height": 214,
    "hash": "0000000abc...",
    "kind": "block_event"
  },
  "latest_tx": {
    "ts": "2026-04-23T14:52:00.987654+00:00",
    "txid": "abc123...",
    "inputs": 1,
    "outputs": 2,
    "total_out": 49.99998,
    "coinbase_input_present": false,
    "addressed_output_count": 2,
    "unattributed_output_count": 0,
    "zero_value_output_count": 0,
    "positive_output_count": 2,
    "script_types": ["witness_v0_keyhash", "witness_v0_keyhash"],
    "has_op_return": false,
    "kind": "simple_payment_like",
    "metadata": {},
    "vout": [
      { "value": 1.0, "address": "bcrt1q..." },
      { "value": 48.99998, "address": "bcrt1q..." }
    ]
  }
}
```

---

### GET /mempool/summary

Returns live mempool statistics fetched directly from Bitcoin Core via RPC. This endpoint reflects the current mempool state, not the captured log.

**Query parameters:** none required

**Response — 200 OK**

```json
{
  "size": 3,
  "bytes": 1254,
  "usage": 8192,
  "mempoolminfee": 0.00001000,
  "minrelaytxfee": 0.00001000
}
```

| Field            | Type    | Description                                              |
|------------------|---------|----------------------------------------------------------|
| `size`           | integer | Number of transactions currently in the mempool          |
| `bytes`          | integer | Total virtual size of all mempool transactions (bytes)   |
| `usage`          | integer | Total memory usage of the mempool (bytes)                |
| `mempoolminfee`  | float   | Minimum fee rate for transactions to be accepted (BTC/kB)|
| `minrelaytxfee`  | float   | Minimum relay fee rate (BTC/kB)                          |

**Notes:** Returns `503 Service Unavailable` if Bitcoin Core RPC is not reachable.

---

### GET /events/recent

Returns a paginated list of raw NDJSON events in reverse-chronological order (most recent first).

**Query parameters**

| Parameter    | Type    | Default | Constraints    | Description                                        |
|--------------|---------|---------|----------------|----------------------------------------------------|
| `limit`      | integer | `10`    | 1 – 100        | Number of events to return                         |
| `offset`     | integer | `0`     | >= 0           | Number of events to skip                           |
| `event_type` | string  | —       | optional       | Filter by event type (e.g. `zmq_rawtx`, `zmq_rawblock`) |

**Response — 200 OK**

```json
{
  "items": [
    {
      "ts": "2026-04-23T14:52:00.987654+00:00",
      "level": "INFO",
      "origin": "monitor",
      "event": "zmq_rawtx",
      "data": {
        "txid": "abc123...",
        "inputs": 1,
        "outputs": 2,
        "total_out": 49.99998,
        "coinbase_input_present": false,
        "script_types": ["witness_v0_keyhash", "witness_v0_keyhash"],
        "has_op_return": false
      }
    }
  ],
  "limit": 10,
  "offset": 0,
  "total_items": 97,
  "event_type": "zmq_rawtx"
}
```

**Notes:** Use `available_event_types` from `/summary` to discover valid `event_type` values.

---

### GET /events/classifications

Returns a paginated list of classified events in reverse-chronological order. Each item includes the classification `kind`, confidence signals, and the associated txid or block hash.

**Query parameters**

| Parameter | Type    | Default | Constraints | Description                                              |
|-----------|---------|---------|-------------|----------------------------------------------------------|
| `limit`   | integer | `10`    | 1 – 100     | Number of items to return                                |
| `offset`  | integer | `0`     | >= 0        | Number of items to skip                                  |
| `kind`    | string  | —       | optional    | Filter by classification kind (e.g. `coinbase_like`)     |

**Response — 200 OK**

```json
{
  "counts": {
    "simple_payment_like": 53
  },
  "total_counts": {
    "block_event": 44,
    "coinbase_like": 44,
    "simple_payment_like": 53,
    "unknown": 1
  },
  "items": [
    {
      "ts": "2026-04-23T14:52:00.987654+00:00",
      "event": "zmq_rawtx",
      "kind": "simple_payment_like",
      "metadata": {
        "signals": ["has_outputs", "no_coinbase"],
        "reason": "standard payment pattern",
        "confidence": "high",
        "has_zero_value_output": false,
        "has_null_address": false,
        "address_count": 2,
        "coinbase_input_present": false,
        "script_types": ["witness_v0_keyhash", "witness_v0_keyhash"],
        "has_op_return": false
      },
      "txid": "abc123..."
    }
  ],
  "limit": 10,
  "offset": 0,
  "total_items": 53,
  "kind": "simple_payment_like"
}
```

| Classification kind    | Description                                         |
|------------------------|-----------------------------------------------------|
| `coinbase_like`        | Transaction with a coinbase input (block reward)    |
| `simple_payment_like`  | Standard payment with identifiable addresses        |
| `block_event`          | Block notification from ZMQ rawblock topic          |
| `unknown`              | Does not match any classification heuristic         |

---

### GET /events/stream

Opens a persistent Server-Sent Events connection. The server tails the latest NDJSON log file and pushes new events as they are written by `monitor.py`. A heartbeat ping is sent every 15 seconds when no events arrive.

**Query parameters:** none required

**Content-Type:** `text/event-stream`

**SSE event types**

| Event name        | When emitted                        | Payload                                             |
|-------------------|-------------------------------------|-----------------------------------------------------|
| `stream_open`     | Immediately on connection           | Project metadata, tracked event types               |
| `nodescope_event` | Each new `zmq_rawtx` or `zmq_rawblock` line | Raw event + classification + latest tx/block      |
| `ping`            | Every 15 seconds when idle          | Project name, current log source path               |

**Example stream**

```
event: stream_open
data: {"project":"NodeScope","mode":"sse","storage":"ndjson_append_only","event_types":["zmq_rawblock","zmq_rawtx"]}

event: nodescope_event
data: {"project":"NodeScope","mode":"live_ndjson_tail","event":{...},"classification":{...},"latest_tx":{...}}

event: ping
data: {"project":"NodeScope","source":"logs/2026-04-23-monitor.ndjson"}
```

**Notes:**
- Connect via the Vite proxy (`http://localhost:5173/events/stream`) to avoid CORS issues during development.
- The stream only emits events for `zmq_rawtx` and `zmq_rawblock` event types by default.
- The stream starts from the current end of the file. Events captured before the connection opened are not replayed.

---

### GET /blocks/latest

Returns the most recent block event from the log snapshot.

**Query parameters:** none required

**Response — 200 OK**

```json
{
  "ts": "2026-04-23T14:52:01.123456+00:00",
  "height": 214,
  "hash": "0000000abc...",
  "kind": "block_event"
}
```

**Response — 200 OK (no block seen yet)**

```json
null
```

---

### GET /tx/latest

Returns the most recent transaction event from the log snapshot, with full output details.

**Query parameters:** none required

**Response — 200 OK**

```json
{
  "ts": "2026-04-23T14:52:00.987654+00:00",
  "txid": "abc123...",
  "inputs": 1,
  "outputs": 2,
  "total_out": 49.99998,
  "coinbase_input_present": false,
  "addressed_output_count": 2,
  "unattributed_output_count": 0,
  "zero_value_output_count": 0,
  "positive_output_count": 2,
  "script_types": ["witness_v0_keyhash", "witness_v0_keyhash"],
  "has_op_return": false,
  "kind": "simple_payment_like",
  "metadata": {},
  "vout": [
    { "value": 1.0, "address": "bcrt1q..." },
    { "value": 48.99998, "address": "bcrt1q..." }
  ]
}
```

**Response — 200 OK (no transaction seen yet)**

```json
null
```

---

### GET /tx/{txid}

Searches the event store for a transaction by its txid and returns full detail.

**Path parameter:** `txid` — hex transaction ID

**Response — 200 OK**

Same schema as `GET /tx/latest`.

**Response — 404 Not Found**

```json
{
  "detail": "Transaction <txid> not found in event store"
}
```

---

## Common Query Parameters (all endpoints)

All endpoints accept two optional parameters for pointing at a specific log source. These are primarily used in tests and operational tooling.

| Parameter | Type   | Description                                                  |
|-----------|--------|--------------------------------------------------------------|
| `log_dir` | string | Absolute path to a directory containing `.ndjson` files      |
| `file`    | string | Absolute path to a specific `.ndjson` file                   |

If neither is provided, the API uses the most recently modified file in the default `logs/` directory.

---

## Error Responses

| Status | Meaning                                                                   |
|--------|---------------------------------------------------------------------------|
| 422    | Unprocessable Entity — query parameter validation failed (e.g. `limit=0`) |
| 503    | Service Unavailable — RPC-backed endpoints when Bitcoin Core is offline   |

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
