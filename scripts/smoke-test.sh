#!/usr/bin/env bash
# smoke-test.sh — fast validation for a running NodeScope stack.

set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:${HOST_API_PORT:-8000}}"
PYTHON="${PYTHON:-./.venv/bin/python}"
COMPOSE="${COMPOSE:-docker compose}"
NODESCOPE_SMOKE_MODE="${NODESCOPE_SMOKE_MODE:-docker}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-0}"

PASS=0
FAIL=0
WARN=0

pass() { echo "  [PASS] $1"; ((PASS++)) || true; }
fail() { echo "  [FAIL] $1"; ((FAIL++)) || true; }
warn() { echo "  [WARN] $1"; ((WARN++)) || true; }
header() { echo ""; echo "--- $1 ---"; }

contains_json_pair() {
    key="$1"
    value="$2"
    grep -Eq "\"${key}\"[[:space:]]*:[[:space:]]*${value}" /tmp/nodescope-smoke.json
}

contains_positive_json_number() {
    key="$1"
    grep -Eq "\"${key}\"[[:space:]]*:[[:space:]]*[1-9][0-9]*" /tmp/nodescope-smoke.json
}

check_endpoint() {
    path="$1"
    if curl -sf --retry 10 --retry-delay 1 --retry-connrefused "${API_URL}${path}" -o /tmp/nodescope-smoke.json 2>/dev/null; then
        pass "${path} responded"
        return 0
    fi
    fail "${path} failed"
    return 1
}

header "NodeScope Smoke Tests"
echo "API: ${API_URL}"
echo "Mode: ${NODESCOPE_SMOKE_MODE}"

header "API endpoints"
if check_endpoint "/health"; then
    if contains_json_pair "rpc_ok" "true"; then
        pass "Bitcoin Core RPC connected"
    else
        fail "Bitcoin Core RPC is not connected"
    fi
    if contains_json_pair "chain" '"regtest"'; then
        pass "Bitcoin Core chain is regtest"
    else
        fail "Bitcoin Core chain is not regtest"
    fi
fi
if check_endpoint "/summary"; then
    if grep -Eq '"project"[[:space:]]*:[[:space:]]*"NodeScope"' /tmp/nodescope-smoke.json; then
        pass "Summary identifies NodeScope"
    else
        fail "Summary did not identify NodeScope"
    fi
    if contains_positive_json_number "rawtx_count"; then
        pass "Summary includes ZMQ rawtx activity"
    else
        fail "Summary has no ZMQ rawtx activity; run make docker-demo first"
    fi
    if contains_positive_json_number "rawblock_count"; then
        pass "Summary includes ZMQ rawblock activity"
    else
        fail "Summary has no ZMQ rawblock activity; run make docker-demo first"
    fi
fi
if check_endpoint "/mempool/summary"; then
    if contains_json_pair "rpc_ok" "true"; then
        pass "Mempool RPC connected"
    else
        fail "Mempool RPC is not connected"
    fi
fi
if check_endpoint "/events/recent"; then
    if contains_positive_json_number "total_items"; then
        pass "Recent events are available"
    else
        fail "Recent events are empty; run make docker-demo first"
    fi
fi
if check_endpoint "/events/classifications"; then
    if contains_positive_json_number "total_items"; then
        pass "Classified events are available"
    else
        fail "Classifications are empty; run make docker-demo first"
    fi
fi

header "Frontend build"
if [ "${SKIP_FRONTEND_BUILD}" = "1" ]; then
    warn "Skipping frontend build"
elif [ "${NODESCOPE_SMOKE_MODE}" = "docker" ]; then
    if ${COMPOSE} run --rm nodescope-frontend-build; then
        pass "Frontend build passed in Docker"
    else
        fail "Frontend build failed in Docker"
    fi
elif [ -f frontend/package.json ]; then
    if (cd frontend && npm run build --silent); then
        pass "Frontend build passed locally"
    else
        fail "Frontend build failed locally"
    fi
else
    fail "frontend/package.json not found"
fi

header "Python tests"
if [ "${NODESCOPE_SMOKE_MODE}" = "docker" ]; then
    if ${COMPOSE} run --rm nodescope-api-test; then
        pass "Python tests passed in Docker"
    else
        fail "Python tests failed in Docker"
    fi
else
    runner="${PYTHON}"
    if [ ! -x "${runner}" ]; then
        runner="$(command -v python3 || true)"
    fi
    if [ -n "${runner}" ] && "${runner}" -m unittest discover -s tests -q; then
        pass "Python tests passed locally"
    else
        fail "Python tests failed locally"
    fi
fi

rm -f /tmp/nodescope-smoke.json

echo ""
echo "=============================="
echo "  RESULT: PASS=${PASS} FAIL=${FAIL} WARN=${WARN}"
echo "=============================="

if [ "${FAIL}" -gt 0 ]; then
    exit 1
fi
