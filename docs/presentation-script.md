# NodeScope Demo Talk Track

## Duration

3 to 5 minutes.

## Opening

Bitcoin Core exposes powerful operational data: chain state through RPC, real-time transaction and block events through ZMQ, and mempool state through RPC. Those sources are useful, but raw and separate.

NodeScope transforms Bitcoin Core raw data into real-time operational intelligence.

## Core Sentence

RPC gives the snapshot. ZMQ gives real time. NodeScope gives interpretation.

## Demo Flow

1. Show the dashboard header.

   Point to API, RPC and SSE status. Confirm the active network is regtest.

2. Show the Command Center.

   Point to Node Health Score, block height, mempool TX count, latest block, latest TX and event store size.

3. Generate regtest activity.

   ```bash
   make demo
   ```

   If using Docker:

   ```bash
   make docker-demo
   ```

4. Explain the transaction lifecycle.

   Created -> Broadcast -> Mempool -> ZMQ rawtx -> Block Mined -> Confirmed.

5. Show the Live Feed.

   Point to `rawtx` and `rawblock` events arriving from the NDJSON-backed SSE stream.

6. Show classifications.

   Explain that the engine adds kind, confidence and signals so the dashboard is not just showing raw data.

7. Show replayability.

   ```bash
   ./.venv/bin/python scripts/replay_monitor_log.py
   ```

   The event store can be reprocessed without Bitcoin Core being online.

## Closing

NodeScope is a read-only observability dashboard for Bitcoin Core. The current release focuses on a deterministic regtest demo. The next product step is signet observer mode: real public-network visibility without wallet custody, signing or key management.

## Short Answers

**Is this a wallet?**  
No. NodeScope is an observability dashboard. The regtest wallet is only used by the demo script to generate local activity.

**Does it need a database?**  
No for Phase 1. NDJSON keeps the event store simple, append-only and replayable.

**Can it evolve to public networks?**  
Yes, as read-only observer mode. Signet is the next planned network profile.
