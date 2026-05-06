#!/usr/bin/env bash
# check-public-clean.sh — scan public files for local-only artifacts and secrets.

set -euo pipefail

ISSUES=0

flag() {
    echo "  [ISSUE] $1"
    ((ISSUES++)) || true
}

ok() {
    echo "  [OK]    $1"
}

header() {
    echo ""
    echo "--- $1 ---"
}

PATTERN_PRIVATE_KEY="private ""key"
PATTERN_VIDEO_SCRIPT="video-""script"
PATTERN_PRESENTATION="present""ation"
PATTERN_PRESENTATION_PT="apresenta""ção"
PATTERN_SCRIPT_PT="rote""iro"
PATTERN_VIDEO_PT="ví""deo"

SCAN_FILES=$(
    {
        git ls-files
        git ls-files --others --exclude-standard
    } 2>/dev/null \
    | sort -u \
    | grep -Ev '(^|/)(\.git|node_modules|\.venv|logs|dist|build|__pycache__|\.pytest_cache|\.ruff_cache)(/|$)' \
    | grep -Ev '(\.ndjson|\.lock|\.pyc)$' \
    || true
)

if [ -z "${SCAN_FILES}" ]; then
    echo "No files to scan. Run inside a git repository."
    exit 0
fi

grep_files() {
    pattern="$1"
    echo "${SCAN_FILES}" | xargs grep -IlE "${pattern}" 2>/dev/null \
        | grep -Ev '^scripts/check-public-clean\.sh$' \
        || true
}

header "Local artifacts"
for path in ".env"; do
    if git ls-files --error-unmatch "${path}" >/dev/null 2>&1; then
        flag "File '${path}' is tracked by git"
    fi
done
ok "Tracked local-artifact file check complete"

header "Product text scan"
for pattern in \
    "${PATTERN_VIDEO_SCRIPT}" \
    "${PATTERN_PRESENTATION}" \
    "${PATTERN_PRESENTATION_PT}" \
    "${PATTERN_SCRIPT_PT}" \
    "${PATTERN_VIDEO_PT}" \
    "\.cookie" \
    "logs sensíveis"; do
    matches=$(grep_files "${pattern}")
    if [ -n "${matches}" ]; then
        flag "Pattern '${pattern}' found in: ${matches}"
    fi
done
ok "Product text scan complete"

header "Secret material"
for pattern in \
    "BEGIN[[:space:]]+(RSA |EC |OPENSSH )?PRIVATE KEY" \
    "${PATTERN_PRIVATE_KEY}" \
    "seed phrase" \
    "mnemonic" \
    "xprv" \
    "zprv" \
    "token[[:space:]]*=" \
    "api[_-]?key[[:space:]]*=" \
    "rpcpassword=" \
    "BITCOIN_RPC_PASSWORD="; do
    matches=$(grep_files "${pattern}")
    if [ -n "${matches}" ]; then
        case "${matches}" in
            *".env.example"* | *"bitcoin.conf.example"* | *"README.md"* | *"README.en-US.md"* | *"docs/"* | *"SECURITY.md"*)
                : # public examples and security guidance may mention example-only terms
                ;;
            *)
                flag "Secret-like pattern '${pattern}' found in: ${matches}"
                ;;
        esac
    fi
done
ok "Secret material scan complete"

header "Runtime logs"
log_files=$(git ls-files logs/ 2>/dev/null | grep '\.ndjson$' || true)
if [ -n "${log_files}" ]; then
    flag "NDJSON runtime logs are tracked: ${log_files}"
else
    ok "No NDJSON runtime logs tracked"
fi

echo ""
echo "=============================="
echo "  NodeScope public-clean check"
if [ "${ISSUES}" -eq 0 ]; then
    echo "  Result: CLEAN (0 issues)"
    echo "=============================="
    exit 0
fi

echo "  Result: ${ISSUES} issue(s) found"
echo "=============================="
exit 1
