from .models import BlockEvent, RawEvent, TxEvent, VoutEntry


def _as_int(value: object, default: int = 0) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value)
        except ValueError:
            return default
    return default


def _as_float(value: object, default: float = 0.0) -> float:
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return default
    return default


def _as_optional_bool(value: object) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes"}:
            return True
        if lowered in {"false", "0", "no"}:
            return False
    return None


def parse_tx(event: RawEvent) -> TxEvent | None:
    """Transforma um evento zmq_rawtx em TxEvent tipado."""
    if event.event != "zmq_rawtx":
        return None

    d = event.data
    txid = d.get("txid")
    if not isinstance(txid, str) or not txid:
        return None

    raw_vout = d.get("vout", [])
    vout: list[VoutEntry] = []
    if isinstance(raw_vout, list):
        for entry in raw_vout:
            if not isinstance(entry, dict):
                continue
            address = entry.get("address")
            normalized_address = address if isinstance(address, str) and address else None
            vout.append(
                VoutEntry(
                    value=_as_float(entry.get("value"), 0.0),
                    address=normalized_address,
                )
            )

    inputs = _as_int(d.get("inputs"), _as_int(d.get("vin_count"), 0))
    outputs = _as_int(d.get("outputs"), _as_int(d.get("vout_count"), len(vout)))
    total_out = _as_float(d.get("total_out"), sum(item.value for item in vout))
    addressed_output_count = _as_int(
        d.get("addressed_output_count"),
        sum(1 for item in vout if item.address is not None),
    )
    zero_value_output_count = _as_int(
        d.get("zero_value_output_count"),
        sum(1 for item in vout if item.value == 0.0),
    )
    positive_output_count = _as_int(
        d.get("positive_output_count"),
        sum(1 for item in vout if item.value > 0.0),
    )
    unattributed_output_count = _as_int(
        d.get("unattributed_output_count"),
        sum(1 for item in vout if item.address is None),
    )
    raw_script_types = d.get("script_types", [])
    script_types: list[str] = []
    if isinstance(raw_script_types, list):
        for entry in raw_script_types:
            if isinstance(entry, str) and entry and entry not in script_types:
                script_types.append(entry)

    coinbase_input_present = _as_optional_bool(d.get("coinbase_input_present"))
    has_op_return = _as_optional_bool(d.get("has_op_return"))
    if has_op_return is None:
        has_op_return = "nulldata" in script_types

    return TxEvent(
        ts=event.ts,
        txid=txid,
        inputs=inputs,
        outputs=outputs if outputs >= 0 else 0,
        total_out=total_out if total_out >= 0 else 0.0,
        vout=vout,
        coinbase_input_present=coinbase_input_present,
        addressed_output_count=max(0, addressed_output_count),
        unattributed_output_count=max(0, unattributed_output_count),
        zero_value_output_count=max(0, zero_value_output_count),
        positive_output_count=max(0, positive_output_count),
        script_types=sorted(script_types),
        has_op_return=has_op_return,
    )


def parse_block(event: RawEvent) -> BlockEvent | None:
    """Transforma um evento zmq_rawblock em BlockEvent tipado."""
    if event.event != "zmq_rawblock":
        return None

    d = event.data
    height = d.get("height")
    normalized_height = _as_int(height) if height is not None else None
    block_hash = d.get("hash")
    return BlockEvent(
        ts=event.ts,
        height=normalized_height,
        hash=block_hash if isinstance(block_hash, str) and block_hash else None,
    )
