#!/usr/bin/env python3
"""Capture real NodeScope dashboard and API screenshots with Playwright."""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

ROOT_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT_DIR / "docs" / "assets"
VIEWPORT = {"width": 1440, "height": 900}
TIMEOUT_MS = 60_000

DASHBOARD_URL = os.environ.get("NODESCOPE_DASHBOARD_URL", "http://127.0.0.1:5173")
API_URL = os.environ.get("NODESCOPE_API_URL", "http://127.0.0.1:8000")


@dataclass(frozen=True)
class CaptureTarget:
    filename: str
    url: str
    wait_selector: str | None = None


CAPTURE_TARGETS = [
    CaptureTarget("nodescope-dashboard.png", f"{DASHBOARD_URL}/", ".app"),
    CaptureTarget("nodescope-command-center.png", f"{DASHBOARD_URL}/", ".kpi-row"),
    CaptureTarget(
        "nodescope-transaction-lifecycle.png",
        f"{DASHBOARD_URL}/",
        ".lifecycle-panel",
    ),
    CaptureTarget("nodescope-api-docs.png", f"{API_URL}/docs", None),
    CaptureTarget("nodescope-demo-page.png", f"{API_URL}/demo", ".shell"),
    CaptureTarget("nodescope-health.png", f"{API_URL}/health", None),
    CaptureTarget("nodescope-live-events.png", f"{API_URL}/events/recent?limit=20", None),
    CaptureTarget(
        "nodescope-mempool-summary.png",
        f"{API_URL}/mempool/summary",
        None,
    ),
    CaptureTarget("nodescope-latest-block.png", f"{API_URL}/blocks/latest", None),
]


def _relative(path: Path) -> str:
    return str(path.relative_to(ROOT_DIR))


def _capture(page: Page, target: CaptureTarget) -> None:
    networkidle_timeout = 10_000 if target.wait_selector is not None else TIMEOUT_MS
    try:
        page.goto(target.url, wait_until="networkidle", timeout=networkidle_timeout)
    except PlaywrightTimeoutError:
        if target.wait_selector is None:
            raise
        print(
            f"networkidle timeout for {target.filename}; "
            "continuing after domcontentloaded because the dashboard keeps a live SSE stream open",
            file=sys.stderr,
        )
        page.goto(target.url, wait_until="domcontentloaded", timeout=TIMEOUT_MS)
    if target.wait_selector is not None:
        page.wait_for_selector(target.wait_selector, timeout=TIMEOUT_MS)
    page.wait_for_timeout(1_000)
    output_path = ASSETS_DIR / target.filename
    page.screenshot(path=output_path, full_page=True)
    print(f"saved {_relative(output_path)}")


def main() -> int:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT)
        page.set_default_timeout(TIMEOUT_MS)

        for target in CAPTURE_TARGETS:
            try:
                _capture(page, target)
            except PlaywrightError as exc:
                failures.append(f"{target.filename}: {exc}")
                print(f"error capturing {target.filename}: {exc}", file=sys.stderr)

        browser.close()

    if failures:
        print("\nScreenshot capture failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
