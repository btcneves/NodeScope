# NodeScope — Developer Makefile
#
# Usage:
#   make setup       Install Python and Node dependencies
#   make backend     Start the FastAPI backend (port 8000)
#   make frontend    Start the Vite dev server (port 5173)
#   make monitor     Start the ZMQ monitor
#   make demo        Run the regtest demo script
#   make test        Run Python unit tests
#   make smoke       Run smoke tests against a running backend
#   make clean       Remove generated artifacts

PYTHON   := ./.venv/bin/python
PIP      := ./.venv/bin/pip
VENV     := ./.venv
API_HOST := 127.0.0.1
API_PORT := 8000

.PHONY: all setup venv backend frontend monitor demo test lint smoke clean check-clean

# --------------------------------------------------------------------------
# Default
# --------------------------------------------------------------------------
all: test

# --------------------------------------------------------------------------
# Setup
# --------------------------------------------------------------------------
setup: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	cd frontend && npm install
	@echo ""
	@echo "Setup complete. Copy .env.example to .env and edit if needed."
	@echo "  cp .env.example .env"

venv:
	@if [ ! -d "$(VENV)" ]; then \
		python3 -m venv $(VENV); \
		echo "Virtual environment created at $(VENV)"; \
	fi

# --------------------------------------------------------------------------
# Runtime
# --------------------------------------------------------------------------
backend:
	$(PYTHON) scripts/run_api.py --host $(API_HOST) --port $(API_PORT)

monitor:
	$(PYTHON) monitor.py

frontend:
	cd frontend && npm run dev

# --------------------------------------------------------------------------
# Demo
# --------------------------------------------------------------------------
demo:
	bash scripts/demo_regtest.sh

# --------------------------------------------------------------------------
# Tests
# --------------------------------------------------------------------------
test:
	$(PYTHON) -m unittest discover -s tests -v

lint:
	$(PYTHON) -m compileall engine api scripts tests monitor.py

# --------------------------------------------------------------------------
# Smoke test
# --------------------------------------------------------------------------
smoke:
	@bash scripts/smoke-test.sh

# --------------------------------------------------------------------------
# Public-clean check (before committing)
# --------------------------------------------------------------------------
check-clean:
	@bash scripts/check-public-clean.sh

# --------------------------------------------------------------------------
# Clean
# --------------------------------------------------------------------------
clean:
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -not -path "./.venv/*" -delete 2>/dev/null || true
	rm -rf frontend/dist
	@echo "Cleaned."
