import type { SummaryData, MempoolData, HealthData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  summary: SummaryData | null
  mempool: MempoolData | null
  health: HealthData | null
}

export function KpiRow({ summary, mempool, health }: Props) {
  const { t } = useI18n()
  const blockHeight = health?.blocks ?? '—'

  const mempoolValue = mempool?.rpc_ok ? mempool.size : '—'
  const mempoolSub = mempool?.rpc_ok
    ? `${(mempool.bytes / 1024).toFixed(1)} KB`
    : t.dashboard.rpcOffline

  const classifiedCount = summary?.classification_counts
    ? Object.values(summary.classification_counts).reduce((a, b) => a + b, 0)
    : '—'

  const kpis = [
    { label: <Term term="Block height">{t.proof.blockHeight}</Term>, value: blockHeight, sub: t.dashboard.rpcSnapshot },
    { label: <Term term="Mempool">{t.dashboard.kpiTxs}</Term>, value: mempoolValue, sub: mempoolSub },
    { label: <Term term="rawtx">ZMQ TX Events</Term>, value: summary?.rawtx_count ?? '—', sub: 'zmq_rawtx' },
    { label: <Term term="rawblock">ZMQ Blocks</Term>, value: summary?.rawblock_count ?? '—', sub: 'zmq_rawblock' },
    { label: t.dashboard.classified, value: classifiedCount, sub: t.dashboard.byEngine },
    { label: t.dashboard.eventStore, value: summary?.total_events ?? '—', sub: t.dashboard.totalInLog },
  ]

  return (
    <div className="kpi-row">
      {kpis.map((k, i) => (
        <div key={i} className="kpi-card">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  )
}
