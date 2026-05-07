"""Prometheus metrics for NodeScope — read-only observability endpoint."""

from __future__ import annotations

import time
from typing import Any

try:
    from prometheus_client import (
        CONTENT_TYPE_LATEST,
        Counter,
        Gauge,
        Histogram,
        generate_latest,
    )

    _PROMETHEUS_AVAILABLE = True
except ImportError:  # pragma: no cover
    _PROMETHEUS_AVAILABLE = False


# ---------------------------------------------------------------------------
# Metric definitions (no-op when prometheus_client is unavailable)
# ---------------------------------------------------------------------------

if _PROMETHEUS_AVAILABLE:
    # HTTP layer
    HTTP_REQUESTS_TOTAL = Counter(
        "nodescope_http_requests_total",
        "Total HTTP requests handled by the NodeScope API",
        ["method", "endpoint", "status"],
    )
    HTTP_REQUEST_DURATION = Histogram(
        "nodescope_http_request_duration_seconds",
        "HTTP request latency in seconds",
        ["method", "endpoint"],
        buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
    )
    HTTP_ERRORS_TOTAL = Counter(
        "nodescope_http_errors_total",
        "Total HTTP 4xx/5xx responses",
        ["method", "endpoint", "status"],
    )

    # Bitcoin Core RPC
    RPC_REQUESTS_TOTAL = Counter(
        "nodescope_rpc_requests_total",
        "Total RPC calls made to Bitcoin Core",
        ["method"],
    )
    RPC_ERRORS_TOTAL = Counter(
        "nodescope_rpc_errors_total",
        "Total RPC errors returned by Bitcoin Core",
        ["method"],
    )
    RPC_LATENCY = Histogram(
        "nodescope_rpc_latency_seconds",
        "Bitcoin Core RPC call latency in seconds",
        ["method"],
        buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
    )
    RPC_UP = Gauge(
        "nodescope_rpc_up",
        "1 if Bitcoin Core RPC is reachable, 0 otherwise",
    )

    # ZMQ events
    ZMQ_RAWTX_EVENTS_TOTAL = Counter(
        "nodescope_zmq_rawtx_events_total",
        "Total rawtx ZMQ events captured",
    )
    ZMQ_RAWBLOCK_EVENTS_TOTAL = Counter(
        "nodescope_zmq_rawblock_events_total",
        "Total rawblock ZMQ events captured",
    )
    ZMQ_LAST_EVENT_TIMESTAMP = Gauge(
        "nodescope_zmq_last_event_timestamp_seconds",
        "Unix timestamp of the last ZMQ event received",
    )

    # Mempool / chain state
    MEMPOOL_TX_COUNT = Gauge(
        "nodescope_mempool_tx_count",
        "Number of transactions currently in the mempool",
    )
    MEMPOOL_VSIZE_BYTES = Gauge(
        "nodescope_mempool_vsize_bytes",
        "Total vsize of transactions in the mempool (bytes)",
    )
    CHAIN_HEIGHT = Gauge(
        "nodescope_chain_height",
        "Current best chain height",
    )
    LATEST_BLOCK_TIMESTAMP = Gauge(
        "nodescope_latest_block_timestamp_seconds",
        "Unix timestamp of the latest known block",
    )

    # Demo / lab counters
    DEMO_RUNS_TOTAL = Counter(
        "nodescope_demo_runs_total",
        "Total Guided Demo full runs started",
    )
    DEMO_FAILURES_TOTAL = Counter(
        "nodescope_demo_failures_total",
        "Total Guided Demo steps that ended in error",
    )
    POLICY_SCENARIOS_TOTAL = Counter(
        "nodescope_policy_scenarios_total",
        "Total Mempool Policy Arena scenario runs",
        ["scenario"],
    )
    REORG_RUNS_TOTAL = Counter(
        "nodescope_reorg_runs_total",
        "Total Reorg Lab runs",
    )
    PROOF_REPORTS_TOTAL = Counter(
        "nodescope_proof_reports_total",
        "Total proof reports generated",
        ["source"],
    )

    # Live simulation
    SIMULATION_BLOCKS_TOTAL = Counter(
        "nodescope_simulation_blocks_total",
        "Total blocks auto-mined by the live simulation engine",
    )
    SIMULATION_TXS_TOTAL = Counter(
        "nodescope_simulation_txs_total",
        "Total transactions auto-sent by the live simulation engine",
    )


# ---------------------------------------------------------------------------
# Public helpers — called by app.py middleware and service functions
# ---------------------------------------------------------------------------


def record_http_request(method: str, endpoint: str, status: int, duration: float) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    labels = {"method": method, "endpoint": endpoint, "status": str(status)}
    HTTP_REQUESTS_TOTAL.labels(**labels).inc()
    HTTP_REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)
    if status >= 400:
        HTTP_ERRORS_TOTAL.labels(**labels).inc()


def record_rpc_call(method: str, *, error: bool = False, duration: float = 0.0) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    RPC_REQUESTS_TOTAL.labels(method=method).inc()
    RPC_LATENCY.labels(method=method).observe(duration)
    if error:
        RPC_ERRORS_TOTAL.labels(method=method).inc()


def set_rpc_up(up: bool) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    RPC_UP.set(1 if up else 0)


def record_zmq_event(topic: str) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    if topic == "rawtx":
        ZMQ_RAWTX_EVENTS_TOTAL.inc()
    elif topic == "rawblock":
        ZMQ_RAWBLOCK_EVENTS_TOTAL.inc()
    ZMQ_LAST_EVENT_TIMESTAMP.set(time.time())


def update_chain_metrics(mempool_info: dict[str, Any], blockchain_info: dict[str, Any]) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    MEMPOOL_TX_COUNT.set(mempool_info.get("size", 0))
    vsize = mempool_info.get("bytes", 0)
    if vsize:
        MEMPOOL_VSIZE_BYTES.set(vsize)
    CHAIN_HEIGHT.set(blockchain_info.get("blocks", 0))
    block_time = blockchain_info.get("time")
    if block_time:
        LATEST_BLOCK_TIMESTAMP.set(block_time)


def record_demo_run() -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    DEMO_RUNS_TOTAL.inc()


def record_demo_failure() -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    DEMO_FAILURES_TOTAL.inc()


def record_policy_scenario(scenario_id: str) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    POLICY_SCENARIOS_TOTAL.labels(scenario=scenario_id).inc()


def record_reorg_run() -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    REORG_RUNS_TOTAL.inc()


def record_proof_report(source: str) -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    PROOF_REPORTS_TOTAL.labels(source=source).inc()


def record_simulation_block() -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    SIMULATION_BLOCKS_TOTAL.inc()


def record_simulation_tx() -> None:
    if not _PROMETHEUS_AVAILABLE:
        return
    SIMULATION_TXS_TOTAL.inc()


# ---------------------------------------------------------------------------
# Metrics response
# ---------------------------------------------------------------------------


def get_metrics_response() -> tuple[bytes, str]:
    """Return (body_bytes, content_type) for the /metrics endpoint."""
    if not _PROMETHEUS_AVAILABLE:
        body = b"# prometheus_client not installed - metrics unavailable\n"
        return body, "text/plain; version=0.0.4; charset=utf-8"
    return generate_latest(), CONTENT_TYPE_LATEST


def is_available() -> bool:
    return _PROMETHEUS_AVAILABLE
