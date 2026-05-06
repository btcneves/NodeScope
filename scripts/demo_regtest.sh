#!/usr/bin/env bash
# demo_regtest.sh — generate wallet, transaction and block activity in regtest.

set -euo pipefail

if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
fi

RPC_USER="${BITCOIN_RPC_USER:-nodescope}"
RPC_PASSWORD="${BITCOIN_RPC_PASSWORD:-nodescope}"
RPC_HOST="${BITCOIN_RPC_HOST:-127.0.0.1}"
RPC_PORT="${HOST_BITCOIN_RPC_PORT:-18443}"

if [ -n "${BITCOIN_RPC_URL:-}" ] && [ -z "${BITCOIN_CLI:-}" ]; then
    RPC_HOST=$(python3 - "${BITCOIN_RPC_URL}" <<'PY'
from urllib.parse import urlparse
import sys
parsed = urlparse(sys.argv[1])
print(parsed.hostname or "127.0.0.1")
PY
)
    parsed_port=$(python3 - "${BITCOIN_RPC_URL}" <<'PY'
from urllib.parse import urlparse
import sys
parsed = urlparse(sys.argv[1])
print(parsed.port or "")
PY
)
    if [ -n "${parsed_port}" ]; then
        RPC_PORT="${parsed_port}"
    fi
fi

CLI="${BITCOIN_CLI:-bitcoin-cli -regtest -rpcconnect=${RPC_HOST} -rpcport=${RPC_PORT} -rpcuser=${RPC_USER} -rpcpassword=${RPC_PASSWORD}}"
WALLET_NAME="${NODESCOPE_DEMO_WALLET:-nodescope_demo}"
SEND_AMOUNT="${NODESCOPE_DEMO_AMOUNT:-1.5}"
API_URL="${API_URL:-http://127.0.0.1:8000}"
INITIAL_BLOCKS="${NODESCOPE_INITIAL_BLOCKS:-101}"

step() { echo ""; echo "==> $1"; }
info() { echo "    $1"; }
fail() { echo "ERROR: $1" >&2; exit 1; }

json_field() {
    python3 -c "import json,sys; print(json.load(sys.stdin).get('$1', ''))" 2>/dev/null || true
}

step "Checking bitcoin-cli"
if [ -z "${BITCOIN_CLI:-}" ]; then
    command -v bitcoin-cli >/dev/null 2>&1 || fail "bitcoin-cli not found"
else
    info "Using custom BITCOIN_CLI command"
fi

step "Checking NodeScope API"
curl -sf "${API_URL}/health" >/dev/null || fail "API not responding at ${API_URL}"
info "API is reachable"

step "Checking Bitcoin Core RPC"
$CLI getblockchaininfo >/dev/null || fail "Bitcoin Core RPC is not reachable"
info "RPC is reachable at ${RPC_HOST}:${RPC_PORT}"

step "Creating or loading wallet ${WALLET_NAME}"
loaded=$($CLI listwallets 2>/dev/null || echo "[]")
if echo "${loaded}" | grep -q "\"${WALLET_NAME}\""; then
    info "Wallet already loaded"
elif $CLI loadwallet "${WALLET_NAME}" >/dev/null 2>&1; then
    info "Wallet loaded"
else
    $CLI createwallet "${WALLET_NAME}" >/dev/null
    info "Wallet created"
fi

WCLI="$CLI -rpcwallet=${WALLET_NAME}"

step "Generating receive address"
ADDR=$($WCLI getnewaddress)
info "Address: ${ADDR}"

step "Ensuring spendable balance"
BALANCE=$($WCLI getbalance)
if python3 - "${BALANCE}" <<'PY'
import sys
raise SystemExit(0 if float(sys.argv[1]) <= 0 else 1)
PY
then
    info "Mining ${INITIAL_BLOCKS} initial blocks"
    $CLI generatetoaddress "${INITIAL_BLOCKS}" "${ADDR}" >/dev/null
else
    info "Existing balance: ${BALANCE} BTC"
fi

step "Broadcasting demo transaction"
DEST_ADDR=$($WCLI getnewaddress)
TXID=$($WCLI sendtoaddress "${DEST_ADDR}" "${SEND_AMOUNT}")
info "TXID: ${TXID}"

step "Reading mempool"
MEMPOOL=$($CLI getmempoolinfo)
MEMPOOL_SIZE=$(echo "${MEMPOOL}" | json_field "size")
info "Mempool size: ${MEMPOOL_SIZE}"

step "Mining confirmation block"
BLOCK_HASHES=$($CLI generatetoaddress 1 "${ADDR}")
BLOCK_HASH=$(echo "${BLOCK_HASHES}" | tr -d '[] \n"')
info "Block: ${BLOCK_HASH}"

step "Demo summary"
info "Wallet: ${WALLET_NAME}"
info "Confirmed txid: ${TXID}"
info "Block height: $($CLI getblockcount)"
info "Dashboard: http://localhost:5173"
info "API: ${API_URL}"
