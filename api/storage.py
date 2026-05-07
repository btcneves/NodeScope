"""Local persistence layer — SQLite with in-memory fallback.

Backend is selected via env vars:
  NODESCOPE_STORAGE_BACKEND=sqlite|memory   (default: sqlite)
  NODESCOPE_SQLITE_PATH=.nodescope/history.db

If the SQLite backend fails to initialise, the module transparently falls back
to an in-memory store and records a warning so the rest of the API is not
affected.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_BACKEND_ENV = os.environ.get("NODESCOPE_STORAGE_BACKEND", "sqlite").lower()
_SQLITE_PATH = os.environ.get("NODESCOPE_SQLITE_PATH", ".nodescope/history.db")

# ---------------------------------------------------------------------------
# Internal state
# ---------------------------------------------------------------------------

_lock = threading.Lock()
_backend: str = "memory"  # resolved after init
_conn: sqlite3.Connection | None = None
_init_error: str | None = None


# In-memory fallback store
@dataclass
class _MemStore:
    proof_reports: list[dict[str, Any]] = field(default_factory=list)
    demo_runs: list[dict[str, Any]] = field(default_factory=list)
    policy_runs: list[dict[str, Any]] = field(default_factory=list)
    reorg_runs: list[dict[str, Any]] = field(default_factory=list)
    _next_id: int = 1

    def next_id(self) -> int:
        val = self._next_id
        self._next_id += 1
        return val


_mem: _MemStore = _MemStore()

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_DDL = """
CREATE TABLE IF NOT EXISTS proof_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_name TEXT,
    source TEXT,
    status TEXT,
    success INTEGER,
    txid TEXT,
    block_hash TEXT,
    block_height INTEGER,
    summary_json TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS demo_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT,
    success INTEGER,
    txid TEXT,
    duration_ms REAL,
    proof_report_id INTEGER,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS policy_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id TEXT,
    status TEXT,
    success INTEGER,
    txids_json TEXT,
    fee_data_json TEXT,
    proof_report_id INTEGER,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS reorg_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT,
    success INTEGER,
    txid TEXT,
    original_block_hash TEXT,
    final_block_hash TEXT,
    proof_report_id INTEGER,
    created_at TEXT
);
"""

# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------


def _init_sqlite() -> None:
    global _conn, _backend, _init_error
    try:
        db_path = Path(_SQLITE_PATH)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.executescript(_DDL)
        conn.commit()
        _conn = conn
        _backend = "sqlite"
    except Exception as exc:
        _init_error = str(exc)
        _backend = "memory"


def _init() -> None:
    if _BACKEND_ENV == "sqlite":
        _init_sqlite()
    else:
        _backend_global = "memory"  # noqa: F841 — side-effect via global
        global _backend
        _backend = "memory"


_init()


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def backend() -> str:
    return _backend


def storage_up() -> bool:
    if _backend == "sqlite" and _conn is not None:
        try:
            _conn.execute("SELECT 1")
            return True
        except Exception:
            return False
    return _backend == "memory"


def init_error() -> str | None:
    return _init_error


def _now() -> str:
    return datetime.now(UTC).isoformat()


# ---------------------------------------------------------------------------
# proof_reports
# ---------------------------------------------------------------------------


def insert_proof_report(
    *,
    scenario_name: str,
    source: str,
    status: str,
    success: bool,
    txid: str | None = None,
    block_hash: str | None = None,
    block_height: int | None = None,
    summary: dict[str, Any] | None = None,
) -> int | None:
    created_at = _now()
    summary_json = json.dumps(summary) if summary else None
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                cur = _conn.execute(
                    """INSERT INTO proof_reports
                       (scenario_name, source, status, success, txid,
                        block_hash, block_height, summary_json, created_at)
                       VALUES (?,?,?,?,?,?,?,?,?)""",
                    (
                        scenario_name,
                        source,
                        status,
                        int(success),
                        txid,
                        block_hash,
                        block_height,
                        summary_json,
                        created_at,
                    ),
                )
                _conn.commit()
                return cur.lastrowid
            except Exception:
                return None
        else:
            row = {
                "id": _mem.next_id(),
                "scenario_name": scenario_name,
                "source": source,
                "status": status,
                "success": success,
                "txid": txid,
                "block_hash": block_hash,
                "block_height": block_height,
                "summary_json": summary_json,
                "created_at": created_at,
            }
            _mem.proof_reports.append(row)
            return row["id"]


def list_proof_reports(
    *,
    limit: int = 20,
    offset: int = 0,
    source: str | None = None,
    success: bool | None = None,
) -> list[dict[str, Any]]:
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                conditions: list[str] = []
                params: list[Any] = []
                if source is not None:
                    conditions.append("source = ?")
                    params.append(source)
                if success is not None:
                    conditions.append("success = ?")
                    params.append(int(success))
                where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
                params += [limit, offset]
                rows = _conn.execute(
                    f"SELECT * FROM proof_reports {where} ORDER BY id DESC LIMIT ? OFFSET ?",
                    params,
                ).fetchall()
                return [dict(r) for r in rows]
            except Exception:
                return []
        else:
            rows = _mem.proof_reports
            if source is not None:
                rows = [r for r in rows if r.get("source") == source]
            if success is not None:
                rows = [r for r in rows if bool(r.get("success")) == success]
            rows = list(reversed(rows))
            return rows[offset : offset + limit]


def get_proof_report(report_id: int) -> dict[str, Any] | None:
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                row = _conn.execute(
                    "SELECT * FROM proof_reports WHERE id = ?", (report_id,)
                ).fetchone()
                return dict(row) if row else None
            except Exception:
                return None
        else:
            for r in _mem.proof_reports:
                if r.get("id") == report_id:
                    return r
            return None


# ---------------------------------------------------------------------------
# demo_runs
# ---------------------------------------------------------------------------


def insert_demo_run(
    *,
    status: str,
    success: bool,
    txid: str | None = None,
    duration_ms: float | None = None,
    proof_report_id: int | None = None,
) -> int | None:
    created_at = _now()
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                cur = _conn.execute(
                    """INSERT INTO demo_runs
                       (status, success, txid, duration_ms, proof_report_id, created_at)
                       VALUES (?,?,?,?,?,?)""",
                    (status, int(success), txid, duration_ms, proof_report_id, created_at),
                )
                _conn.commit()
                return cur.lastrowid
            except Exception:
                return None
        else:
            row = {
                "id": _mem.next_id(),
                "status": status,
                "success": success,
                "txid": txid,
                "duration_ms": duration_ms,
                "proof_report_id": proof_report_id,
                "created_at": created_at,
            }
            _mem.demo_runs.append(row)
            return row["id"]


def list_demo_runs(*, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                rows = _conn.execute(
                    "SELECT * FROM demo_runs ORDER BY id DESC LIMIT ? OFFSET ?",
                    (limit, offset),
                ).fetchall()
                return [dict(r) for r in rows]
            except Exception:
                return []
        else:
            rows = list(reversed(_mem.demo_runs))
            return rows[offset : offset + limit]


# ---------------------------------------------------------------------------
# policy_runs
# ---------------------------------------------------------------------------


def insert_policy_run(
    *,
    scenario_id: str,
    status: str,
    success: bool,
    txids: list[str] | None = None,
    fee_data: dict[str, Any] | None = None,
    proof_report_id: int | None = None,
) -> int | None:
    created_at = _now()
    txids_json = json.dumps(txids) if txids else None
    fee_data_json = json.dumps(fee_data) if fee_data else None
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                cur = _conn.execute(
                    """INSERT INTO policy_runs
                       (scenario_id, status, success, txids_json, fee_data_json,
                        proof_report_id, created_at)
                       VALUES (?,?,?,?,?,?,?)""",
                    (
                        scenario_id,
                        status,
                        int(success),
                        txids_json,
                        fee_data_json,
                        proof_report_id,
                        created_at,
                    ),
                )
                _conn.commit()
                return cur.lastrowid
            except Exception:
                return None
        else:
            row = {
                "id": _mem.next_id(),
                "scenario_id": scenario_id,
                "status": status,
                "success": success,
                "txids_json": txids_json,
                "fee_data_json": fee_data_json,
                "proof_report_id": proof_report_id,
                "created_at": created_at,
            }
            _mem.policy_runs.append(row)
            return row["id"]


def list_policy_runs(
    *,
    limit: int = 20,
    offset: int = 0,
    scenario_id: str | None = None,
) -> list[dict[str, Any]]:
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                if scenario_id is not None:
                    rows = _conn.execute(
                        "SELECT * FROM policy_runs WHERE scenario_id = ? ORDER BY id DESC LIMIT ? OFFSET ?",
                        (scenario_id, limit, offset),
                    ).fetchall()
                else:
                    rows = _conn.execute(
                        "SELECT * FROM policy_runs ORDER BY id DESC LIMIT ? OFFSET ?",
                        (limit, offset),
                    ).fetchall()
                return [dict(r) for r in rows]
            except Exception:
                return []
        else:
            rows = _mem.policy_runs
            if scenario_id is not None:
                rows = [r for r in rows if r.get("scenario_id") == scenario_id]
            rows = list(reversed(rows))
            return rows[offset : offset + limit]


# ---------------------------------------------------------------------------
# reorg_runs
# ---------------------------------------------------------------------------


def insert_reorg_run(
    *,
    status: str,
    success: bool,
    txid: str | None = None,
    original_block_hash: str | None = None,
    final_block_hash: str | None = None,
    proof_report_id: int | None = None,
) -> int | None:
    created_at = _now()
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                cur = _conn.execute(
                    """INSERT INTO reorg_runs
                       (status, success, txid, original_block_hash,
                        final_block_hash, proof_report_id, created_at)
                       VALUES (?,?,?,?,?,?,?)""",
                    (
                        status,
                        int(success),
                        txid,
                        original_block_hash,
                        final_block_hash,
                        proof_report_id,
                        created_at,
                    ),
                )
                _conn.commit()
                return cur.lastrowid
            except Exception:
                return None
        else:
            row = {
                "id": _mem.next_id(),
                "status": status,
                "success": success,
                "txid": txid,
                "original_block_hash": original_block_hash,
                "final_block_hash": final_block_hash,
                "proof_report_id": proof_report_id,
                "created_at": created_at,
            }
            _mem.reorg_runs.append(row)
            return row["id"]


def list_reorg_runs(*, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
    with _lock:
        if _backend == "sqlite" and _conn:
            try:
                rows = _conn.execute(
                    "SELECT * FROM reorg_runs ORDER BY id DESC LIMIT ? OFFSET ?",
                    (limit, offset),
                ).fetchall()
                return [dict(r) for r in rows]
            except Exception:
                return []
        else:
            rows = list(reversed(_mem.reorg_runs))
            return rows[offset : offset + limit]


# ---------------------------------------------------------------------------
# Summary counts
# ---------------------------------------------------------------------------


def _count_table(table: str) -> int:
    if _backend == "sqlite" and _conn:
        try:
            row = _conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()  # noqa: S608
            return row[0] if row else 0
        except Exception:
            return 0
    mapping = {
        "proof_reports": _mem.proof_reports,
        "demo_runs": _mem.demo_runs,
        "policy_runs": _mem.policy_runs,
        "reorg_runs": _mem.reorg_runs,
    }
    return len(mapping.get(table, []))


def summary_counts() -> dict[str, Any]:
    with _lock:
        return {
            "proof_reports": _count_table("proof_reports"),
            "demo_runs": _count_table("demo_runs"),
            "policy_runs": _count_table("policy_runs"),
            "reorg_runs": _count_table("reorg_runs"),
            "storage_backend": _backend,
            "storage_up": storage_up(),
            "init_error": _init_error,
        }
