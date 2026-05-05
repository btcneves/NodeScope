from dataclasses import dataclass, field
from typing import Any, Literal, Optional

ClassificationKind = Literal[
    "coinbase_like",
    "simple_payment_like",
    "block_event",
    "unknown",
]


@dataclass
class RawEvent:
    """Evento bruto validado e lido do log NDJSON do monitor."""
    ts: str
    level: str
    origin: str
    event: str
    data: dict[str, Any]


@dataclass
class ReaderStats:
    """Contadores simples de ingestão do reader."""

    total_lines: int = 0
    blank_lines: int = 0
    invalid_json_lines: int = 0
    invalid_shape_lines: int = 0
    yielded_events: int = 0

    @property
    def ignored_lines(self) -> int:
        return self.blank_lines + self.invalid_json_lines + self.invalid_shape_lines


@dataclass
class VoutEntry:
    value: float
    address: Optional[str]


@dataclass
class TxEvent:
    """Transação normalizada a partir de zmq_rawtx."""
    ts: str
    txid: str
    inputs: int
    outputs: int
    total_out: float
    vout: list[VoutEntry]
    coinbase_input_present: Optional[bool] = None
    addressed_output_count: int = 0
    unattributed_output_count: int = 0
    zero_value_output_count: int = 0
    positive_output_count: int = 0
    script_types: list[str] = field(default_factory=list)
    has_op_return: Optional[bool] = None


@dataclass
class BlockEvent:
    """Bloco normalizado a partir de zmq_rawblock."""
    ts: str
    height: Optional[int]
    hash: Optional[str]


@dataclass
class ClassifiedEvent:
    """Resultado do pipeline: evento bruto + tipo parsed + classificação."""
    raw: RawEvent
    kind: ClassificationKind
    tx: Optional[TxEvent] = None
    block: Optional[BlockEvent] = None
    metadata: dict[str, Any] = field(default_factory=dict)
