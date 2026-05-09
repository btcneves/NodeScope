from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from api import demo_service
from api.rpc import RPCError

ROOT = Path(__file__).resolve().parents[1]


class DemoAssetTests(unittest.TestCase):
    def test_demo_static_assets_exist_and_reference_api_features(self) -> None:
        html = (ROOT / "api" / "static" / "demo.html").read_text(encoding="utf-8")
        css = (ROOT / "api" / "static" / "demo.css").read_text(encoding="utf-8")
        js = (ROOT / "api" / "static" / "demo.js").read_text(encoding="utf-8")

        self.assertIn("NodeScope Demo", html)
        self.assertIn("/static/demo.js", html)
        self.assertIn("/summary", js)
        self.assertIn("/events/recent", js)
        self.assertIn("/events/classifications", js)
        self.assertIn("/events/stream", js)
        self.assertIn("EventSource", js)
        self.assertIn("script_type_counts", js)
        self.assertIn("coinbase_input_present_count", js)
        self.assertIn("op_return_count", js)
        self.assertIn("event_type", js)
        self.assertIn("kind", js)
        self.assertIn("Tempo real", html)
        self.assertIn(".hero", css)
        self.assertIn(".stream-chip", css)


class DemoDetectionTests(unittest.TestCase):
    def test_find_zmq_event_reads_matching_ndjson_event(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            event_log = Path(tmp) / "monitor.ndjson"
            event_log.write_text(
                '{"event":"zmq_rawblock","data":{"hash":"block-1"},"ts":"2026-05-09T00:00:00+00:00"}\n',
                encoding="utf-8",
            )

            with mock.patch.dict(os.environ, {"NODESCOPE_LOG_DIR": tmp}):
                ev = demo_service._find_zmq_event("zmq_rawblock", "hash", "block-1")

        self.assertIsNotNone(ev)
        self.assertEqual(ev["data"]["hash"], "block-1")

    def test_wait_for_mempool_entry_retries_transient_rpc_miss(self) -> None:
        class FakeRPC:
            def __init__(self) -> None:
                self.calls = 0

            def getmempoolentry(self, txid: str) -> dict:
                self.calls += 1
                if self.calls == 1:
                    raise RPCError("not in mempool yet")
                return {"txid": txid, "vsize": 141, "fees": {"base": 0.00000141}}

        rpc = FakeRPC()

        with mock.patch.object(demo_service, "DETECT_POLL_INTERVAL_SECONDS", 0):
            entry = demo_service._wait_for_mempool_entry(rpc, "tx-demo", timeout=1)

        self.assertEqual(entry["txid"], "tx-demo")
        self.assertEqual(rpc.calls, 2)


if __name__ == "__main__":
    unittest.main()
