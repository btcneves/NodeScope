"""Mempool Policy Arena — 4 interactive scenarios: normal tx, low fee, RBF, CPFP."""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any

from .rpc import RPCClient, RPCError, get_client

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

POLICY_WALLET = "nodescope_demo"  # reuse the guided demo wallet
POLICY_AMOUNT = 0.0005  # BTC per scenario tx

LOW_FEE_RATE = 1.0  # sat/vbyte — low but above dust threshold
HIGH_FEE_RATE = 20.0  # sat/vbyte — for CPFP child tx

SCENARIO_IDS = [
    "normal_transaction",
    "low_fee_transaction",
    "rbf_replacement",
    "cpfp_package",
]

SCENARIO_META: dict[str, dict[str, str]] = {
    "normal_transaction": {
        "title": "Normal Transaction",
        "description": "Send a standard transaction, observe mempool entry, mine a block and confirm.",
    },
    "low_fee_transaction": {
        "title": "Low Fee Transaction",
        "description": "Send with fee_rate=1 sat/vbyte, compare fee data vs a normal tx. Uses sendtoaddress fee_rate param (BC 26+).",
    },
    "rbf_replacement": {
        "title": "RBF Replacement (BIP125)",
        "description": "Send a replaceable transaction, then use bumpfee to replace it with a higher-fee version before it confirms.",
    },
    "cpfp_package": {
        "title": "CPFP Package",
        "description": "Send a low-fee parent, then child-pays-for-parent: construct a child that spends the unconfirmed output with a higher fee to boost the package rate.",
    },
}

# Steps per scenario
SCENARIO_STEPS: dict[str, list[tuple[str, str]]] = {
    "normal_transaction": [
        ("ensure_wallet", "Ensure Wallet & Funds"),
        ("send_normal_tx", "Send Normal Transaction"),
        ("check_mempool", "Inspect Mempool Entry"),
        ("mine_block", "Mine Confirmation Block"),
        ("confirm_tx", "Verify Confirmation"),
        ("build_proof", "Build Proof Report"),
    ],
    "low_fee_transaction": [
        ("ensure_wallet", "Ensure Wallet & Funds"),
        ("send_low_fee_tx", "Send Low-Fee Transaction (1 sat/vb)"),
        ("check_mempool", "Inspect Mempool Entry"),
        ("compare_fee_rate", "Compare Fee Rate vs Normal"),
        ("mine_block", "Mine Confirmation Block"),
        ("confirm_tx", "Verify Confirmation"),
        ("build_proof", "Build Proof Report"),
    ],
    "rbf_replacement": [
        ("ensure_wallet", "Ensure Wallet & Funds"),
        ("send_replaceable_tx", "Send Replaceable Transaction"),
        ("verify_in_mempool", "Verify in Mempool (replaceable=true)"),
        ("bump_fee", "Bump Fee via RBF (bumpfee)"),
        ("verify_replacement", "Verify Replacement in Mempool"),
        ("mine_block", "Mine Confirmation Block"),
        ("confirm_replacement", "Verify Replacement Confirmed"),
        ("build_proof", "Build Proof Report"),
    ],
    "cpfp_package": [
        ("ensure_wallet", "Ensure Wallet & Funds"),
        ("send_parent_tx", "Send Low-Fee Parent Transaction"),
        ("verify_parent", "Verify Parent Pending in Mempool"),
        ("build_child_tx", "Construct & Submit Child Tx (CPFP)"),
        ("verify_cpfp", "Verify CPFP Package in Mempool"),
        ("mine_block", "Mine Confirmation Block"),
        ("confirm_cpfp", "Verify Both Txs Confirmed"),
        ("build_proof", "Build Proof Report"),
    ],
}


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


def _make_step(step_id: str, title: str) -> dict[str, Any]:
    return {
        "id": step_id,
        "title": title,
        "status": "pending",
        "friendly_message": "",
        "technical_output": None,
        "timestamp": None,
        "error": None,
        "data": {},
    }


def _make_scenario(scenario_id: str) -> dict[str, Any]:
    meta = SCENARIO_META[scenario_id]
    steps_list = SCENARIO_STEPS[scenario_id]
    return {
        "id": scenario_id,
        "title": meta["title"],
        "description": meta["description"],
        "status": "idle",
        "running": False,
        "steps": {sid: _make_step(sid, title) for sid, title in steps_list},
        "step_order": [sid for sid, _ in steps_list],
        "proof": None,
    }


def _initial_state() -> dict[str, Any]:
    return {"scenarios": {sid: _make_scenario(sid) for sid in SCENARIO_IDS}}


_state_lock = threading.Lock()
_state: dict[str, Any] = _initial_state()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def list_scenarios() -> list[dict[str, Any]]:
    with _state_lock:
        return [_scenario_summary(s) for s in _state["scenarios"].values()]


def get_scenario_status(scenario_id: str) -> dict[str, Any] | None:
    with _state_lock:
        sc = _state["scenarios"].get(scenario_id)
        if sc is None:
            return None
        return _scenario_full(sc)


def reset_scenario(scenario_id: str) -> dict[str, Any] | None:
    with _state_lock:
        if scenario_id not in _state["scenarios"]:
            return None
        _state["scenarios"][scenario_id] = _make_scenario(scenario_id)
    return get_scenario_status(scenario_id)


def reset_all() -> list[dict[str, Any]]:
    global _state
    with _state_lock:
        _state = _initial_state()
    return list_scenarios()


def run_scenario(scenario_id: str) -> dict[str, Any] | None:
    with _state_lock:
        sc = _state["scenarios"].get(scenario_id)
        if sc is None:
            return None
        if sc["running"]:
            return _scenario_full(sc)
        sc["running"] = True
        sc["status"] = "running"
    t = threading.Thread(target=_run_worker, args=(scenario_id,), daemon=True)
    t.start()
    return get_scenario_status(scenario_id)


def get_scenario_proof(scenario_id: str) -> dict[str, Any] | None:
    with _state_lock:
        sc = _state["scenarios"].get(scenario_id)
        if sc is None:
            return None
        return sc.get("proof")


# ---------------------------------------------------------------------------
# Helpers — serialization
# ---------------------------------------------------------------------------


def _scenario_summary(sc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": sc["id"],
        "title": sc["title"],
        "description": sc["description"],
        "status": sc["status"],
        "running": sc["running"],
        "step_count": len(sc["steps"]),
        "has_proof": sc["proof"] is not None,
    }


def _scenario_full(sc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": sc["id"],
        "title": sc["title"],
        "description": sc["description"],
        "status": sc["status"],
        "running": sc["running"],
        "steps": [dict(sc["steps"][sid]) for sid in sc["step_order"]],
        "proof": sc["proof"],
    }


# ---------------------------------------------------------------------------
# Step state helpers
# ---------------------------------------------------------------------------


def _set_step(
    scenario_id: str,
    step_id: str,
    status: str,
    friendly: str,
    technical: Any = None,
    error: str | None = None,
    data: dict[str, Any] | None = None,
) -> None:
    with _state_lock:
        s = _state["scenarios"][scenario_id]["steps"][step_id]
        s["status"] = status
        s["friendly_message"] = friendly
        s["technical_output"] = technical
        s["timestamp"] = _now()
        if error is not None:
            s["error"] = error
        if data:
            s["data"].update(data)


def _get_step_data(scenario_id: str, step_id: str) -> dict[str, Any]:
    with _state_lock:
        return dict(_state["scenarios"][scenario_id]["steps"][step_id]["data"])


def _wallet_rpc() -> RPCClient:
    import os

    base_url = os.environ.get("BITCOIN_RPC_URL", "http://127.0.0.1:18443")
    wallet_url = base_url.rstrip("/") + f"/wallet/{POLICY_WALLET}"
    return RPCClient(url=wallet_url)


# ---------------------------------------------------------------------------
# Shared sub-steps (reused across scenarios)
# ---------------------------------------------------------------------------


def _sub_ensure_wallet(scenario_id: str) -> bool:
    """Create/load wallet, mine enough blocks to have spendable balance. Returns True on success."""
    _set_step(
        scenario_id,
        "ensure_wallet",
        "running",
        f"Preparing wallet '{POLICY_WALLET}' and funds…",
    )
    try:
        rpc = get_client()
        loaded = rpc.listwallets()
        if POLICY_WALLET not in loaded:
            try:
                rpc.loadwallet(POLICY_WALLET)
            except RPCError:
                rpc.createwallet(POLICY_WALLET)

        w_rpc = _wallet_rpc()
        info = w_rpc.getwalletinfo()
        balance = info.get("balance", 0.0)

        if balance < 0.01:
            addr = w_rpc.getnewaddress("policy_mining", "bech32")
            chain_info = rpc.getblockchaininfo()
            height = chain_info.get("blocks", 0)
            blocks_needed = max(0, 101 - height)
            if blocks_needed > 0:
                w_rpc.generatetoaddress(blocks_needed, addr)
            else:
                w_rpc.generatetoaddress(1, addr)
            info = w_rpc.getwalletinfo()
            balance = info.get("balance", 0.0)

        _set_step(
            scenario_id,
            "ensure_wallet",
            "success",
            f"Wallet ready — balance={balance:.8f} BTC",
            technical={"wallet": POLICY_WALLET, "balance": balance},
            data={"wallet": POLICY_WALLET, "balance": balance},
        )
        return True
    except RPCError as exc:
        _set_step(
            scenario_id,
            "ensure_wallet",
            "error",
            "Wallet/funds setup failed.",
            error=str(exc),
        )
        return False


def _sub_mine_block(scenario_id: str, step_id: str = "mine_block") -> str | None:
    """Mine 1 block. Returns blockhash or None on failure."""
    _set_step(scenario_id, step_id, "running", "Mining confirmation block…")
    try:
        w_rpc = _wallet_rpc()
        addr = w_rpc.getnewaddress("mine_reward", "bech32")
        hashes = w_rpc.generatetoaddress(1, addr)
        block_hash = hashes[0] if hashes else None
        height = w_rpc.getblockcount()
        _set_step(
            scenario_id,
            step_id,
            "success",
            f"Block mined — height={height}",
            technical={"block_hash": block_hash, "height": height},
            data={"block_hash": block_hash, "block_height": height},
        )
        return block_hash
    except RPCError as exc:
        _set_step(scenario_id, step_id, "error", "Mining failed.", error=str(exc))
        return None


def _sub_check_mempool(
    scenario_id: str, txid: str, step_id: str = "check_mempool"
) -> dict[str, Any] | None:
    """Run getmempoolentry for txid. Returns entry dict or None."""
    _set_step(scenario_id, step_id, "running", f"Querying mempool for {txid[:12]}…")
    try:
        w_rpc = _wallet_rpc()
        entry = w_rpc.getmempoolentry(txid)
        fee = entry.get("fees", {}).get("base", 0.0)
        vsize = entry.get("vsize", 0)
        fee_rate = round(fee * 1e8 / vsize, 2) if fee and vsize else None
        _set_step(
            scenario_id,
            step_id,
            "success",
            f"In mempool — vsize={vsize} vbytes, fee={fee} BTC ({fee_rate} sat/vb)",
            technical=entry,
            data={
                "txid": txid,
                "in_mempool": True,
                "fee_btc": fee,
                "vsize": vsize,
                "fee_rate_sat_vb": fee_rate,
                "replaceable": entry.get("bip125-replaceable", False),
            },
        )
        return entry
    except RPCError as exc:
        _set_step(
            scenario_id,
            step_id,
            "error",
            "Transaction not found in mempool.",
            error=str(exc),
        )
        return None


def _sub_confirm_tx(scenario_id: str, txid: str, step_id: str = "confirm_tx") -> bool:
    _set_step(
        scenario_id, step_id, "running", f"Verifying confirmation for {txid[:12]}…"
    )
    try:
        w_rpc = _wallet_rpc()
        tx = w_rpc.gettransaction(txid)
        confirmations = tx.get("confirmations", 0)
        blockhash = tx.get("blockhash")
        fee = tx.get("fee")
        if confirmations > 0:
            _set_step(
                scenario_id,
                step_id,
                "success",
                f"Confirmed — {confirmations} confirmation(s)",
                technical={
                    "txid": txid,
                    "confirmations": confirmations,
                    "blockhash": blockhash,
                    "fee": fee,
                },
                data={
                    "confirmed": True,
                    "confirmations": confirmations,
                    "blockhash": blockhash,
                },
            )
            return True
        else:
            _set_step(
                scenario_id,
                step_id,
                "error",
                "Not yet confirmed.",
                error=f"confirmations={confirmations}",
            )
            return False
    except RPCError as exc:
        _set_step(
            scenario_id, step_id, "error", "gettransaction failed.", error=str(exc)
        )
        return False


# ---------------------------------------------------------------------------
# Scenario workers
# ---------------------------------------------------------------------------


def _run_worker(scenario_id: str) -> None:
    handlers = {
        "normal_transaction": _run_normal_transaction,
        "low_fee_transaction": _run_low_fee_transaction,
        "rbf_replacement": _run_rbf_replacement,
        "cpfp_package": _run_cpfp_package,
    }
    handler = handlers.get(scenario_id)
    try:
        if handler:
            handler(scenario_id)
        else:
            with _state_lock:
                _state["scenarios"][scenario_id]["status"] = "error"
    except Exception as exc:
        with _state_lock:
            _state["scenarios"][scenario_id]["status"] = "error"
            _state["scenarios"][scenario_id]["error"] = str(exc)
    finally:
        with _state_lock:
            _state["scenarios"][scenario_id]["running"] = False


def _finish_scenario(scenario_id: str, success: bool) -> None:
    with _state_lock:
        _state["scenarios"][scenario_id]["status"] = "success" if success else "error"
        _state["scenarios"][scenario_id]["running"] = False


# ---------------------------------------------------------------------------
# Scenario 1: Normal Transaction
# ---------------------------------------------------------------------------


def _run_normal_transaction(scenario_id: str) -> None:
    if not _sub_ensure_wallet(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    # send_normal_tx
    _set_step(
        scenario_id,
        "send_normal_tx",
        "running",
        "Sending normal transaction (default fee)…",
    )
    try:
        w_rpc = _wallet_rpc()
        dest = w_rpc.getnewaddress("normal_dest", "bech32")
        txid = w_rpc.sendtoaddress(dest, POLICY_AMOUNT)
        _set_step(
            scenario_id,
            "send_normal_tx",
            "success",
            f"Sent — TXID: {txid}",
            technical={"txid": txid, "amount": POLICY_AMOUNT, "destination": dest},
            data={"txid": txid, "destination": dest},
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "send_normal_tx",
            "error",
            "sendtoaddress failed.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    txid = _get_step_data(scenario_id, "send_normal_tx").get("txid")
    if not _sub_check_mempool(scenario_id, txid):
        _finish_scenario(scenario_id, False)
        return

    if not _sub_mine_block(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    if not _sub_confirm_tx(scenario_id, txid):
        _finish_scenario(scenario_id, False)
        return

    _build_proof_normal(scenario_id)
    _finish_scenario(scenario_id, True)


def _build_proof_normal(scenario_id: str) -> None:
    _set_step(scenario_id, "build_proof", "running", "Assembling proof report…")
    try:
        mempool_data = _get_step_data(scenario_id, "check_mempool")
        confirm_data = _get_step_data(scenario_id, "confirm_tx")
        mine_data = _get_step_data(scenario_id, "mine_block")
        tx_data = _get_step_data(scenario_id, "send_normal_tx")
        wallet_data = _get_step_data(scenario_id, "ensure_wallet")
        proof = {
            "scenario": "normal_transaction",
            "title": SCENARIO_META["normal_transaction"]["title"],
            "network": _get_chain(),
            "wallet": wallet_data.get("wallet"),
            "txid": tx_data.get("txid"),
            "amount_btc": POLICY_AMOUNT,
            "fee_btc": mempool_data.get("fee_btc"),
            "fee_rate_sat_vb": mempool_data.get("fee_rate_sat_vb"),
            "vsize_vbytes": mempool_data.get("vsize"),
            "mempool_seen": mempool_data.get("in_mempool", False),
            "confirmations": confirm_data.get("confirmations", 0),
            "block_hash": mine_data.get("block_hash"),
            "block_height": mine_data.get("block_height"),
            "success": confirm_data.get("confirmed", False),
            "unavailable_features": [],
            "warnings": [],
        }
        with _state_lock:
            _state["scenarios"][scenario_id]["proof"] = proof
        _set_step(
            scenario_id,
            "build_proof",
            "success",
            "Proof report ready.",
            technical=proof,
            data={"proof_ready": True},
        )
    except Exception as exc:
        _set_step(
            scenario_id,
            "build_proof",
            "error",
            "Proof assembly failed.",
            error=str(exc),
        )


# ---------------------------------------------------------------------------
# Scenario 2: Low Fee Transaction
# ---------------------------------------------------------------------------


def _run_low_fee_transaction(scenario_id: str) -> None:
    if not _sub_ensure_wallet(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    # send_low_fee_tx
    _set_step(
        scenario_id,
        "send_low_fee_tx",
        "running",
        f"Sending with fee_rate={LOW_FEE_RATE} sat/vbyte…",
    )
    try:
        w_rpc = _wallet_rpc()
        dest = w_rpc.getnewaddress("low_fee_dest", "bech32")
        txid = w_rpc.sendtoaddress(dest, POLICY_AMOUNT, fee_rate=LOW_FEE_RATE)
        _set_step(
            scenario_id,
            "send_low_fee_tx",
            "success",
            f"Low-fee tx sent — TXID: {txid}",
            technical={
                "txid": txid,
                "amount": POLICY_AMOUNT,
                "requested_fee_rate": LOW_FEE_RATE,
            },
            data={
                "txid": txid,
                "destination": dest,
                "requested_fee_rate": LOW_FEE_RATE,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "send_low_fee_tx",
            "experimental",
            f"fee_rate param not accepted: {exc}. Sending with default fee instead.",
            error=str(exc),
        )
        # Fallback: send without custom fee
        try:
            w_rpc = _wallet_rpc()
            dest = w_rpc.getnewaddress("low_fee_dest_fallback", "bech32")
            txid = w_rpc.sendtoaddress(dest, POLICY_AMOUNT)
            _set_step(
                scenario_id,
                "send_low_fee_tx",
                "experimental",
                f"Fallback: sent with default fee. fee_rate param unavailable in this build. TXID: {txid}",
                technical={
                    "txid": txid,
                    "note": "fee_rate param rejected — using default fee",
                },
                data={"txid": txid, "destination": dest, "fallback": True},
            )
        except RPCError as exc2:
            _set_step(
                scenario_id,
                "send_low_fee_tx",
                "error",
                "sendtoaddress failed.",
                error=str(exc2),
            )
            _finish_scenario(scenario_id, False)
            return

    txid = _get_step_data(scenario_id, "send_low_fee_tx").get("txid")
    if not txid:
        _finish_scenario(scenario_id, False)
        return

    entry = _sub_check_mempool(scenario_id, txid)
    if not entry:
        _finish_scenario(scenario_id, False)
        return

    # compare_fee_rate
    _set_step(scenario_id, "compare_fee_rate", "running", "Comparing fee rate data…")
    low_fee_data = _get_step_data(scenario_id, "check_mempool")
    actual_rate = low_fee_data.get("fee_rate_sat_vb")
    requested_rate = _get_step_data(scenario_id, "send_low_fee_tx").get(
        "requested_fee_rate", "n/a"
    )
    is_fallback = _get_step_data(scenario_id, "send_low_fee_tx").get("fallback", False)
    comparison = {
        "requested_fee_rate": requested_rate,
        "actual_fee_rate_sat_vb": actual_rate,
        "low_fee_threshold_sat_vb": LOW_FEE_RATE,
        "is_below_typical": (actual_rate is not None and actual_rate <= 2.0)
        if actual_rate
        else False,
        "note": "fallback used — custom fee_rate not available"
        if is_fallback
        else "fee_rate param applied",
    }
    _set_step(
        scenario_id,
        "compare_fee_rate",
        "success",
        f"Fee rate: {actual_rate} sat/vb (requested {requested_rate} sat/vb)",
        technical=comparison,
        data={"comparison": comparison},
    )

    if not _sub_mine_block(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    if not _sub_confirm_tx(scenario_id, txid):
        _finish_scenario(scenario_id, False)
        return

    _build_proof_low_fee(scenario_id)
    _finish_scenario(scenario_id, True)


def _build_proof_low_fee(scenario_id: str) -> None:
    _set_step(scenario_id, "build_proof", "running", "Assembling proof report…")
    try:
        mempool_data = _get_step_data(scenario_id, "check_mempool")
        confirm_data = _get_step_data(scenario_id, "confirm_tx")
        mine_data = _get_step_data(scenario_id, "mine_block")
        tx_data = _get_step_data(scenario_id, "send_low_fee_tx")
        comparison = _get_step_data(scenario_id, "compare_fee_rate").get(
            "comparison", {}
        )
        proof = {
            "scenario": "low_fee_transaction",
            "title": SCENARIO_META["low_fee_transaction"]["title"],
            "network": _get_chain(),
            "txid": tx_data.get("txid"),
            "amount_btc": POLICY_AMOUNT,
            "requested_fee_rate_sat_vb": tx_data.get("requested_fee_rate", "n/a"),
            "actual_fee_rate_sat_vb": mempool_data.get("fee_rate_sat_vb"),
            "fee_btc": mempool_data.get("fee_btc"),
            "vsize_vbytes": mempool_data.get("vsize"),
            "fee_comparison": comparison,
            "fallback_used": tx_data.get("fallback", False),
            "confirmations": confirm_data.get("confirmations", 0),
            "block_hash": mine_data.get("block_hash"),
            "block_height": mine_data.get("block_height"),
            "success": confirm_data.get("confirmed", False),
            "unavailable_features": ["custom_fee_rate — fallback used"]
            if tx_data.get("fallback")
            else [],
            "warnings": [],
        }
        with _state_lock:
            _state["scenarios"][scenario_id]["proof"] = proof
        _set_step(
            scenario_id,
            "build_proof",
            "success",
            "Proof report ready.",
            technical=proof,
            data={"proof_ready": True},
        )
    except Exception as exc:
        _set_step(
            scenario_id,
            "build_proof",
            "error",
            "Proof assembly failed.",
            error=str(exc),
        )


# ---------------------------------------------------------------------------
# Scenario 3: RBF Replacement
# ---------------------------------------------------------------------------


def _run_rbf_replacement(scenario_id: str) -> None:
    if not _sub_ensure_wallet(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    # send_replaceable_tx
    _set_step(
        scenario_id,
        "send_replaceable_tx",
        "running",
        "Sending replaceable (BIP125 RBF) transaction…",
    )
    try:
        w_rpc = _wallet_rpc()
        dest = w_rpc.getnewaddress("rbf_dest", "bech32")
        txid = w_rpc.sendtoaddress(dest, POLICY_AMOUNT, replaceable=True)
        _set_step(
            scenario_id,
            "send_replaceable_tx",
            "success",
            f"Replaceable tx sent — TXID: {txid}",
            technical={"txid": txid, "replaceable": True, "amount": POLICY_AMOUNT},
            data={"txid": txid, "destination": dest},
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "send_replaceable_tx",
            "error",
            "sendtoaddress (replaceable=true) failed.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    txid = _get_step_data(scenario_id, "send_replaceable_tx").get("txid")

    # verify_in_mempool
    entry = _sub_check_mempool(scenario_id, txid, step_id="verify_in_mempool")
    if not entry:
        _finish_scenario(scenario_id, False)
        return
    original_fee_rate = _get_step_data(scenario_id, "verify_in_mempool").get(
        "fee_rate_sat_vb"
    )

    # bump_fee
    _set_step(
        scenario_id,
        "bump_fee",
        "running",
        "Calling bumpfee to replace transaction (RBF)…",
    )
    try:
        w_rpc = _wallet_rpc()
        bump_result = w_rpc.bumpfee(txid)
        new_txid = bump_result.get("txid")
        new_fee = bump_result.get("fee")
        orig_fee = bump_result.get("origfee")
        _set_step(
            scenario_id,
            "bump_fee",
            "success",
            f"RBF applied — new TXID: {new_txid}, fee bump: {orig_fee} → {new_fee} BTC",
            technical=bump_result,
            data={
                "new_txid": new_txid,
                "original_txid": txid,
                "new_fee": new_fee,
                "orig_fee": orig_fee,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "bump_fee",
            "experimental",
            f"bumpfee failed: {exc}. RBF may require walletrbf=1 or a different wallet state.",
            error=str(exc),
        )
        # Mark proof as experimental and continue to mine original tx
        _mine_and_confirm_rbf_fallback(scenario_id, txid, original_fee_rate)
        return

    new_txid = _get_step_data(scenario_id, "bump_fee").get("new_txid")

    # verify_replacement
    _set_step(
        scenario_id,
        "verify_replacement",
        "running",
        f"Verifying replacement tx {new_txid[:12] if new_txid else '?'}…",
    )
    try:
        w_rpc = _wallet_rpc()
        new_entry = w_rpc.getmempoolentry(new_txid)
        new_fee_btc = new_entry.get("fees", {}).get("base", 0.0)
        new_vsize = new_entry.get("vsize", 0)
        new_rate = (
            round(new_fee_btc * 1e8 / new_vsize, 2)
            if new_fee_btc and new_vsize
            else None
        )
        _set_step(
            scenario_id,
            "verify_replacement",
            "success",
            f"Replacement in mempool — fee_rate={new_rate} sat/vb (was {original_fee_rate})",
            technical=new_entry,
            data={
                "new_txid": new_txid,
                "new_fee_rate_sat_vb": new_rate,
                "original_fee_rate": original_fee_rate,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "verify_replacement",
            "error",
            "Replacement not found in mempool.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    if not _sub_mine_block(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    # confirm_replacement
    _set_step(
        scenario_id,
        "confirm_replacement",
        "running",
        "Verifying replacement confirmed…",
    )
    try:
        w_rpc = _wallet_rpc()
        tx = w_rpc.gettransaction(new_txid)
        confirmations = tx.get("confirmations", 0)
        if confirmations > 0:
            _set_step(
                scenario_id,
                "confirm_replacement",
                "success",
                f"Replacement confirmed — {confirmations} confirmation(s)",
                technical={"new_txid": new_txid, "confirmations": confirmations},
                data={
                    "confirmed": True,
                    "confirmations": confirmations,
                    "new_txid": new_txid,
                },
            )
        else:
            _set_step(
                scenario_id,
                "confirm_replacement",
                "error",
                "Replacement not confirmed.",
                error="confirmations=0",
            )
            _finish_scenario(scenario_id, False)
            return
    except RPCError as exc:
        _set_step(
            scenario_id,
            "confirm_replacement",
            "error",
            "gettransaction failed for replacement.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    _build_proof_rbf(scenario_id)
    _finish_scenario(scenario_id, True)


def _mine_and_confirm_rbf_fallback(
    scenario_id: str, txid: str, original_fee_rate: Any
) -> None:
    """Fallback when bumpfee fails — skip replacement steps, mine and confirm original."""
    _set_step(
        scenario_id,
        "verify_replacement",
        "experimental",
        "Skipped — bumpfee was not available. Confirming original tx.",
        data={"skipped": True},
    )
    if not _sub_mine_block(scenario_id):
        _finish_scenario(scenario_id, False)
        return
    _set_step(scenario_id, "confirm_replacement", "running", "Confirming original tx…")
    try:
        w_rpc = _wallet_rpc()
        tx = w_rpc.gettransaction(txid)
        confirmations = tx.get("confirmations", 0)
        _set_step(
            scenario_id,
            "confirm_replacement",
            "success" if confirmations > 0 else "error",
            f"Original tx confirmed — {confirmations} confirmation(s)",
            data={
                "confirmed": confirmations > 0,
                "confirmations": confirmations,
                "fallback": True,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "confirm_replacement",
            "error",
            "gettransaction failed.",
            error=str(exc),
        )

    _build_proof_rbf_fallback(scenario_id, txid, original_fee_rate)
    _finish_scenario(scenario_id, False)


def _build_proof_rbf(scenario_id: str) -> None:
    _set_step(scenario_id, "build_proof", "running", "Assembling proof report…")
    try:
        orig_data = _get_step_data(scenario_id, "send_replaceable_tx")
        bump_data = _get_step_data(scenario_id, "bump_fee")
        verify_data = _get_step_data(scenario_id, "verify_replacement")
        orig_mempool_data = _get_step_data(scenario_id, "verify_in_mempool")
        confirm_data = _get_step_data(scenario_id, "confirm_replacement")
        mine_data = _get_step_data(scenario_id, "mine_block")
        proof = {
            "scenario": "rbf_replacement",
            "title": SCENARIO_META["rbf_replacement"]["title"],
            "network": _get_chain(),
            "original_txid": orig_data.get("txid"),
            "replacement_txid": bump_data.get("new_txid"),
            "original_fee_btc": bump_data.get("orig_fee"),
            "replacement_fee_btc": bump_data.get("new_fee"),
            "original_fee_rate_sat_vb": orig_mempool_data.get("fee_rate_sat_vb"),
            "replacement_fee_rate_sat_vb": verify_data.get("new_fee_rate_sat_vb"),
            "rbf_applied": True,
            "confirmations": confirm_data.get("confirmations", 0),
            "block_hash": mine_data.get("block_hash"),
            "block_height": mine_data.get("block_height"),
            "success": confirm_data.get("confirmed", False),
            "unavailable_features": [],
            "warnings": [],
        }
        with _state_lock:
            _state["scenarios"][scenario_id]["proof"] = proof
        _set_step(
            scenario_id,
            "build_proof",
            "success",
            "Proof report ready.",
            technical=proof,
            data={"proof_ready": True},
        )
    except Exception as exc:
        _set_step(
            scenario_id,
            "build_proof",
            "error",
            "Proof assembly failed.",
            error=str(exc),
        )


def _build_proof_rbf_fallback(
    scenario_id: str, txid: str, original_fee_rate: Any
) -> None:
    _set_step(scenario_id, "build_proof", "running", "Assembling proof (fallback)…")
    try:
        mine_data = _get_step_data(scenario_id, "mine_block")
        proof = {
            "scenario": "rbf_replacement",
            "title": SCENARIO_META["rbf_replacement"]["title"],
            "network": _get_chain(),
            "original_txid": txid,
            "replacement_txid": None,
            "original_fee_rate_sat_vb": original_fee_rate,
            "replacement_fee_rate_sat_vb": None,
            "rbf_applied": False,
            "rbf_note": "bumpfee not available — walletrbf may not be enabled or tx already spent",
            "block_hash": mine_data.get("block_hash"),
            "block_height": mine_data.get("block_height"),
            "success": False,
            "unavailable_features": ["rbf_replacement — bumpfee RPC failed"],
            "warnings": ["RBF replacement could not be executed in this environment"],
        }
        with _state_lock:
            _state["scenarios"][scenario_id]["proof"] = proof
        _set_step(
            scenario_id,
            "build_proof",
            "experimental",
            "Partial proof (RBF unavailable).",
            technical=proof,
            data={"proof_ready": True},
        )
    except Exception as exc:
        _set_step(
            scenario_id,
            "build_proof",
            "error",
            "Proof assembly failed.",
            error=str(exc),
        )


# ---------------------------------------------------------------------------
# Scenario 4: CPFP Package
# ---------------------------------------------------------------------------


def _run_cpfp_package(scenario_id: str) -> None:
    if not _sub_ensure_wallet(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    # send_parent_tx — use low fee so miner "needs" child to include it
    _set_step(
        scenario_id,
        "send_parent_tx",
        "running",
        f"Sending low-fee parent tx ({LOW_FEE_RATE} sat/vb)…",
    )
    try:
        w_rpc = _wallet_rpc()
        parent_dest = w_rpc.getnewaddress("cpfp_parent_dest", "bech32")
        try:
            parent_txid = w_rpc.sendtoaddress(
                parent_dest, POLICY_AMOUNT, fee_rate=LOW_FEE_RATE
            )
            used_fee_rate = LOW_FEE_RATE
        except RPCError:
            parent_txid = w_rpc.sendtoaddress(parent_dest, POLICY_AMOUNT)
            used_fee_rate = "default (fee_rate param unavailable)"
        _set_step(
            scenario_id,
            "send_parent_tx",
            "success",
            f"Parent tx sent — TXID: {parent_txid}",
            technical={"txid": parent_txid, "fee_rate_used": used_fee_rate},
            data={
                "parent_txid": parent_txid,
                "parent_dest": parent_dest,
                "fee_rate_used": used_fee_rate,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "send_parent_tx",
            "error",
            "Failed to send parent tx.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    parent_txid = _get_step_data(scenario_id, "send_parent_tx").get("parent_txid")
    parent_dest = _get_step_data(scenario_id, "send_parent_tx").get("parent_dest")

    # verify_parent
    parent_entry = _sub_check_mempool(scenario_id, parent_txid, step_id="verify_parent")
    if not parent_entry:
        _finish_scenario(scenario_id, False)
        return
    parent_fee_rate = _get_step_data(scenario_id, "verify_parent").get(
        "fee_rate_sat_vb"
    )
    parent_vsize = _get_step_data(scenario_id, "verify_parent").get("vsize")
    parent_fee_btc = _get_step_data(scenario_id, "verify_parent").get("fee_btc")

    # build_child_tx — construct child that spends parent's output
    _set_step(
        scenario_id,
        "build_child_tx",
        "running",
        "Finding unconfirmed output and constructing child tx (CPFP)…",
    )
    try:
        w_rpc = _wallet_rpc()
        # Find the UTXO sent to parent_dest (minconf=0 to see unconfirmed)
        utxos = w_rpc.listunspent(minconf=0, maxconf=0, addresses=[parent_dest])
        parent_utxo = next((u for u in utxos if u.get("txid") == parent_txid), None)

        if not parent_utxo:
            _set_step(
                scenario_id,
                "build_child_tx",
                "experimental",
                "Parent UTXO not found with minconf=0. CPFP child cannot be constructed — "
                "this requires the parent output to be tracked in the wallet.",
                technical={"utxos_found": len(utxos), "parent_txid": parent_txid},
                data={"child_skipped": True},
            )
            _mine_cpfp_fallback(scenario_id, parent_txid, parent_fee_rate)
            return

        # Create child tx: spend parent output, send to a new address
        child_dest = w_rpc.getnewaddress("cpfp_child_dest", "bech32")
        child_amount = round(
            parent_utxo["amount"] - 0.00005, 8
        )  # leave ~5000 sat fee margin
        if child_amount <= 0:
            child_amount = 0.00001

        raw_hex = w_rpc.createrawtransaction(
            [{"txid": parent_txid, "vout": parent_utxo["vout"]}],
            {child_dest: child_amount},
        )
        funded = w_rpc.fundrawtransaction(
            raw_hex, {"fee_rate": HIGH_FEE_RATE, "subtractFeeFromOutputs": [0]}
        )
        signed = w_rpc.signrawtransactionwithwallet(funded["hex"])
        if not signed.get("complete"):
            raise RPCError("signing incomplete")
        child_txid = w_rpc.sendrawtransaction(signed["hex"])
        child_fee_estimate = funded.get("fee")

        _set_step(
            scenario_id,
            "build_child_tx",
            "success",
            f"Child tx submitted — TXID: {child_txid}",
            technical={
                "child_txid": child_txid,
                "parent_txid": parent_txid,
                "parent_vout": parent_utxo["vout"],
                "child_fee_estimate": child_fee_estimate,
                "high_fee_rate_sat_vb": HIGH_FEE_RATE,
            },
            data={"child_txid": child_txid, "child_fee_btc": child_fee_estimate},
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "build_child_tx",
            "experimental",
            f"CPFP child construction failed: {exc}",
            error=str(exc),
            data={"child_skipped": True},
        )
        _mine_cpfp_fallback(scenario_id, parent_txid, parent_fee_rate)
        return

    child_txid = _get_step_data(scenario_id, "build_child_tx").get("child_txid")

    # verify_cpfp — check both in mempool, compute package fee rate
    _set_step(
        scenario_id, "verify_cpfp", "running", "Verifying CPFP package in mempool…"
    )
    try:
        w_rpc = _wallet_rpc()
        child_entry = w_rpc.getmempoolentry(child_txid)
        child_fee = child_entry.get("fees", {}).get("base", 0.0)
        child_vsize = child_entry.get("vsize", 0)
        child_fee_rate = (
            round(child_fee * 1e8 / child_vsize, 2)
            if child_fee and child_vsize
            else None
        )
        package_fee = (parent_fee_btc or 0.0) + (child_fee or 0.0)
        package_vsize = (parent_vsize or 0) + (child_vsize or 0)
        package_rate = (
            round(package_fee * 1e8 / package_vsize, 2)
            if package_fee and package_vsize
            else None
        )
        _set_step(
            scenario_id,
            "verify_cpfp",
            "success",
            f"Package rate={package_rate} sat/vb (parent={parent_fee_rate}, child={child_fee_rate})",
            technical={
                "parent_txid": parent_txid,
                "child_txid": child_txid,
                "parent_fee_rate_sat_vb": parent_fee_rate,
                "child_fee_rate_sat_vb": child_fee_rate,
                "package_fee_rate_sat_vb": package_rate,
                "parent_fee_btc": parent_fee_btc,
                "child_fee_btc": child_fee,
            },
            data={
                "package_fee_rate_sat_vb": package_rate,
                "child_txid": child_txid,
                "child_fee_btc": child_fee,
                "child_fee_rate_sat_vb": child_fee_rate,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "verify_cpfp",
            "error",
            "Could not verify CPFP package.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    if not _sub_mine_block(scenario_id):
        _finish_scenario(scenario_id, False)
        return

    # confirm_cpfp — verify both parent and child confirmed
    _set_step(
        scenario_id, "confirm_cpfp", "running", "Verifying parent and child confirmed…"
    )
    try:
        w_rpc = _wallet_rpc()
        parent_tx = w_rpc.gettransaction(parent_txid)
        child_tx = w_rpc.gettransaction(child_txid)
        p_conf = parent_tx.get("confirmations", 0)
        c_conf = child_tx.get("confirmations", 0)
        both_confirmed = p_conf > 0 and c_conf > 0
        _set_step(
            scenario_id,
            "confirm_cpfp",
            "success" if both_confirmed else "error",
            f"Parent: {p_conf} conf, Child: {c_conf} conf",
            technical={"parent_confirmations": p_conf, "child_confirmations": c_conf},
            data={
                "parent_confirmed": p_conf > 0,
                "child_confirmed": c_conf > 0,
                "both_confirmed": both_confirmed,
            },
        )
        if not both_confirmed:
            _finish_scenario(scenario_id, False)
            return
    except RPCError as exc:
        _set_step(
            scenario_id,
            "confirm_cpfp",
            "error",
            "gettransaction failed.",
            error=str(exc),
        )
        _finish_scenario(scenario_id, False)
        return

    _build_proof_cpfp(scenario_id, parent_txid, child_txid)
    _finish_scenario(scenario_id, True)


def _mine_cpfp_fallback(
    scenario_id: str, parent_txid: str, parent_fee_rate: Any
) -> None:
    _set_step(
        scenario_id,
        "verify_cpfp",
        "experimental",
        "Skipped — child tx not constructed. Confirming parent only.",
        data={"skipped": True},
    )
    if not _sub_mine_block(scenario_id):
        _finish_scenario(scenario_id, False)
        return
    _set_step(scenario_id, "confirm_cpfp", "running", "Confirming parent tx…")
    try:
        w_rpc = _wallet_rpc()
        tx = w_rpc.gettransaction(parent_txid)
        p_conf = tx.get("confirmations", 0)
        _set_step(
            scenario_id,
            "confirm_cpfp",
            "success" if p_conf > 0 else "error",
            f"Parent: {p_conf} conf (CPFP child not executed)",
            data={
                "parent_confirmed": p_conf > 0,
                "child_confirmed": False,
                "fallback": True,
            },
        )
    except RPCError as exc:
        _set_step(
            scenario_id,
            "confirm_cpfp",
            "error",
            "gettransaction failed.",
            error=str(exc),
        )

    _build_proof_cpfp_fallback(scenario_id, parent_txid, parent_fee_rate)
    _finish_scenario(scenario_id, False)


def _build_proof_cpfp(scenario_id: str, parent_txid: str, child_txid: str) -> None:
    _set_step(scenario_id, "build_proof", "running", "Assembling proof report…")
    try:
        verify_data = _get_step_data(scenario_id, "verify_cpfp")
        confirm_data = _get_step_data(scenario_id, "confirm_cpfp")
        mine_data = _get_step_data(scenario_id, "mine_block")
        parent_data = _get_step_data(scenario_id, "send_parent_tx")
        proof = {
            "scenario": "cpfp_package",
            "title": SCENARIO_META["cpfp_package"]["title"],
            "network": _get_chain(),
            "parent_txid": parent_txid,
            "child_txid": child_txid,
            "parent_fee_rate_sat_vb": _get_step_data(scenario_id, "verify_parent").get(
                "fee_rate_sat_vb"
            ),
            "child_fee_rate_sat_vb": verify_data.get("child_fee_rate_sat_vb"),
            "package_fee_rate_sat_vb": verify_data.get("package_fee_rate_sat_vb"),
            "parent_fee_btc": _get_step_data(scenario_id, "verify_parent").get(
                "fee_btc"
            ),
            "child_fee_btc": verify_data.get("child_fee_btc"),
            "cpfp_applied": True,
            "parent_confirmed": confirm_data.get("parent_confirmed", False),
            "child_confirmed": confirm_data.get("child_confirmed", False),
            "block_hash": mine_data.get("block_hash"),
            "block_height": mine_data.get("block_height"),
            "fee_rate_requested_parent": parent_data.get("fee_rate_used"),
            "fee_rate_requested_child": HIGH_FEE_RATE,
            "success": confirm_data.get("both_confirmed", False),
            "unavailable_features": [],
            "warnings": [],
        }
        with _state_lock:
            _state["scenarios"][scenario_id]["proof"] = proof
        _set_step(
            scenario_id,
            "build_proof",
            "success",
            "Proof report ready.",
            technical=proof,
            data={"proof_ready": True},
        )
    except Exception as exc:
        _set_step(
            scenario_id,
            "build_proof",
            "error",
            "Proof assembly failed.",
            error=str(exc),
        )


def _build_proof_cpfp_fallback(
    scenario_id: str, parent_txid: str, parent_fee_rate: Any
) -> None:
    _set_step(scenario_id, "build_proof", "running", "Assembling partial proof…")
    try:
        mine_data = _get_step_data(scenario_id, "mine_block")
        proof = {
            "scenario": "cpfp_package",
            "title": SCENARIO_META["cpfp_package"]["title"],
            "network": _get_chain(),
            "parent_txid": parent_txid,
            "child_txid": None,
            "parent_fee_rate_sat_vb": parent_fee_rate,
            "child_fee_rate_sat_vb": None,
            "package_fee_rate_sat_vb": None,
            "cpfp_applied": False,
            "cpfp_note": "Child tx construction failed — listunspent(minconf=0) may not find parent output, or UTXO not wallet-tracked",
            "block_hash": mine_data.get("block_hash"),
            "block_height": mine_data.get("block_height"),
            "success": False,
            "unavailable_features": [
                "cpfp_child_tx — child construction via raw tx pipeline failed"
            ],
            "warnings": [
                "CPFP child could not be submitted; parent confirmed standalone"
            ],
        }
        with _state_lock:
            _state["scenarios"][scenario_id]["proof"] = proof
        _set_step(
            scenario_id,
            "build_proof",
            "experimental",
            "Partial proof (CPFP child unavailable).",
            technical=proof,
            data={"proof_ready": True},
        )
    except Exception as exc:
        _set_step(
            scenario_id,
            "build_proof",
            "error",
            "Proof assembly failed.",
            error=str(exc),
        )


# ---------------------------------------------------------------------------
# Util
# ---------------------------------------------------------------------------


def _get_chain() -> str:
    try:
        return get_client().getblockchaininfo().get("chain", "regtest")
    except RPCError:
        return "regtest"
