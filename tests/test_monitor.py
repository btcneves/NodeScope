from __future__ import annotations

import unittest

from monitor import build_rawtx_payload


class MonitorPayloadTests(unittest.TestCase):
    def test_build_rawtx_payload_extracts_enriched_signals(self) -> None:
        payload = build_rawtx_payload(
            {
                "txid": "coinbase-1",
                "vin": [{"coinbase": "abcd"}],
                "vout": [
                    {
                        "value": 50.0,
                        "scriptPubKey": {
                            "type": "witness_v0_keyhash",
                            "address": "bcrt1reward",
                        },
                    },
                    {
                        "value": 0.0,
                        "scriptPubKey": {
                            "type": "nulldata",
                        },
                    },
                ],
            }
        )

        self.assertEqual(payload["inputs"], 1)
        self.assertEqual(payload["outputs"], 2)
        self.assertTrue(payload["coinbase_input_present"])
        self.assertEqual(payload["addressed_output_count"], 1)
        self.assertEqual(payload["unattributed_output_count"], 1)
        self.assertEqual(payload["zero_value_output_count"], 1)
        self.assertEqual(payload["positive_output_count"], 1)
        self.assertEqual(payload["script_types"], ["nulldata", "witness_v0_keyhash"])
        self.assertTrue(payload["has_op_return"])
        self.assertEqual(payload["vout"][1]["address"], None)

    def test_build_rawtx_payload_handles_addresses_list(self) -> None:
        payload = build_rawtx_payload(
            {
                "txid": "payment-1",
                "vin": [{"txid": "prev", "vout": 0}],
                "vout": [
                    {
                        "value": 1.5,
                        "scriptPubKey": {
                            "type": "pubkeyhash",
                            "addresses": ["bcrt1payment"],
                        },
                    }
                ],
            }
        )

        self.assertFalse(payload["coinbase_input_present"])
        self.assertEqual(payload["addressed_output_count"], 1)
        self.assertEqual(payload["unattributed_output_count"], 0)
        self.assertFalse(payload["has_op_return"])
        self.assertEqual(payload["vout"][0]["address"], "bcrt1payment")


if __name__ == "__main__":
    unittest.main()
