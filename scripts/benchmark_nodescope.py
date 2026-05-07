#!/usr/bin/env python3
"""
NodeScope API Benchmark — reproducible latency measurement.

Usage:
    python3 scripts/benchmark_nodescope.py [--base-url URL] [--runs N] [--json]

Examples:
    python3 scripts/benchmark_nodescope.py
    python3 scripts/benchmark_nodescope.py --base-url http://127.0.0.1:8000 --runs 5
    python3 scripts/benchmark_nodescope.py --json
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import time
import urllib.request
import urllib.error


# ---------------------------------------------------------------------------
# Endpoints to benchmark
# ---------------------------------------------------------------------------

ENDPOINTS = [
    ("GET", "/health", "Health check"),
    ("GET", "/demo/status", "Demo status"),
    ("GET", "/events/tape?limit=5", "ZMQ event tape (5 events)"),
    ("GET", "/policy/scenarios", "Policy scenarios list"),
    ("GET", "/mempool/cluster/compatibility", "Cluster mempool compatibility"),
    ("GET", "/simulation/status", "Simulation status"),
    ("GET", "/mempool/summary", "Mempool summary"),
    ("GET", "/metrics", "Prometheus metrics"),
]


def _request(base_url: str, method: str, path: str, timeout: float = 5.0) -> tuple[int, float]:
    url = base_url.rstrip("/") + path
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            resp.read()
            elapsed = time.perf_counter() - start
            return resp.status, elapsed
    except urllib.error.HTTPError as exc:
        elapsed = time.perf_counter() - start
        return exc.code, elapsed
    except Exception:
        elapsed = time.perf_counter() - start
        return 0, elapsed


def benchmark(base_url: str, runs: int) -> list[dict]:
    results = []
    for method, path, label in ENDPOINTS:
        latencies = []
        statuses = []
        for _ in range(runs):
            status, elapsed = _request(base_url, method, path)
            latencies.append(elapsed * 1000)  # convert to ms
            statuses.append(status)

        ok_statuses = [s for s in statuses if 200 <= s < 300]
        results.append({
            "endpoint": path,
            "label": label,
            "method": method,
            "runs": runs,
            "success_rate": len(ok_statuses) / runs,
            "min_ms": round(min(latencies), 2),
            "max_ms": round(max(latencies), 2),
            "mean_ms": round(statistics.mean(latencies), 2),
            "median_ms": round(statistics.median(latencies), 2),
            "p95_ms": round(sorted(latencies)[max(0, int(runs * 0.95) - 1)], 2) if runs >= 2 else latencies[0],
            "last_status": statuses[-1],
        })
    return results


def print_table(results: list[dict], base_url: str, runs: int) -> None:
    print(f"\nNodeScope API Benchmark — {base_url} — {runs} run(s) per endpoint\n")
    col_label = 36
    col_num = 9
    header = (
        f"{'Endpoint':<{col_label}} "
        f"{'OK%':>{col_num}} "
        f"{'Min':>{col_num}} "
        f"{'Mean':>{col_num}} "
        f"{'Median':>{col_num}} "
        f"{'P95':>{col_num}} "
        f"{'Max':>{col_num}} "
        f"{'Status':>{7}}"
    )
    print(header)
    print("-" * len(header))
    for r in results:
        ok_pct = f"{r['success_rate'] * 100:.0f}%"
        status_str = str(r["last_status"]) if r["last_status"] else "ERR"
        row = (
            f"{r['label']:<{col_label}} "
            f"{ok_pct:>{col_num}} "
            f"{r['min_ms']:>{col_num}.1f}ms "
            f"{r['mean_ms']:>{col_num}.1f}ms "
            f"{r['median_ms']:>{col_num}.1f}ms "
            f"{r['p95_ms']:>{col_num}.1f}ms "
            f"{r['max_ms']:>{col_num}.1f}ms "
            f"{status_str:>{7}}"
        )
        print(row)
    print()
    print("Note: latency includes local network round-trip. Run with backend on same host for best accuracy.")
    print("Environment: regtest (Bitcoin Core), Docker Compose or local uvicorn.")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description="NodeScope API latency benchmark")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="API base URL (default: http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=3,
        help="Number of requests per endpoint (default: 3)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON to stdout",
    )
    args = parser.parse_args()

    if args.runs < 1:
        print("--runs must be >= 1", file=sys.stderr)
        return 1

    print(f"Benchmarking {args.base_url} ({args.runs} run(s) per endpoint)...", file=sys.stderr)
    results = benchmark(args.base_url, args.runs)

    if args.json:
        print(json.dumps({"base_url": args.base_url, "runs": args.runs, "results": results}, indent=2))
    else:
        print_table(results, args.base_url, args.runs)

    # Exit 0 if at least /health returned 2xx
    health_result = next((r for r in results if r["endpoint"] == "/health"), None)
    if health_result and health_result["success_rate"] > 0:
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
