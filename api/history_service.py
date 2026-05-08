"""History service — read-only queries over the storage layer.

Provides the data contracts used by the /history/* API endpoints.
All functions are safe to call even if storage is unavailable; they will
return empty results rather than raising exceptions.
"""

from __future__ import annotations

import datetime
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
    sort_by: str = "id",
    sort_dir: str = "desc",
) -> list[dict[str, Any]]:
    rows = storage.list_proof_reports(
        limit=limit,
        offset=offset,
        source=source,
        success=success,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
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


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------


def _apply_date_filter(
    rows: list[dict[str, Any]], since: str | None, until: str | None
) -> list[dict[str, Any]]:
    if not since and not until:
        return rows
    result = []
    for row in rows:
        created = row.get("created_at") or ""
        if since and created < since:
            continue
        if until and created > until:
            continue
        result.append(row)
    return result


def build_export_payload(
    *,
    source: str | None = None,
    success: bool | None = None,
    since: str | None = None,
    until: str | None = None,
    limit: int = 1000,
) -> dict[str, Any]:
    summary = get_history_summary()

    proofs = get_proof_reports(limit=limit, offset=0, source=source, success=success)
    demos = get_demo_runs(limit=limit, offset=0)
    policies = get_policy_runs(limit=limit, offset=0)
    reorgs = get_reorg_runs(limit=limit, offset=0)

    proofs = _apply_date_filter(proofs, since, until)
    demos = _apply_date_filter(demos, since, until)
    policies = _apply_date_filter(policies, since, until)
    reorgs = _apply_date_filter(reorgs, since, until)

    return {
        "metadata": {
            "generated_at": datetime.datetime.now(tz=datetime.UTC).isoformat(),
            "project": "NodeScope",
            "version": "1.1.x",
            "storage_backend": summary.get("storage_backend", "unknown"),
            "counts": {
                "proof_reports": len(proofs),
                "demo_runs": len(demos),
                "policy_runs": len(policies),
                "reorg_runs": len(reorgs),
            },
            "filters": {
                "source": source,
                "success": success,
                "since": since,
                "until": until,
                "limit": limit,
            },
        },
        "proof_reports": proofs,
        "demo_runs": demos,
        "policy_runs": policies,
        "reorg_runs": reorgs,
    }
