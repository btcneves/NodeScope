#!/usr/bin/env bash
# smoke-test.sh — Fast validation that NodeScope is healthy.
#
# Checks:
#   1. Python backend /health responds
#   2. /mempool/summary responds
#   3. /events/recent responds
#   4. Frontend build succeeds (optional — set SKIP_FRONTEND_BUILD=1 to skip)
#   5. Python unit tests pass
#
# Usage:
#   bash scripts/smoke-test.sh
#   SKIP_FRONTEND_BUILD=1 bash scripts/smoke-test.sh

set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000}"
PYTHON="${PYTHON:-./.venv/bin/python}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-0}"

PASS=0
FAIL=0
WARN=0

pass()  { echo "  [PASS] $1"; ((PASS++)) || true; }
fail()  { echo "  [FAIL] $1"; ((FAIL++)) || true; }
warn()  { echo "  [WARN] $1"; ((WARN++)) || true; }
header(){ echo ""; echo "--- $1 ---"; }

# ---------------------------------------------------------------------------
# 1. Backend health
# ---------------------------------------------------------------------------
header "Backend connectivity"
if curl -sf "${API_URL}/health" -o /dev/null 2>/dev/null; then
    pass "/health is responding at ${API_URL}"
    HEALTH_BODY=$(curl -s "${API_URL}/health")
    RPC_OK=$(echo "${HEALTH_BODY}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('rpc_ok',''))" 2>/dev/null || echo "unknown")
    if [ "${RPC_OK}" = "True" ] || [ "${RPC_OK}" = "true" ]; then
        pass "Bitcoin Core RPC is connected"
    else
        warn "Bitcoin Core RPC not connected (rpc_ok=${RPC_OK}) — start bitcoind in regtest"
    fi
else
    fail "/health not reachable — start the backend: make backend"
fi

# ---------------------------------------------------------------------------
# 2. Mempool endpoint
# ---------------------------------------------------------------------------
header "Mempool endpoint"
if curl -sf "${API_URL}/mempool/summary" -o /dev/null 2>/dev/null; then
    pass "/mempool/summary is responding"
else
    fail "/mempool/summary failed"
fi

# ---------------------------------------------------------------------------
# 3. Events endpoint
# ---------------------------------------------------------------------------
header "Events endpoint"
if curl -sf "${API_URL}/events/recent" -o /dev/null 2>/dev/null; then
    EVENTS=$(curl -s "${API_URL}/events/recent" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_items',0))" 2>/dev/null || echo "0")
    pass "/events/recent is responding (total_items=${EVENTS})"
else
    fail "/events/recent failed"
fi

# ---------------------------------------------------------------------------
# 4. Frontend build
# ---------------------------------------------------------------------------
header "Frontend build"
if [ "${SKIP_FRONTEND_BUILD}" = "1" ]; then
    warn "Skipping frontend build (SKIP_FRONTEND_BUILD=1)"
elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    if (cd frontend && npm run build --silent 2>&1 | tail -5); then
        pass "Frontend build succeeded"
    else
        fail "Frontend build failed"
    fi
else
    warn "frontend/ directory not found — skipping"
fi

# ---------------------------------------------------------------------------
# 5. Python tests
# ---------------------------------------------------------------------------
header "Python tests"
if [ -f "${PYTHON}" ] || command -v python3 &>/dev/null; then
    RUNNER="${PYTHON}"
    [ ! -f "${PYTHON}" ] && RUNNER="python3"
    if "${RUNNER}" -m unittest discover -s tests -q 2>&1 | tail -3; then
        pass "Python tests passed"
    else
        fail "Python tests failed"
    fi
else
    warn "Python not found at ${PYTHON} — skipping tests"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=============================="
echo "  Smoke test complete"
echo "  PASS: ${PASS}  FAIL: ${FAIL}  WARN: ${WARN}"
echo "=============================="
echo ""

if [ "${FAIL}" -gt 0 ]; then
    echo "One or more checks failed. See output above."
    exit 1
fi
