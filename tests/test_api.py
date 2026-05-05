from __future__ import annotations

import unittest
from pathlib import Path
import tempfile
import threading
import time

from unittest.mock import patch

from api.app import (
    app,
    classifications,
    demo,
    health,
    latest_block,
    latest_tx,
    mempool_summary,
    recent_events,
    root,
    stream_events,
    summary,
)
from api.rpc import RPCError
from api.service import iter_live_events_sse
from engine.snapshot import load_snapshot


FIXTURE_FILE = Path("/home/btcneves/corecraft/tests/fixtures/monitor-sample.ndjson")


class ApiTests(unittest.TestCase):
    def test_app_metadata(self) -> None:
        self.assertEqual(app.title, "NodeScope API")

    def test_demo_routes_exist(self) -> None:
        root_response = root()
        demo_response = demo()
        self.assertEqual(root_response.status_code, 307)
        self.assertEqual(root_response.headers["location"], "/demo")
        self.assertEqual(str(demo_response.path).endswith("api/static/demo.html"), True)
        stream_response = stream_events(file=str(FIXTURE_FILE))
        self.assertEqual(stream_response.media_type, "text/event-stream")

    def test_health_endpoint(self) -> None:
        with patch("api.service.get_client") as mock_get:
            mock_get.return_value.getblockchaininfo.side_effect = RPCError("offline")
            data = health(file=str(FIXTURE_FILE))
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["project"], "NodeScope")
        self.assertEqual(data["storage"], "ndjson_append_only")
        self.assertFalse(data["rpc_ok"])

    def test_health_endpoint_with_rpc(self) -> None:
        with patch("api.service.get_client") as mock_get:
            mock_get.return_value.getblockchaininfo.return_value = {
                "chain": "regtest", "blocks": 101,
            }
            data = health(file=str(FIXTURE_FILE))
        self.assertTrue(data["rpc_ok"])
        self.assertEqual(data["chain"], "regtest")
        self.assertEqual(data["blocks"], 101)

    def test_mempool_summary_rpc_offline(self) -> None:
        with patch("api.service.get_client") as mock_get:
            mock_get.return_value.getmempoolinfo.side_effect = RPCError("offline")
            data = mempool_summary()
        self.assertFalse(data["rpc_ok"])
        self.assertEqual(data["size"], 0)

    def test_mempool_summary_rpc_online(self) -> None:
        with patch("api.service.get_client") as mock_get:
            mock_get.return_value.getmempoolinfo.return_value = {
                "size": 5, "bytes": 2000, "usage": 10000,
                "maxmempool": 300000000, "mempoolminfee": 0.00001,
                "minrelaytxfee": 0.00001,
            }
            data = mempool_summary()
        self.assertTrue(data["rpc_ok"])
        self.assertEqual(data["size"], 5)
        self.assertIsNone(data["error"])

    def test_summary_endpoint(self) -> None:
        data = summary(file=str(FIXTURE_FILE))
        snapshot = load_snapshot(file=FIXTURE_FILE)
        self.assertEqual(data["total_events"], 10)
        self.assertEqual(data["rawtx_count"], 4)
        self.assertEqual(data["rawblock_count"], 4)
        self.assertIn("zmq_rawtx", data["available_event_types"])
        self.assertIn("coinbase_like", data["classification_counts"])
        self.assertEqual(data["coinbase_input_present_count"], 2)
        self.assertEqual(data["op_return_count"], 2)
        self.assertEqual(data["script_type_counts"], {"nulldata": 2, "witness_v0_keyhash": 2})
        self.assertEqual(data["classification_counts"], snapshot.analytics.classification_counts)
        self.assertEqual(data["event_type_counts"], snapshot.analytics.event_type_counts)
        self.assertEqual(data["coinbase_input_present_count"], snapshot.analytics.coinbase_input_present_count)
        self.assertEqual(data["op_return_count"], snapshot.analytics.op_return_count)
        self.assertEqual(data["script_type_counts"], snapshot.analytics.script_type_counts)

    def test_recent_events_endpoint(self) -> None:
        data = recent_events(file=str(FIXTURE_FILE), limit=3, offset=0, event_type=None)
        self.assertEqual(data["limit"], 3)
        self.assertEqual(len(data["items"]), 3)
        self.assertEqual(data["offset"], 0)

    def test_recent_events_supports_filter_and_offset(self) -> None:
        data = recent_events(
            file=str(FIXTURE_FILE),
            event_type="zmq_rawblock",
            limit=2,
            offset=1,
        )
        self.assertEqual(data["event_type"], "zmq_rawblock")
        self.assertEqual(data["total_items"], 4)
        self.assertEqual(data["offset"], 1)
        self.assertEqual(len(data["items"]), 2)
        self.assertTrue(all(item["event"] == "zmq_rawblock" for item in data["items"]))

    def test_classifications_and_latest_endpoints(self) -> None:
        class_data = classifications(file=str(FIXTURE_FILE), limit=5, offset=0, kind=None)
        block_data = latest_block(file=str(FIXTURE_FILE))
        tx_data = latest_tx(file=str(FIXTURE_FILE))

        self.assertIn("block_event", class_data["counts"])
        self.assertEqual(block_data["height"], 6)
        self.assertEqual(tx_data["kind"], "coinbase_like")
        self.assertEqual(tx_data["txid"], "tx-4")
        self.assertIn("confidence", tx_data["metadata"])
        self.assertIn("reason", tx_data["metadata"])
        self.assertIn("signals", tx_data["metadata"])
        self.assertIn("coinbase_input_present", tx_data)
        self.assertIn("script_types", tx_data)
        self.assertIn("has_op_return", tx_data)
        self.assertTrue(tx_data["coinbase_input_present"])

    def test_classifications_supports_filter_and_offset(self) -> None:
        data = classifications(
            file=str(FIXTURE_FILE),
            kind="coinbase_like",
            limit=2,
            offset=1,
        )
        self.assertEqual(data["kind"], "coinbase_like")
        self.assertEqual(data["total_items"], 3)
        self.assertEqual(data["offset"], 1)
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(data["counts"], {"coinbase_like": 3})
        self.assertIn("block_event", data["total_counts"])
        self.assertTrue(all(item["kind"] == "coinbase_like" for item in data["items"]))
        self.assertTrue(all("confidence" in item["metadata"] for item in data["items"]))
        self.assertTrue(all("signals" in item["metadata"] for item in data["items"]))
        self.assertTrue(all("has_zero_value_output" in item["metadata"] for item in data["items"]))
        self.assertTrue(all("coinbase_input_present" in item["metadata"] for item in data["items"]))

    def test_live_sse_stream_emits_appended_rawtx_event(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            log_file = Path(tmp_dir) / "live.ndjson"
            log_file.write_text("", encoding="utf-8")

            def append_event() -> None:
                time.sleep(0.05)
                log_file.write_text(
                    '{"ts":"2026-04-22T23:59:00+00:00","level":"info","origin":"rawtx","event":"zmq_rawtx","data":{"txid":"live-tx","inputs":1,"outputs":1,"total_out":1.25,"vout":[{"value":1.25,"address":"bcrt1live"}]}}\n',
                    encoding="utf-8",
                )

            thread = threading.Thread(target=append_event, daemon=True)
            thread.start()

            stream = iter_live_events_sse(
                file=log_file,
                poll_interval=0.01,
                heartbeat_interval=60.0,
                max_events=1,
                start_at_end=True,
            )

            opening_chunk = next(stream)
            event_chunk = next(stream)
            thread.join(timeout=1.0)

            self.assertIn("event: stream_open", opening_chunk)
            self.assertIn("event: nodescope_event", event_chunk)
            self.assertIn('"txid": "live-tx"', event_chunk)
            self.assertIn('"kind": "simple_payment_like"', event_chunk)


if __name__ == "__main__":
    unittest.main()
