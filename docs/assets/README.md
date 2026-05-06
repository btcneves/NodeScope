# docs/assets

This directory stores screenshots, GIFs, and other visual assets used in the NodeScope documentation and README.

## Planned Assets

| File | Description |
|------|-------------|
| `dashboard-overview.png` | Full dashboard screenshot — Command Center layout |
| `node-health-score.png` | Node Health Score panel (green, healthy state) |
| `transaction-lifecycle.png` | Transaction Lifecycle panel with all stages active |
| `live-feed.png` | Live Event Feed showing rawtx and rawblock events |
| `classifications-table.png` | Classifications table with confidence and signals |
| `demo-regtest.gif` | Animated GIF: transaction created → mempool → ZMQ → confirmed |

## How to Capture

With the full stack running (`make backend && make monitor && make frontend`):

1. Open `http://localhost:5173` in a browser at 1280×800.
2. Run `make demo` to generate live regtest activity.
3. Capture screenshots using your OS screenshot tool or browser DevTools.
4. For the animated GIF, use [LICEcap](https://www.cockos.com/licecap/) (macOS/Windows) or [Peek](https://github.com/phw/peek) (Linux).

## Usage in Documentation

Reference assets from README or docs with a relative path:

```markdown
![Dashboard overview](docs/assets/dashboard-overview.png)
```
