# Bitcoin Core Setup for NodeScope

This guide covers installing and configuring Bitcoin Core for local development with NodeScope in regtest mode.

---

## Prerequisites

- Linux or macOS
- `bitcoin-cli` and `bitcoind` available on your `PATH`
- Python 3.12+ with the NodeScope virtualenv created (see `README.md`)

---

## 1. Install Bitcoin Core

Download the latest release from [bitcoincore.org/en/download](https://bitcoincore.org/en/download/).

Verify the installation:

```bash
bitcoind --version
bitcoin-cli --version
```

Both commands should print a version string (NodeScope was developed against v31.0.0).

---

## 2. Create `bitcoin.conf`

Create the configuration file at `~/.bitcoin/bitcoin.conf`:

```bash
mkdir -p ~/.bitcoin
```

Paste the following content:

```
# Network
regtest=1

# RPC
rpcuser=corecraft
rpcpassword=corecraft
rpcbind=127.0.0.1
rpcallowip=127.0.0.1

# ZMQ
zmqpubrawblock=tcp://127.0.0.1:28332
zmqpubrawtx=tcp://127.0.0.1:28333

# Index
txindex=1
```

**Security note:** These credentials are intentionally simple for local regtest development. Before connecting to any public network, replace `rpcpassword` with a strong password or switch to `rpcauth` (hash-based authentication).

---

## 3. Start `bitcoind`

```bash
bitcoind -daemon
```

Wait a few seconds for the daemon to initialize, then verify it is responding:

```bash
bitcoin-cli -regtest getblockchaininfo
```

Expected output includes:

```json
{
  "chain": "regtest",
  "blocks": 0,
  ...
}
```

---

## 4. Verify RPC Connectivity

```bash
bitcoin-cli -regtest getnetworkinfo
```

The response should include `"version"` and `"subversion"` fields. If you see `Connection refused`, `bitcoind` is not running or `bitcoin.conf` is pointing to a different data directory.

---

## 5. Verify ZMQ Notifications

```bash
bitcoin-cli -regtest getzmqnotifications
```

Expected output:

```json
[
  {
    "type": "pubrawblock",
    "address": "tcp://127.0.0.1:28332",
    "hwm": 1000
  },
  {
    "type": "pubrawtx",
    "address": "tcp://127.0.0.1:28333",
    "hwm": 1000
  }
]
```

If the array is empty, ZMQ was not compiled into your Bitcoin Core binary or the `zmqpub*` lines are missing from `bitcoin.conf`.

---

## 6. Create a Wallet

```bash
bitcoin-cli -regtest createwallet "nodescope"
```

If a wallet already exists with that name, load it instead:

```bash
bitcoin-cli -regtest loadwallet "nodescope"
```

---

## 7. Get a Receive Address

```bash
bitcoin-cli -regtest getnewaddress
```

Save the address — you will need it for mining.

---

## 8. Mine Initial Blocks

Regtest coinbase outputs require 100 confirmations before they are spendable. Mine 101 blocks so that the first block reward is immediately available:

```bash
bitcoin-cli -regtest generatetoaddress 101 <address>
```

Replace `<address>` with the output of the previous step.

Verify your balance:

```bash
bitcoin-cli -regtest getbalance
```

You should see `50.00000000` (the first coinbase reward, now mature).

---

## Environment Variables

NodeScope reads the following environment variables to locate Bitcoin Core. If they are not set, the defaults shown below are used.

| Variable               | Default                      | Description                        |
|------------------------|------------------------------|------------------------------------|
| `BITCOIN_RPC_URL`      | `http://127.0.0.1:18443`     | Bitcoin Core RPC endpoint          |
| `BITCOIN_RPC_USER`     | `corecraft`                  | RPC username                       |
| `BITCOIN_RPC_PASSWORD` | `corecraft`                  | RPC password                       |

To override, set them in your shell before starting the API or monitor:

```bash
export BITCOIN_RPC_URL=http://127.0.0.1:18443
export BITCOIN_RPC_USER=corecraft
export BITCOIN_RPC_PASSWORD=corecraft
```

---

## Stopping `bitcoind`

```bash
bitcoin-cli -regtest stop
```

---

## Notes

- The regtest chain is local and ephemeral. Block hashes and transaction IDs are not shared with mainnet or testnet.
- `txindex=1` is required for `monitor.py` to decode full transaction details via `getrawtransaction`.
- The `logs/` directory accumulates NDJSON files per day. To start fresh, stop `monitor.py`, remove the log files, and restart.
