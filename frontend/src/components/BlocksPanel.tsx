import type { BlockData } from '../types/api'

interface Props {
  block: BlockData | null
}

function trunc(s: string | null | undefined, n = 16): string {
  return s ? s.slice(0, n) + '...' : '—'
}

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function BlocksPanel({ block }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Latest Block</span>
      </div>
      <div className="panel-body">
        {!block ? (
          <div className="empty-state">No blocks yet</div>
        ) : (
          <>
            <div className="event-row">
              <span className="kpi-label">Height</span>
              <span className="kpi-value" style={{ fontSize: '20px' }}>
                {block.height ?? '—'}
              </span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Hash</span>
              <span className="event-hash mono" title={block.hash ?? ''}>
                {trunc(block.hash, 20)}
              </span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Time</span>
              <span className="event-time">
                {block.ts ? relTime(block.ts) : '—'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
