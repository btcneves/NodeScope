SHELL := /bin/sh

PYTHON ?= ./.venv/bin/python
PIP ?= ./.venv/bin/pip
VENV ?= ./.venv
API_HOST ?= 127.0.0.1
API_PORT ?= 8000
FRONTEND_PORT ?= 5173
COMPOSE_FILE ?= docker-compose.yml
export COMPOSE_FILE
COMPOSE ?= docker compose

.PHONY: help setup setup-local venv backend monitor frontend test test-local build build-local smoke smoke-local demo replay-demo screenshots clean public-clean docker-up docker-down docker-demo docker-full-demo docker-wait lint docker-config benchmark load-smoke

help:
	@echo "NodeScope Makefile - Available Targets"
	@echo "======================================="
	@echo ""
	@echo "Docker quickstart:"
	@echo "  docker compose up -d --build   Start the full stack"
	@echo "  make docker-demo       Generate regtest wallet/tx/block activity"
	@echo "  make smoke             Run Dockerized smoke checks, frontend build and Python tests"
	@echo ""
	@echo "Local development:"
	@echo "  make setup-local   Create venv and install Python/Node dependencies"
	@echo "  make backend       Start FastAPI on $${API_HOST:-$(API_HOST)}:$${API_PORT:-$(API_PORT)}"
	@echo "  make monitor       Start the Bitcoin Core ZMQ monitor"
	@echo "  make frontend      Start Vite on port $${FRONTEND_PORT:-$(FRONTEND_PORT)}"
	@echo ""
	@echo "Validation:"
	@echo "  make test          Run Python unit tests inside Docker"
	@echo "  make test-local    Run Python unit tests in the local venv"
	@echo "  make build         Run frontend build inside Docker"
	@echo "  make build-local   Compile Python and build the frontend locally"
	@echo "  make smoke         Run Dockerized smoke tests against the Compose stack"
	@echo "  make smoke-local   Run smoke tests using local Python and node_modules"
	@echo "  make screenshots   Capture dashboard/API screenshots (requires running stack)"
	@echo "  make public-clean  Scan public files for local artifacts and secrets"
	@echo ""
	@echo "Demo and Docker:"
	@echo "  make demo          Generate regtest wallet activity"
	@echo "  make replay-demo   Replay NDJSON event store and print engine summary (no Bitcoin Core needed)"
	@echo "  make docker-up     Start bitcoind, API, monitor and frontend"
	@echo "  make docker-config Validate Docker Compose configuration"
	@echo "  make docker-demo   Generate regtest activity through the Docker bitcoind"
	@echo "  make docker-full-demo Start stack, generate demo data and run smoke checks"
	@echo "  make docker-down   Stop Docker services"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         Remove generated local artifacts"

setup: setup-local

setup-local: venv
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

test: docker-wait
	$(COMPOSE) run --rm nodescope-api-test

test-local:
	$(PYTHON) -m unittest discover -s tests -v

lint:
	$(PYTHON) -m compileall engine api scripts tests monitor.py

build: docker-wait
	$(COMPOSE) run --rm nodescope-frontend-build

build-local: lint
	cd frontend && npm run build

smoke: docker-wait
	bash scripts/smoke-test.sh

smoke-local:
	NODESCOPE_SMOKE_MODE=local bash scripts/smoke-test.sh

demo:
	bash scripts/demo_regtest.sh

replay-demo:
	$(PYTHON) scripts/replay_monitor_log.py

screenshots:
	$(PYTHON) scripts/capture-dashboard-screenshots.py

public-clean:
	bash scripts/check-public-clean.sh

docker-up:
	$(COMPOSE) up --build -d

docker-wait:
	@echo "Waiting for Docker services..."
	@for i in $$(seq 1 60); do \
		if $(COMPOSE) exec -T nodescope-api python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).read()" >/dev/null 2>&1; then \
			echo "Docker API is ready"; \
			exit 0; \
		fi; \
		sleep 2; \
	done; \
	echo "Docker API did not become ready. Recent service status:"; \
	$(COMPOSE) ps; \
	exit 1

docker-demo: docker-wait
	@set -a; [ ! -f .env ] || . ./.env; set +a; \
	BITCOIN_CLI="$(COMPOSE) exec -T nodescope-bitcoind bitcoin-cli -regtest -rpcuser=$${BITCOIN_RPC_USER:-nodescope} -rpcpassword=$${BITCOIN_RPC_PASSWORD:-nodescope}" \
	API_URL="http://127.0.0.1:$${HOST_API_PORT:-$(API_PORT)}" \
	bash scripts/demo_regtest.sh

docker-full-demo:
	$(COMPOSE) up -d --build
	$(MAKE) docker-demo
	$(MAKE) smoke

docker-down:
	$(COMPOSE) down

docker-config:
	$(COMPOSE) config

benchmark:
	python3 scripts/benchmark_nodescope.py

load-smoke:
	python3 scripts/load_smoke.py --concurrency 5 --requests 100

clean:
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -not -path "./.venv/*" -delete 2>/dev/null || true
	rm -rf frontend/dist frontend/.vite .pytest_cache .ruff_cache htmlcov
	@echo "Cleaned."
