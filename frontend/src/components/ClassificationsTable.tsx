import type { ClassificationItem } from '../types/api'

interface Props {
  classifications: ClassificationItem[]
}

function kindClass(kind: string): string {
  if (kind === 'coinbase_like') return 'coinbase'
  if (kind === 'simple_payment_like') return 'payment'
  if (kind === 'block_event') return 'rawblock'
  return 'unknown'
}

export function ClassificationsTable({ classifications }: Props) {
  return (
    <div className="panel" style={{ marginBottom: '24px' }}>
      <div className="panel-header">
        <span className="panel-title">Classifications</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {classifications.length} items
        </span>
      </div>
      <div className="panel-body">
        {classifications.length === 0 ? (
          <div className="empty-state">No classifications</div>
        ) : (
          classifications.slice(0, 20).map((c, i) => {
            const confidence = c.metadata?.confidence
            const reason = c.metadata?.reason as string | undefined
            const identifier = c.txid?.slice(0, 16) ?? c.hash?.slice(0, 16) ?? '—'
            return (
              <div key={i} className="event-row">
                <span className="event-time">{new Date(c.ts).toLocaleTimeString()}</span>
                <span className={`badge badge-${kindClass(c.kind)}`}>{c.kind}</span>
                {confidence !== undefined && (
                  <span
                    className="tag"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}
                  >
                    {String(confidence)}
                  </span>
                )}
                <span className="event-hash mono">{identifier}&hellip;</span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    marginLeft: 'auto',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reason ?? ''}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
