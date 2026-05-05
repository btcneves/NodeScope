from __future__ import annotations

import unittest

from engine.models import RawEvent
from engine.parser import parse_block, parse_tx


class ParserTests(unittest.TestCase):
    def test_parse_tx_normalizes_values(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "tx-1",
                "inputs": "1",
                "outputs": "1",
                "total_out": "12.5",
                "vout": [{"value": "12.5", "address": "bcrt1example"}],
            },
        )

        tx = parse_tx(event)

        self.assertIsNotNone(tx)
        assert tx is not None
        self.assertEqual(tx.txid, "tx-1")
        self.assertEqual(tx.inputs, 1)
        self.assertEqual(tx.outputs, 1)
        self.assertEqual(tx.total_out, 12.5)
        self.assertEqual(tx.vout[0].address, "bcrt1example")
        self.assertIsNone(tx.coinbase_input_present)
        self.assertEqual(tx.addressed_output_count, 1)
        self.assertEqual(tx.unattributed_output_count, 0)
        self.assertEqual(tx.zero_value_output_count, 0)
        self.assertEqual(tx.positive_output_count, 1)
        self.assertEqual(tx.script_types, [])
        self.assertFalse(tx.has_op_return)

    def test_parse_block_normalizes_height(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:02+00:00",
            level="info",
            origin="rawblock",
            event="zmq_rawblock",
            data={"height": "6", "hash": "hash-1"},
        )

        block = parse_block(event)

        self.assertIsNotNone(block)
        assert block is not None
        self.assertEqual(block.height, 6)
        self.assertEqual(block.hash, "hash-1")

    def test_parse_tx_returns_none_when_txid_is_missing(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={"inputs": 1, "outputs": 1, "total_out": 10.0, "vout": []},
        )

        self.assertIsNone(parse_tx(event))

    def test_parse_tx_preserves_zero_value_and_null_address_shape(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "tx-2",
                "inputs": 1,
                "outputs": 2,
                "total_out": 50.0,
                "vout": [
                    {"value": 50.0, "address": "bcrt1reward"},
                    {"value": 0.0, "address": None},
                ],
            },
        )

        tx = parse_tx(event)

        self.assertIsNotNone(tx)
        assert tx is not None
        self.assertEqual(tx.vout[1].value, 0.0)
        self.assertIsNone(tx.vout[1].address)
        self.assertEqual(tx.addressed_output_count, 1)
        self.assertEqual(tx.unattributed_output_count, 1)
        self.assertEqual(tx.zero_value_output_count, 1)
        self.assertEqual(tx.positive_output_count, 1)

    def test_parse_tx_reads_enriched_monitor_fields(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "tx-3",
                "inputs": 1,
                "outputs": 2,
                "vin_count": 1,
                "vout_count": 2,
                "total_out": 50.0,
                "coinbase_input_present": True,
                "addressed_output_count": 1,
                "unattributed_output_count": 1,
                "zero_value_output_count": 1,
                "positive_output_count": 1,
                "script_types": ["witness_v0_keyhash", "nulldata"],
                "has_op_return": True,
                "vout": [
                    {"value": 50.0, "address": "bcrt1reward"},
                    {"value": 0.0, "address": None},
                ],
            },
        )

        tx = parse_tx(event)

        self.assertIsNotNone(tx)
        assert tx is not None
        self.assertTrue(tx.coinbase_input_present)
        self.assertEqual(tx.addressed_output_count, 1)
        self.assertEqual(tx.unattributed_output_count, 1)
        self.assertEqual(tx.zero_value_output_count, 1)
        self.assertEqual(tx.positive_output_count, 1)
        self.assertEqual(tx.script_types, ["nulldata", "witness_v0_keyhash"])
        self.assertTrue(tx.has_op_return)


if __name__ == "__main__":
    unittest.main()
