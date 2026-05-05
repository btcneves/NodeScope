from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from .models import ClassifiedEvent, RawEvent


@dataclass
class EngineAnalytics:
    """Métricas agregadas derivadas do replay atual."""

    total_events: int = 0
    event_type_counts: dict[str, int] = field(default_factory=dict)
    classification_counts: dict[str, int] = field(default_factory=dict)
    coinbase_input_present_count: int = 0
    op_return_count: int = 0
    script_type_counts: dict[str, int] = field(default_factory=dict)


@dataclass
class _MutableAnalytics:
    total_events: int = 0
    event_type_counts: Counter[str] = field(default_factory=Counter)
    classification_counts: Counter[str] = field(default_factory=Counter)
    script_type_counts: Counter[str] = field(default_factory=Counter)
    coinbase_input_present_count: int = 0
    op_return_count: int = 0

    def observe_event(self, event: RawEvent) -> None:
        self.total_events += 1
        self.event_type_counts[event.event] += 1

    def observe_classification(self, result: ClassifiedEvent) -> None:
        self.classification_counts[result.kind] += 1
        if result.tx is None:
            return
        if result.tx.coinbase_input_present is True:
            self.coinbase_input_present_count += 1
        if result.tx.has_op_return is True:
            self.op_return_count += 1
        for script_type in result.tx.script_types:
            self.script_type_counts[script_type] += 1

    def freeze(self) -> EngineAnalytics:
        return EngineAnalytics(
            total_events=self.total_events,
            event_type_counts=dict(sorted(self.event_type_counts.items())),
            classification_counts=dict(sorted(self.classification_counts.items())),
            coinbase_input_present_count=self.coinbase_input_present_count,
            op_return_count=self.op_return_count,
            script_type_counts=dict(sorted(self.script_type_counts.items())),
        )


def new_analytics() -> _MutableAnalytics:
    return _MutableAnalytics()
