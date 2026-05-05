import datetime
import base64
import json
import os
import pathlib
import urllib.error
import urllib.request
from typing import Any

import zmq

# --- Logging NDJSON ---

ROOT = pathlib.Path(__file__).parent
LOG_DIR = pathlib.Path(os.environ.get("NODESCOPE_LOG_DIR", ROOT / "logs"))
LOG_DIR.mkdir(exist_ok=True)


def log(level, event, origin, data=None):
    entry = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "level": level,
        "origin": origin,
        "event": event,
        "data": data or {},
    }
    line = json.dumps(entry, ensure_ascii=False)
    print(line)
    log_path = LOG_DIR / f"{datetime.date.today().isoformat()}-monitor.ndjson"
    with log_path.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


# --- RPC ---

def rpc(method: str, params: list[Any] | None = None) -> Any | None:
    rpc_url = os.environ.get("BITCOIN_RPC_URL", "http://127.0.0.1:18443")
    rpc_user = os.environ.get("BITCOIN_RPC_USER", "corecraft")
    rpc_password = os.environ.get("BITCOIN_RPC_PASSWORD", "corecraft")
    payload = json.dumps({
        "jsonrpc": "1.1",
        "id": "nodescope-monitor",
        "method": method,
        "params": params or [],
    }).encode()
    credentials = f"{rpc_user}:{rpc_password}".encode()
    auth = base64.b64encode(credentials).decode()
    request = urllib.request.Request(
        rpc_url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=3) as response:
            decoded = json.loads(response.read())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        log("warn", "rpc_failed", "monitor", {"method": method, "error": str(exc)})
        return None
    if decoded.get("error"):
        log("warn", "rpc_failed", "monitor", {"method": method, "error": decoded["error"]})
        return None
    return decoded.get("result")


def _extract_output_address(script: dict[str, Any]) -> str | None:
    address = script.get("address")
    if isinstance(address, str) and address:
        return address
    addresses = script.get("addresses")
    if isinstance(addresses, list):
        for candidate in addresses:
            if isinstance(candidate, str) and candidate:
                return candidate
    return None


def build_rawtx_payload(tx: dict[str, Any]) -> dict[str, Any]:
    vin = tx.get("vin", [])
    raw_vout = tx.get("vout", [])

    vin_count = len(vin) if isinstance(vin, list) else 0
    coinbase_input_present = False
    if isinstance(vin, list):
        coinbase_input_present = any(
            isinstance(entry, dict) and isinstance(entry.get("coinbase"), str) and entry.get("coinbase")
            for entry in vin
        )

    outputs: list[dict[str, Any]] = []
    total_out = 0.0
    addressed_output_count = 0
    unattributed_output_count = 0
    zero_value_output_count = 0
    positive_output_count = 0
    script_types: list[str] = []

    if isinstance(raw_vout, list):
        for out in raw_vout:
            if not isinstance(out, dict):
                continue
            value = float(out.get("value", 0) or 0)
            total_out += value
            if value == 0.0:
                zero_value_output_count += 1
            if value > 0.0:
                positive_output_count += 1

            script = out.get("scriptPubKey", {})
            if not isinstance(script, dict):
                script = {}

            script_type = script.get("type")
            if isinstance(script_type, str) and script_type and script_type not in script_types:
                script_types.append(script_type)

            address = _extract_output_address(script)
            if address is None:
                unattributed_output_count += 1
            else:
                addressed_output_count += 1
            outputs.append({"value": value, "address": address})

    return {
        "txid": tx.get("txid"),
        "inputs": vin_count,
        "outputs": len(outputs),
        "vin_count": vin_count,
        "vout_count": len(outputs),
        "total_out": total_out,
        "coinbase_input_present": coinbase_input_present,
        "addressed_output_count": addressed_output_count,
        "unattributed_output_count": unattributed_output_count,
        "zero_value_output_count": zero_value_output_count,
        "positive_output_count": positive_output_count,
        "script_types": sorted(script_types),
        "has_op_return": "nulldata" in script_types,
        "vout": outputs,
    }


# --- Handlers de evento ---

def handle_rawtx(body):
    tx_hex = body.hex()
    tx = rpc("decoderawtransaction", [tx_hex])
    if not isinstance(tx, dict):
        log("warn", "rpc_enrichment_unavailable", "rawtx", {"step": "decoderawtransaction"})
        return
    log("info", "zmq_rawtx", "rawtx", build_rawtx_payload(tx))


def handle_rawblock(body):
    height = rpc("getblockcount")
    block_hash = rpc("getblockhash", [height]) if height is not None else None
    log("info", "zmq_rawblock", "rawblock", {
        "height": int(height) if isinstance(height, int) else None,
        "hash": block_hash if isinstance(block_hash, str) else None,
    })


def create_socket(context: zmq.Context | None = None) -> zmq.Socket:
    ctx = context or zmq.Context()
    socket = ctx.socket(zmq.SUB)
    socket.connect(os.environ.get("ZMQ_RAWTX_URL", "tcp://127.0.0.1:28333"))
    socket.connect(os.environ.get("ZMQ_RAWBLOCK_URL", "tcp://127.0.0.1:28332"))
    socket.setsockopt_string(zmq.SUBSCRIBE, "")
    return socket


def main() -> None:
    socket = create_socket()
    log("info", "monitor_start", "monitor", {
        "rawtx": os.environ.get("ZMQ_RAWTX_URL", "tcp://127.0.0.1:28333"),
        "rawblock": os.environ.get("ZMQ_RAWBLOCK_URL", "tcp://127.0.0.1:28332"),
    })

    while True:
        try:
            parts = socket.recv_multipart()
            if len(parts) < 2:
                log("warn", "malformed_message", "zmq", {"parts_count": len(parts)})
                continue
            topic = parts[0]
            body = parts[1]
            if topic == b"rawtx":
                handle_rawtx(body)
            elif topic == b"rawblock":
                handle_rawblock(body)
        except KeyboardInterrupt:
            log("info", "monitor_stop", "monitor", {})
            break
        except Exception as e:
            log("error", "unexpected_error", "monitor", {"error": str(e)})


if __name__ == "__main__":
    main()
