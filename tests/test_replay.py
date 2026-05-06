from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ReplayScriptTests(unittest.TestCase):
    def test_replay_script_emits_coherent_summary(self) -> None:
        fixture = "\n".join(
            [
                '{"ts":"2026-04-22T23:37:43+00:00","level":"info","origin":"monitor","event":"monitor_start","data":{"sockets":["rawtx:28333","rawblock:28332"]}}',
                '{"ts":"2026-04-22T23:37:45+00:00","level":"info","origin":"rawtx","event":"zmq_rawtx","data":{"txid":"tx-1","inputs":1,"outputs":2,"total_out":50.0,"vout":[{"value":50.0,"address":"bcrt1coinbase"},{"value":0.0,"address":null}]}}',
                '{"ts":"2026-04-22T23:37:46+00:00","level":"info","origin":"rawblock","event":"zmq_rawblock","data":{"height":3,"hash":"hash-3"}}',
            ]
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            log_file = Path(tmp_dir) / "sample.ndjson"
            log_file.write_text(fixture, encoding="utf-8")

            result = subprocess.run(
                [sys.executable, "scripts/replay_monitor_log.py", "--file", str(log_file)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                check=True,
            )

        stdout = result.stdout
        self.assertIn("NodeScope Engine", stdout)
        self.assertIn("Total eventos:  3", stdout)
        self.assertIn("zmq_rawtx:    1", stdout)
        self.assertIn("zmq_rawblock: 1", stdout)
        self.assertIn("coinbase_like: 1", stdout)
        self.assertIn("block_event: 1", stdout)
        self.assertIn("coinbase_input_present=0", stdout)
        self.assertIn("has_op_return=0", stdout)


if __name__ == "__main__":
    unittest.main()
