from __future__ import annotations

import unittest
from pathlib import Path

from engine.snapshot import load_snapshot

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_FILE = ROOT / "tests" / "fixtures" / "monitor-sample.ndjson"


class SnapshotTests(unittest.TestCase):
    def test_load_snapshot_consolidates_engine_state(self) -> None:
        snapshot = load_snapshot(file=FIXTURE_FILE)

        self.assertEqual(snapshot.source, FIXTURE_FILE)
        self.assertEqual(snapshot.reader_stats.total_lines, 10)
        self.assertEqual(snapshot.reader_stats.ignored_lines, 0)
        self.assertEqual(len(snapshot.events), 10)
        self.assertEqual(len(snapshot.classifications), 8)
        self.assertEqual(snapshot.skipped_events, 2)
        self.assertIsNotNone(snapshot.latest_block)
        self.assertIsNotNone(snapshot.latest_tx)
        assert snapshot.latest_block is not None
        assert snapshot.latest_tx is not None
        self.assertEqual(snapshot.latest_block.block.height, 6)
        self.assertEqual(snapshot.latest_tx.tx.txid, "tx-4")
        self.assertEqual(snapshot.rawtx_count, 4)
        self.assertEqual(snapshot.rawblock_count, 4)
        self.assertEqual(snapshot.other_count, 2)


if __name__ == "__main__":
    unittest.main()
