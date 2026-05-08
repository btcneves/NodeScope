"""Live Simulation Service — auto-mines blocks and sends transactions in regtest."""

from __future__ import annotations

import logging
import os
import random
import threading
import time
from datetime import UTC, datetime
from typing import Any

from .rpc import RPCClient, RPCError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_MINER_WALLET = "nodescope_miner"
_USER_WALLET = "nodescope_user"

_block_interval: int = int(os.environ.get("SIMULATION_BLOCK_INTERVAL", "30"))
_tx_interval: int = int(os.environ.get("SIMULATION_TX_INTERVAL", "12"))

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

_lock = threading.Lock()
_stop_event = threading.Event()
_thread: threading.Thread | None = None
_readonly_flag = False

_state: dict[str, Any] = {
    "running": False,
    "blocks_mined": 0,
    "txs_sent": 0,
    "errors": 0,
    "started_at": None,
    "last_block_at": None,
    "last_tx_at": None,
    "last_txid": None,
    "last_block_height": None,
    "next_block_in": None,
    "next_tx_in": None,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _wallet_rpc(wallet_name: str) -> RPCClient:
    base_url = os.environ.get("BITCOIN_RPC_URL", "http://127.0.0.1:18443")
    return RPCClient(url=f"{base_url.rstrip('/')}/wallet/{wallet_name}")


def _ensure_wallet(name: str) -> None:
    """Create or load a wallet by name."""
    base_rpc = RPCClient()
    try:
        wallets: list[str] = base_rpc.listwallets()
        if name not in wallets:
            try:
                base_rpc.loadwallet(name)
                logger.info("simulation: loaded wallet %s", name)
            except RPCError:
                base_rpc.createwallet(name)
                logger.info("simulation: created wallet %s", name)
    except RPCError as exc:
        logger.warning("simulation: _ensure_wallet(%s) failed: %s", name, exc)
        raise


def _ensure_funded() -> None:
    """Ensure miner wallet has at least 1 BTC; mine 101 blocks if not."""
    _ensure_wallet(_MINER_WALLET)
    _ensure_wallet(_USER_WALLET)

    miner = _wallet_rpc(_MINER_WALLET)
    try:
        info = miner.getwalletinfo()
        balance = float(info.get("balance", 0))
        if balance < 1.0:
            addr = miner.getnewaddress("sim_funding", "bech32")
            logger.info("simulation: mining 101 initial blocks to fund miner wallet")
            miner.generatetoaddress(101, addr)
    except RPCError as exc:
        logger.warning("simulation: _ensure_funded failed: %s", exc)
        raise


def _mine_block() -> None:
    miner = _wallet_rpc(_MINER_WALLET)
    addr = miner.getnewaddress("sim_mining", "bech32")
    hashes = miner.generatetoaddress(1, addr)
    height: int | None = None
    if hashes:
        try:
            block_data = miner.getblock(hashes[0])
            height = block_data.get("height")
        except RPCError:
            pass
    with _lock:
        _state["blocks_mined"] += 1
        _state["last_block_at"] = _now()
        _state["last_block_height"] = height
    logger.debug("simulation: mined block height=%s", height)


def _send_transaction() -> None:
    miner = _wallet_rpc(_MINER_WALLET)
    try:
        info = miner.getwalletinfo()
        balance = float(info.get("balance", 0))
        if balance <= 0.01:
            logger.info("simulation: miner balance low (%.6f BTC), mining 5 more blocks", balance)
            addr = miner.getnewaddress("sim_refund", "bech32")
            miner.generatetoaddress(5, addr)
            return
    except RPCError as exc:
        logger.warning("simulation: balance check failed: %s", exc)
        raise

    user = _wallet_rpc(_USER_WALLET)
    dest_addr = user.getnewaddress("sim_recv", "bech32")
    amount = round(random.uniform(0.001, 0.05), 8)

    try:
        txid = miner.sendtoaddress(dest_addr, amount)
    except RPCError as exc:
        logger.warning("simulation: sendtoaddress failed (%s), ensuring funded", exc)
        _ensure_funded()
        raise

    with _lock:
        _state["txs_sent"] += 1
        _state["last_tx_at"] = _now()
        _state["last_txid"] = txid
    logger.debug("simulation: sent tx %s (%.8f BTC)", txid, amount)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------


def _run_loop() -> None:
    global _block_interval, _tx_interval

    logger.info(
        "simulation: loop started (block_interval=%ds, tx_interval=%ds)",
        _block_interval,
        _tx_interval,
    )

    try:
        _ensure_funded()
    except Exception as exc:
        logger.error("simulation: initial _ensure_funded failed: %s", exc)

    last_block_time = time.time() - _block_interval  # trigger immediately
    last_tx_time = time.time() - _tx_interval  # trigger immediately

    while not _stop_event.is_set():
        now = time.time()

        # Capture current intervals (may change via configure())
        with _lock:
            bi = _block_interval
            ti = _tx_interval

        # Update countdowns
        nb = max(0, int(bi - (now - last_block_time)))
        nt = max(0, int(ti - (now - last_tx_time)))
        with _lock:
            _state["next_block_in"] = nb
            _state["next_tx_in"] = nt

        # Mine a block?
        if now - last_block_time >= bi:
            try:
                _mine_block()
            except Exception as exc:
                logger.error("simulation: _mine_block error: %s", exc)
                with _lock:
                    _state["errors"] += 1
            last_block_time = time.time()

        # Send a transaction?
        if now - last_tx_time >= ti:
            try:
                _send_transaction()
            except Exception as exc:
                logger.error("simulation: _send_transaction error: %s", exc)
                with _lock:
                    _state["errors"] += 1
            last_tx_time = time.time()

        _stop_event.wait(1)

    with _lock:
        _state["running"] = False
        _state["next_block_in"] = None
        _state["next_tx_in"] = None

    logger.info("simulation: loop stopped")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def start() -> dict[str, Any]:
    global _thread

    with _lock:
        readonly = _readonly_flag
        already_running = bool(_state["running"])
    if readonly or already_running:
        return get_status()

    with _lock:
        # Reset stats
        _state["blocks_mined"] = 0
        _state["txs_sent"] = 0
        _state["errors"] = 0
        _state["started_at"] = _now()
        _state["last_block_at"] = None
        _state["last_tx_at"] = None
        _state["last_txid"] = None
        _state["last_block_height"] = None
        _state["next_block_in"] = None
        _state["next_tx_in"] = None
        _state["running"] = True

    _stop_event.clear()
    _thread = threading.Thread(target=_run_loop, daemon=True, name="simulation-loop")
    _thread.start()
    logger.info("simulation: started")
    return get_status()


def stop() -> dict[str, Any]:
    with _lock:
        running = bool(_state["running"])
    if not running:
        return get_status()

    _stop_event.set()
    if _thread is not None:
        _thread.join(timeout=5)
    logger.info("simulation: stopped")
    return get_status()


def configure(block_interval: int | None = None, tx_interval: int | None = None) -> dict[str, Any]:
    global _block_interval, _tx_interval
    with _lock:
        if block_interval is not None and block_interval > 0:
            _block_interval = block_interval
        if tx_interval is not None and tx_interval > 0:
            _tx_interval = tx_interval
    logger.info(
        "simulation: configured block_interval=%d tx_interval=%d", _block_interval, _tx_interval
    )
    return get_status()


def get_status() -> dict[str, Any]:
    with _lock:
        return {
            **_state,
            "read_only": _readonly_flag,
            "config": {
                "block_interval": _block_interval,
                "tx_interval": _tx_interval,
            },
        }


def reset_stats() -> None:
    """Reset counters only — keeps simulation running."""
    with _lock:
        _state["blocks_mined"] = 0
        _state["txs_sent"] = 0
        _state["errors"] = 0
        _state["started_at"] = _now()
        _state["last_block_at"] = None
        _state["last_tx_at"] = None
        _state["last_txid"] = None
        _state["last_block_height"] = None


def auto_start() -> None:
    if _readonly_flag:
        logger.info("simulation: auto-start disabled because network mode is read-only")
        return
    if os.environ.get("SIMULATION_ENABLED", "").lower() == "true":
        logger.info("simulation: auto-starting (SIMULATION_ENABLED=true)")
        start()


def prevent_auto_start() -> None:
    global _readonly_flag
    with _lock:
        _readonly_flag = True
