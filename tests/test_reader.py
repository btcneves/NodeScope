from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from engine.models import ReaderStats
from engine.reader import iter_events


class ReaderTests(unittest.TestCase):
    def test_iter_events_reads_valid_ndjson_and_counts_ignored_lines(self) -> None:
        payload = (
            "\n".join(
                [
                    '{"ts":"2026-04-22T00:00:00+00:00","level":"info","origin":"monitor","event":"monitor_start","data":{}}',
                    '{"ts":"2026-04-22T00:00:01+00:00","level":"info","origin":"rawtx","event":"zmq_rawtx","data":{"txid":"abc","inputs":1,"outputs":1,"total_out":1.0,"vout":[{"value":1.0,"address":"bcrt1test"}]}}',
                    '{"ts":"broken"',
                    '{"ts":"2026-04-22T00:00:02+00:00","level":"info","origin":"rawblock","event":"zmq_rawblock","data":[]}',
                    "",
                ]
            )
            + "\n"
        )
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "sample.ndjson"
            path.write_text(payload, encoding="utf-8")

            stats = ReaderStats()
            events = list(iter_events(path, stats=stats))

        self.assertEqual(len(events), 2)
        self.assertEqual(stats.total_lines, 5)
        self.assertEqual(stats.invalid_json_lines, 1)
        self.assertEqual(stats.invalid_shape_lines, 1)
        self.assertEqual(stats.blank_lines, 1)
        self.assertEqual(stats.ignored_lines, 3)


if __name__ == "__main__":
    unittest.main()
