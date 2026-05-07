from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from .demo import STATIC_DIR, demo_page, root_redirect
from .demo_service import (
    get_status as demo_get_status,
    reset_demo,
    run_step,
    start_full_demo,
)
from .policy_service import (
    get_scenario_proof,
    get_scenario_status,
    list_scenarios,
    reset_all as policy_reset_all,
    reset_scenario,
    run_scenario,
)
from .reorg_service import (
    get_proof as reorg_get_proof,
    get_status as reorg_get_status,
    reset as reorg_reset,
    run as reorg_run,
)
from .schemas import (
    BlockResponse,
    ClassificationsResponse,
    ClusterCompatibilityResponse,
    DemoProofResponse,
    DemoStatusResponse,
    EventTapeResponse,
    HealthResponse,
    IntelligenceSummaryResponse,
    MempoolSummaryResponse,
    PolicyProofResponse,
    PolicyScenarioResponse,
    RecentEventsResponse,
    ReorgProofResponse,
    ReorgStatusResponse,
    ScenariosListResponse,
    SummaryResponse,
    TxInspectorResponse,
    TxResponse,
)
from .service import (
    build_health,
    build_summary,
    get_classifications,
    get_cluster_compatibility,
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

app = FastAPI(
    title="NodeScope API",
    version="0.2.0",
    description="Bitcoin Core observability API — ZMQ events, classifications, mempool, chain stats, and guided demo.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

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
    return build_health(log_dir=_resolve_path(log_dir), file=_resolve_path(file))


@app.get("/summary", response_model=SummaryResponse)
def summary(log_dir: str | None = None, file: str | None = None) -> dict:
    return build_summary(log_dir=_resolve_path(log_dir), file=_resolve_path(file))


@app.get("/mempool/summary", response_model=MempoolSummaryResponse)
def mempool_summary() -> dict:
    return get_mempool_summary()


@app.get("/events/recent", response_model=RecentEventsResponse)
def recent_events(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    event_type: str | None = Query(default=None),
    log_dir: str | None = None,
    file: str | None = None,
) -> dict:
    return get_recent_events(
        limit=limit,
        offset=offset,
        event_type=event_type,
        log_dir=_resolve_path(log_dir),
        file=_resolve_path(file),
    )


@app.get("/events/classifications", response_model=ClassificationsResponse)
def classifications(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    kind: str | None = Query(default=None),
    log_dir: str | None = None,
    file: str | None = None,
) -> dict:
    return get_classifications(
        limit=limit,
        offset=offset,
        kind=kind,
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
# Guided Demo endpoints
# ---------------------------------------------------------------------------


@app.get("/demo/status", response_model=DemoStatusResponse)
def demo_status() -> dict:
    return demo_get_status()


@app.post("/demo/run", response_model=DemoStatusResponse)
def demo_run() -> dict:
    return start_full_demo()


@app.post("/demo/step/{step_id}")
def demo_step(step_id: str) -> dict:
    result = run_step(step_id)
    if "error" in result and result.get("status") not in ("error", "unavailable"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/demo/reset", response_model=DemoStatusResponse)
def demo_reset() -> dict:
    return reset_demo()


@app.get("/demo/proof", response_model=DemoProofResponse)
def demo_proof() -> dict:
    status = demo_get_status()
    return {"proof": status.get("proof")}


# ---------------------------------------------------------------------------
# Mempool Policy Arena endpoints
# ---------------------------------------------------------------------------


@app.get("/policy/scenarios", response_model=ScenariosListResponse)
def policy_scenarios() -> dict:
    return {"scenarios": list_scenarios()}


@app.post("/policy/run/{scenario_id}", response_model=PolicyScenarioResponse)
def policy_run(scenario_id: str) -> dict:
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


@app.post("/policy/reset/{scenario_id}", response_model=PolicyScenarioResponse)
def policy_reset_one(scenario_id: str) -> dict:
    result = reset_scenario(scenario_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario_id}")
    return result


@app.post("/policy/reset", response_model=ScenariosListResponse)
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
    return {"scenario_id": scenario_id, "proof": proof}


# ---------------------------------------------------------------------------
# Reorg Lab endpoints
# ---------------------------------------------------------------------------


@app.get("/reorg/status", response_model=ReorgStatusResponse)
def reorg_status() -> dict:
    return reorg_get_status()


@app.post("/reorg/run", response_model=ReorgStatusResponse)
def reorg_run_endpoint() -> dict:
    return reorg_run()


@app.post("/reorg/reset", response_model=ReorgStatusResponse)
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
