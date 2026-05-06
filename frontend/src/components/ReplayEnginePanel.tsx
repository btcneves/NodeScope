import type { SummaryData } from '../types/api'

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
  if (!summary) {
    return (
      <div className="panel">
        <div className="panel-title">Replay Engine</div>
        <div className="panel-empty">no data</div>
      </div>
    )
  }

  const source = summary.source
    ? summary.source.split('/').pop() ?? summary.source
    : '—'

  return (
    <div className="panel">
      <div className="panel-title">Replay Engine</div>
      <Row label="Source file" value={source} />
      <Row label="Total events" value={summary.total_events} />
      <Row label="ZMQ rawtx" value={summary.rawtx_count} />
      <Row label="ZMQ rawblock" value={summary.rawblock_count} />
      <Row label="Other events" value={summary.other_count} />
      <Row label="Ignored lines" value={summary.ignored_lines} />
      <Row label="Skipped events" value={summary.skipped_events ?? 0} />
    </div>
  )
}
