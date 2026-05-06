from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    project: str
    api_mode: str
    storage: str
    source: str
    events_available: int
    ignored_lines: int
    rpc_ok: bool
    network: str | None = None
    chain: str | None = None
    blocks: int | None = None
    rpc_error: str | None = None


class RawEventResponse(BaseModel):
    ts: str
    level: str
    origin: str
    event: str
    data: dict[str, Any]


class BlockResponse(BaseModel):
    ts: str
    height: int | None
    hash: str | None
    kind: str


class VoutResponse(BaseModel):
    value: float
    address: str | None


class TxResponse(BaseModel):
    ts: str
    txid: str
    inputs: int
    outputs: int
    total_out: float
    coinbase_input_present: bool | None = None
    addressed_output_count: int | None = None
    unattributed_output_count: int | None = None
    zero_value_output_count: int | None = None
    positive_output_count: int | None = None
    script_types: list[str] = Field(default_factory=list)
    has_op_return: bool | None = None
    kind: str
    metadata: dict[str, Any]
    vout: list[VoutResponse]


class SummaryResponse(BaseModel):
    project: str
    source: str
    total_events: int
    rawtx_count: int
    rawblock_count: int
    other_count: int
    ignored_lines: int
    skipped_events: int
    event_type_counts: dict[str, int]
    classification_counts: dict[str, int]
    coinbase_input_present_count: int
    op_return_count: int
    script_type_counts: dict[str, int]
    available_event_types: list[str]
    available_classification_kinds: list[str]
    latest_block: BlockResponse | None
    latest_tx: TxResponse | None


class MempoolSummaryResponse(BaseModel):
    size: int
    bytes: int
    usage: int
    maxmempool: int
    mempoolminfee: float
    minrelaytxfee: float
    rpc_ok: bool
    error: str | None = None


class ClassificationItemResponse(BaseModel):
    ts: str
    event: str
    kind: str
    metadata: dict[str, Any]
    txid: str | None = None
    height: int | None = None
    hash: str | None = None


class ClassificationsResponse(BaseModel):
    counts: dict[str, int]
    total_counts: dict[str, int]
    items: list[ClassificationItemResponse]
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)
    total_items: int = Field(ge=0)
    kind: str | None = None


class RecentEventsResponse(BaseModel):
    items: list[RawEventResponse]
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)
    total_items: int = Field(ge=0)
    event_type: str | None = None


class EventStoreInfo(BaseModel):
    replayable: bool
    source: str
    total_events: int


class IntelligenceSummaryResponse(BaseModel):
    node_health_score: int
    node_health_label: str
    rpc_status: str
    zmq_status: str
    sse_status: str
    mempool_pressure: str
    latest_signal: str | None
    event_store: EventStoreInfo
    classification_summary: dict[str, int]
    latest_block: BlockResponse | None
    latest_tx: TxResponse | None
