from __future__ import annotations

from typing import Any

from . import storage
from .rpc import RPCError, get_client

SUPPORTED_METRICS = {"mempool_size", "mempool_bytes", "minfee", "rpc_offline"}
SUPPORTED_OPERATORS = {"gt", "lt", "eq", "gte", "lte"}
SUPPORTED_SEVERITIES = {"info", "warning", "critical"}


def _compare(value: float, operator: str, threshold: float) -> bool:
    if operator == "gt":
        return value > threshold
    if operator == "lt":
        return value < threshold
    if operator == "eq":
        return value == threshold
    if operator == "gte":
        return value >= threshold
    if operator == "lte":
        return value <= threshold
    return False


def _current_values() -> dict[str, float]:
    try:
        info = get_client().getmempoolinfo()
        return {
            "mempool_size": float(info.get("size", 0)),
            "mempool_bytes": float(info.get("bytes", 0)),
            "minfee": float(info.get("mempoolminfee", 0.0)) * 100_000,
            "rpc_offline": 0.0,
        }
    except RPCError:
        return {
            "mempool_size": 0.0,
            "mempool_bytes": 0.0,
            "minfee": 0.0,
            "rpc_offline": 1.0,
        }


def _format_config(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "metric": row.get("metric"),
        "operator": row.get("operator"),
        "threshold": row.get("threshold"),
        "severity": row.get("severity"),
        "enabled": bool(row.get("enabled")),
        "created_at": row.get("created_at"),
    }


def list_configs() -> list[dict[str, Any]]:
    storage.seed_default_alerts()
    return [_format_config(row) for row in storage.list_alert_configs()]


def validate_rule(rule: dict[str, Any]) -> None:
    metric = rule.get("metric")
    operator = rule.get("operator")
    severity = rule.get("severity", "warning")
    if rule.get("threshold") is None:
        raise ValueError("Missing threshold")
    if metric not in SUPPORTED_METRICS:
        raise ValueError(f"Unsupported metric: {metric}")
    if operator not in SUPPORTED_OPERATORS:
        raise ValueError(f"Unsupported operator: {operator}")
    if severity not in SUPPORTED_SEVERITIES:
        raise ValueError(f"Unsupported severity: {severity}")


def create_config(rule: dict[str, Any]) -> dict[str, Any] | None:
    validate_rule(rule)
    row_id = storage.insert_alert_config(
        rule["metric"],
        rule["operator"],
        float(rule["threshold"]),
        severity=rule.get("severity", "warning"),
        enabled=bool(rule.get("enabled", True)),
    )
    return _format_config(storage.get_alert_config(row_id)) if row_id is not None else None


def update_config(config_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    existing = storage.get_alert_config(config_id)
    if existing is None:
        return None
    merged = {**existing, **{k: v for k, v in values.items() if v is not None}}
    validate_rule(merged)
    row = storage.update_alert_config(config_id, values)
    return _format_config(row) if row else None


def delete_config(config_id: int) -> bool:
    return storage.delete_alert_config(config_id)


def evaluate_alerts() -> list[dict[str, Any]]:
    storage.seed_default_alerts()
    values = _current_values()
    active = []
    for row in storage.list_alert_configs():
        config = _format_config(row)
        if not config["enabled"]:
            continue
        metric = str(config["metric"])
        value = values.get(metric)
        if value is None:
            continue
        if _compare(value, str(config["operator"]), float(config["threshold"])):
            active.append(
                {
                    "id": config["id"],
                    "metric": metric,
                    "operator": config["operator"],
                    "threshold": config["threshold"],
                    "severity": config["severity"],
                    "current_value": value,
                    "enabled": True,
                }
            )
    return active
