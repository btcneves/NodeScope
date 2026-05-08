from __future__ import annotations

import csv
import datetime
import io
import json
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import (
    alerts_service,
    charts_service,
    fee_service,
    history_service,
    metrics,
    network_guard,
    simulation_service,
)
from .demo import STATIC_DIR, demo_page, root_redirect
from .demo_service import (
    get_status as demo_get_status,
)
from .demo_service import (
    reset_demo,
    run_step,
    start_full_demo,
)
from .policy_service import (
    get_scenario_proof,
    get_scenario_status,
    list_scenarios,
    reset_scenario,
    run_scenario,
)
from .policy_service import (
    reset_all as policy_reset_all,
)
from .rate_limiter import RateLimitMiddleware
from .reorg_service import (
    get_proof as reorg_get_proof,
)
from .reorg_service import (
    get_status as reorg_get_status,
)
from .reorg_service import (
    reset as reorg_reset,
)
from .reorg_service import (
    run as reorg_run,
)
from .schemas import (
    ActiveAlertsResponse,
    AlertConfigListResponse,
    AlertConfigRequest,
    AlertConfigResponse,
    BlockResponse,
    ChartResponse,
    ClassificationsResponse,
    ClusterCompatibilityResponse,
    DemoProofResponse,
    DemoRunHistoryResponse,
    DemoStatusResponse,
    EventTapeResponse,
    FeeEstimateResponse,
    HealthResponse,
    HistorySummaryResponse,
    IntelligenceSummaryResponse,
    MempoolClustersResponse,
    MempoolSummaryResponse,
    NetworkModeResponse,
    PolicyProofResponse,
    PolicyRunHistoryResponse,
    PolicyScenarioResponse,
    ProofReportHistoryResponse,
    RecentEventsResponse,
    ReorgProofResponse,
    ReorgRunHistoryResponse,
    ReorgStatusResponse,
    ScenariosListResponse,
    SimulationConfigRequest,
    SimulationStatusResponse,
    SummaryResponse,
    TxInspectorResponse,
    TxResponse,
)
from .service import (
    build_health,
    build_summary,
    get_classifications,
    get_cluster_compatibility,
    get_cluster_mempool_visual,
    get_event_tape,
    get_intelligence_summary,
    get_latest_block,
    get_latest_tx,
    get_mempool_summary,
    get_recent_events,
    get_tx_by_txid,
    get_tx_premium,
    iter_live_events_sse,
)

# ---------------------------------------------------------------------------
# Optional API key protection for state-changing endpoints
# ---------------------------------------------------------------------------

_REQUIRE_API_KEY: bool = os.environ.get("NODESCOPE_REQUIRE_API_KEY", "false").lower() == "true"
_API_KEY: str = os.environ.get("NODESCOPE_API_KEY", "")


async def _verify_api_key(
    x_nodescope_api_key: str | None = Header(default=None, alias="X-NodeScope-API-Key"),
) -> None:
    if not _REQUIRE_API_KEY:
        return
    if not _API_KEY:
        raise HTTPException(
            status_code=503,
            detail="API key protection is enabled but no key is configured on the server",
        )
    if x_nodescope_api_key != _API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-NodeScope-API-Key header")


_PROTECTED = [Depends(_verify_api_key)]


async def _guard_readonly() -> None:
    if network_guard.is_read_only():
        mode = network_guard.detect_network_mode()
        raise HTTPException(
            status_code=403,
            detail={
                "message": "State-changing actions are disabled outside regtest.",
                "chain": mode.get("chain"),
                "reason": mode.get("reason"),
            },
        )


_WRITE_PROTECTED = [Depends(_verify_api_key), Depends(_guard_readonly)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    network_guard.refresh_network_mode()
    if network_guard.is_read_only():
        simulation_service.prevent_auto_start()
    simulation_service.auto_start()
    charts_service.start_snapshot_loop()
    yield


# ---------------------------------------------------------------------------
# Metrics middleware — records per-request counters and latency
# ---------------------------------------------------------------------------

_SKIP_METRICS_PATHS = {"/metrics", "/", "/demo", "/static"}


async def metrics_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
    if request.url.path in _SKIP_METRICS_PATHS or request.url.path.startswith("/static"):
        return await call_next(request)
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    # Normalise dynamic segments so cardinality stays bounded
    endpoint = request.url.path
    metrics.record_http_request(request.method, endpoint, response.status_code, duration)
    return response


app = FastAPI(
    title="NodeScope API",
    version="1.1.0",
    description="Bitcoin Core observability API — ZMQ events, classifications, mempool, chain stats, and guided demo.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.middleware("http")(metrics_middleware)
app.add_middleware(RateLimitMiddleware)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def _resolve_path(value: str | None) -> Path | None:
    if value is None:
        return None
    return Path(value)


@app.get("/", include_in_schema=False)
def root():
    return root_redirect()


@app.get("/demo", include_in_schema=False)
def demo():
    return demo_page()


@app.get("/health", response_model=HealthResponse)
def health(log_dir: str | None = None, file: str | None = None) -> dict:
    result = build_health(log_dir=_resolve_path(log_dir), file=_resolve_path(file))
    metrics.set_rpc_up(bool(result.get("rpc_ok")))
    return result


@app.get("/network/mode", response_model=NetworkModeResponse)
def network_mode() -> dict:
    return network_guard.detect_network_mode()


@app.get("/summary", response_model=SummaryResponse)
def summary(log_dir: str | None = None, file: str | None = None) -> dict:
    return build_summary(log_dir=_resolve_path(log_dir), file=_resolve_path(file))


@app.get("/mempool/summary", response_model=MempoolSummaryResponse)
def mempool_summary() -> dict:
    result = get_mempool_summary()
    if result.get("rpc_ok"):
        try:
            from .rpc import get_client

            mi = get_client().getmempoolinfo()
            bi = get_client().getblockchaininfo()
            metrics.update_chain_metrics(mi, bi)
        except Exception:
            pass
    return result


@app.get("/charts/mempool", response_model=ChartResponse)
def charts_mempool(range: str = "1h") -> dict:  # noqa: A002
    return charts_service.get_mempool_chart(range)


@app.get("/charts/fees", response_model=ChartResponse)
def charts_fees(range: str = "1h") -> dict:  # noqa: A002
    return charts_service.get_fees_chart(range)


@app.get("/alerts/config", response_model=AlertConfigListResponse)
def alerts_config() -> dict:
    return {"items": alerts_service.list_configs()}


@app.post(
    "/alerts/config",
    response_model=AlertConfigResponse,
    dependencies=_WRITE_PROTECTED,
)
def alerts_config_create(req: AlertConfigRequest) -> dict:
    try:
        item = alerts_service.create_config(req.model_dump(exclude_none=True))
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if item is None:
        raise HTTPException(status_code=500, detail="Failed to create alert config")
    return item


@app.put(
    "/alerts/config/{config_id}",
    response_model=AlertConfigResponse,
    dependencies=_WRITE_PROTECTED,
)
def alerts_config_update(config_id: int, req: AlertConfigRequest) -> dict:
    try:
        item = alerts_service.update_config(config_id, req.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if item is None:
        raise HTTPException(status_code=404, detail="Alert config not found")
    return item


@app.delete("/alerts/config/{config_id}", dependencies=_WRITE_PROTECTED)
def alerts_config_delete(config_id: int) -> dict:
    if not alerts_service.delete_config(config_id):
        raise HTTPException(status_code=404, detail="Alert config not found")
    return {"ok": True}


@app.get("/alerts/active", response_model=ActiveAlertsResponse)
def alerts_active() -> dict:
    return {"items": alerts_service.evaluate_alerts()}


@app.get("/events/recent", response_model=RecentEventsResponse)
def recent_events(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    event_type: str | None = Query(default=None),
    sort_by: str = "ts",
    sort_dir: str = "desc",
    log_dir: str | None = None,
    file: str | None = None,
) -> dict:
    return get_recent_events(
        limit=limit,
        offset=offset,
        event_type=event_type,
        sort_by=sort_by,
        sort_dir=sort_dir,
        log_dir=_resolve_path(log_dir),
        file=_resolve_path(file),
    )


@app.get("/events/classifications", response_model=ClassificationsResponse)
def classifications(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    kind: str | None = Query(default=None),
    sort_by: str = "ts",
    sort_dir: str = "desc",
    log_dir: str | None = None,
    file: str | None = None,
) -> dict:
    return get_classifications(
        limit=limit,
        offset=offset,
        kind=kind,
        sort_by=sort_by,
        sort_dir=sort_dir,
        log_dir=_resolve_path(log_dir),
        file=_resolve_path(file),
    )


@app.get("/events/stream")
def stream_events(log_dir: str | None = None, file: str | None = None) -> StreamingResponse:
    return StreamingResponse(
        iter_live_events_sse(log_dir=_resolve_path(log_dir), file=_resolve_path(file)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/blocks/latest", response_model=BlockResponse | None)
def latest_block(log_dir: str | None = None, file: str | None = None) -> dict | None:
    return get_latest_block(log_dir=_resolve_path(log_dir), file=_resolve_path(file))


@app.get("/tx/latest", response_model=TxResponse | None)
def latest_tx(log_dir: str | None = None, file: str | None = None) -> dict | None:
    return get_latest_tx(log_dir=_resolve_path(log_dir), file=_resolve_path(file))


@app.get("/intelligence/summary", response_model=IntelligenceSummaryResponse)
def intelligence_summary(log_dir: str | None = None, file: str | None = None) -> dict:
    return get_intelligence_summary(log_dir=_resolve_path(log_dir), file=_resolve_path(file))


@app.get("/tx/inspect/{txid}", response_model=TxInspectorResponse)
def tx_inspect(txid: str, log_dir: str | None = None) -> dict:
    return get_tx_premium(txid=txid, log_dir=_resolve_path(log_dir))


@app.get("/tx/{txid}", response_model=TxResponse)
def tx_by_id(txid: str, log_dir: str | None = None, file: str | None = None) -> dict:
    result = get_tx_by_txid(txid=txid, log_dir=_resolve_path(log_dir), file=_resolve_path(file))
    if result is None:
        raise HTTPException(status_code=404, detail=f"Transaction {txid} not found in event store")
    return result


@app.get("/events/tape", response_model=EventTapeResponse)
def event_tape(
    limit: int = Query(default=50, ge=1, le=200),
    topic: str | None = Query(default=None),
    log_dir: str | None = None,
) -> dict:
    return get_event_tape(limit=limit, topic=topic, log_dir=_resolve_path(log_dir))


@app.get("/events/tape/{txid}", response_model=EventTapeResponse)
def event_tape_by_txid(txid: str, log_dir: str | None = None) -> dict:
    return get_event_tape(limit=50, txid_filter=txid, log_dir=_resolve_path(log_dir))


# ---------------------------------------------------------------------------
# Prometheus metrics endpoint
# ---------------------------------------------------------------------------


@app.get("/metrics", include_in_schema=False)
def prometheus_metrics() -> Response:
    body, content_type = metrics.get_metrics_response()
    return Response(content=body, media_type=content_type)


# ---------------------------------------------------------------------------
# Guided Demo endpoints
# ---------------------------------------------------------------------------


@app.get("/demo/status", response_model=DemoStatusResponse)
def demo_status() -> dict:
    return demo_get_status()


@app.post("/demo/run", response_model=DemoStatusResponse, dependencies=_WRITE_PROTECTED)
def demo_run() -> dict:
    metrics.record_demo_run()
    return start_full_demo()


@app.post("/demo/step/{step_id}", dependencies=_WRITE_PROTECTED)
def demo_step(step_id: str) -> dict:
    result = run_step(step_id)
    if result.get("error") and result.get("status") not in ("error", "unavailable"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/demo/reset", response_model=DemoStatusResponse, dependencies=_WRITE_PROTECTED)
def demo_reset() -> dict:
    return reset_demo()


@app.get("/demo/proof", response_model=DemoProofResponse)
def demo_proof() -> dict:
    status = demo_get_status()
    proof = status.get("proof")
    if proof and proof.get("success"):
        metrics.record_proof_report("guided_demo")
    return {"proof": proof}


# ---------------------------------------------------------------------------
# Mempool Policy Arena endpoints
# ---------------------------------------------------------------------------


@app.get("/policy/scenarios", response_model=ScenariosListResponse)
def policy_scenarios() -> dict:
    return {"scenarios": list_scenarios()}


@app.post(
    "/policy/run/{scenario_id}", response_model=PolicyScenarioResponse, dependencies=_WRITE_PROTECTED
)
def policy_run(scenario_id: str) -> dict:
    metrics.record_policy_scenario(scenario_id)
    result = run_scenario(scenario_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario_id}")
    return result


@app.get("/policy/status/{scenario_id}", response_model=PolicyScenarioResponse)
def policy_status(scenario_id: str) -> dict:
    result = get_scenario_status(scenario_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario_id}")
    return result


@app.post(
    "/policy/reset/{scenario_id}", response_model=PolicyScenarioResponse, dependencies=_WRITE_PROTECTED
)
def policy_reset_one(scenario_id: str) -> dict:
    result = reset_scenario(scenario_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario_id}")
    return result


@app.post("/policy/reset", response_model=ScenariosListResponse, dependencies=_WRITE_PROTECTED)
def policy_reset_all_endpoint() -> dict:
    return {"scenarios": policy_reset_all()}


@app.get("/policy/proof/{scenario_id}", response_model=PolicyProofResponse)
def policy_proof(scenario_id: str) -> dict:
    proof = get_scenario_proof(scenario_id)
    if proof is None and scenario_id not in [
        "normal_transaction",
        "low_fee_transaction",
        "rbf_replacement",
        "cpfp_package",
    ]:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario_id}")
    if proof and proof.get("success"):
        metrics.record_proof_report(f"policy_{scenario_id}")
    return {"scenario_id": scenario_id, "proof": proof}


# ---------------------------------------------------------------------------
# Reorg Lab endpoints
# ---------------------------------------------------------------------------


@app.get("/reorg/status", response_model=ReorgStatusResponse)
def reorg_status() -> dict:
    return reorg_get_status()


@app.post("/reorg/run", response_model=ReorgStatusResponse, dependencies=_WRITE_PROTECTED)
def reorg_run_endpoint() -> dict:
    metrics.record_reorg_run()
    return reorg_run()


@app.post("/reorg/reset", response_model=ReorgStatusResponse, dependencies=_WRITE_PROTECTED)
def reorg_reset_endpoint() -> dict:
    return reorg_reset()


@app.get("/reorg/proof", response_model=ReorgProofResponse)
def reorg_proof_endpoint() -> dict:
    return {"proof": reorg_get_proof()}


# ---------------------------------------------------------------------------
# Cluster Mempool Compatibility
# ---------------------------------------------------------------------------


@app.get("/mempool/cluster/compatibility", response_model=ClusterCompatibilityResponse)
def cluster_compatibility() -> dict:
    return get_cluster_compatibility()


@app.get("/mempool/clusters", response_model=MempoolClustersResponse)
def mempool_clusters() -> dict:
    return get_cluster_mempool_visual()


# ---------------------------------------------------------------------------
# Live Simulation endpoints
# ---------------------------------------------------------------------------


@app.get("/simulation/status", response_model=SimulationStatusResponse)
def simulation_status() -> dict:
    return simulation_service.get_status()


@app.post("/simulation/start", response_model=SimulationStatusResponse, dependencies=_WRITE_PROTECTED)
def simulation_start() -> dict:
    return simulation_service.start()


@app.post("/simulation/stop", response_model=SimulationStatusResponse, dependencies=_WRITE_PROTECTED)
def simulation_stop() -> dict:
    return simulation_service.stop()


@app.put("/simulation/config", response_model=SimulationStatusResponse, dependencies=_WRITE_PROTECTED)
def simulation_config(req: SimulationConfigRequest) -> dict:
    return simulation_service.configure(
        block_interval=req.block_interval,
        tx_interval=req.tx_interval,
    )


# ---------------------------------------------------------------------------
# Session reset
# ---------------------------------------------------------------------------


@app.post("/session/reset", dependencies=_WRITE_PROTECTED)
def session_reset() -> dict:
    log_dir = os.environ.get("NODESCOPE_LOG_DIR", "/app/logs")
    today = datetime.date.today().isoformat()
    log_path = os.path.join(log_dir, f"{today}-monitor.ndjson")

    truncated = False
    if os.path.exists(log_path):
        with open(log_path, "w", encoding="utf-8") as f:
            f.truncate(0)
        truncated = True

    simulation_service.reset_stats()

    return {"ok": True, "truncated": truncated, "file": log_path}


# ---------------------------------------------------------------------------
# History — read-only endpoints
# ---------------------------------------------------------------------------


@app.get("/history/summary", response_model=HistorySummaryResponse)
def history_summary() -> dict:
    data = history_service.get_history_summary()
    metrics.update_storage_metrics(
        proof_reports=data.get("proof_reports", 0),
        demo_runs=data.get("demo_runs", 0),
        policy_runs=data.get("policy_runs", 0),
        reorg_runs=data.get("reorg_runs", 0),
        storage_up=bool(data.get("storage_up")),
        backend=data.get("storage_backend", "memory"),
    )
    return data


@app.get("/history/proofs", response_model=ProofReportHistoryResponse)
def history_proofs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    source: str | None = Query(default=None),
    success: bool | None = Query(default=None),
    sort_by: str = "id",
    sort_dir: str = "desc",
) -> dict:
    items = history_service.get_proof_reports(
        limit=limit,
        offset=offset,
        source=source,
        success=success,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return {"items": items, "total_returned": len(items), "limit": limit, "offset": offset}


@app.get("/history/proofs/{report_id}", response_model=ProofReportHistoryResponse)
def history_proof_by_id(report_id: int) -> dict:
    item = history_service.get_proof_report(report_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Proof report not found")
    return {"items": [item], "total_returned": 1, "limit": 1, "offset": 0}


@app.get("/history/demo-runs", response_model=DemoRunHistoryResponse)
def history_demo_runs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    items = history_service.get_demo_runs(limit=limit, offset=offset)
    return {"items": items, "total_returned": len(items), "limit": limit, "offset": offset}


@app.get("/history/policy-runs", response_model=PolicyRunHistoryResponse)
def history_policy_runs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    scenario: str | None = Query(default=None),
) -> dict:
    items = history_service.get_policy_runs(limit=limit, offset=offset, scenario_id=scenario)
    return {"items": items, "total_returned": len(items), "limit": limit, "offset": offset}


@app.get("/history/reorg-runs", response_model=ReorgRunHistoryResponse)
def history_reorg_runs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    items = history_service.get_reorg_runs(limit=limit, offset=offset)
    return {"items": items, "total_returned": len(items), "limit": limit, "offset": offset}


@app.get("/history/export.json")
def history_export_json(
    source: str | None = Query(default=None),
    success: bool | None = Query(default=None),
    since: str | None = Query(default=None),
    until: str | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=10000),
) -> Response:
    payload = history_service.build_export_payload(
        source=source, success=success, since=since, until=until, limit=limit
    )
    content = json.dumps(payload, indent=2, default=str)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="nodescope-history.json"'},
    )


@app.get("/history/export.csv")
def history_export_csv(
    source: str | None = Query(default=None),
    success: bool | None = Query(default=None),
    since: str | None = Query(default=None),
    until: str | None = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=10000),
) -> Response:
    payload = history_service.build_export_payload(
        source=source, success=success, since=since, until=until, limit=limit
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["table", "id", "source", "scenario_id", "status", "success", "txid", "created_at"]
    )
    for row in payload.get("proof_reports", []):
        writer.writerow(
            [
                "proof_report",
                row.get("id"),
                row.get("source"),
                "",
                row.get("status"),
                row.get("success"),
                row.get("txid"),
                row.get("created_at"),
            ]
        )
    for row in payload.get("demo_runs", []):
        writer.writerow(
            [
                "demo_run",
                row.get("id"),
                "demo",
                "",
                row.get("status"),
                row.get("success"),
                row.get("txid"),
                row.get("created_at"),
            ]
        )
    for row in payload.get("policy_runs", []):
        writer.writerow(
            [
                "policy_run",
                row.get("id"),
                "policy",
                row.get("scenario_id"),
                row.get("status"),
                row.get("success"),
                "",
                row.get("created_at"),
            ]
        )
    for row in payload.get("reorg_runs", []):
        writer.writerow(
            [
                "reorg_run",
                row.get("id"),
                "reorg",
                "",
                row.get("status"),
                row.get("success"),
                row.get("txid"),
                row.get("created_at"),
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="nodescope-history.csv"'},
    )


# ---------------------------------------------------------------------------
# Fee Estimation Playground — read-only endpoints
# ---------------------------------------------------------------------------


@app.get("/fees/estimate", response_model=FeeEstimateResponse)
def fees_estimate(
    mode: str = Query(default="CONSERVATIVE", description="CONSERVATIVE or ECONOMICAL"),
) -> dict:
    result = fee_service.get_fee_estimates(estimate_mode=mode)
    any_success = any(e.get("status") == "success" for e in result.get("estimates", []))
    metrics.record_fee_estimation(success=any_success)
    return result


@app.get("/fees/compare", response_model=FeeEstimateResponse)
def fees_compare(
    mode: str = Query(default="CONSERVATIVE", description="CONSERVATIVE or ECONOMICAL"),
) -> dict:
    result = fee_service.get_fee_comparison()
    any_success = any(e.get("status") == "success" for e in result.get("estimates", []))
    metrics.record_fee_estimation(success=any_success)
    return result
