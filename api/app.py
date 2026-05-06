from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from .demo import STATIC_DIR, demo_page, root_redirect
from .schemas import (
    BlockResponse,
    ClassificationsResponse,
    HealthResponse,
    IntelligenceSummaryResponse,
    MempoolSummaryResponse,
    RecentEventsResponse,
    SummaryResponse,
    TxResponse,
)
from .service import (
    build_health,
    build_summary,
    get_classifications,
    get_intelligence_summary,
    get_latest_block,
    get_latest_tx,
    get_mempool_summary,
    get_recent_events,
    get_tx_by_txid,
    iter_live_events_sse,
)

app = FastAPI(
    title="NodeScope API",
    version="0.1.0",
    description="Read-only observability API for Bitcoin Core — ZMQ events, classifications, mempool and chain stats.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["GET"],
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


@app.get("/tx/{txid}", response_model=TxResponse)
def tx_by_id(txid: str, log_dir: str | None = None, file: str | None = None) -> dict:
    result = get_tx_by_txid(txid=txid, log_dir=_resolve_path(log_dir), file=_resolve_path(file))
    if result is None:
        raise HTTPException(status_code=404, detail=f"Transaction {txid} not found in event store")
    return result
