"""Thin JSON-RPC client for Bitcoin Core."""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from typing import Any

_DEFAULT_URL = "http://127.0.0.1:18443"  # regtest default
_DEFAULT_USER = "nodescope"
_DEFAULT_PASS = "nodescope"


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
        payload = json.dumps(
            {
                "jsonrpc": "1.0",
                "id": self._id,
                "method": method,
                "params": params or [],
            }
        ).encode()
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

    # --- wallet ---

    def createwallet(self, wallet_name: str) -> dict[str, Any]:
        return self.call("createwallet", [wallet_name])  # type: ignore[return-value]

    def loadwallet(self, wallet_name: str) -> dict[str, Any]:
        return self.call("loadwallet", [wallet_name])  # type: ignore[return-value]

    def getwalletinfo(self) -> dict[str, Any]:
        return self.call("getwalletinfo")  # type: ignore[return-value]

    def listwallets(self) -> list[str]:
        return self.call("listwallets")  # type: ignore[return-value]

    def getnewaddress(self, label: str = "", address_type: str = "bech32") -> str:
        return self.call("getnewaddress", [label, address_type])  # type: ignore[return-value]

    # --- mining / blocks ---

    def generatetoaddress(self, nblocks: int, address: str) -> list[str]:
        return self.call("generatetoaddress", [nblocks, address])  # type: ignore[return-value]

    def getblockcount(self) -> int:
        return self.call("getblockcount")  # type: ignore[return-value]

    def getblockhash(self, height: int) -> str:
        return self.call("getblockhash", [height])  # type: ignore[return-value]

    def getblock(self, blockhash: str, verbosity: int = 1) -> dict[str, Any]:
        return self.call("getblock", [blockhash, verbosity])  # type: ignore[return-value]

    # --- transactions ---

    def sendtoaddress(
        self,
        address: str,
        amount: float,
        *,
        replaceable: bool | None = None,
        fee_rate: float | None = None,
    ) -> str:
        if replaceable is None and fee_rate is None:
            return self.call("sendtoaddress", [address, amount])  # type: ignore[return-value]
        # positional: address, amount, comment, comment_to, subtractfeefromamount,
        #             replaceable, conf_target, estimate_mode, avoid_reuse, fee_rate
        params: list[Any] = [address, amount, "", "", False, replaceable]
        if fee_rate is not None:
            params = [
                address,
                amount,
                "",
                "",
                False,
                replaceable,
                None,
                "unset",
                True,
                fee_rate,
            ]
        return self.call("sendtoaddress", params)  # type: ignore[return-value]

    def bumpfee(self, txid: str) -> dict[str, Any]:
        return self.call("bumpfee", [txid])  # type: ignore[return-value]

    def listunspent(
        self,
        minconf: int = 1,
        maxconf: int = 9999999,
        addresses: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        params: list[Any] = [minconf, maxconf, addresses or []]
        return self.call("listunspent", params)  # type: ignore[return-value]

    def createrawtransaction(self, inputs: list[dict[str, Any]], outputs: dict[str, Any]) -> str:
        return self.call("createrawtransaction", [inputs, outputs])  # type: ignore[return-value]

    def fundrawtransaction(
        self, hexstring: str, options: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        params: list[Any] = [hexstring]
        if options is not None:
            params.append(options)
        return self.call("fundrawtransaction", params)  # type: ignore[return-value]

    def signrawtransactionwithwallet(self, hexstring: str) -> dict[str, Any]:
        return self.call("signrawtransactionwithwallet", [hexstring])  # type: ignore[return-value]

    def sendrawtransaction(self, hexstring: str) -> str:
        return self.call("sendrawtransaction", [hexstring])  # type: ignore[return-value]

    def getrawmempool(self, verbose: bool = False) -> Any:
        return self.call("getrawmempool", [verbose])

    def getmempoolentry(self, txid: str) -> dict[str, Any]:
        return self.call("getmempoolentry", [txid])  # type: ignore[return-value]

    def getrawtransaction(self, txid: str, verbose: bool = True) -> Any:
        return self.call("getrawtransaction", [txid, verbose])

    def decoderawtransaction(self, hexstring: str) -> dict[str, Any]:
        return self.call("decoderawtransaction", [hexstring])  # type: ignore[return-value]

    def gettransaction(self, txid: str) -> dict[str, Any]:
        return self.call("gettransaction", [txid])  # type: ignore[return-value]

    def invalidateblock(self, blockhash: str) -> None:
        self.call("invalidateblock", [blockhash])

    def reconsiderblock(self, blockhash: str) -> None:
        self.call("reconsiderblock", [blockhash])

    # --- zmq ---

    def getzmqnotifications(self) -> list[dict[str, Any]]:
        return self.call("getzmqnotifications")  # type: ignore[return-value]


_client: RPCClient | None = None


def get_client() -> RPCClient:
    global _client
    if _client is None:
        _client = RPCClient()
    return _client
