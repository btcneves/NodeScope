import type { EventItem } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  events: EventItem[]
}

function eventBadgeClass(event: string): string {
  if (event === 'zmq_rawtx') return 'rawtx'
  if (event === 'zmq_rawblock') return 'rawblock'
  return 'unknown'
}

export function EventsTable({ events }: Props) {
  const { t } = useI18n()
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title"><Term term="ZMQ">{t.dashboard.events}</Term></span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{events.length} {t.dashboard.items}</span>
      </div>
      <div className="panel-body">
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
