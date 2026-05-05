import type { useSSE } from '../hooks/useSSE'

interface Props {
  sseEvents: ReturnType<typeof useSSE>['events']
  connected: boolean
}

export function LiveFeed({ sseEvents, connected }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Live Events</span>
        <span className="live-indicator">
          <span
            className="live-dot"
            style={{ background: connected ? 'var(--accent-bright)' : 'var(--error)' }}
          />
          {connected ? 'connected' : 'connecting...'}
        </span>
      </div>
      <div className="panel-body">
        {sseEvents.length === 0 ? (
          <div className="empty-state">Waiting for events&hellip;</div>
        ) : (
          sseEvents.slice(0, 10).map((ev, i) => {
            const evType: string = (ev.payload?.event?.event as string | undefined) ?? 'event'
            const txid: string | undefined = ev.payload?.classification?.txid as string | undefined
            const height: number | undefined = ev.payload?.classification?.height as number | undefined
            const kind: string | undefined = ev.payload?.classification?.kind as string | undefined
            const badgeClass = evType === 'zmq_rawtx' ? 'rawtx' : 'rawblock'
            const ts: string = (ev.payload?.event?.ts as string | undefined) ?? ''
            return (
              <div key={i} className="event-row">
                <span className={`badge badge-${badgeClass}`}>{evType}</span>
                {kind && (
                  <span className={`tag badge-${kind.replace('_like', '')}`}>{kind}</span>
                )}
                <span className="event-hash mono">
                  {txid
                    ? txid.slice(0, 16) + '...'
                    : height != null
                    ? `#${height}`
                    : '—'}
                </span>
                <span className="event-time">
                  {ts ? new Date(ts).toLocaleTimeString() : '—'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
