#!/usr/bin/env python3
"""
NodeScope load smoke test — concurrent read-only endpoint validation.

Tests only read-only endpoints. Does not alter Bitcoin Core or application state.

Usage:
    python3 scripts/load_smoke.py [options]

Options:
    --base-url   API base URL (default: http://127.0.0.1:8000)
    --concurrency  Number of parallel workers (default: 5)
    --requests   Total number of requests (distributed round-robin, default: 100)
    --timeout    Per-request timeout in seconds (default: 2.0)
    --json       Print results as JSON to stdout

Examples:
    python3 scripts/load_smoke.py
    python3 scripts/load_smoke.py --concurrency 5 --requests 50
    python3 scripts/load_smoke.py --json
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import statistics
import sys
import time
import urllib.error
import urllib.request

READ_ONLY_ENDPOINTS = [
    "/health",
    "/metrics",
    "/demo/status",
    "/events/tape?limit=5",
    "/policy/scenarios",
    "/mempool/cluster/compatibility",
    "/simulation/status",
    "/mempool/summary",
    "/fees/estimate",
    "/fees/compare",
]


def _fetch(base_url: str, path: str, timeout: float) -> tuple[str, int, float]:
    url = base_url.rstrip("/") + path
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "nodescope-load-smoke/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            resp.read()
            return path, resp.status, time.perf_counter() - start
    except urllib.error.HTTPError as exc:
        return path, exc.code, time.perf_counter() - start
    except Exception:
        return path, 0, time.perf_counter() - start


def run_load(
    base_url: str,
    concurrency: int,
    total_requests: int,
    timeout: float,
) -> dict:
    endpoints = READ_ONLY_ENDPOINTS
    tasks = [endpoints[i % len(endpoints)] for i in range(total_requests)]

    per_endpoint: dict[str, list[float]] = {ep: [] for ep in endpoints}
    per_endpoint_errors: dict[str, int] = {ep: 0 for ep in endpoints}
    all_latencies: list[float] = []
    total_errors = 0

    wall_start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(_fetch, base_url, path, timeout) for path in tasks]
        for future in concurrent.futures.as_completed(futures):
            path, status, elapsed = future.result()
            ms = elapsed * 1000.0
            all_latencies.append(ms)
            if path in per_endpoint:
                per_endpoint[path].append(ms)
            is_error = not (200 <= status < 300)
            if is_error:
                total_errors += 1
                if path in per_endpoint_errors:
                    per_endpoint_errors[path] += 1
    wall_elapsed = time.perf_counter() - wall_start

    def _percentile(data: list[float], pct: float) -> float:
        if not data:
            return 0.0
        s = sorted(data)
        idx = max(0, int(len(s) * pct / 100) - 1)
        return round(s[idx], 2)

    def _stats(data: list[float]) -> dict:
        if not data:
            return {"count": 0, "min_ms": 0, "mean_ms": 0, "median_ms": 0, "p95_ms": 0, "max_ms": 0}
        return {
            "count": len(data),
            "min_ms": round(min(data), 2),
            "mean_ms": round(statistics.mean(data), 2),
            "median_ms": round(statistics.median(data), 2),
            "p95_ms": _percentile(data, 95),
            "max_ms": round(max(data), 2),
        }

    aggregate = _stats(all_latencies)
    aggregate["total_requests"] = total_requests
    aggregate["errors"] = total_errors
    aggregate["success_rate"] = (
        round((total_requests - total_errors) / total_requests, 4) if total_requests else 0
    )
    aggregate["wall_seconds"] = round(wall_elapsed, 2)
    aggregate["rps"] = round(total_requests / wall_elapsed, 1) if wall_elapsed > 0 else 0

    per_endpoint_results = []
    for ep in endpoints:
        lats = per_endpoint[ep]
        errs = per_endpoint_errors[ep]
        s = _stats(lats)
        s["endpoint"] = ep
        s["errors"] = errs
        s["success_rate"] = round((s["count"] - errs) / s["count"], 4) if s["count"] else 1.0
        per_endpoint_results.append(s)

    return {
        "base_url": base_url,
        "concurrency": concurrency,
        "total_requests": total_requests,
        "timeout_seconds": timeout,
        "aggregate": aggregate,
        "per_endpoint": per_endpoint_results,
    }


def print_report(result: dict) -> None:
    agg = result["aggregate"]
    ok_pct = f"{agg['success_rate'] * 100:.1f}%"
    print(f"\nNodeScope Load Smoke — {result['base_url']}")
    print(
        f"Concurrency: {result['concurrency']}  Requests: {result['total_requests']}  Timeout: {result['timeout_seconds']}s\n"
    )

    col_ep = 38
    col_n = 7
    col_ms = 10
    header = (
        f"{'Endpoint':<{col_ep}} "
        f"{'Reqs':>{col_n}} "
        f"{'OK%':>{col_n}} "
        f"{'Mean':>{col_ms}} "
        f"{'Median':>{col_ms}} "
        f"{'P95':>{col_ms}} "
        f"{'Max':>{col_ms}}"
    )
    print(header)
    print("-" * len(header))

    for ep in result["per_endpoint"]:
        if ep["count"] == 0:
            continue
        ep_ok = f"{ep['success_rate'] * 100:.0f}%"
        row = (
            f"{ep['endpoint']:<{col_ep}} "
            f"{ep['count']:>{col_n}} "
            f"{ep_ok:>{col_n}} "
            f"{ep['mean_ms']:>{col_ms}.1f}ms "
            f"{ep['median_ms']:>{col_ms}.1f}ms "
            f"{ep['p95_ms']:>{col_ms}.1f}ms "
            f"{ep['max_ms']:>{col_ms}.1f}ms"
        )
        print(row)

    print("-" * len(header))
    agg_row = (
        f"{'AGGREGATE':<{col_ep}} "
        f"{agg['total_requests']:>{col_n}} "
        f"{ok_pct:>{col_n}} "
        f"{agg['mean_ms']:>{col_ms}.1f}ms "
        f"{agg['median_ms']:>{col_ms}.1f}ms "
        f"{agg['p95_ms']:>{col_ms}.1f}ms "
        f"{agg['max_ms']:>{col_ms}.1f}ms"
    )
    print(agg_row)
    print()
    print(
        f"Wall time: {agg['wall_seconds']}s   Throughput: {agg['rps']} req/s   Errors: {agg['errors']}"
    )
    print()
    print("Note: tests only read-only endpoints. No state is modified.")
    print("      Results vary by environment. Run against a live stack.")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description="NodeScope concurrent read-only load smoke test")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL")
    parser.add_argument("--concurrency", type=int, default=5, help="Parallel workers (default: 5)")
    parser.add_argument(
        "--requests",
        type=int,
        default=100,
        help="Total requests, round-robin across endpoints (default: 100)",
    )
    parser.add_argument(
        "--timeout", type=float, default=2.0, help="Per-request timeout in seconds (default: 2.0)"
    )
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()

    if args.requests < 1:
        print("--requests must be >= 1", file=sys.stderr)
        return 1
    if args.concurrency < 1:
        print("--concurrency must be >= 1", file=sys.stderr)
        return 1

    print(
        f"Load smoke: {args.base_url} | concurrency={args.concurrency} | requests={args.requests} | timeout={args.timeout}s",
        file=sys.stderr,
    )

    result = run_load(
        base_url=args.base_url,
        concurrency=args.concurrency,
        total_requests=args.requests,
        timeout=args.timeout,
    )

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)

    agg = result["aggregate"]
    if agg["errors"] == agg["total_requests"]:
        print("ERROR: all requests failed — is the API running?", file=sys.stderr)
        return 1
    if agg["success_rate"] < 0.9:
        print(
            f"WARNING: success rate below 90% ({agg['success_rate'] * 100:.1f}%)", file=sys.stderr
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
