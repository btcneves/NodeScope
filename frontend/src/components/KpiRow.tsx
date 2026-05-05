import type { SummaryData, MempoolData } from '../types/api'

interface Props {
  summary: SummaryData | null
  mempool: MempoolData | null
}

export function KpiRow({ summary, mempool }: Props) {
  const mempoolValue = mempool?.rpc_ok ? mempool.size : '—'
  const mempoolSub = mempool?.rpc_ok
    ? `${(mempool.bytes / 1024).toFixed(1)} KB`
    : 'rpc offline'

  const kpis = [
    { label: 'Total Events', value: summary?.total_events ?? '—', sub: 'all types' },
    { label: 'Raw TX', value: summary?.rawtx_count ?? '—', sub: 'zmq_rawtx' },
    { label: 'Raw Blocks', value: summary?.rawblock_count ?? '—', sub: 'zmq_rawblock' },
    { label: 'Coinbase', value: summary?.coinbase_input_present_count ?? '—', sub: 'detected' },
    { label: 'OP_RETURN', value: summary?.op_return_count ?? '—', sub: 'detected' },
    { label: 'Mempool', value: mempoolValue, sub: mempoolSub },
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
