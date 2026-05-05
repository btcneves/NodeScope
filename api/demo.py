from __future__ import annotations

from pathlib import Path

from fastapi.responses import FileResponse, RedirectResponse

STATIC_DIR = Path(__file__).resolve().parent / "static"
DEMO_HTML = STATIC_DIR / "demo.html"


def demo_page() -> FileResponse:
    return FileResponse(DEMO_HTML)


def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/demo", status_code=307)
