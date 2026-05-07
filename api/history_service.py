"""History service — read-only queries over the storage layer.

Provides the data contracts used by the /history/* API endpoints.
All functions are safe to call even if storage is unavailable; they will
return empty results rather than raising exceptions.
"""

from __future__ import annotations

import json
from typing import Any

from . import storage


def _parse_json(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except Exception:
        return None


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return bool(value)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def get_history_summary() -> dict[str, Any]:
    return storage.summary_counts()


# ---------------------------------------------------------------------------
# Proof reports
# ---------------------------------------------------------------------------


def get_proof_reports(
    *,
    limit: int = 20,
    offset: int = 0,
    source: str | None = None,
    success: bool | None = None,
) -> list[dict[str, Any]]:
    rows = storage.list_proof_reports(limit=limit, offset=offset, source=source, success=success)
    return [_format_proof_report(r) for r in rows]


def get_proof_report(report_id: int) -> dict[str, Any] | None:
    row = storage.get_proof_report(report_id)
    if row is None:
        return None
    return _format_proof_report(row)


def _format_proof_report(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "scenario_name": row.get("scenario_name"),
        "source": row.get("source"),
        "status": row.get("status"),
        "success": _coerce_bool(row.get("success")),
        "txid": row.get("txid"),
        "block_hash": row.get("block_hash"),
        "block_height": row.get("block_height"),
        "summary": _parse_json(row.get("summary_json")),
        "created_at": row.get("created_at"),
    }


# ---------------------------------------------------------------------------
# Demo runs
# ---------------------------------------------------------------------------


def get_demo_runs(*, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
    rows = storage.list_demo_runs(limit=limit, offset=offset)
    return [_format_demo_run(r) for r in rows]


def _format_demo_run(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "status": row.get("status"),
        "success": _coerce_bool(row.get("success")),
        "txid": row.get("txid"),
        "duration_ms": row.get("duration_ms"),
        "proof_report_id": row.get("proof_report_id"),
        "created_at": row.get("created_at"),
    }


# ---------------------------------------------------------------------------
# Policy runs
# ---------------------------------------------------------------------------


def get_policy_runs(
    *,
    limit: int = 20,
    offset: int = 0,
    scenario_id: str | None = None,
) -> list[dict[str, Any]]:
    rows = storage.list_policy_runs(limit=limit, offset=offset, scenario_id=scenario_id)
    return [_format_policy_run(r) for r in rows]


def _format_policy_run(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "scenario_id": row.get("scenario_id"),
        "status": row.get("status"),
        "success": _coerce_bool(row.get("success")),
        "txids": _parse_json(row.get("txids_json")) or [],
        "fee_data": _parse_json(row.get("fee_data_json")),
        "proof_report_id": row.get("proof_report_id"),
        "created_at": row.get("created_at"),
    }


# ---------------------------------------------------------------------------
# Reorg runs
# ---------------------------------------------------------------------------


def get_reorg_runs(*, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
    rows = storage.list_reorg_runs(limit=limit, offset=offset)
    return [_format_reorg_run(r) for r in rows]


def _format_reorg_run(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "status": row.get("status"),
        "success": _coerce_bool(row.get("success")),
        "txid": row.get("txid"),
        "original_block_hash": row.get("original_block_hash"),
        "final_block_hash": row.get("final_block_hash"),
        "proof_report_id": row.get("proof_report_id"),
        "created_at": row.get("created_at"),
    }
