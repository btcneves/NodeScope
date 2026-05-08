from __future__ import annotations

import importlib
import os
import unittest
from unittest.mock import patch


class NetworkGuardTests(unittest.TestCase):
    def _reload_guard(self):
        import api.network_guard as network_guard

        return importlib.reload(network_guard)

    def test_force_readonly_env_marks_read_only(self) -> None:
        with patch.dict(os.environ, {"NODESCOPE_FORCE_READONLY": "true"}):
            network_guard = self._reload_guard()
            self.assertTrue(network_guard.is_read_only())
            self.assertEqual(network_guard.detect_network_mode()["reason"], "force_readonly_env")

    def test_regtest_is_writable(self) -> None:
        with patch.dict(os.environ, {"NODESCOPE_FORCE_READONLY": "false"}):
            network_guard = self._reload_guard()
            with patch("api.rpc.get_client") as mock_get:
                mock_get.return_value.getblockchaininfo.return_value = {"chain": "regtest"}
                network_guard.refresh_network_mode()
            mode = network_guard.detect_network_mode()
            self.assertEqual(mode["chain"], "regtest")
            self.assertFalse(mode["read_only"])
            self.assertEqual(mode["reason"], "regtest_writable")

    def test_non_regtest_chain_is_read_only(self) -> None:
        with patch.dict(os.environ, {"NODESCOPE_FORCE_READONLY": "false"}):
            network_guard = self._reload_guard()
            with patch("api.rpc.get_client") as mock_get:
                mock_get.return_value.getblockchaininfo.return_value = {"chain": "signet"}
                network_guard.refresh_network_mode()
            mode = network_guard.detect_network_mode()
            self.assertEqual(mode["chain"], "signet")
            self.assertTrue(mode["read_only"])
            self.assertEqual(mode["reason"], "non_regtest_chain")


class RateLimiterTests(unittest.TestCase):
    def test_sliding_window_rejects_after_limit(self) -> None:
        import api.rate_limiter as rate_limiter

        window: rate_limiter.deque[float] = rate_limiter.deque()
        limited, retry = rate_limiter._check_window(window, limit=2, now=100.0)
        self.assertFalse(limited)
        self.assertEqual(retry, 0)

        limited, retry = rate_limiter._check_window(window, limit=2, now=101.0)
        self.assertFalse(limited)
        self.assertEqual(retry, 0)

        limited, retry = rate_limiter._check_window(window, limit=2, now=102.0)
        self.assertTrue(limited)
        self.assertGreaterEqual(retry, 1)

    def test_sliding_window_expires_old_entries(self) -> None:
        import api.rate_limiter as rate_limiter

        window: rate_limiter.deque[float] = rate_limiter.deque([1.0, 2.0])
        limited, _ = rate_limiter._check_window(window, limit=2, now=61.9)
        self.assertFalse(limited)
        self.assertEqual(list(window), [2.0, 61.9])
