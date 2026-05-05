from typing import Optional

from .models import RawEvent, TxEvent, BlockEvent, ClassifiedEvent
from .parser import parse_tx, parse_block


def _tx_signals(tx: TxEvent) -> dict[str, object]:
    address_count = tx.addressed_output_count
    has_address = address_count > 0
    has_zero_value_output = tx.zero_value_output_count > 0
    has_null_address = tx.unattributed_output_count > 0
    positive_output_count = tx.positive_output_count
    return {
        "one_input": tx.inputs == 1,
        "single_output": tx.outputs == 1,
        "multiple_outputs": tx.outputs >= 2,
        "positive_total_out": tx.total_out > 0.0,
        "has_address": has_address,
        "has_zero_value_output": has_zero_value_output,
        "has_null_address": has_null_address,
        "address_count": address_count,
        "addressed_output_count": tx.addressed_output_count,
        "unattributed_output_count": tx.unattributed_output_count,
        "zero_value_output_count": tx.zero_value_output_count,
        "positive_output_count": positive_output_count,
        "coinbase_input_present": tx.coinbase_input_present,
        "has_op_return": tx.has_op_return,
        "script_types": tx.script_types,
    }


def _classify_tx(event: RawEvent, tx: TxEvent) -> ClassifiedEvent:
    """Heurísticas iniciais, deliberadamente conservadoras, para transações."""
    signals = _tx_signals(tx)
    explicit_coinbase_signal = tx.coinbase_input_present is True
    coinbase_like_signal = (
        explicit_coinbase_signal
        or (
            signals["one_input"]
            and tx.outputs >= 1
            and signals["positive_total_out"]
            and signals["has_address"]
            and (signals["has_zero_value_output"] or signals["has_null_address"])
        )
    )

    if explicit_coinbase_signal:
        kind = "coinbase_like"
        confidence = "medium"
        reason = (
            "vin coinbase observado diretamente no payload do monitor; "
            "classificação continua conservadora na taxonomia pública da Fase 1"
        )
    elif coinbase_like_signal:
        kind = "coinbase_like"
        confidence = "low"
        reason = (
            "shape observado compatível com recompensa minerada no log atual: "
            "1 input, total positivo, ao menos um endereço e output técnico zero/nulo"
        )
    elif (
        tx.inputs >= 1
        and tx.outputs == 1
        and signals["has_address"]
        and not explicit_coinbase_signal
    ):
        kind = "simple_payment_like"
        confidence = "medium"
        reason = "shape simples observado: pelo menos 1 input e exatamente 1 output com endereço"
    else:
        kind = "unknown"
        confidence = "low"
        reason = (
            "shape insuficiente para classificação segura com os campos hoje expostos pelo monitor"
        )

    metadata = {
        "inputs": tx.inputs,
        "outputs": tx.outputs,
        "total_out": tx.total_out,
        "has_address": signals["has_address"],
        "has_zero_value_output": signals["has_zero_value_output"],
        "has_null_address": signals["has_null_address"],
        "address_count": signals["address_count"],
        "addressed_output_count": tx.addressed_output_count,
        "unattributed_output_count": tx.unattributed_output_count,
        "zero_value_output_count": tx.zero_value_output_count,
        "positive_output_count": tx.positive_output_count,
        "coinbase_input_present": tx.coinbase_input_present,
        "has_op_return": tx.has_op_return,
        "script_types": tx.script_types,
        "coinbase_like_signal": coinbase_like_signal,
        "signals": signals,
        "reason": reason,
        "confidence": confidence,
    }

    return ClassifiedEvent(raw=event, kind=kind, tx=tx, metadata=metadata)


def classify(event: RawEvent) -> Optional[ClassifiedEvent]:
    """
    Pipeline de classificação: recebe RawEvent, retorna ClassifiedEvent ou None.
    Eventos que não são zmq_rawtx nem zmq_rawblock retornam None (skipped).
    """
    if event.event == "zmq_rawtx":
        tx = parse_tx(event)
        if tx is None:
            return ClassifiedEvent(
                raw=event,
                kind="unknown",
                metadata={"reason": "invalid_tx_event"},
            )
        return _classify_tx(event, tx)
    elif event.event == "zmq_rawblock":
        block = parse_block(event)
        if block is None:
            return ClassifiedEvent(
                raw=event,
                kind="unknown",
                metadata={"reason": "invalid_block_event"},
            )
        return ClassifiedEvent(
            raw=event,
            kind="block_event",
            block=block,
            metadata={
                "height": block.height,
                "hash": block.hash,
                "signals": {
                    "has_height": block.height is not None,
                    "has_hash": block.hash is not None,
                },
                "reason": "evento de bloco emitido diretamente pelo monitor",
                "confidence": "medium",
            },
        )
    return None
