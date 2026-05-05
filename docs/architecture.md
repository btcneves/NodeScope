# NodeScope — Architecture

NodeScope is a Bitcoin Core observability tool that captures live network events via ZMQ, processes them through an offline replay engine, and exposes structured data through a read-only REST API and a React dashboard.

---

## System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        Bitcoin Core (regtest)                      │
│                                                                    │
│  RPC :18443          ZMQ rawblock :28332    ZMQ rawtx :28333       │
└──────┬───────────────────────┬──────────────────┬──────────────────┘
       │                       │                  │
       │                       └────────┬─────────┘
       │                                │
       │                        ┌───────▼────────┐
       │                        │   monitor.py   │
       │                        │  ZMQ subscriber│
       │                        └───────┬────────┘
       │                                │ NDJSON append
       │                                ▼
       │                        ┌───────────────┐
       │                        │  logs/         │
       │                        │  YYYY-MM-DD-   │
       │                        │  monitor.ndjson│
       │                        └───────┬───────┘
       │                                │ replay / tail
       │                                ▼
       │                        ┌───────────────┐
       │                        │   engine/      │
       │                        │  reader        │
       │                        │  parser        │
       │                        │  classify      │
       │                        │  snapshot      │
       │                        │  analytics     │
       │                        └───────┬───────┘
       │                                │ snapshot
       └────────────────────────────────▼
                               ┌─────────────────┐
                               │   FastAPI :8000  │
                               │  /health         │
                               │  /summary        │
                               │  /events/*       │
                               │  /blocks/latest  │
                               │  /tx/latest      │
                               │  /events/stream  │
                               └────────┬─────────┘
                                        │ HTTP + SSE
                                        ▼
                               ┌─────────────────┐
                               │  React/Vite      │
                               │  frontend :5173  │
                               │  (Vite proxy)    │
                               └─────────────────┘
```

---

## Port Map

| Service              | Protocol | Port  | Notes                          |
|----------------------|----------|-------|--------------------------------|
| Bitcoin Core RPC     | HTTP     | 18443 | regtest default                |
| ZMQ rawblock         | TCP      | 28332 | `zmqpubrawblock`               |
| ZMQ rawtx            | TCP      | 28333 | `zmqpubrawtx`                  |
| NodeScope API        | HTTP     | 8000  | FastAPI, read-only             |
| NodeScope Dashboard  | HTTP     | 5173  | React/Vite dev server          |

---

## Components

### `monitor.py` — ZMQ Capture

Subscribes to both ZMQ topics (`rawblock`, `rawtx`) simultaneously. For each message it decodes the raw bytes, calls `bitcoin-cli` via RPC to enrich the payload (full transaction decode, script type analysis), and writes a structured NDJSON line to `logs/YYYY-MM-DD-monitor.ndjson`.

Each log line is a self-contained JSON object with the following envelope:

```json
{
  "ts":     "<ISO 8601 UTC timestamp>",
  "level":  "INFO",
  "origin": "monitor",
  "event":  "zmq_rawtx | zmq_rawblock | monitor_start | monitor_stop | error",
  "data":   { ... }
}
```

For `zmq_rawtx` events the `data` object carries: `txid`, `inputs`, `outputs`, `total_out`, `coinbase_input_present`, `addressed_output_count`, `unattributed_output_count`, `zero_value_output_count`, `positive_output_count`, `script_types`, `has_op_return`, and the full `vout` list.

For `zmq_rawblock` events the `data` object carries: `hash`, `height`, and `tx_count`.

### `engine/` — Offline Replay Engine

The engine processes NDJSON log files without any live dependency on Bitcoin Core. It is designed around a **replay-first** model: the same pipeline that runs at API request time can be replayed offline against any captured log.

| Module          | Responsibility                                                           |
|-----------------|--------------------------------------------------------------------------|
| `reader.py`     | Reads NDJSON lines, validates schema, discards malformed lines, tracks stats |
| `parser.py`     | Converts raw event dicts into typed `TxEvent` / `BlockEvent` models     |
| `classify.py`   | Assigns a `kind` label, `signals`, `reason`, `confidence` to each event |
| `snapshot.py`   | Runs the full pipeline and returns an `EngineSnapshot`                   |
| `analytics.py`  | Aggregates counts and derived metrics from the snapshot                  |
| `models.py`     | Pydantic-style dataclasses: `RawEvent`, `TxEvent`, `BlockEvent`, `ClassifiedEvent`, `ReaderStats` |

The `EngineSnapshot` is the single object consumed by the API layer. It contains: all valid `RawEvent`s, all `ClassifiedEvent`s, latest block and transaction, analytics aggregate, and reader stats.

**Classification kinds:**

| Kind                 | Description                                    |
|----------------------|------------------------------------------------|
| `coinbase_like`      | Transaction with a coinbase input              |
| `simple_payment_like`| Standard payment transaction                   |
| `block_event`        | Block notification                             |
| `unknown`            | Does not match any heuristic                   |

### `api/` — FastAPI Layer

A thin read-only adapter over the engine snapshot. No write operations, no authentication, no persistent state beyond the NDJSON log files.

| Module        | Responsibility                                                         |
|---------------|------------------------------------------------------------------------|
| `app.py`      | FastAPI route definitions, query parameter parsing, SSE endpoint       |
| `service.py`  | Snapshot loading, serialization helpers, SSE generator                 |
| `schemas.py`  | Pydantic response models for all endpoints                             |
| `demo.py`     | Serves the legacy static HTML demo                                     |

The SSE endpoint (`/events/stream`) tails the latest NDJSON log file in real time using a poll-and-seek loop. It emits three SSE event types: `stream_open`, `nodescope_event`, and `ping`.

### `frontend/` — React/Vite Dashboard

A React 18 + TypeScript application bundled by Vite. During development, the Vite dev server proxies all API paths (`/health`, `/summary`, `/mempool`, `/events`, `/blocks`, `/tx`) to the FastAPI backend at `http://127.0.0.1:8000`, avoiding CORS issues.

---

## Data Flow

```
1. Bitcoin Core mines a block or receives a transaction
2. ZMQ publishes the raw bytes on port 28332 (block) or 28333 (tx)
3. monitor.py receives the message, enriches it via RPC, writes NDJSON
4. On each API request:
   a. engine/reader.py opens the latest NDJSON file, reads all valid lines
   b. engine/parser.py converts each line to a typed model
   c. engine/classify.py assigns kind/signals/confidence
   d. engine/snapshot.py assembles the EngineSnapshot
   e. engine/analytics.py computes aggregate counts
   f. api/service.py serializes and paginates the result
5. For SSE (/events/stream):
   a. The generator tails the NDJSON file from the current end
   b. New lines are parsed, classified, and emitted as SSE events
   c. A heartbeat ping is sent every 15 seconds when idle
6. The React frontend polls REST endpoints and maintains an SSE connection
   for live updates
```

---

## Key Design Decisions

### Append-Only NDJSON Persistence

Each monitor run appends to a date-stamped file (`YYYY-MM-DD-monitor.ndjson`). This format is human-readable, trivially tail-able, requires no database, and makes replay deterministic. Files are never modified after the initial write.

### Replay-First Engine

The engine has no live dependency. It can process any captured log file offline. This makes testing straightforward (deterministic inputs, no mocks needed for ZMQ or Bitcoin Core) and decouples the analysis pipeline from the capture pipeline.

### Read-Only API

The API exposes no mutation endpoints. It is a read window over the captured log data. This keeps the security surface minimal and ensures the API cannot affect node state.

### SSE for Real-Time Updates

Server-Sent Events over a plain HTTP connection were chosen over WebSockets because the data flow is strictly unidirectional (server to client). SSE is simpler to implement, works through standard HTTP proxies, and requires no additional protocol handshake.

### Vite Proxy for Local Development

The frontend dev server proxies API requests to avoid CORS configuration in FastAPI. In production builds, a reverse proxy (nginx, Caddy) would handle the same routing.
