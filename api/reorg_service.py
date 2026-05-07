"""Reorg Lab — controlled chain reorganization scenario in regtest."""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any

from .rpc import RPCClient, RPCError, get_client

REORG_WALLET = "nodescope_demo"
REORG_AMOUNT = 0.0005

_state_lock = threading.Lock()
_state: dict[str, Any] = {
    "status": "idle",
    "running": False,
    "network": None,
    "steps": [],
    "proof": None,
    "error": None,
    "warning": None,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_status() -> dict[str, Any]:
    with _state_lock:
        return dict(_state)


def reset() -> dict[str, Any]:
    global _state
    with _state_lock:
        _state = {
            "status": "idle",
            "running": False,
            "network": None,
            "steps": [],
            "proof": None,
            "error": None,
            "warning": None,
        }
    return get_status()


def run() -> dict[str, Any]:
    with _state_lock:
        if _state["running"]:
            return dict(_state)
        _state["running"] = True
        _state["status"] = "running"
        _state["steps"] = []
        _state["proof"] = None
        _state["error"] = None
        _state["warning"] = None
    t = threading.Thread(target=_run_worker, daemon=True)
    t.start()
    return get_status()


def get_proof() -> dict[str, Any] | None:
    with _state_lock:
        return _state.get("proof")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _add_step(
    name: str,
    status: str,
    message: str,
    technical: Any = None,
    data: dict[str, Any] | None = None,
) -> None:
    with _state_lock:
        _state["steps"].append({
            "name": name,
            "status": status,
            "message": message,
            "technical": technical,
            "data": data or {},
            "timestamp": _now(),
        })


def _wallet_rpc() -> RPCClient:
    import os
    base_url = os.environ.get("BITCOIN_RPC_URL", "http://127.0.0.1:18443")
    wallet_url = base_url.rstrip("/") + f"/wallet/{REORG_WALLET}"
    return RPCClient(url=wallet_url)


def _ensure_regtest() -> str | None:
    """Returns chain name if regtest, else None."""
    try:
        info = get_client().getblockchaininfo()
        return info.get("chain")
    except RPCError:
        return None


def _ensure_wallet_and_funds() -> tuple[bool, str]:
    """Ensure wallet loaded + mature balance. Returns (ok, message)."""
    try:
        rpc = get_client()
        loaded = rpc.listwallets()
        if REORG_WALLET not in loaded:
            try:
                rpc.loadwallet(REORG_WALLET)
            except RPCError:
                rpc.createwallet(REORG_WALLET)

        w_rpc = _wallet_rpc()
        info = w_rpc.getwalletinfo()
        balance = info.get("balance", 0.0)

        if balance < 0.01:
            addr = w_rpc.getnewaddress("reorg_mining", "bech32")
            chain_info = rpc.getblockchaininfo()
            height = chain_info.get("blocks", 0)
            blocks_needed = max(0, 101 - height)
            if blocks_needed > 0:
                w_rpc.generatetoaddress(blocks_needed, addr)
            else:
                w_rpc.generatetoaddress(1, addr)
            info = w_rpc.getwalletinfo()
            balance = info.get("balance", 0.0)

        return True, f"wallet={REORG_WALLET} balance={balance:.8f} BTC"
    except RPCError as exc:
        return False, str(exc)


# ---------------------------------------------------------------------------
# Main worker
# ---------------------------------------------------------------------------

def _run_worker() -> None:
    try:
        _execute_reorg()
    except Exception as exc:
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = f"Unexpected error: {exc}"
            _state["running"] = False


def _execute_reorg() -> None:

    # Step 1: Verify network
    chain = _ensure_regtest()
    if chain != "regtest":
        msg = f"Network={chain!r} — Reorg Lab requires regtest."
        _add_step("check_network", "unavailable", msg, technical={"chain": chain})
        with _state_lock:
            _state["status"] = "unavailable"
            _state["running"] = False
            _state["network"] = chain
        return

    with _state_lock:
        _state["network"] = chain

    _add_step("check_network", "success", f"Network confirmed: {chain}", technical={"chain": chain})

    # Step 2: Ensure wallet + funds
    ok, msg = _ensure_wallet_and_funds()
    if not ok:
        _add_step("ensure_wallet", "error", f"Wallet setup failed: {msg}")
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = msg
            _state["running"] = False
        return
    _add_step("ensure_wallet", "success", msg)

    w_rpc = _wallet_rpc()

    # Step 3: Create destination address + send transaction
    try:
        dest = w_rpc.getnewaddress("reorg_dest", "bech32")
        txid = w_rpc.sendtoaddress(dest, REORG_AMOUNT)
        _add_step(
            "broadcast_tx", "success",
            f"Transaction broadcast — TXID: {txid}",
            technical={"txid": txid, "amount": REORG_AMOUNT, "destination": dest},
            data={"txid": txid, "destination": dest},
        )
    except RPCError as exc:
        _add_step("broadcast_tx", "error", f"sendtoaddress failed: {exc}")
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = str(exc)
            _state["running"] = False
        return

    # Step 4: Mine a block to confirm it
    try:
        mine_addr = w_rpc.getnewaddress("reorg_mine1", "bech32")
        hashes = w_rpc.generatetoaddress(1, mine_addr)
        original_block_hash = hashes[0]
        original_block_height = w_rpc.getblockcount()
        tx_before = w_rpc.gettransaction(txid)
        confirmations_before = tx_before.get("confirmations", 0)
        _add_step(
            "mine_block", "success",
            f"Block mined — height={original_block_height}, txid confirmed with {confirmations_before} conf",
            technical={
                "block_hash": original_block_hash,
                "height": original_block_height,
                "confirmations": confirmations_before,
            },
            data={
                "original_block_hash": original_block_hash,
                "original_block_height": original_block_height,
                "confirmations_before_reorg": confirmations_before,
            },
        )
    except RPCError as exc:
        _add_step("mine_block", "error", f"Mining failed: {exc}")
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = str(exc)
            _state["running"] = False
        return

    # Step 5: Invalidate the block (trigger reorg)
    try:
        get_client().invalidateblock(original_block_hash)
        height_after_invalidate = get_client().getblockcount()
        _add_step(
            "invalidate_block", "success",
            f"Block {original_block_hash[:16]}… invalidated — chain height now={height_after_invalidate}",
            technical={
                "invalidated_block": original_block_hash,
                "height_after": height_after_invalidate,
            },
            data={"invalidated_block": original_block_hash, "height_after_invalidate": height_after_invalidate},
        )
    except RPCError as exc:
        _add_step("invalidate_block", "error", f"invalidateblock failed: {exc}")
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = str(exc)
            _state["running"] = False
        return

    # Step 6: Check tx status after invalidation
    mempool_status_after = "unknown"
    try:
        w_rpc.getmempoolentry(txid)
        mempool_status_after = "back_in_mempool"
        _add_step(
            "check_tx_after_invalidation", "success",
            f"Transaction {txid[:16]}… returned to mempool after block invalidation.",
            technical={"mempool_status": "back_in_mempool", "txid": txid},
            data={"mempool_status_after_invalidation": "back_in_mempool", "txid": txid},
        )
    except RPCError:
        # Tx might not be in mempool; check via gettransaction
        try:
            tx_check = w_rpc.gettransaction(txid)
            conf_check = tx_check.get("confirmations", 0)
            if conf_check <= 0:
                mempool_status_after = "unconfirmed_not_in_mempool"
            _add_step(
                "check_tx_after_invalidation", "experimental",
                f"Transaction confirmations={conf_check} after invalidation. Not found in getmempoolentry.",
                technical={"confirmations": conf_check, "note": "mempool_entry_not_found"},
                data={"mempool_status_after_invalidation": mempool_status_after, "txid": txid},
            )
        except RPCError as exc2:
            mempool_status_after = "unknown"
            _add_step(
                "check_tx_after_invalidation", "error",
                f"Could not determine tx status after invalidation: {exc2}",
                data={"mempool_status_after_invalidation": "unknown"},
            )

    # Step 7: Mine a new block to re-confirm
    try:
        mine_addr2 = w_rpc.getnewaddress("reorg_mine2", "bech32")
        new_hashes = w_rpc.generatetoaddress(1, mine_addr2)
        final_block_hash = new_hashes[0]
        final_block_height = w_rpc.getblockcount()
        _add_step(
            "mine_recovery_block", "success",
            f"Recovery block mined — height={final_block_height}, hash={final_block_hash[:16]}…",
            technical={"block_hash": final_block_hash, "height": final_block_height},
            data={"final_block_hash": final_block_hash, "final_block_height": final_block_height},
        )
    except RPCError as exc:
        _add_step("mine_recovery_block", "error", f"Mining recovery block failed: {exc}")
        with _state_lock:
            _state["status"] = "error"
            _state["error"] = str(exc)
            _state["running"] = False
        return

    # Step 8: Verify tx re-confirmed
    try:
        tx_final = w_rpc.gettransaction(txid)
        final_confirmations = tx_final.get("confirmations", 0)
        final_blockhash = tx_final.get("blockhash")
        mempool_status_after_recovery = "confirmed" if final_confirmations > 0 else "unconfirmed"
        step_status = "success" if final_confirmations > 0 else "error"
        _add_step(
            "verify_reconfirmation", step_status,
            f"Transaction {txid[:16]}… — confirmations={final_confirmations} after recovery.",
            technical={
                "txid": txid,
                "confirmations": final_confirmations,
                "blockhash": final_blockhash,
            },
            data={
                "final_confirmations": final_confirmations,
                "final_blockhash": final_blockhash,
                "mempool_status_after_recovery": mempool_status_after_recovery,
            },
        )
    except RPCError as exc:
        _add_step("verify_reconfirmation", "error", f"gettransaction failed: {exc}")
        final_confirmations = 0
        final_block_hash = None
        mempool_status_after_recovery = "unknown"

    # Step 9: reconsiderblock — ensure original block is cleanly invalid on current chain
    # (The recovery chain is longer; this just removes the "manually invalid" flag)
    reconsider_ok = False
    try:
        get_client().reconsiderblock(original_block_hash)
        # After reconsider, Bitcoin Core re-evaluates; since recovery chain is longer, it stays
        final_height_check = get_client().getblockcount()
        reconsider_ok = True
        _add_step(
            "reconsider_block", "success",
            f"reconsiderblock called — chain height={final_height_check}. Recovery chain remains active.",
            technical={"height_after_reconsider": final_height_check},
            data={"reconsider_called": True, "chain_height_final": final_height_check},
        )
    except RPCError as exc:
        _add_step(
            "reconsider_block", "experimental",
            f"reconsiderblock returned: {exc}. Chain state may still be valid.",
            technical={"error": str(exc)},
            data={"reconsider_called": False},
        )

    # Step 10: Build proof
    overall_success = final_confirmations > 0
    proof = {
        "scenario": "reorg_lab",
        "title": "Controlled Regtest Chain Reorganization",
        "network": chain,
        "experimental": True,
        "txid": txid,
        "amount_btc": REORG_AMOUNT,
        "original_block_hash": original_block_hash,
        "original_block_height": original_block_height,
        "confirmations_before_reorg": confirmations_before,
        "invalidated_block_hash": original_block_hash,
        "mempool_status_after_invalidation": mempool_status_after,
        "final_block_hash": final_block_hash,
        "final_block_height": final_block_height,
        "final_confirmations": final_confirmations,
        "mempool_status_after_recovery": mempool_status_after_recovery,
        "reconsider_block_called": reconsider_ok,
        "success": overall_success,
        "warnings": [
            "This scenario is marked experimental. Regtest reorgs are controlled and safe.",
            "Chain was restored via a new block after invalidation.",
        ],
        "unavailable_features": [],
    }

    with _state_lock:
        _state["proof"] = proof
        _state["status"] = "success" if overall_success else "error"
        _state["running"] = False

    _add_step(
        "build_proof", "success" if overall_success else "experimental",
        "Proof report assembled.",
        technical=proof,
    )
