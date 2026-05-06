from __future__ import annotations

import json
import time
from collections import Counter
from pathlib import Path
from typing import Any

from engine.classify import classify
from engine.models import ClassifiedEvent, RawEvent
from engine.snapshot import EngineSnapshot, load_snapshot

from .rpc import RPCError, get_client

PathLike = str | Path

PROJECT_NAME = "NodeScope"
EngineState = EngineSnapshot
DEFAULT_STREAM_EVENT_TYPES = ("zmq_rawtx", "zmq_rawblock")


def load_engine_state(log_dir: PathLike | None = None, file: PathLike | None = None) -> EngineState:
    return load_snapshot(log_dir=log_dir, file=file)


def serialize_event(event: RawEvent) -> dict[str, Any]:
    return {
        "ts": event.ts,
        "level": event.level,
        "origin": event.origin,
        "event": event.event,
        "data": event.data,
    }


def _build_raw_event(obj: Any) -> RawEvent | None:
    if not isinstance(obj, dict):
        return None
    if any(field not in obj for field in ("ts", "level", "origin", "event", "data")):
        return None
    if not all(isinstance(obj[field], str) for field in ("ts", "level", "origin", "event")):
        return None
    if not isinstance(obj["data"], dict):
        return None
    return RawEvent(
        ts=obj["ts"],
        level=obj["level"],
        origin=obj["origin"],
        event=obj["event"],
        data=obj["data"],
    )


def _paginate[T](items: list[T], limit: int, offset: int) -> tuple[list[T], int, int, int]:
    effective_limit = max(1, limit)
    effective_offset = max(0, offset)
    total = len(items)
    return (
        items[effective_offset : effective_offset + effective_limit],
        total,
        effective_limit,
        effective_offset,
    )


def serialize_block(result: ClassifiedEvent | None) -> dict[str, Any] | None:
    if result is None or result.block is None:
        return None
    return {
        "ts": result.block.ts,
        "height": result.block.height,
        "hash": result.block.hash,
        "kind": result.kind,
    }


def serialize_classification(result: ClassifiedEvent) -> dict[str, Any]:
    item: dict[str, Any] = {
        "ts": result.raw.ts,
        "event": result.raw.event,
        "kind": result.kind,
        "metadata": result.metadata,
    }
    if result.tx is not None:
        item["txid"] = result.tx.txid
    if result.block is not None:
        item["height"] = result.block.height
        item["hash"] = result.block.hash
    return item


def serialize_tx(result: ClassifiedEvent | None) -> dict[str, Any] | None:
    if result is None or result.tx is None:
        return None
    return {
        "ts": result.tx.ts,
        "txid": result.tx.txid,
        "inputs": result.tx.inputs,
        "outputs": result.tx.outputs,
        "total_out": result.tx.total_out,
        "coinbase_input_present": result.tx.coinbase_input_present,
        "addressed_output_count": result.tx.addressed_output_count,
        "unattributed_output_count": result.tx.unattributed_output_count,
        "zero_value_output_count": result.tx.zero_value_output_count,
        "positive_output_count": result.tx.positive_output_count,
        "script_types": result.tx.script_types,
        "has_op_return": result.tx.has_op_return,
        "kind": result.kind,
        "metadata": result.metadata,
        "vout": [{"value": item.value, "address": item.address} for item in result.tx.vout],
    }


def build_health(log_dir: PathLike | None = None, file: PathLike | None = None) -> dict[str, Any]:
    state = load_engine_state(log_dir=log_dir, file=file)
    rpc_ok = False
    chain: str | None = None
    network: str | None = None
    blocks: int | None = None
    rpc_error: str | None = None
    try:
        info = get_client().getblockchaininfo()
        chain = info.get("chain")
        blocks = info.get("blocks")
        network = chain
        rpc_ok = True
    except RPCError as exc:
        rpc_error = str(exc)
    return {
        "status": "ok",
        "project": PROJECT_NAME,
        "api_mode": "read_only_local",
        "storage": "ndjson_append_only",
        "source": str(state.source),
        "events_available": len(state.events),
        "ignored_lines": state.reader_stats.ignored_lines,
        "rpc_ok": rpc_ok,
        "chain": chain,
        "network": network,
        "blocks": blocks,
        "rpc_error": rpc_error,
    }


def get_mempool_summary() -> dict[str, Any]:
    try:
        info = get_client().getmempoolinfo()
        return {
            "size": info.get("size", 0),
            "bytes": info.get("bytes", 0),
            "usage": info.get("usage", 0),
            "maxmempool": info.get("maxmempool", 0),
            "mempoolminfee": info.get("mempoolminfee", 0.0),
            "minrelaytxfee": info.get("minrelaytxfee", 0.0),
            "rpc_ok": True,
            "error": None,
        }
    except RPCError as exc:
        return {
            "size": 0,
            "bytes": 0,
            "usage": 0,
            "maxmempool": 0,
            "mempoolminfee": 0.0,
            "minrelaytxfee": 0.0,
            "rpc_ok": False,
            "error": str(exc),
        }


def build_summary(log_dir: PathLike | None = None, file: PathLike | None = None) -> dict[str, Any]:
    state = load_engine_state(log_dir=log_dir, file=file)
    return {
        "project": PROJECT_NAME,
        "source": str(state.source),
        "total_events": state.analytics.total_events,
        "rawtx_count": state.rawtx_count,
        "rawblock_count": state.rawblock_count,
        "other_count": state.other_count,
        "ignored_lines": state.reader_stats.ignored_lines,
        "skipped_events": state.skipped_events,
        "event_type_counts": state.analytics.event_type_counts,
        "classification_counts": state.analytics.classification_counts,
        "coinbase_input_present_count": state.analytics.coinbase_input_present_count,
        "op_return_count": state.analytics.op_return_count,
        "script_type_counts": state.analytics.script_type_counts,
        "available_event_types": sorted(state.analytics.event_type_counts.keys()),
        "available_classification_kinds": sorted(state.analytics.classification_counts.keys()),
        "latest_block": serialize_block(state.latest_block),
        "latest_tx": serialize_tx(state.latest_tx),
    }


def get_recent_events(
    limit: int = 10,
    offset: int = 0,
    event_type: str | None = None,
    log_dir: PathLike | None = None,
    file: PathLike | None = None,
) -> dict[str, Any]:
    state = load_engine_state(log_dir=log_dir, file=file)
    filtered_events = state.events
    if event_type is not None:
        filtered_events = [event for event in state.events if event.event == event_type]

    ordered_events = list(reversed(filtered_events))
    page_items, total, effective_limit, effective_offset = _paginate(
        ordered_events,
        limit=limit,
        offset=offset,
    )
    return {
        "items": [serialize_event(event) for event in page_items],
        "limit": effective_limit,
        "offset": effective_offset,
        "total_items": total,
        "event_type": event_type,
    }


def get_classifications(
    limit: int = 10,
    offset: int = 0,
    kind: str | None = None,
    log_dir: PathLike | None = None,
    file: PathLike | None = None,
) -> dict[str, Any]:
    state = load_engine_state(log_dir=log_dir, file=file)
    filtered_classifications = state.classifications
    if kind is not None:
        filtered_classifications = [
            result for result in state.classifications if result.kind == kind
        ]

    ordered_classifications = list(reversed(filtered_classifications))
    page_items, total, effective_limit, effective_offset = _paginate(
        ordered_classifications,
        limit=limit,
        offset=offset,
    )

    items = []
    for result in page_items:
        items.append(serialize_classification(result))
    filtered_counts = Counter(result.kind for result in filtered_classifications)
    return {
        "counts": dict(sorted(filtered_counts.items())),
        "total_counts": state.analytics.classification_counts,
        "items": items,
        "limit": effective_limit,
        "offset": effective_offset,
        "total_items": total,
        "kind": kind,
    }


def get_latest_block(
    log_dir: PathLike | None = None, file: PathLike | None = None
) -> dict[str, Any] | None:
    state = load_engine_state(log_dir=log_dir, file=file)
    return serialize_block(state.latest_block)


def get_latest_tx(
    log_dir: PathLike | None = None, file: PathLike | None = None
) -> dict[str, Any] | None:
    state = load_engine_state(log_dir=log_dir, file=file)
    return serialize_tx(state.latest_tx)


def _compute_mempool_pressure(size: int, nbytes: int, rpc_ok: bool) -> str:
    if not rpc_ok:
        return "unknown"
    if size > 100 or nbytes > 1_000_000:
        return "high"
    if size > 10 or nbytes > 100_000:
        return "medium"
    return "low"


def get_intelligence_summary(
    log_dir: PathLike | None = None, file: PathLike | None = None
) -> dict[str, Any]:
    state = load_engine_state(log_dir=log_dir, file=file)

    rpc_ok = False
    blocks: int | None = None
    mempool_size = 0
    mempool_bytes = 0
    mempool_rpc_ok = False
    try:
        info = get_client().getblockchaininfo()
        blocks = info.get("blocks")
        rpc_ok = True
        minfo = get_client().getmempoolinfo()
        mempool_size = minfo.get("size", 0)
        mempool_bytes = minfo.get("bytes", 0)
        mempool_rpc_ok = True
    except RPCError:
        pass

    zmq_active = state.rawtx_count + state.rawblock_count > 0
    zmq_points = 30 if zmq_active else 0
    rpc_points = 40 if rpc_ok else 0
    mempool_points = 20 if mempool_rpc_ok else 0

    block_points = 0
    if state.latest_block and state.latest_block.block and state.latest_block.block.ts:
        import datetime

        try:
            ts = datetime.datetime.fromisoformat(state.latest_block.block.ts.replace("Z", "+00:00"))
            age = (datetime.datetime.now(datetime.timezone.utc) - ts).total_seconds()
            if age < 60:
                block_points = 10
            elif age < 300:
                block_points = 5
        except (ValueError, TypeError):
            pass

    score = rpc_points + zmq_points + mempool_points + block_points
    label = "healthy" if score >= 80 else "degraded" if score >= 50 else "critical"

    latest_signal: str | None = None
    if state.events:
        latest_signal = state.events[-1].event

    return {
        "node_health_score": score,
        "node_health_label": label,
        "rpc_status": "online" if rpc_ok else "offline",
        "zmq_status": "subscribed" if zmq_active else "no_events",
        "sse_status": "streaming",
        "mempool_pressure": _compute_mempool_pressure(mempool_size, mempool_bytes, mempool_rpc_ok),
        "latest_signal": latest_signal,
        "event_store": {
            "replayable": True,
            "source": str(state.source),
            "total_events": state.analytics.total_events,
        },
        "classification_summary": state.analytics.classification_counts,
        "latest_block": serialize_block(state.latest_block),
        "latest_tx": serialize_tx(state.latest_tx),
    }


def get_tx_by_txid(
    txid: str, log_dir: PathLike | None = None, file: PathLike | None = None
) -> dict[str, Any] | None:
    state = load_engine_state(log_dir=log_dir, file=file)
    for result in state.classifications:
        if result.tx is not None and result.tx.txid == txid:
            return serialize_tx(result)
    return None


def serialize_stream_event(event: RawEvent) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "project": PROJECT_NAME,
        "mode": "live_ndjson_tail",
        "event": serialize_event(event),
    }
    result = classify(event)
    if result is not None:
        payload["classification"] = serialize_classification(result)
        if result.tx is not None:
            payload["latest_tx"] = serialize_tx(result)
        if result.block is not None:
            payload["latest_block"] = serialize_block(result)
    return payload


def _select_stream_file(
    log_dir: PathLike | None = None, file: PathLike | None = None
) -> Path | None:
    if file is not None:
        return Path(file)
    base_dir = (
        Path(log_dir) if log_dir is not None else Path(__file__).resolve().parent.parent / "logs"
    )
    files = sorted(base_dir.glob("*.ndjson"))
    return files[-1] if files else None


def _format_sse(event_name: str, payload: dict[str, Any]) -> str:
    return f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def iter_live_events_sse(
    log_dir: PathLike | None = None,
    file: PathLike | None = None,
    event_types: tuple[str, ...] = DEFAULT_STREAM_EVENT_TYPES,
    poll_interval: float = 0.25,
    heartbeat_interval: float = 15.0,
    max_events: int | None = None,
    start_at_end: bool = True,
    sleep_fn: Any = time.sleep,
):
    allowed_types = set(event_types)
    current_path: Path | None = None
    current_handle = None
    emitted_events = 0
    first_open = True
    last_ping = time.monotonic()

    try:
        yield _format_sse(
            "stream_open",
            {
                "project": PROJECT_NAME,
                "mode": "sse",
                "storage": "ndjson_append_only",
                "event_types": sorted(allowed_types),
            },
        )
        while max_events is None or emitted_events < max_events:
            selected_path = _select_stream_file(log_dir=log_dir, file=file)
            if selected_path != current_path:
                if current_handle is not None:
                    current_handle.close()
                current_path = selected_path
                if current_path is not None and current_path.exists():
                    current_handle = current_path.open(encoding="utf-8")
                    if start_at_end and first_open:
                        current_handle.seek(0, 2)
                    first_open = False
                else:
                    current_handle = None
            if current_handle is not None:
                line = current_handle.readline()
                if line:
                    try:
                        parsed = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    event = _build_raw_event(parsed)
                    if event is None or event.event not in allowed_types:
                        continue
                    emitted_events += 1
                    yield _format_sse("nodescope_event", serialize_stream_event(event))
                    last_ping = time.monotonic()
                    continue
            now = time.monotonic()
            if now - last_ping >= heartbeat_interval:
                yield _format_sse(
                    "ping",
                    {
                        "project": PROJECT_NAME,
                        "source": str(current_path) if current_path is not None else None,
                    },
                )
                last_ping = now
            sleep_fn(poll_interval)
    finally:
        if current_handle is not None:
            current_handle.close()
