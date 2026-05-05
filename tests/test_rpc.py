"""Tests for the Bitcoin Core RPC client."""
from __future__ import annotations

import json
import unittest
from unittest.mock import MagicMock, patch

from api.rpc import RPCClient, RPCError


class RPCClientTests(unittest.TestCase):
    def _make_client(self) -> RPCClient:
        return RPCClient(
            url="http://127.0.0.1:18443",
            user="testuser",
            password="testpass",
        )

    def _mock_response(self, result: object) -> MagicMock:
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"result": result, "error": None, "id": 1}).encode()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        return mock_resp

    def test_call_returns_result(self):
        client = self._make_client()
        mock_resp = self._mock_response({"chain": "regtest", "blocks": 101})
        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = client.call("getblockchaininfo")
        self.assertEqual(result["chain"], "regtest")
        self.assertEqual(result["blocks"], 101)

    def test_getblockchaininfo_delegates(self):
        client = self._make_client()
        mock_resp = self._mock_response({"chain": "regtest", "blocks": 50})
        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = client.getblockchaininfo()
        self.assertEqual(result["chain"], "regtest")

    def test_getmempoolinfo_delegates(self):
        client = self._make_client()
        mock_resp = self._mock_response({"size": 3, "bytes": 1500, "usage": 8000,
                                          "maxmempool": 300000000, "mempoolminfee": 0.00001,
                                          "minrelaytxfee": 0.00001})
        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = client.getmempoolinfo()
        self.assertEqual(result["size"], 3)

    def test_raises_rpc_error_on_connection_failure(self):
        import urllib.error
        client = self._make_client()
        with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("refused")):
            with self.assertRaises(RPCError):
                client.call("getblockchaininfo")

    def test_raises_rpc_error_on_server_error(self):
        client = self._make_client()
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            "result": None,
            "error": {"code": -28, "message": "Loading block index"},
            "id": 1,
        }).encode()
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        with patch("urllib.request.urlopen", return_value=mock_resp):
            with self.assertRaises(RPCError):
                client.call("getblockchaininfo")


if __name__ == "__main__":
    unittest.main()
