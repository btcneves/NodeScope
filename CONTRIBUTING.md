# Contributing to NodeScope

Thank you for your interest in contributing to NodeScope.

## Before You Start

- Read the [README](README.md) and run the project locally
- Check [open issues](https://github.com/btcneves/NodeScope/issues) before opening a new one
- For large changes, open an issue first to discuss the approach

## Development Setup

```bash
git clone https://github.com/btcneves/NodeScope.git
cd NodeScope
make setup
cp .env.example .env
```

## Running Tests

All contributions must pass the test suite:

```bash
make test        # 34 Python unit tests
make lint        # static compilation check
cd frontend && npm run build   # frontend type-check + build
```

## Code Style

- Python: follow existing style (no formatter enforced, keep it readable)
- TypeScript: follow existing patterns in `frontend/src/`
- No external dependencies without discussion
- No database — NDJSON append-only storage is an explicit design decision

## Pull Request Checklist

- [ ] Tests pass (`make test`)
- [ ] Frontend builds (`cd frontend && npm run build`)
- [ ] No sensitive content (`bash scripts/check-public-clean.sh`)
- [ ] `CHANGELOG.md` updated
- [ ] Documentation updated if behavior changed

## Architecture Decisions

Before changing core design (storage, API shape, engine pipeline), read:
- [docs/architecture.md](docs/architecture.md)
- The ADR notes in `notes/15-adr/` (local vault, not committed)

## Reporting Issues

Include:
- OS and Bitcoin Core version
- Steps to reproduce
- Relevant output from `/health` endpoint
- Any log lines from the API or monitor terminal

## License

By contributing, you agree your contributions will be licensed under the [MIT License](LICENSE).
