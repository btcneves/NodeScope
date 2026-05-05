SHELL := /bin/sh

PYTHON ?= ./.venv/bin/python
PIP ?= ./.venv/bin/pip
VENV ?= ./.venv
API_HOST ?= 127.0.0.1
API_PORT ?= 8000
FRONTEND_PORT ?= 5173
COMPOSE ?= docker compose

.PHONY: help setup venv backend monitor frontend test build smoke demo clean public-clean docker-up docker-down lint docker-config

help:
	@echo "NodeScope Makefile - Available Targets"
	@echo "======================================="
	@echo ""
	@echo "Local development:"
	@echo "  make setup         Create venv and install Python/Node dependencies"
	@echo "  make backend       Start FastAPI on $${API_HOST:-$(API_HOST)}:$${API_PORT:-$(API_PORT)}"
	@echo "  make monitor       Start the Bitcoin Core ZMQ monitor"
	@echo "  make frontend      Start Vite on port $${FRONTEND_PORT:-$(FRONTEND_PORT)}"
	@echo ""
	@echo "Validation:"
	@echo "  make test          Run Python unit tests"
	@echo "  make build         Compile Python and build the frontend"
	@echo "  make smoke         Run smoke tests against a running backend"
	@echo "  make public-clean  Scan public files for local artifacts and secrets"
	@echo ""
	@echo "Demo and Docker:"
	@echo "  make demo          Generate regtest wallet activity"
	@echo "  make docker-up     Start bitcoind, API, monitor and frontend"
	@echo "  make docker-down   Stop Docker services"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         Remove generated local artifacts"

setup: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	cd frontend && npm install
	@echo ""
	@echo "Setup complete. Next:"
	@echo "  cp .env.example .env"
	@echo "  make backend"

venv:
	@if [ ! -d "$(VENV)" ]; then \
		python3 -m venv "$(VENV)"; \
		echo "Virtual environment created at $(VENV)"; \
	fi

backend:
	API_HOST="$(API_HOST)" API_PORT="$(API_PORT)" $(PYTHON) scripts/run_api.py

monitor:
	$(PYTHON) monitor.py

frontend:
	cd frontend && npm run dev -- --host 0.0.0.0 --port "$(FRONTEND_PORT)"

test:
	$(PYTHON) -m unittest discover -s tests -v

lint:
	$(PYTHON) -m compileall engine api scripts tests monitor.py

build: lint
	cd frontend && npm run build

smoke:
	bash scripts/smoke-test.sh

demo:
	bash scripts/demo_regtest.sh

public-clean:
	bash scripts/check-public-clean.sh

docker-up:
	$(COMPOSE) up --build

docker-down:
	$(COMPOSE) down

docker-config:
	$(COMPOSE) config

clean:
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -not -path "./.venv/*" -delete 2>/dev/null || true
	rm -rf frontend/dist frontend/.vite .pytest_cache .ruff_cache htmlcov
	@echo "Cleaned."
