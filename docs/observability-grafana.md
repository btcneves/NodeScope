# NodeScope — Grafana + Prometheus Observability Pack

Optional monitoring stack for NodeScope using Prometheus and Grafana.

---

## Overview

The observability pack adds two services on top of the standard NodeScope stack:

- **Prometheus** — scrapes `/metrics` from the NodeScope API every 15 seconds.
- **Grafana** — provides a pre-built dashboard with panels for all NodeScope Prometheus metrics.

This is entirely optional. The standard demo works without it.

---

## Requirements

- Docker and Docker Compose installed.
- NodeScope main stack already running (or started together — see below).

---

## Start Together

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d --build
```

## Start Observability Separately (after main stack is running)

```bash
docker compose -f docker-compose.observability.yml up -d
```

## Validate

```bash
curl http://127.0.0.1:9090/-/ready   # Prometheus ready
curl http://127.0.0.1:3000/api/health # Grafana healthy
```

## Open Grafana

```
http://localhost:3000
```

Default: anonymous viewer access. No login required.

Navigate to **Dashboards → NodeScope Overview**.

---

## Stop

```bash
docker compose -f docker-compose.observability.yml down
```

## Stop and remove data volumes

```bash
docker compose -f docker-compose.observability.yml down -v
```

---

## Makefile Targets

```bash
make observability-up    # Start Prometheus + Grafana
make observability-down  # Stop Prometheus + Grafana
```

---

## Dashboard Panels

The pre-built `nodescope-overview.json` dashboard includes panels for:

| Panel | Metric(s) |
|---|---|
| Bitcoin Core RPC status | `nodescope_rpc_up` |
| Storage backend status | `nodescope_storage_up` |
| Chain height | `nodescope_chain_height` |
| Mempool transactions | `nodescope_mempool_tx_count` |
| Mempool vsize | `nodescope_mempool_vsize_bytes` |
| HTTP request rate | `nodescope_http_requests_total` |
| HTTP latency (p50/p95/p99) | `nodescope_http_request_duration_seconds` |
| ZMQ event rate | `nodescope_zmq_rawtx_events_total`, `nodescope_zmq_rawblock_events_total` |
| Demo runs | `nodescope_demo_runs_total` |
| Policy scenario runs | `nodescope_policy_scenarios_total` |
| Reorg lab runs | `nodescope_reorg_runs_total` |
| Proof reports generated | `nodescope_proof_reports_total` |
| Persisted records (SQLite) | `nodescope_history_*_total` |
| Fee estimation runs | `nodescope_fee_estimation_runs_total` |
| RPC request rate + latency | `nodescope_rpc_requests_total`, `nodescope_rpc_latency_seconds` |

All panels use only metrics that are actually exported by the NodeScope API.

---

## Prometheus Scrape Target

Prometheus scrapes `nodescope-api:8000/metrics` using the internal Docker network.
When the stacks share the same `name: nodescope` compose project, the network is shared automatically.

If you run the stacks separately, ensure both are on the same Docker network or adjust `prometheus.yml` accordingly.

---

## Notes

- Anonymous access is enabled in Grafana for evaluator convenience. For production use, disable `GF_AUTH_ANONYMOUS_ENABLED`.
- Data volumes (`nodescope-prometheus-data`, `nodescope-grafana-data`) persist metrics history across restarts.
- The NodeScope main stack is not modified by this pack — it is entirely additive.
