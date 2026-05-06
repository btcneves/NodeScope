# Signet Observer Mode (Phase 2 Preview)

Signet is Bitcoin's developer test network with a curated block schedule. Unlike regtest, signet is a shared public network that behaves like mainnet without real economic value.

NodeScope Phase 2 will support signet as a **read-only observer**: ZMQ events and RPC snapshots only, no wallet or regtest-specific operations.

This document describes the planned configuration and what to expect.

---

## Phase 2 Scope

| Feature | Phase 1 (Regtest) | Phase 2 (Signet) |
|---------|-------------------|------------------|
| ZMQ event capture | ✅ | ✅ |
| RPC snapshot | ✅ | ✅ |
| Classification engine | ✅ | ✅ |
| Replay engine | ✅ | ✅ |
| Regtest demo controls (mine block, fund wallet) | ✅ | ❌ (observer only) |
| Wallet operations | Regtest only | ❌ (observer only) |
| Network flag | `regtest` | `signet` |

---

## Planned Configuration

### Bitcoin Core for Signet

Copy the signet config example:

```bash
cp bitcoin.signet.conf.example ~/.bitcoin/bitcoin.conf
bitcoind -signet -daemon
```

`bitcoin.signet.conf.example` content:

```ini
signet=1
server=1
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcuser=nodescope
rpcpassword=nodescope
zmqpubrawtx=tcp://127.0.0.1:28333
zmqpubrawblock=tcp://127.0.0.1:28332
txindex=1
```

### NodeScope for Signet

Copy the signet env template:

```bash
cp .env.signet.example .env
```

`.env.signet.example` sets:

```
BITCOIN_RPC_URL=http://127.0.0.1:38332
BITCOIN_RPC_USER=nodescope
BITCOIN_RPC_PASSWORD=nodescope
ZMQ_RAWBLOCK_URL=tcp://127.0.0.1:28332
ZMQ_RAWTX_URL=tcp://127.0.0.1:28333
```

> **Note:** Signet uses RPC port 38332 by default (not 18443).

---

## Syncing Signet

Signet requires downloading the signet chain. With `txindex=1`, this may take several minutes to hours depending on hardware.

```bash
bitcoind -signet -daemon
bitcoin-cli -signet getblockchaininfo
# Wait until "verificationprogress" reaches 1.0
```

---

## Running NodeScope in Observer Mode

Once Bitcoin Core is synced on signet:

```bash
make backend    # API on port 8000
make monitor    # ZMQ subscriber (signet events)
make frontend   # Dashboard on port 5173
```

The dashboard will display real signet transactions and blocks as they arrive. The "mine block" and "fund wallet" demo controls will not be available in observer mode.

---

## What to Expect on Signet

- Blocks arrive approximately every 10 minutes (curated by the signet authority).
- Transaction volume is much lower than mainnet.
- The classification engine works identically — OP_RETURN, coinbase, and payment signals apply.
- ZMQ events will be less frequent than in regtest; use the replay engine to work with historical logs.

---

## Security Considerations

- Signet Bitcoin has no real value. Do not use mainnet keys or credentials on signet.
- The NodeScope API has no authentication. Follow [deploy-vps.md](deploy-vps.md) before exposing it publicly.
- Observer mode means no transaction signing. NodeScope does not need wallet access for observation.

---

## Mainnet (Phase 3)

Mainnet read-only mode is planned for Phase 3. The architecture is identical to signet observer mode, with additional safeguards:

- Explicit `BITCOIN_NETWORK=mainnet` flag required.
- Regtest and signet demo operations are disabled when mainnet is active.
- API authentication required before any public deployment.

See [ROADMAP.md](../ROADMAP.md) for details.
