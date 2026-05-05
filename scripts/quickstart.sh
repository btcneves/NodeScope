#!/usr/bin/env bash
# quickstart.sh — install local NodeScope dependencies without destructive actions.

set -euo pipefail

echo "NodeScope quickstart"
echo "===================="

if ! command -v python3 >/dev/null 2>&1; then
    echo "[FAIL] python3 not found" >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "[FAIL] npm not found. Install Node.js 18+." >&2
    exit 1
fi

if [ ! -d .venv ]; then
    python3 -m venv .venv
    echo "[OK] Created .venv"
else
    echo "[OK] Reusing .venv"
fi

./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt
(cd frontend && npm install)

if [ ! -f .env ]; then
    cp .env.example .env
    echo "[OK] Created .env from .env.example"
else
    echo "[OK] Existing .env left untouched"
fi

echo ""
echo "Next steps:"
echo "  make backend"
echo "  make monitor"
echo "  make frontend"
