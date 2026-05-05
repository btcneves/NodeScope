import json
import pathlib
from typing import Any, Iterator

from .models import RawEvent, ReaderStats

REQUIRED_TOP_LEVEL_FIELDS = ("ts", "level", "origin", "event", "data")


def _note(stats: ReaderStats | None, field: str) -> None:
    if stats is not None:
        setattr(stats, field, getattr(stats, field) + 1)


def _is_valid_shape(obj: Any) -> bool:
    if not isinstance(obj, dict):
        return False
    if any(field not in obj for field in REQUIRED_TOP_LEVEL_FIELDS):
        return False
    if not all(isinstance(obj[field], str) for field in ("ts", "level", "origin", "event")):
        return False
    if not isinstance(obj["data"], dict):
        return False
    return True


def iter_events(path: pathlib.Path, stats: ReaderStats | None = None) -> Iterator[RawEvent]:
    """Itera um arquivo NDJSON, descartando linhas inválidas ou fora do contrato."""
    with path.open(encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            _note(stats, "total_lines")
            line = line.strip()
            if not line:
                _note(stats, "blank_lines")
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                _note(stats, "invalid_json_lines")
                print(f"[reader] {path.name}:{i} — linha inválida ignorada: {e}")
                continue
            if not _is_valid_shape(obj):
                _note(stats, "invalid_shape_lines")
                print(f"[reader] {path.name}:{i} — shape inválido ignorado")
                continue
            _note(stats, "yielded_events")
            yield RawEvent(
                ts=obj["ts"],
                level=obj["level"],
                origin=obj["origin"],
                event=obj["event"],
                data=obj["data"],
            )


def iter_log_dir(log_dir: pathlib.Path, stats: ReaderStats | None = None) -> Iterator[RawEvent]:
    """Itera todos os arquivos .ndjson do diretório em ordem cronológica."""
    for path in sorted(log_dir.glob("*.ndjson")):
        yield from iter_events(path, stats=stats)
