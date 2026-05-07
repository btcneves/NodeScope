# NodeScope — Screenshots Checklist

This is an objective list of screenshots needed for the presentation pack. No screenshots are fabricated here — this checklist guides capture only.

Existing screenshots are in `docs/assets/`. New captures should be added there.

---

## README and Badges

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] README top with professional badges | `readme-badges.png` | CI badge, license badge, Docker badge |
| [ ] Dashboard overview | `nodescope-dashboard.png` | Already exists in docs/assets/ — verify it reflects current UI |
| [ ] Node health score card | `nodescope-health.png` | Already exists — verify current |
| [ ] Latest block card | `nodescope-latest-block.png` | Already exists |

---

## Guided Demo

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Guided Demo before run (all steps pending) | `guided-demo-before.png` | All 14 steps show "pending" state |
| [ ] Guided Demo after run (all steps success) | `guided-demo-after.png` | All 14 steps show green checkmarks |
| [ ] Proof Report JSON visible | `proof-report.png` | Proof report expanded with txid, fee, vbytes, block hash |
| [ ] Copy Proof button | `proof-report-copy.png` | Optional — shows copy interaction |

---

## Transaction Inspector

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Transaction Inspector with decoded tx | `tx-inspector.png` | Already exists as nodescope-demo-page.png — verify it shows Inspector |
| [ ] Fee, vsize, weight, wtxid details | `tx-inspector-detail.png` | Shows the full decoded transaction panel |

---

## ZMQ Event Tape

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] ZMQ Event Tape with rawtx/rawblock entries | `zmq-event-tape.png` | Shows event list with topic badges |
| [ ] Filtered view (rawtx only or rawblock only) | `zmq-event-tape-filtered.png` | Optional |

---

## Mempool Policy Arena

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Policy Arena — 4 scenario cards | `policy-arena.png` | Shows all four scenario cards |
| [ ] RBF scenario result | `policy-rbf-result.png` | Shows original txid, replacement txid, fee rates |
| [ ] CPFP scenario result | `policy-cpfp-result.png` | Shows parent txid, child txid, effective fee rate |

---

## Fee Estimation Playground

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Fee Estimation — estimates table | `fee-estimation.png` | Shows 1/3/6/12 block target rows in BTC/kvB and sat/vB |
| [ ] Regtest limitation note visible | `fee-estimation-note.png` | Shows the honest inline documentation |

---

## Reorg Lab

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Reorg Lab — experimental badge | `reorg-lab.png` | Shows the experimental marker |
| [ ] Reorg Lab — completed run | `reorg-lab-result.png` | Shows all 10 steps completed |

---

## Historical Dashboard

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Historical Dashboard — run list | `historical-dashboard.png` | Shows past demo runs, policy runs, reorg runs |
| [ ] Proof retrieval from history | `historical-proof.png` | Shows copy-proof from a past run |

---

## Cluster Mempool Detector

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Cluster Mempool — unavailable message | `cluster-mempool-unavailable.png` | Shows honest "unavailable on BC26" message |

---

## Alerting Panel

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] Alerting Panel — healthy state | `alerting-panel.png` | Shows RPC status, simulation status, environment notes |

---

## Prometheus Metrics

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] `/metrics` in browser or terminal | `prometheus-metrics.png` | Shows Prometheus text format output |
| [ ] `nodescope_rpc_up 1.0` visible | Included in above | Confirm value is present |

---

## Smoke Tests

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] `make smoke` output — PASS=15 FAIL=0 | `smoke-pass.png` | Terminal screenshot of full smoke output |

---

## CI

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] GitHub Actions — all checks green | `ci-green.png` | From https://github.com/btcneves/NodeScope/actions |

---

## PROJECT_STATUS

| Screenshot | Filename | Notes |
|---|---|---|
| [ ] PROJECT_STATUS.md rendered on GitHub | `project-status.png` | Public status page as seen on GitHub |

---

## Notes

- Do not fabricate screenshots. Capture only from a running NodeScope instance.
- If a screenshot already exists in `docs/assets/`, verify it reflects the current UI before reusing it.
- Screenshots should be captured in a clean browser window with no personal browser extensions visible.
- Use a consistent window size (1280×800 or 1920×1080) for uniformity.
