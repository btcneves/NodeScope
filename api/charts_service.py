from __future__ import annotations

import threading
from datetime import UTC, datetime, timedelta
from typing import Any

from . import storage
from .rpc import RPCError, get_client

_RANGES = {"1h": 3600, "6h": 21600, "24h": 86400}
_SNAPSHOT_INTERVAL = 60
_thread: threading.Thread | None = None
_stop = threading.Event()


def _now() -> datetime:
    return datetime.now(UTC)


def _since(range_str: str) -> str:
    seconds = _RANGES.get(range_str, _RANGES["1h"])
    return (_now() - timedelta(seconds=seconds)).isoformat()


def _take_snapshot() -> None:
    try:
        rpc = get_client()
        mempool = rpc.getmempoolinfo()
        blockchain = rpc.getblockchaininfo()
    except RPCError:
        return
    ts = _now().isoformat()
    storage.insert_time_series("mempool_size", float(mempool.get("size", 0)), ts=ts)
    storage.insert_time_series("mempool_bytes", float(mempool.get("bytes", 0)), ts=ts)
    storage.insert_time_series("minfee", float(mempool.get("mempoolminfee", 0.0)) * 100_000, ts=ts)
    storage.insert_time_series("chain_height", float(blockchain.get("blocks", 0)), ts=ts)


def _snapshot_loop() -> None:
    _take_snapshot()
    while not _stop.wait(_SNAPSHOT_INTERVAL):
        _take_snapshot()


def start_snapshot_loop() -> None:
    global _thread
    if _thread and _thread.is_alive():
        return
    _stop.clear()
    _thread = threading.Thread(target=_snapshot_loop, daemon=True, name="charts-snapshot-loop")
    _thread.start()


def get_mempool_chart(range_str: str) -> dict[str, Any]:
    selected = range_str if range_str in _RANGES else "1h"
    size_rows = storage.query_time_series("mempool_size", _since(selected))
    bytes_rows = storage.query_time_series("mempool_bytes", _since(selected))
    by_ts: dict[str, dict[str, Any]] = {}
    for row in size_rows:
        by_ts.setdefault(row["ts"], {"ts": row["ts"]})["mempool_size"] = row["value"]
    for row in bytes_rows:
        by_ts.setdefault(row["ts"], {"ts": row["ts"]})["mempool_bytes"] = row["value"]
    return {"range": selected, "points": [by_ts[ts] for ts in sorted(by_ts)]}


def get_fees_chart(range_str: str) -> dict[str, Any]:
    selected = range_str if range_str in _RANGES else "1h"
    rows = storage.query_time_series("minfee", _since(selected))
    return {
        "range": selected,
        "points": [{"ts": row["ts"], "minfee": row["value"]} for row in rows],
    }
