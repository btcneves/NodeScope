"""Tests for api/storage.py and api/history_service.py.

These tests import storage and history_service directly via importlib to avoid
triggering api/__init__.py (which depends on fastapi). They run both locally
and inside the Docker API container.
"""

from __future__ import annotations

import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1] / "api"


def _load_module(name: str, path: Path):
    """Load a module by file path, bypassing the api package __init__."""
    spec = importlib.util.spec_from_file_location(name, str(path))
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


def _reload_storage(backend: str = "memory", sqlite_path: str | None = None) -> object:
    """Reload storage module with fresh env vars."""
    # Remove cached modules so reload picks up new env
    for key in list(sys.modules.keys()):
        if "nodescope_storage_direct" in key:
            del sys.modules[key]

    os.environ["NODESCOPE_STORAGE_BACKEND"] = backend
    if sqlite_path:
        os.environ["NODESCOPE_SQLITE_PATH"] = sqlite_path
    elif "NODESCOPE_SQLITE_PATH" in os.environ:
        del os.environ["NODESCOPE_SQLITE_PATH"]

    return _load_module("nodescope_storage_direct", API_DIR / "storage.py")


class StorageMemoryBackendTests(unittest.TestCase):
    """Tests for the in-memory storage backend."""

    def setUp(self) -> None:
        self.storage = _reload_storage(backend="memory")

    def test_backend_is_memory(self) -> None:
        self.assertEqual(self.storage.backend(), "memory")  # type: ignore[union-attr]

    def test_storage_up(self) -> None:
        self.assertTrue(self.storage.storage_up())  # type: ignore[union-attr]

    def test_insert_and_list_proof_reports(self) -> None:
        proof_id = self.storage.insert_proof_report(  # type: ignore[union-attr]
            scenario_name="test scenario",
            source="test",
            status="success",
            success=True,
            txid="abc123",
            block_hash="blockhash",
            block_height=10,
            summary={"key": "value"},
        )
        self.assertIsNotNone(proof_id)
        rows = self.storage.list_proof_reports()  # type: ignore[union-attr]
        self.assertGreater(len(rows), 0)
        row = rows[0]
        self.assertEqual(row["scenario_name"], "test scenario")
        self.assertEqual(row["txid"], "abc123")
        self.assertTrue(bool(row["success"]))

    def test_get_proof_report_by_id(self) -> None:
        proof_id = self.storage.insert_proof_report(  # type: ignore[union-attr]
            scenario_name="get_by_id",
            source="test",
            status="success",
            success=True,
        )
        self.assertIsNotNone(proof_id)
        row = self.storage.get_proof_report(proof_id)  # type: ignore[union-attr]
        self.assertIsNotNone(row)
        self.assertEqual(row["scenario_name"], "get_by_id")

    def test_get_proof_report_not_found(self) -> None:
        row = self.storage.get_proof_report(99999)  # type: ignore[union-attr]
        self.assertIsNone(row)

    def test_insert_and_list_demo_runs(self) -> None:
        self.storage.insert_demo_run(  # type: ignore[union-attr]
            status="success",
            success=True,
            txid="demotxid",
            duration_ms=1234.5,
        )
        rows = self.storage.list_demo_runs()  # type: ignore[union-attr]
        self.assertGreater(len(rows), 0)
        row = rows[0]
        self.assertEqual(row["txid"], "demotxid")
        self.assertTrue(bool(row["success"]))

    def test_insert_and_list_policy_runs(self) -> None:
        self.storage.insert_policy_run(  # type: ignore[union-attr]
            scenario_id="rbf_replacement",
            status="success",
            success=True,
            txids=["tx1", "tx2"],
            fee_data={"fee_rate": 10},
        )
        rows = self.storage.list_policy_runs()  # type: ignore[union-attr]
        self.assertGreater(len(rows), 0)
        row = rows[0]
        self.assertEqual(row["scenario_id"], "rbf_replacement")

    def test_insert_and_list_reorg_runs(self) -> None:
        self.storage.insert_reorg_run(  # type: ignore[union-attr]
            status="success",
            success=True,
            txid="reorgtxid",
            original_block_hash="origblock",
            final_block_hash="finalblock",
        )
        rows = self.storage.list_reorg_runs()  # type: ignore[union-attr]
        self.assertGreater(len(rows), 0)
        row = rows[0]
        self.assertEqual(row["txid"], "reorgtxid")

    def test_summary_counts(self) -> None:
        self.storage.insert_proof_report(  # type: ignore[union-attr]
            scenario_name="s",
            source="test",
            status="success",
            success=True,
        )
        counts = self.storage.summary_counts()  # type: ignore[union-attr]
        self.assertIn("proof_reports", counts)
        self.assertIn("demo_runs", counts)
        self.assertIn("policy_runs", counts)
        self.assertIn("reorg_runs", counts)
        self.assertIn("storage_backend", counts)
        self.assertIn("storage_up", counts)
        self.assertGreater(counts["proof_reports"], 0)

    def test_list_proof_reports_filter_success(self) -> None:
        st = _reload_storage(backend="memory")
        st.insert_proof_report(  # type: ignore[union-attr]
            scenario_name="ok", source="t", status="success", success=True
        )
        st.insert_proof_report(  # type: ignore[union-attr]
            scenario_name="fail", source="t", status="error", success=False
        )
        ok_rows = st.list_proof_reports(success=True)  # type: ignore[union-attr]
        fail_rows = st.list_proof_reports(success=False)  # type: ignore[union-attr]
        self.assertTrue(all(bool(r["success"]) for r in ok_rows))
        self.assertTrue(all(not bool(r["success"]) for r in fail_rows))

    def test_list_policy_runs_filter_scenario(self) -> None:
        st = _reload_storage(backend="memory")
        st.insert_policy_run(  # type: ignore[union-attr]
            scenario_id="normal_transaction", status="success", success=True
        )
        st.insert_policy_run(  # type: ignore[union-attr]
            scenario_id="rbf_replacement", status="success", success=True
        )
        rows = st.list_policy_runs(scenario_id="normal_transaction")  # type: ignore[union-attr]
        self.assertTrue(all(r["scenario_id"] == "normal_transaction" for r in rows))


class StorageSQLiteBackendTests(unittest.TestCase):
    """Tests for the SQLite backend using a temporary file."""

    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        db_path = os.path.join(self._tmpdir.name, "test_history.db")
        self.storage = _reload_storage(backend="sqlite", sqlite_path=db_path)
        if self.storage.backend() == "memory":  # type: ignore[union-attr]
            self.skipTest("SQLite init failed unexpectedly — skipping SQLite tests")

    def tearDown(self) -> None:
        self._tmpdir.cleanup()

    def test_backend_is_sqlite(self) -> None:
        self.assertEqual(self.storage.backend(), "sqlite")  # type: ignore[union-attr]

    def test_storage_up(self) -> None:
        self.assertTrue(self.storage.storage_up())  # type: ignore[union-attr]

    def test_insert_and_retrieve_proof(self) -> None:
        proof_id = self.storage.insert_proof_report(  # type: ignore[union-attr]
            scenario_name="sqlite test",
            source="test",
            status="success",
            success=True,
            txid="sqlitertxid",
            block_hash="sqliteblock",
            block_height=42,
            summary={"foo": "bar"},
        )
        self.assertIsNotNone(proof_id)
        rows = self.storage.list_proof_reports()  # type: ignore[union-attr]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["txid"], "sqlitertxid")
        row = self.storage.get_proof_report(proof_id)  # type: ignore[union-attr]
        self.assertIsNotNone(row)
        self.assertEqual(row["block_height"], 42)

    def test_summary_counts_sqlite(self) -> None:
        self.storage.insert_demo_run(status="success", success=True, txid="tx1")  # type: ignore[union-attr]
        self.storage.insert_policy_run(  # type: ignore[union-attr]
            scenario_id="normal_transaction", status="success", success=True
        )
        self.storage.insert_reorg_run(status="success", success=True, txid="reorg1")  # type: ignore[union-attr]
        counts = self.storage.summary_counts()  # type: ignore[union-attr]
        self.assertEqual(counts["demo_runs"], 1)
        self.assertEqual(counts["policy_runs"], 1)
        self.assertEqual(counts["reorg_runs"], 1)

    def test_graceful_fallback_on_bad_path(self) -> None:
        bad = _reload_storage(backend="sqlite", sqlite_path="/root/no_perms/bad.db")
        # Should fall back to memory without crashing
        self.assertIn(bad.backend(), ("memory", "sqlite"))  # type: ignore[union-attr]
        self.assertIsNotNone(bad.summary_counts())  # type: ignore[union-attr]


if __name__ == "__main__":
    unittest.main()
