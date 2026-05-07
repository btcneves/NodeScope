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


# --- Guided Demo schemas ---


class DemoStepResponse(BaseModel):
    id: str
    title: str
    status: str
    friendly_message: str
    technical_output: Any = None
    timestamp: str | None = None
    error: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class DemoStatusResponse(BaseModel):
    steps: list[DemoStepResponse]
    proof: dict[str, Any] | None = None
    running: bool


class DemoProofResponse(BaseModel):
    proof: dict[str, Any] | None


# --- Transaction Inspector Premium ---


class TxVinResponse(BaseModel):
    coinbase: bool = False
    coinbase_hex: str | None = None
    prev_txid: str | None = None
    prev_vout: int | None = None
    sequence: int | None = None
    value: float | None = None
    address: str | None = None


class TxVoutResponse(BaseModel):
    n: int | None = None
    value: float
    address: str | None = None
    script_type: str | None = None


class TxInspectorResponse(BaseModel):
    txid: str
    wtxid: str | None = None
    version: int | None = None
    locktime: int | None = None
    size: int | None = None
    vsize: int | None = None
    weight: int | None = None
    fee_btc: Any = None
    fee_rate_sat_vb: Any = None
    confirmations: int | None = None
    blockhash: str | None = None
    blockheight: int | None = None
    blocktime: int | None = None
    time: int | None = None
    mempool_status: str
    replaceable: bool | None = None
    total_output_btc: float | None = None
    vin: list[TxVinResponse] = Field(default_factory=list)
    vout: list[TxVoutResponse] = Field(default_factory=list)
    vin_count: int = 0
    vout_count: int = 0
    related_zmq_events: list[dict[str, Any]] = Field(default_factory=list)
    rpc_validation_status: str
    warnings: list[str] = Field(default_factory=list)
    unavailable_features: list[str] = Field(default_factory=list)


# --- ZMQ Event Tape ---


class TapeEventResponse(BaseModel):
    ts: str | None = None
    event: str
    topic: str
    txid: str | None = None
    blockhash: str | None = None
    short_id: str | None = None
    height: int | None = None
    vsize: int | None = None
    has_op_return: bool | None = None
    script_types: list[str] = Field(default_factory=list)
    validation_status: str = "seen"


class EventTapeResponse(BaseModel):
    items: list[TapeEventResponse]
    total: int
    limit: int
    topic_filter: str | None = None
    txid_filter: str | None = None
    source: str


# --- Mempool Policy Arena ---


class PolicyStepResponse(BaseModel):
    id: str
    title: str
    status: str
    friendly_message: str
    technical_output: Any = None
    timestamp: str | None = None
    error: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class PolicyScenarioResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    running: bool
    steps: list[PolicyStepResponse]
    proof: dict[str, Any] | None = None


class PolicyScenarioSummary(BaseModel):
    id: str
    title: str
    description: str
    status: str
    running: bool
    step_count: int
    has_proof: bool


class ScenariosListResponse(BaseModel):
    scenarios: list[PolicyScenarioSummary]


class PolicyProofResponse(BaseModel):
    scenario_id: str
    proof: dict[str, Any] | None


# --- Reorg Lab ---


class ReorgStepResponse(BaseModel):
    name: str
    status: str
    message: str
    technical: Any = None
    data: dict[str, Any] = Field(default_factory=dict)
    timestamp: str | None = None


class ReorgStatusResponse(BaseModel):
    status: str
    running: bool
    network: str | None = None
    steps: list[ReorgStepResponse] = Field(default_factory=list)
    proof: dict[str, Any] | None = None
    error: str | None = None
    warning: str | None = None


class ReorgProofResponse(BaseModel):
    proof: dict[str, Any] | None


# --- Cluster Mempool Compatibility ---


class ClusterRpcResult(BaseModel):
    rpc: str
    supported: bool
    reason: str | None = None


class ClusterCompatibilityResponse(BaseModel):
    bitcoin_core_version: str | None = None
    supported: bool
    rpcs: list[ClusterRpcResult] = Field(default_factory=list)
    message: str
    note: str | None = None
