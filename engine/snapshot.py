from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from .analytics import EngineAnalytics, new_analytics
from .classify import classify
from .models import ClassifiedEvent, RawEvent, ReaderStats
from .reader import iter_events, iter_log_dir

PathLike = str | Path
ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LOG_DIR = Path(os.environ.get("NODESCOPE_LOG_DIR", ROOT / "logs"))


@dataclass
class EngineSnapshot:
    source: Path
    reader_stats: ReaderStats
    events: list[RawEvent]
    classifications: list[ClassifiedEvent]
    skipped_events: int
    latest_block: ClassifiedEvent | None
    latest_tx: ClassifiedEvent | None
    analytics: EngineAnalytics

    @property
    def rawtx_count(self) -> int:
        return self.analytics.event_type_counts.get("zmq_rawtx", 0)

    @property
    def rawblock_count(self) -> int:
        return self.analytics.event_type_counts.get("zmq_rawblock", 0)

    @property
    def other_count(self) -> int:
        return self.analytics.total_events - self.rawtx_count - self.rawblock_count


def _coerce_path(value: PathLike | None) -> Path | None:
    if value is None:
        return None
    return value if isinstance(value, Path) else Path(value)


def load_snapshot(log_dir: PathLike | None = None, file: PathLike | None = None) -> EngineSnapshot:
    reader_stats = ReaderStats()
    file_path = _coerce_path(file)
    if file_path is not None:
        source = file_path
        event_iter = iter_events(file_path, stats=reader_stats)
    else:
        source = _coerce_path(log_dir) or DEFAULT_LOG_DIR
        event_iter = iter_log_dir(source, stats=reader_stats)

    events: list[RawEvent] = []
    classifications: list[ClassifiedEvent] = []
    latest_block: ClassifiedEvent | None = None
    latest_tx: ClassifiedEvent | None = None
    skipped_events = 0
    analytics = new_analytics()

    for event in event_iter:
        events.append(event)
        analytics.observe_event(event)
        result = classify(event)
        if result is None:
            skipped_events += 1
            continue
        classifications.append(result)
        analytics.observe_classification(result)
        if result.block is not None:
            latest_block = result
        if result.tx is not None:
            latest_tx = result

    return EngineSnapshot(
        source=source,
        reader_stats=reader_stats,
        events=events,
        classifications=classifications,
        skipped_events=skipped_events,
        latest_block=latest_block,
        latest_tx=latest_tx,
        analytics=analytics.freeze(),
    )
