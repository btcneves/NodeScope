import type { SummaryData, MempoolData, HealthData } from '../types/api'

interface Props {
  summary: SummaryData | null
  mempool: MempoolData | null
  health: HealthData | null
}

export function KpiRow({ summary, mempool, health }: Props) {
  const blockHeight = health?.blocks ?? '—'

  const mempoolValue = mempool?.rpc_ok ? mempool.size : '—'
  const mempoolSub = mempool?.rpc_ok
    ? `${(mempool.bytes / 1024).toFixed(1)} KB`
    : 'rpc offline'

  const classifiedCount = summary?.classification_counts
    ? Object.values(summary.classification_counts).reduce((a, b) => a + b, 0)
    : '—'

  const kpis = [
    { label: 'Block Height', value: blockHeight, sub: 'rpc snapshot' },
    { label: 'Mempool TXs', value: mempoolValue, sub: mempoolSub },
    { label: 'ZMQ TX Events', value: summary?.rawtx_count ?? '—', sub: 'zmq_rawtx' },
    { label: 'ZMQ Blocks', value: summary?.rawblock_count ?? '—', sub: 'zmq_rawblock' },
    { label: 'Classified', value: classifiedCount, sub: 'by engine' },
    { label: 'Event Store', value: summary?.total_events ?? '—', sub: 'total in log' },
  ]

  return (
    <div className="kpi-row">
      {kpis.map(k => (
        <div key={k.label} className="kpi-card">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  )
}
