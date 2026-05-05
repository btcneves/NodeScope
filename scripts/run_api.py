#!/usr/bin/env python3
"""
Inicializa a API local read-only do NodeScope.

Uso:
    ./.venv/bin/python scripts/run_api.py
    ./.venv/bin/python scripts/run_api.py --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import argparse
import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Executa a API read-only local do NodeScope."
    )
    parser.add_argument("--host", default=os.environ.get("API_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("API_PORT", "8000")))
    args = parser.parse_args()

    try:
        import uvicorn
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "uvicorn não está instalado no venv. Instale as dependências de API antes de executar."
        ) from exc

    uvicorn.run("api.app:app", host=args.host, port=args.port, reload=False)


if __name__ == "__main__":
    main()
