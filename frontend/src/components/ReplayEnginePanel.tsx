import type { SummaryData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  summary: SummaryData | null
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel-row">
      <span className="panel-key">{label}</span>
      <span className="panel-val">{value}</span>
    </div>
  )
}

export function ReplayEnginePanel({ summary }: Props) {
  const { t } = useI18n()

  const title = (
    <div className="panel-header">
      <span className="panel-title">
        <Term text={t.panelDesc.replayEngine}>{t.dashboard.replayEngine}</Term>
      </span>
    </div>
  )

  if (!summary) {
    return (
      <div className="panel">
        {title}
        <div className="panel-empty">{t.generic.noData}</div>
      </div>
    )
  }

  const source = summary.source ? (summary.source.split('/').pop() ?? summary.source) : '—'

  return (
    <div className="panel">
      {title}
      <Row label={t.dashboard.replaySource} value={source} />
      <Row label={t.dashboard.replayTotal} value={summary.total_events} />
      <Row label="ZMQ rawtx" value={summary.rawtx_count} />
      <Row label="ZMQ rawblock" value={summary.rawblock_count} />
      <Row label={t.dashboard.replayOther} value={summary.other_count} />
      <Row label={t.dashboard.replayIgnored} value={summary.ignored_lines} />
      <Row label={t.dashboard.replaySkipped} value={summary.skipped_events ?? 0} />
    </div>
  )
}
