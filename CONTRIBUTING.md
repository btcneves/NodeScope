# Contributing to NodeScope

Thank you for your interest in contributing. This document covers the development workflow, coding standards, and how to submit changes.

---

## Development Setup

Requirements: Python 3.12+, Node.js 18+, Git.

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
make setup
```

`make setup` creates a Python virtual environment at `.venv/`, installs all dependencies from `requirements-dev.txt`, and runs `npm ci` in `frontend/`.

Verify the setup:

```bash
make test          # Python unit tests
make build         # TypeScript strict check + Vite bundle
make public-clean  # Check for local artifacts and secrets
```

---

## Project Structure

| Path | Purpose |
|------|---------|
| `api/` | FastAPI application — routes, service logic, RPC client, Pydantic schemas |
| `engine/` | NDJSON reader, event parser, transaction classifier, snapshot loader, analytics |
| `frontend/src/` | React/TypeScript dashboard — components, hooks, API client, types |
| `scripts/` | quickstart, demo, smoke-test, and public-clean scripts |
| `tests/` | Python unit tests (`unittest`) and fixtures |
| `monitor.py` | ZMQ subscriber that writes enriched events to NDJSON logs |
| `docs/` | Architecture, API reference, setup guides, and demo docs |

---

## Running Tests

**Python unit tests:**

```bash
./.venv/bin/python -m unittest discover -s tests -v
```

**Static compilation check:**

```bash
./.venv/bin/python -m compileall engine api scripts tests monitor.py
```

**Linting:**

```bash
./.venv/bin/ruff format --check .
./.venv/bin/ruff check .
```

**Frontend (TypeScript strict + Vite build):**

```bash
cd frontend && npm run build
```

---

## Code Style

**Python:**
- Target: Python 3.12
- Formatter: `ruff format` (line length 100)
- Linter: `ruff check` (rules: E, F, I, UP, B; E501 ignored)
- Type hints on all public functions and class fields
- No external dependencies beyond `requirements.txt` without discussion

**TypeScript / React:**
- Strict TypeScript (`"strict": true` in tsconfig)
- Functional components with explicit props interfaces
- No default exports except `App.tsx`
- Vanilla CSS with CSS variables — no new CSS frameworks
- No new npm dependencies without discussion

**General:**
- Comments only when the *why* is non-obvious
- No commented-out code
- No debug prints or `console.log` in committed code

---

## Pull Request Process

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. Make focused, descriptive commits.

3. Run all checks before opening a PR:
   ```bash
   make test && make build && make public-clean
   ```

4. Open a pull request against `main` with:
   - A clear title describing the change
   - A short summary of what was changed and why
   - A test plan describing how to verify the change

5. Address review feedback before merging.

---

## What to Contribute

Good starting points:

- Bug fixes with a reproducible test case
- Documentation improvements (clearer explanations, better examples)
- Additional classification heuristics in `engine/classify.py`
- New API endpoints (read-only, must include tests)
- Frontend improvements (new panels, better error states)

Please open an issue before starting large changes to align on approach.

---

## Scope Boundaries (Phase 1)

NodeScope is intentionally scoped to **read-only observability** in Phase 1:

- No transaction signing or broadcasting via the NodeScope API
- No key management or wallet operations
- No external database (NDJSON append-only is the source of truth)
- Regtest is the primary supported network in Phase 1

Changes exceeding these boundaries belong in the roadmap discussion. See [ROADMAP.md](ROADMAP.md).

---

## Security Issues

Do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md).

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
