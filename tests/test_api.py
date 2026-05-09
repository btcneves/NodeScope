from __future__ import annotations

import json
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from api.app import (
    app,
    classifications,
    demo,
    demo_step,
    health,
    history_export_csv,
    history_export_json,
    latest_block,
    latest_tx,
    mempool_summary,
    recent_events,
    root,
    stream_events,
    summary,
    tx_by_id,
)
from api.rpc import RPCError
from api.service import get_cluster_compatibility, get_cluster_mempool_visual, iter_live_events_sse
from engine.snapshot import load_snapshot

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_FILE = ROOT / "tests" / "fixtures" / "monitor-sample.ndjson"


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

    def test_demo_step_allows_success_with_null_error_field(self) -> None:
        with patch("api.app.run_step") as mock_run_step:
            mock_run_step.return_value = {
                "id": "check_rpc",
                "title": "Check Bitcoin Core RPC",
                "status": "success",
                "friendly_message": "RPC OK",
                "technical_output": {"chain": "regtest"},
                "timestamp": "2026-05-07T00:00:00+00:00",
                "error": None,
                "data": {"rpc_ok": True},
            }
            result = demo_step("check_rpc")
        self.assertEqual(result["status"], "success")
        self.assertIsNone(result["error"])

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
                "chain": "regtest",
                "blocks": 101,
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
                "size": 5,
                "bytes": 2000,
                "usage": 10000,
                "maxmempool": 300000000,
                "mempoolminfee": 0.00001,
                "minrelaytxfee": 0.00001,
            }
            data = mempool_summary()
        self.assertTrue(data["rpc_ok"])
        self.assertEqual(data["size"], 5)
        self.assertIsNone(data["error"])

    def test_cluster_compatibility_rejects_pre_31_core(self) -> None:
        with patch("api.service.get_client") as mock_get:
            client = mock_get.return_value
            client.getnetworkinfo.return_value = {
                "subversion": "/Satoshi:28.4.0/",
                "version": 280400,
            }
            data = get_cluster_compatibility()

        self.assertFalse(data["supported"])
        self.assertEqual(data["bitcoin_core_version"], "/Satoshi:28.4.0/")
        self.assertIn("31.0", data["note"])
        self.assertTrue(all(not item["supported"] for item in data["rpcs"]))
        client.call.assert_not_called()

    def test_cluster_compatibility_uses_help_probe_on_31_core(self) -> None:
        with patch("api.service.get_client") as mock_get:
            client = mock_get.return_value
            client.getnetworkinfo.return_value = {
                "subversion": "/Satoshi:31.0.0/",
                "version": 310000,
            }
            client.call.return_value = "help text"
            data = get_cluster_compatibility()

        self.assertTrue(data["supported"])
        self.assertIsNone(data["note"])
        client.call.assert_any_call("help", ["getmempoolcluster"])
        client.call.assert_any_call("help", ["getmempoolfeeratediagram"])

    def test_mempool_clusters_use_native_rpc_when_available(self) -> None:
        with patch("api.service.get_client") as mock_get:
            client = mock_get.return_value
            client.getrawmempool.return_value = {
                "parent": {
                    "vsize": 100,
                    "fees": {"base": 0.00001},
                    "depends": [],
                    "spentby": ["child"],
                },
                "child": {
                    "vsize": 120,
                    "fees": {"base": 0.00003},
                    "depends": ["parent"],
                    "spentby": [],
                },
            }
            client.call.side_effect = [
                "help text",
                {
                    "clusterweight": 880,
                    "txcount": 2,
                    "chunks": [{"chunkfee": 4000, "chunkweight": 880, "txs": ["parent", "child"]}],
                },
                {
                    "clusterweight": 880,
                    "txcount": 2,
                    "chunks": [{"chunkfee": 4000, "chunkweight": 880, "txs": ["parent", "child"]}],
                },
            ]

            data = get_cluster_mempool_visual()

        self.assertTrue(data["rpc_ok"])
        self.assertEqual(data["cluster_count"], 1)
        self.assertEqual(data["clusters"][0]["id"], "native-cluster-1")
        self.assertEqual([tx["txid"] for tx in data["clusters"][0]["txs"]], ["parent", "child"])
        self.assertEqual(data["clusters"][0]["total_vsize"], 220)
        client.call.assert_any_call("help", ["getmempoolcluster"])
        client.call.assert_any_call("getmempoolcluster", ["parent"])
        client.call.assert_any_call("getmempoolcluster", ["child"])

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
        self.assertEqual(
            data["coinbase_input_present_count"], snapshot.analytics.coinbase_input_present_count
        )
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

    def test_tx_by_id_returns_transaction_when_found(self) -> None:
        tx_data = latest_tx(file=str(FIXTURE_FILE))
        self.assertIsNotNone(tx_data)
        txid = tx_data["txid"]

        result = tx_by_id(txid=txid, file=str(FIXTURE_FILE))
        self.assertEqual(result["txid"], txid)
        self.assertIn("kind", result)
        self.assertIn("metadata", result)
        self.assertIn("inputs", result)
        self.assertIn("outputs", result)

    def test_tx_by_id_raises_404_when_not_found(self) -> None:
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as ctx:
            tx_by_id(txid="nonexistenttxid0000", file=str(FIXTURE_FILE))
        self.assertEqual(ctx.exception.status_code, 404)

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


class HistoryExportTests(unittest.TestCase):
    def test_export_json_returns_response_with_correct_media_type(self) -> None:
        response = history_export_json()
        self.assertEqual(response.media_type, "application/json")
        self.assertIn("nodescope-history.json", response.headers.get("content-disposition", ""))

    def test_export_json_body_is_valid_json(self) -> None:
        response = history_export_json()
        payload = json.loads(response.body)
        self.assertIn("metadata", payload)
        self.assertIn("proof_reports", payload)
        self.assertIn("demo_runs", payload)
        self.assertIn("policy_runs", payload)
        self.assertIn("reorg_runs", payload)

    def test_export_json_metadata_has_required_keys(self) -> None:
        response = history_export_json()
        meta = json.loads(response.body)["metadata"]
        self.assertIn("generated_at", meta)
        self.assertIn("project", meta)
        self.assertIn("counts", meta)
        self.assertIn("filters", meta)
        self.assertEqual(meta["project"], "NodeScope")

    def test_export_json_empty_store_returns_empty_lists(self) -> None:
        response = history_export_json()
        payload = json.loads(response.body)
        self.assertIsInstance(payload["proof_reports"], list)
        self.assertIsInstance(payload["demo_runs"], list)
        self.assertIsInstance(payload["policy_runs"], list)
        self.assertIsInstance(payload["reorg_runs"], list)

    def test_export_csv_returns_response_with_correct_media_type(self) -> None:
        response = history_export_csv()
        self.assertEqual(response.media_type, "text/csv")
        self.assertIn("nodescope-history.csv", response.headers.get("content-disposition", ""))

    def test_export_csv_body_has_header_row(self) -> None:
        response = history_export_csv()
        first_line = response.body.decode().splitlines()[0]
        self.assertIn("table", first_line)
        self.assertIn("id", first_line)
        self.assertIn("status", first_line)
        self.assertIn("created_at", first_line)

    def test_export_csv_empty_store_returns_only_header(self) -> None:
        response = history_export_csv()
        lines = [line for line in response.body.decode().splitlines() if line.strip()]
        self.assertEqual(len(lines), 1)

    def test_export_json_source_filter_is_reflected_in_metadata(self) -> None:
        response = history_export_json(source="demo")
        meta = json.loads(response.body)["metadata"]
        self.assertEqual(meta["filters"]["source"], "demo")

    def test_export_json_success_filter_is_reflected_in_metadata(self) -> None:
        response = history_export_json(success=True)
        meta = json.loads(response.body)["metadata"]
        self.assertEqual(meta["filters"]["success"], True)


if __name__ == "__main__":
    unittest.main()
