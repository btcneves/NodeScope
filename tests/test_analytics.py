from __future__ import annotations

import unittest
from pathlib import Path

from engine.snapshot import load_snapshot

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_FILE = ROOT / "tests" / "fixtures" / "monitor-sample.ndjson"


class AnalyticsTests(unittest.TestCase):
    def test_snapshot_analytics_counts_expected_metrics(self) -> None:
        snapshot = load_snapshot(file=FIXTURE_FILE)

        self.assertEqual(snapshot.analytics.total_events, 10)
        self.assertEqual(
            snapshot.analytics.event_type_counts,
            {
                "monitor_start": 1,
                "monitor_stop": 1,
                "zmq_rawblock": 4,
                "zmq_rawtx": 4,
            },
        )
        self.assertEqual(
            snapshot.analytics.classification_counts,
            {
                "block_event": 4,
                "coinbase_like": 3,
                "simple_payment_like": 1,
            },
        )
        self.assertEqual(snapshot.analytics.coinbase_input_present_count, 2)
        self.assertEqual(snapshot.analytics.op_return_count, 2)
        self.assertEqual(
            snapshot.analytics.script_type_counts,
            {
                "nulldata": 2,
                "witness_v0_keyhash": 2,
            },
        )


if __name__ == "__main__":
    unittest.main()
