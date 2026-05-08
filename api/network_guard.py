from __future__ import annotations

import os
import threading

_lock = threading.Lock()
_chain_cache: str | None = None
_read_only_cache: bool = False
_reason_cache: str = "regtest_writable"
_initialized: bool = False

_FORCE_READONLY: bool = os.environ.get("NODESCOPE_FORCE_READONLY", "false").lower() == "true"


def refresh_network_mode() -> None:
    global _chain_cache, _read_only_cache, _reason_cache, _initialized
    if _FORCE_READONLY:
        with _lock:
            _read_only_cache = True
            _reason_cache = "force_readonly_env"
            _chain_cache = None
            _initialized = True
        return

    try:
        from .rpc import get_client  # noqa: PLC0415

        info = get_client().getblockchaininfo()
        chain = info.get("chain", "unknown")
        with _lock:
            _chain_cache = chain
            if chain != "regtest":
                _read_only_cache = True
                _reason_cache = "non_regtest_chain"
            else:
                _read_only_cache = False
                _reason_cache = "regtest_writable"
            _initialized = True
    except Exception:
        # Fail-open: if RPC is offline we cannot confirm it's mainnet
        with _lock:
            _chain_cache = None
            _read_only_cache = False
            _reason_cache = "regtest_writable"
            _initialized = True


def is_read_only() -> bool:
    if not _initialized:
        refresh_network_mode()
    return _read_only_cache


def detect_network_mode() -> dict[str, object]:
    if not _initialized:
        refresh_network_mode()
    with _lock:
        return {
            "chain": _chain_cache,
            "read_only": _read_only_cache,
            "reason": _reason_cache,
        }
