#!/usr/bin/env bash
# smoke-test.sh — fast validation for a running NodeScope stack.

set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000}"
PYTHON="${PYTHON:-./.venv/bin/python}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-0}"

PASS=0
FAIL=0
WARN=0

pass() { echo "  [PASS] $1"; ((PASS++)) || true; }
fail() { echo "  [FAIL] $1"; ((FAIL++)) || true; }
warn() { echo "  [WARN] $1"; ((WARN++)) || true; }
header() { echo ""; echo "--- $1 ---"; }

json_get() {
    python3 -c "import json,sys; print(json.load(sys.stdin).get('$1', ''))" 2>/dev/null || true
}

check_endpoint() {
    path="$1"
    if curl -sf "${API_URL}${path}" -o /tmp/nodescope-smoke.json 2>/dev/null; then
        pass "${path} responded"
        return 0
    fi
    fail "${path} failed"
    return 1
}

header "NodeScope Smoke Tests"
echo "API: ${API_URL}"

header "API endpoints"
if check_endpoint "/health"; then
    rpc_ok=$(json_get "rpc_ok" < /tmp/nodescope-smoke.json)
    if [ "${rpc_ok}" = "True" ] || [ "${rpc_ok}" = "true" ]; then
        pass "Bitcoin Core RPC connected"
    else
        warn "Bitcoin Core RPC is not connected; API fallback is active"
    fi
fi
check_endpoint "/summary" || true
check_endpoint "/mempool/summary" || true
check_endpoint "/events/recent" || true

header "Frontend build"
if [ "${SKIP_FRONTEND_BUILD}" = "1" ]; then
    warn "Skipping frontend build"
elif [ -f frontend/package.json ]; then
    if (cd frontend && npm run build --silent); then
        pass "Frontend build passed"
    else
        fail "Frontend build failed"
    fi
else
    fail "frontend/package.json not found"
fi

header "Python tests"
runner="${PYTHON}"
if [ ! -x "${runner}" ]; then
    runner="$(command -v python3 || true)"
fi
if [ -n "${runner}" ] && "${runner}" -m unittest discover -s tests -q; then
    pass "Python tests passed"
else
    fail "Python tests failed"
fi

rm -f /tmp/nodescope-smoke.json

echo ""
echo "=============================="
echo "  RESULT: PASS=${PASS} FAIL=${FAIL} WARN=${WARN}"
echo "=============================="

if [ "${FAIL}" -gt 0 ]; then
    exit 1
fi
