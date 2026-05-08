import type { EventItem } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  events: EventItem[]
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (field: string) => void
}

function eventBadgeClass(event: string): string {
  if (event === 'zmq_rawtx') return 'rawtx'
  if (event === 'zmq_rawblock') return 'rawblock'
  return 'unknown'
}

export function EventsTable({ events, sortBy = 'ts', sortDir = 'desc', onSort }: Props) {
  const { t } = useI18n()
  const sortLabel = (field: string) => (sortBy === field ? (sortDir === 'asc' ? '▲' : '▼') : '–')
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">
          <Term text={t.panelDesc.events}>{t.dashboard.events}</Term>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {events.length} {t.dashboard.items}
        </span>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 11 }}>
          {['ts', 'event', 'origin'].map((field) => (
            <button
              key={field}
              onClick={() => onSort?.(field)}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                borderRadius: 4,
                color: '#9ca3af',
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {field} {sortLabel(field)}
            </button>
          ))}
        </div>
        {events.length === 0 ? (
          <div className="empty-state">{t.zmq.noEvents}</div>
        ) : (
          events.slice(0, 15).map((ev, i) => {
            const data = ev.data as { txid?: string; hash?: string }
            const identifier = data?.txid?.slice(0, 16) ?? data?.hash?.slice(0, 16) ?? '—'
            return (
              <div key={i} className="event-row">
                <span className="event-time">{new Date(ev.ts).toLocaleTimeString()}</span>
                <span className={`badge badge-${eventBadgeClass(ev.event)}`}>{ev.event}</span>
                <span className="event-hash mono">{identifier}&hellip;</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
