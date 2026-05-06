import type { IntelligenceData } from '../types/api'

interface Props {
  data: IntelligenceData | null
}

function PressureBadge({ pressure }: { pressure: string }) {
  const cls =
    pressure === 'high'
      ? 'intelligence-pressure intelligence-pressure--high'
      : pressure === 'medium'
        ? 'intelligence-pressure intelligence-pressure--medium'
        : pressure === 'low'
          ? 'intelligence-pressure intelligence-pressure--low'
          : 'intelligence-pressure intelligence-pressure--unknown'
  return <span className={cls}>{pressure}</span>
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`dot ${ok ? 'dot-ok' : 'dot-error'}`} style={{ display: 'inline-block' }} />
}

export function IntelligenceSummaryPanel({ data }: Props) {
  if (!data) {
    return (
      <div className="panel intelligence-panel">
        <div className="panel-title">Intelligence Summary</div>
        <div className="intelligence-loading">Loading…</div>
      </div>
    )
  }

  const scoreColor =
    data.node_health_label === 'healthy'
      ? 'var(--accent-bright)'
      : data.node_health_label === 'degraded'
        ? 'var(--warn)'
        : 'var(--error)'

  return (
    <div className="panel intelligence-panel">
      <div className="panel-title">Intelligence Summary</div>
      <div className="intelligence-body">
        <div className="intelligence-score-block">
          <span className="intelligence-score-value" style={{ color: scoreColor }}>
            {data.node_health_score}
          </span>
          <span className="intelligence-score-label">Node Health Score</span>
          <span className="intelligence-score-status" style={{ color: scoreColor }}>
            {data.node_health_label}
          </span>
        </div>

        <div className="intelligence-grid">
          <div className="intelligence-row">
            <span className="intelligence-key">RPC</span>
            <span className="intelligence-val">
              <StatusDot ok={data.rpc_status === 'online'} /> {data.rpc_status}
            </span>
          </div>
          <div className="intelligence-row">
            <span className="intelligence-key">ZMQ</span>
            <span className="intelligence-val">
              <StatusDot ok={data.zmq_status === 'subscribed'} /> {data.zmq_status}
            </span>
          </div>
          <div className="intelligence-row">
            <span className="intelligence-key">SSE</span>
            <span className="intelligence-val">
              <StatusDot ok={data.sse_status === 'streaming'} /> {data.sse_status}
            </span>
          </div>
          <div className="intelligence-row">
            <span className="intelligence-key">Mempool pressure</span>
            <span className="intelligence-val">
              <PressureBadge pressure={data.mempool_pressure} />
            </span>
          </div>
          <div className="intelligence-row">
            <span className="intelligence-key">Event store</span>
            <span className="intelligence-val">
              {data.event_store.total_events} events · replayable
            </span>
          </div>
          {data.latest_signal && (
            <div className="intelligence-row">
              <span className="intelligence-key">Latest signal</span>
              <span className="intelligence-val intelligence-mono">{data.latest_signal}</span>
            </div>
          )}
          {data.latest_block && (
            <div className="intelligence-row">
              <span className="intelligence-key">Latest block</span>
              <span className="intelligence-val intelligence-mono">
                #{data.latest_block.height ?? '—'}
              </span>
            </div>
          )}
          {data.latest_tx && (
            <div className="intelligence-row">
              <span className="intelligence-key">Latest tx</span>
              <span className="intelligence-val intelligence-mono intelligence-truncate">
                {data.latest_tx.txid}
              </span>
            </div>
          )}
        </div>

        {Object.keys(data.classification_summary).length > 0 && (
          <div className="intelligence-classifications">
            <div className="intelligence-section-title">Classifications</div>
            {Object.entries(data.classification_summary).map(([kind, count]) => (
              <div key={kind} className="intelligence-row">
                <span className="intelligence-key">{kind}</span>
                <span className="intelligence-val">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
