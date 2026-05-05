# Security Policy

## Scope

NodeScope is designed for **local and development use** (regtest, signet). It is a read-only observability tool — it does not write to Bitcoin Core, sign transactions, or handle private keys.

## Current Security Model

| Aspect | Status |
|---|---|
| API authentication | None — read-only local API |
| RPC credentials | Simple `rpcuser`/`rpcpassword` (regtest default) |
| Network exposure | Localhost only (`127.0.0.1`) by default |
| Private key handling | None — NodeScope never touches keys or wallets |
| Data written to Bitcoin Core | None — read-only |

## Before Using on Public Networks

NodeScope is **not production-ready** for mainnet without additional hardening:

1. **Use `rpcauth`** instead of `rpcpassword` — see [docs/bitcoin-core-setup.md](docs/bitcoin-core-setup.md)
2. **Add API authentication** before exposing port 8000 externally
3. **Restrict ZMQ bindings** to localhost only
4. **Do not expose the API** on a public IP without a reverse proxy and auth layer
5. **Review CORS settings** in `api/app.py` before deploying

## Reporting a Vulnerability

If you find a security issue in NodeScope, please report it privately:

- Email: open an issue with the `security` label on GitHub and we will contact you for details
- Do **not** post vulnerability details in public issues

We will respond within 5 business days.

## Credentials in This Repository

All credentials in this repository (`nodescope` / `nodescope`) are **example values for regtest only**. They are not real credentials and carry no risk.

Never commit real RPC passwords, Bitcoin private keys, seeds, or authentication tokens to this repository.
