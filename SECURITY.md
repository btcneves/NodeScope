# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Scope

NodeScope is a **local observability tool** designed for regtest and, in future phases, signet/mainnet read-only monitoring. The current security posture reflects Phase 1 assumptions:

- The API runs on `127.0.0.1` (loopback only) by default.
- Bitcoin Core RPC credentials are example-only (`nodescope`/`nodescope`) and intended for local regtest use only.
- No authentication is implemented on the NodeScope API in Phase 1.
- No transaction signing, key management, or wallet operations are exposed.

**Do not run NodeScope with a publicly exposed API port without a reverse proxy, firewall rules, and authentication.**

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**.

Report it via a [GitHub Security Advisory](https://github.com/btcneves/NodeScope/security/advisories/new) (private disclosure).

Include:
- A description of the vulnerability and its potential impact
- Steps to reproduce
- Affected version(s)
- Any suggested mitigation

You will receive an acknowledgment within 72 hours. We aim to release a fix within 14 days for critical issues.

## Known Limitations (Phase 1)

| Limitation | Mitigation |
|------------|-----------|
| No API authentication | Run on loopback only; use firewall for remote deployments |
| Example RPC credentials in `.env.example` | Replace before any non-local use |
| CORS allows `localhost:5173` and `localhost:3000` | Acceptable for local development |
| No rate limiting on SSE stream | Acceptable for single-node local use |

## Recommendations for Remote Deployments

If you deploy NodeScope beyond localhost:

1. Place the API behind a reverse proxy (nginx, Caddy) with TLS.
2. Add HTTP Basic Auth or an API key layer at the proxy level.
3. Restrict Bitcoin Core RPC to the loopback interface (`rpcbind=127.0.0.1`).
4. Never expose Bitcoin Core RPC directly to the internet.
5. Use `rpcauth` instead of `rpcpassword` for production Bitcoin Core setups.
6. Review firewall rules to ensure only intended ports are reachable.

See [docs/deploy-vps.md](docs/deploy-vps.md) for a reference nginx + firewall configuration.

## Credentials and Secrets

- Never commit `.env` files with real credentials.
- The `.env.example` file contains placeholder values only.
- `bitcoin.conf.example` uses `rpcpassword=nodescope` for local regtest only.
- NDJSON logs are gitignored and should never be committed.

## Future Security Roadmap

- API key authentication for remote deployments.
- `rpcauth` support documentation for production Bitcoin Core.
- Signet/mainnet read-only mode with explicit network flag.
- Rate limiting on `/events/stream`.
