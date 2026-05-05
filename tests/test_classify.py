from __future__ import annotations

import unittest

from engine.classify import classify
from engine.models import RawEvent


class ClassifyTests(unittest.TestCase):
    def test_classify_coinbase_like(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "coinbase-1",
                "inputs": 1,
                "outputs": 2,
                "total_out": 50.0,
                "vout": [
                    {"value": 50.0, "address": "bcrt1coinbase"},
                    {"value": 0.0, "address": None},
                ],
            },
        )

        result = classify(event)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.kind, "coinbase_like")
        self.assertEqual(result.metadata["confidence"], "low")
        self.assertTrue(result.metadata["has_zero_value_output"])
        self.assertTrue(result.metadata["has_null_address"])
        self.assertEqual(result.metadata["address_count"], 1)
        self.assertTrue(result.metadata["signals"]["one_input"])
        self.assertIsNone(result.metadata["coinbase_input_present"])

    def test_classify_simple_payment_like(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "payment-1",
                "inputs": 2,
                "outputs": 1,
                "total_out": 1.5,
                "vout": [{"value": 1.5, "address": "bcrt1payment"}],
            },
        )

        result = classify(event)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.kind, "simple_payment_like")
        self.assertEqual(result.metadata["confidence"], "medium")
        self.assertFalse(result.metadata["has_zero_value_output"])
        self.assertFalse(result.metadata["has_null_address"])
        self.assertEqual(result.metadata["address_count"], 1)
        self.assertEqual(result.metadata["script_types"], [])
        self.assertFalse(result.metadata["has_op_return"])

    def test_classify_coinbase_like_with_explicit_coinbase_signal(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:01+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "coinbase-2",
                "inputs": 1,
                "outputs": 2,
                "total_out": 50.0,
                "coinbase_input_present": True,
                "addressed_output_count": 1,
                "unattributed_output_count": 1,
                "zero_value_output_count": 1,
                "positive_output_count": 1,
                "script_types": ["witness_v0_keyhash", "nulldata"],
                "has_op_return": True,
                "vout": [
                    {"value": 50.0, "address": "bcrt1coinbase"},
                    {"value": 0.0, "address": None},
                ],
            },
        )

        result = classify(event)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.kind, "coinbase_like")
        self.assertEqual(result.metadata["confidence"], "medium")
        self.assertTrue(result.metadata["coinbase_input_present"])
        self.assertTrue(result.metadata["has_op_return"])
        self.assertEqual(result.metadata["script_types"], ["nulldata", "witness_v0_keyhash"])
        self.assertIn("vin coinbase observado", result.metadata["reason"])

    def test_classify_block_event(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:02+00:00",
            level="info",
            origin="rawblock",
            event="zmq_rawblock",
            data={"height": 6, "hash": "blockhash"},
        )

        result = classify(event)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.kind, "block_event")
        self.assertEqual(result.metadata["confidence"], "medium")
        self.assertTrue(result.metadata["signals"]["has_height"])
        self.assertTrue(result.metadata["signals"]["has_hash"])

    def test_classify_complex_transaction(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:03+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "complex-1",
                "inputs": 2,
                "outputs": 2,
                "total_out": 4.0,
                "vout": [
                    {"value": 2.0, "address": "bcrt1a"},
                    {"value": 2.0, "address": "bcrt1b"},
                ],
            },
        )

        result = classify(event)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.kind, "complex_transaction")
        self.assertEqual(result.metadata["confidence"], "medium")
        self.assertEqual(result.metadata["address_count"], 2)
        self.assertIn("multiple positive outputs", result.metadata["reason"])
        self.assertFalse(result.metadata["coinbase_like_signal"])

    def test_classify_possible_op_return(self) -> None:
        event = RawEvent(
            ts="2026-04-22T00:00:04+00:00",
            level="info",
            origin="rawtx",
            event="zmq_rawtx",
            data={
                "txid": "op-return-1",
                "inputs": 1,
                "outputs": 2,
                "total_out": 0.1,
                "script_types": ["nulldata", "witness_v0_keyhash"],
                "has_op_return": True,
                "vout": [
                    {"value": 0.1, "address": "bcrt1payment"},
                    {"value": 0.0, "address": None},
                ],
            },
        )

        result = classify(event)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.kind, "possible_op_return")
        self.assertEqual(result.metadata["confidence"], "medium")
        self.assertTrue(result.metadata["has_op_return"])


if __name__ == "__main__":
    unittest.main()
