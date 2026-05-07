"""Fee estimation service — wraps estimatesmartfee RPC and builds reports.

estimatesmartfee returns feerate in BTC/kvB.
Conversion: sat/vB = feerate_btc_kvb * 100_000
  (1 BTC = 100_000_000 sat; 1 kvB = 1000 vB  →  BTC/kvB × 100_000_000 / 1000 = sat/vB)

In regtest, estimatesmartfee may return {'errors': [...]} or an absent feerate
because there is no real fee market. This is displayed honestly.
"""

from __future__ import annotations

import datetime
from typing import Any

from .rpc import RPCError, get_client

# Default confirmation targets to estimate
_DEFAULT_TARGETS = [1, 3, 6, 12]

_BTC_KVB_TO_SAT_VB = 100_000  # exact, no floating-point surprise


def _convert_feerate(feerate_btc_kvb: float) -> float:
    return round(feerate_btc_kvb * _BTC_KVB_TO_SAT_VB, 4)


def _estimate_target(
    conf_target: int, estimate_mode: str
) -> dict[str, Any]:
    """Call estimatesmartfee for a single target and return a normalised dict."""
    client = get_client()
    try:
        result = client.estimatesmartfee(conf_target, estimate_mode)
    except RPCError as exc:
        return {
            "target_blocks": conf_target,
            "estimate_mode": estimate_mode,
            "feerate_btc_kvb": None,
            "feerate_sat_vb": None,
            "blocks_returned": None,
            "errors": [str(exc)],
            "status": "error",
        }

    errors = result.get("errors") or []
    feerate = result.get("feerate")
    blocks_returned = result.get("blocks")

    if feerate is not None:
        status = "success"
        feerate_sat_vb = _convert_feerate(feerate)
    elif errors:
        status = "limited"
        feerate_sat_vb = None
    else:
        status = "unavailable"
        feerate_sat_vb = None

    return {
        "target_blocks": conf_target,
        "estimate_mode": estimate_mode,
        "feerate_btc_kvb": feerate,
        "feerate_sat_vb": feerate_sat_vb,
        "blocks_returned": blocks_returned,
        "errors": errors,
        "status": status,
    }


def get_fee_estimates(
    estimate_mode: str = "CONSERVATIVE",
    targets: list[int] | None = None,
) -> dict[str, Any]:
    """Return fee estimates for all targets, plus node metadata."""
    if targets is None:
        targets = _DEFAULT_TARGETS

    estimate_mode = estimate_mode.upper()

    client = get_client()
    network: str | None = None
    bitcoin_core_version: str | None = None
    warnings: list[str] = []

    try:
        info = client.getblockchaininfo()
        network = info.get("chain")
    except RPCError:
        warnings.append("Could not reach Bitcoin Core RPC.")

    try:
        netinfo = client.getnetworkinfo()
        bitcoin_core_version = netinfo.get("subversion")
    except RPCError:
        pass

    if network == "regtest":
        warnings.append(
            "Running in regtest: estimatesmartfee has no real fee market. "
            "Results may be unavailable or limited. "
            "This does not represent mainnet fee conditions."
        )

    estimates = [_estimate_target(t, estimate_mode) for t in targets]

    any_success = any(e["status"] == "success" for e in estimates)
    unavailable_features: list[str] = []
    if not any_success:
        unavailable_features.append(
            "estimatesmartfee returned no feerate for any target "
            "(insufficient data — expected in regtest without prior transactions)"
        )

    return {
        "network": network,
        "bitcoin_core_version": bitcoin_core_version,
        "estimate_mode": estimate_mode,
        "targets": targets,
        "estimates": estimates,
        "warnings": warnings,
        "unavailable_features": unavailable_features,
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
    }


def get_fee_comparison() -> dict[str, Any]:
    """Return fee estimates side-by-side with fees used in recent NodeScope scenarios.

    The comparison sources are read from shared in-memory state of the
    demo/policy services. If no runs have been completed the field is marked
    unavailable — no values are invented.
    """
    estimates = get_fee_estimates()

    compared: list[dict[str, Any]] = []

    # Import lazily to avoid circular imports at module load time
    try:
        from .demo_service import get_status as demo_status

        demo_state = demo_status()
        proof = demo_state.get("proof") or {}
        fee_rate = proof.get("fee_rate_sat_vb")
        if fee_rate is not None:
            compared.append({
                "source": "guided_demo",
                "label": "Guided Demo",
                "feerate_sat_vb": fee_rate,
                "feerate_btc_kvb": round(fee_rate / _BTC_KVB_TO_SAT_VB, 8) if fee_rate else None,
                "note": "Fee rate of the most recent Guided Demo transaction",
            })
    except Exception:
        pass

    try:
        from .policy_service import get_scenario_proof

        for scenario_id, label in [
            ("normal_transaction", "Normal Transaction"),
            ("low_fee_transaction", "Low Fee Transaction"),
            ("rbf_replacement", "RBF Replacement"),
            ("cpfp_package", "CPFP Package"),
        ]:
            proof = get_scenario_proof(scenario_id)
            if proof is None:
                continue
            fee_rate = proof.get("fee_rate_sat_vb")
            if fee_rate is not None:
                compared.append({
                    "source": scenario_id,
                    "label": label,
                    "feerate_sat_vb": fee_rate,
                    "feerate_btc_kvb": round(fee_rate / _BTC_KVB_TO_SAT_VB, 8) if fee_rate else None,
                    "note": f"Fee rate from {label} scenario",
                })
    except Exception:
        pass

    estimates["compared_fee_rates"] = compared
    estimates["comparison_available"] = len(compared) > 0
    if not compared:
        estimates["comparison_note"] = (
            "No scenario runs available for comparison. "
            "Run the Guided Demo or a Policy Arena scenario first."
        )

    return estimates
