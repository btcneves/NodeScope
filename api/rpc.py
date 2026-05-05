"""Thin JSON-RPC client for Bitcoin Core."""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from typing import Any

_DEFAULT_URL = "http://127.0.0.1:18443"  # regtest default
_DEFAULT_USER = "corecraft"
_DEFAULT_PASS = "corecraft"


class RPCError(Exception):
    pass


class RPCClient:
    def __init__(
        self,
        url: str | None = None,
        user: str | None = None,
        password: str | None = None,
    ) -> None:
        self._url = url or os.environ.get("BITCOIN_RPC_URL", _DEFAULT_URL)
        self._user = user or os.environ.get("BITCOIN_RPC_USER", _DEFAULT_USER)
        self._password = password or os.environ.get("BITCOIN_RPC_PASSWORD", _DEFAULT_PASS)
        self._id = 0

    def call(self, method: str, params: list[Any] | None = None) -> Any:
        self._id += 1
        payload = json.dumps({
            "jsonrpc": "1.1",
            "id": self._id,
            "method": method,
            "params": params or [],
        }).encode()
        creds = base64.b64encode(f"{self._user}:{self._password}".encode()).decode()
        req = urllib.request.Request(
            self._url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {creds}",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read())
                if data.get("error"):
                    raise RPCError(str(data["error"]))
                return data["result"]
        except urllib.error.URLError as exc:
            raise RPCError(f"connection failed: {exc}") from exc

    def getmempoolinfo(self) -> dict[str, Any]:
        return self.call("getmempoolinfo")  # type: ignore[return-value]

    def getblockchaininfo(self) -> dict[str, Any]:
        return self.call("getblockchaininfo")  # type: ignore[return-value]

    def getnetworkinfo(self) -> dict[str, Any]:
        return self.call("getnetworkinfo")  # type: ignore[return-value]


_client: RPCClient | None = None


def get_client() -> RPCClient:
    global _client
    if _client is None:
        _client = RPCClient()
    return _client
