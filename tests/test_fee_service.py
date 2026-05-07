"""Tests for the fee estimation service."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from api.fee_service import (
    _BTC_KVB_TO_SAT_VB,
    _convert_feerate,
    _estimate_target,
    get_fee_estimates,
)
from api.rpc import RPCError


class ConversionTests(unittest.TestCase):
    """Unit tests for BTC/kvB → sat/vB conversion."""

    def test_constant_value(self):
        self.assertEqual(_BTC_KVB_TO_SAT_VB, 100_000)

    def test_one_sat_per_vb(self):
        # 1 sat/vB == 0.00001 BTC/kvB
        result = _convert_feerate(0.00001)
        self.assertAlmostEqual(result, 1.0, places=4)

    def test_ten_sat_per_vb(self):
        result = _convert_feerate(0.0001)
        self.assertAlmostEqual(result, 10.0, places=4)

    def test_typical_mainnet_rate(self):
        # 20 sat/vB → 0.0002 BTC/kvB
        result = _convert_feerate(0.0002)
        self.assertAlmostEqual(result, 20.0, places=4)

    def test_zero_feerate(self):
        result = _convert_feerate(0.0)
        self.assertAlmostEqual(result, 0.0, places=4)


class EstimateTargetTests(unittest.TestCase):
    """Tests for _estimate_target — mocking the RPC client."""

    def _make_mock_client(self, return_value=None, side_effect=None):
        mock_client = MagicMock()
        if side_effect is not None:
            mock_client.estimatesmartfee.side_effect = side_effect
        else:
            mock_client.estimatesmartfee.return_value = return_value
        return mock_client

    def test_success_with_feerate(self):
        mock_client = self._make_mock_client(
            return_value={"feerate": 0.0001, "blocks": 3}
        )
        with patch("api.fee_service.get_client", return_value=mock_client):
            result = _estimate_target(3, "CONSERVATIVE")

        self.assertEqual(result["status"], "success")
        self.assertAlmostEqual(result["feerate_btc_kvb"], 0.0001, places=8)
        self.assertAlmostEqual(result["feerate_sat_vb"], 10.0, places=4)
        self.assertEqual(result["blocks_returned"], 3)
        self.assertEqual(result["errors"], [])

    def test_limited_with_errors(self):
        mock_client = self._make_mock_client(
            return_value={"errors": ["Insufficient data or no feerate found"], "blocks": 1}
        )
        with patch("api.fee_service.get_client", return_value=mock_client):
            result = _estimate_target(1, "CONSERVATIVE")

        self.assertEqual(result["status"], "limited")
        self.assertIsNone(result["feerate_btc_kvb"])
        self.assertIsNone(result["feerate_sat_vb"])
        self.assertTrue(len(result["errors"]) > 0)

    def test_unavailable_no_feerate_no_errors(self):
        mock_client = self._make_mock_client(
            return_value={"blocks": 1}
        )
        with patch("api.fee_service.get_client", return_value=mock_client):
            result = _estimate_target(1, "CONSERVATIVE")

        self.assertEqual(result["status"], "unavailable")
        self.assertIsNone(result["feerate_btc_kvb"])
        self.assertIsNone(result["feerate_sat_vb"])

    def test_rpc_error_becomes_error_status(self):
        mock_client = self._make_mock_client(
            side_effect=RPCError("connection failed")
        )
        with patch("api.fee_service.get_client", return_value=mock_client):
            result = _estimate_target(6, "CONSERVATIVE")

        self.assertEqual(result["status"], "error")
        self.assertIsNone(result["feerate_btc_kvb"])
        self.assertTrue(len(result["errors"]) > 0)

    def test_target_and_mode_preserved(self):
        mock_client = self._make_mock_client(
            return_value={"feerate": 0.0002, "blocks": 6}
        )
        with patch("api.fee_service.get_client", return_value=mock_client):
            result = _estimate_target(6, "ECONOMICAL")

        self.assertEqual(result["target_blocks"], 6)
        self.assertEqual(result["estimate_mode"], "ECONOMICAL")


class GetFeeEstimatesTests(unittest.TestCase):
    """Integration-level tests for get_fee_estimates."""

    def _mock_client(self):
        client = MagicMock()
        client.getblockchaininfo.return_value = {"chain": "regtest"}
        client.getnetworkinfo.return_value = {"subversion": "/Satoshi:26.2.0/"}
        client.estimatesmartfee.return_value = {
            "errors": ["Insufficient data or no feerate found"],
            "blocks": 1,
        }
        return client

    def test_returns_expected_structure(self):
        with patch("api.fee_service.get_client", return_value=self._mock_client()):
            result = get_fee_estimates()

        self.assertIn("network", result)
        self.assertIn("estimates", result)
        self.assertIn("warnings", result)
        self.assertIn("generated_at", result)
        self.assertEqual(result["network"], "regtest")

    def test_regtest_warning_present(self):
        with patch("api.fee_service.get_client", return_value=self._mock_client()):
            result = get_fee_estimates()

        self.assertTrue(
            any("regtest" in w.lower() for w in result["warnings"]),
            "Expected regtest warning in warnings list",
        )

    def test_default_targets(self):
        with patch("api.fee_service.get_client", return_value=self._mock_client()):
            result = get_fee_estimates()

        self.assertEqual(result["targets"], [1, 3, 6, 12])
        self.assertEqual(len(result["estimates"]), 4)

    def test_custom_targets(self):
        with patch("api.fee_service.get_client", return_value=self._mock_client()):
            result = get_fee_estimates(targets=[1, 6])

        self.assertEqual(result["targets"], [1, 6])
        self.assertEqual(len(result["estimates"]), 2)

    def test_mode_uppercased(self):
        with patch("api.fee_service.get_client", return_value=self._mock_client()):
            result = get_fee_estimates(estimate_mode="economical")

        self.assertEqual(result["estimate_mode"], "ECONOMICAL")

    def test_no_feerate_in_regtest_marks_unavailable(self):
        with patch("api.fee_service.get_client", return_value=self._mock_client()):
            result = get_fee_estimates()

        self.assertTrue(len(result["unavailable_features"]) > 0)
        for est in result["estimates"]:
            self.assertIn(est["status"], ("limited", "unavailable", "error"))

    def test_rpc_unreachable_returns_graceful_result(self):
        client = MagicMock()
        client.getblockchaininfo.side_effect = RPCError("connection failed")
        client.getnetworkinfo.side_effect = RPCError("connection failed")
        client.estimatesmartfee.side_effect = RPCError("connection failed")

        with patch("api.fee_service.get_client", return_value=client):
            result = get_fee_estimates()

        self.assertIn("warnings", result)
        self.assertTrue(len(result["warnings"]) > 0)
        for est in result["estimates"]:
            self.assertEqual(est["status"], "error")


if __name__ == "__main__":
    unittest.main()
