#!/usr/bin/env bash
# demo_regtest.sh — Generate regtest activity for a NodeScope demo.
#
# Safe to run multiple times (idempotent):
#   - Creates or loads the wallet if it does not exist.
#   - Only mines initial blocks when the spendable balance is 0.
#   - Sends 1.5 BTC, shows the pending mempool entry, then mines 1 block to confirm.
#
# Prerequisites:
#   - bitcoind running in regtest mode
#   - NodeScope API running on http://127.0.0.1:8000

set -e
set -o pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CLI="bitcoin-cli -regtest"
WALLET_NAME="nodescope-demo"
SEND_AMOUNT="1.5"
API_URL="http://127.0.0.1:8000"
INITIAL_BLOCKS=101

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
step() {
    echo ""
    echo "==> Step $1: $2"
}

info() {
    echo "    $1"
}

fail() {
    echo ""
    echo "ERROR: $1" >&2
    exit 1
}

# ---------------------------------------------------------------------------
# Step 1 — Check bitcoin-cli
# ---------------------------------------------------------------------------
step 1 "Checking bitcoin-cli availability"
if ! command -v bitcoin-cli &>/dev/null; then
    fail "bitcoin-cli not found. Install Bitcoin Core and ensure it is on PATH."
fi
info "bitcoin-cli found: $(command -v bitcoin-cli)"

# ---------------------------------------------------------------------------
# Step 2 — Check API health
# ---------------------------------------------------------------------------
step 2 "Checking NodeScope API at ${API_URL}"
if ! curl -sf "${API_URL}/health" -o /dev/null; then
    fail "NodeScope API is not responding at ${API_URL}. Start it with: ./.venv/bin/python scripts/run_api.py"
fi
info "API is up."

# ---------------------------------------------------------------------------
# Step 3 — Create or load wallet
# ---------------------------------------------------------------------------
step 3 "Creating or loading wallet '${WALLET_NAME}'"

# List loaded wallets
LOADED_WALLETS=$($CLI listwallets 2>/dev/null || echo "[]")

if echo "${LOADED_WALLETS}" | grep -q "\"${WALLET_NAME}\""; then
    info "Wallet '${WALLET_NAME}' is already loaded."
else
    # Try to load it first (in case it exists on disk but is not loaded)
    if $CLI loadwallet "${WALLET_NAME}" &>/dev/null; then
        info "Wallet '${WALLET_NAME}' loaded from disk."
    else
        # Create a fresh wallet
        $CLI createwallet "${WALLET_NAME}" &>/dev/null
        info "Wallet '${WALLET_NAME}' created."
    fi
fi

# ---------------------------------------------------------------------------
# Step 4 — Get a receive address
# ---------------------------------------------------------------------------
step 4 "Getting a receive address"
ADDR=$($CLI -rpcwallet="${WALLET_NAME}" getnewaddress)
info "Address: ${ADDR}"

# ---------------------------------------------------------------------------
# Step 5 — Mine initial blocks if balance is zero
# ---------------------------------------------------------------------------
step 5 "Checking balance — mining ${INITIAL_BLOCKS} initial blocks if needed"
BALANCE=$($CLI -rpcwallet="${WALLET_NAME}" getbalance)
info "Current balance: ${BALANCE} BTC"

if [ "$(echo "${BALANCE} == 0" | bc -l)" -eq 1 ]; then
    info "Balance is 0. Mining ${INITIAL_BLOCKS} blocks to mature the first coinbase..."
    $CLI generatetoaddress "${INITIAL_BLOCKS}" "${ADDR}" &>/dev/null
    BALANCE=$($CLI -rpcwallet="${WALLET_NAME}" getbalance)
    info "Balance after mining: ${BALANCE} BTC"
else
    info "Balance already sufficient. Skipping initial mining."
fi

# ---------------------------------------------------------------------------
# Step 6 — Send 1.5 BTC to a new address
# ---------------------------------------------------------------------------
step 6 "Sending ${SEND_AMOUNT} BTC to a new address"
DEST_ADDR=$($CLI -rpcwallet="${WALLET_NAME}" getnewaddress)
info "Destination address: ${DEST_ADDR}"
TXID=$($CLI -rpcwallet="${WALLET_NAME}" sendtoaddress "${DEST_ADDR}" "${SEND_AMOUNT}")
info "Transaction broadcast: ${TXID}"

# ---------------------------------------------------------------------------
# Step 7 — Show mempool
# ---------------------------------------------------------------------------
step 7 "Checking mempool for the pending transaction"
MEMPOOL=$($CLI getmempoolinfo)
MEMPOOL_SIZE=$(echo "${MEMPOOL}" | python3 -c "import sys,json; print(json.load(sys.stdin)['size'])" 2>/dev/null || echo "unknown")
info "Mempool size: ${MEMPOOL_SIZE} transaction(s)"
info "Transaction ${TXID} is unconfirmed and visible in the mempool."

# ---------------------------------------------------------------------------
# Step 8 — Mine 1 block to confirm
# ---------------------------------------------------------------------------
step 8 "Mining 1 block to confirm the transaction"
BLOCK_HASHES=$($CLI generatetoaddress 1 "${ADDR}")
BLOCK_HASH=$(echo "${BLOCK_HASHES}" | tr -d '[] \n"')
info "Block mined: ${BLOCK_HASH}"

# ---------------------------------------------------------------------------
# Step 9 — Print summary
# ---------------------------------------------------------------------------
step 9 "Summary"
BLOCK_COUNT=$($CLI getblockcount)
FINAL_BALANCE=$($CLI -rpcwallet="${WALLET_NAME}" getbalance)
echo ""
echo "    Wallet:          ${WALLET_NAME}"
echo "    Address used:    ${ADDR}"
echo "    Final balance:   ${FINAL_BALANCE} BTC"
echo "    Total blocks:    ${BLOCK_COUNT}"
echo "    Confirmed txid:  ${TXID}"
echo ""
echo "    Dashboard: http://localhost:5173"
echo "    API health: ${API_URL}/health"
echo ""
echo "Demo complete."
