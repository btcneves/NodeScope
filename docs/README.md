# NodeScope Documentation

NodeScope is a Bitcoin Core Intelligence Dashboard for real-time node observability.

## Guides

| Document | Purpose |
|---|---|
| [architecture.md](architecture.md) | System design and data flow |
| [api.md](api.md) | REST and SSE API reference |
| [assets/README.md](assets/README.md) | Visual evidence capture workflow |
| [bitcoin-core-setup.md](bitcoin-core-setup.md) | Local Bitcoin Core regtest setup |
| [docker.md](docker.md) | Docker Compose stack and service reference |
| [demo.md](demo.md) | End-to-end regtest demo walkthrough |
| [demo-checklist.md](demo-checklist.md) | Pre-demo verification checklist |
| [demo-script.md](demo-script.md) | 4-minute demo narrative |
| [judges-guide.md](judges-guide.md) | Technical evaluation guide |
| [project-status.md](project-status.md) | Current feature inventory, test count, component list |
| [roadmap.md](roadmap.md) | Phase plan for demo, final release and future modes |
| [smoke-tests.md](smoke-tests.md) | Local validation and CI-style checks |
| [live-validation.md](live-validation.md) | curl-based API validation with expected outputs |
| [troubleshooting.md](troubleshooting.md) | Common setup and runtime issues |
| [deploy-vps.md](deploy-vps.md) | VPS deployment with nginx + systemd |
| [deploy-cloudflare-tunnel.md](deploy-cloudflare-tunnel.md) | Public demo via Cloudflare Tunnel |
| [signet.md](signet.md) | Signet observer mode (Phase 2 preview) |

## Recommended Reading Order

**First time setup:**
1. `README.md` — overview and quickstart
2. `docs/docker.md` or `docs/bitcoin-core-setup.md` — get the node running
3. `docs/demo.md` — end-to-end walkthrough
4. `docs/api.md` — full endpoint reference
5. `docs/troubleshooting.md` — if something doesn't work

**For a live demo:**
1. `docs/demo-checklist.md` — pre-demo verification
2. `docs/demo-script.md` — 4-minute narrative
3. `docs/project-status.md` — readiness and risk register
4. `docs/assets/README.md` — screenshot evidence workflow

**For evaluators:**
1. `docs/judges-guide.md` — what to run and what to assess

**For deployment beyond localhost:**
1. `docs/deploy-vps.md` — VPS with nginx reverse proxy
2. `docs/deploy-cloudflare-tunnel.md` — public demo without a VPS

**For Phase 2 (signet):**
1. `docs/signet.md` — observer mode configuration
