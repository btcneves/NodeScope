import { useState, useEffect, useRef } from 'react'
import type { SSEEvent } from '../hooks/useSSE'
import type { DemoStep } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface TrackedTx {
  txid: string
  rawtxTs: string
  rawblockSeen: boolean
  rawblockTs: string | null
  blockHeight: number | null
  confirmed: boolean
}

interface Stage {
  id: string
  label: string
  sub: string
  active: boolean
}

interface TransactionLifecycleProps {
  rpcOk: boolean
  zmqConnected: boolean
  sseEvents: SSEEvent[]
  demoSteps?: DemoStep[]
  vertical?: boolean
}

function StageLabel({ id, label }: { id: string; label: string }) {
  if (id === 'mempool') return <Term term="Mempool">{label}</Term>
  if (id === 'zmq-rawtx') return <Term term="rawtx">{label}</Term>
  if (id === 'zmq-rawblock') return <Term term="rawblock">{label}</Term>
  if (id === 'mined') return <Term term="Block hash">{label}</Term>
  return <>{label}</>
}

export function TransactionLifecycle({
  rpcOk,
  zmqConnected,
  sseEvents,
  demoSteps,
  vertical = false,
}: TransactionLifecycleProps) {
  const { t } = useI18n()
  const [tracked, setTracked] = useState<TrackedTx | null>(null)
  const [resetting, setResetting] = useState(false)
  const confirmedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Initialize to mount time so pre-existing events in the SSE buffer are ignored.
  // Only events that arrive after this component mounts will be processed.
  const lastProcessedTs = useRef<string>(new Date().toISOString())

  // Watch SSE stream for rawtx and rawblock events.
  // Process ALL new events in chronological order to survive React 18 automatic batching,
  // which can coalesce multiple setEvents() calls into a single render where only sseEvents[0]
  // reflects the latest event (e.g. rawblock arriving ms after rawtx in the same flush).
  useEffect(() => {
    if (!sseEvents.length) return

    // Collect events newer than the last we processed, then sort oldest-first
    const newEvents = sseEvents
      .filter((ev) => {
        const ts = (ev.payload?.event as Record<string, unknown> | undefined)?.ts as
          | string
          | undefined
        return ts !== undefined && ts > lastProcessedTs.current
      })
      .reverse()

    if (!newEvents.length) return

    for (const ev of newEvents) {
      const event = ev.payload?.event as Record<string, unknown> | undefined
      const origin = event?.origin as string | undefined
      const data = event?.data as Record<string, unknown> | undefined
      const ts = event?.ts as string | undefined

      if (ts && ts > lastProcessedTs.current) lastProcessedTs.current = ts

      // Skip coinbase transactions — they are system-generated, not user transactions
      if (origin === 'rawtx' && data?.coinbase_input_present) continue

      if (origin === 'rawtx' && data?.txid) {
        setTracked((prev) => {
          if (prev && !prev.confirmed) return prev
          return {
            txid: data.txid as string,
            rawtxTs: ts ?? new Date().toISOString(),
            rawblockSeen: false,
            rawblockTs: null,
            blockHeight: null,
            confirmed: false,
          }
        })
      }

      if (origin === 'rawblock') {
        setTracked((prev) => {
          if (!prev || prev.rawblockSeen) return prev
          return {
            ...prev,
            rawblockSeen: true,
            rawblockTs: ts ?? new Date().toISOString(),
            blockHeight: (data?.height as number | null) ?? null,
          }
        })
      }
    }
  }, [sseEvents])

  // After rawblock seen → mark confirmed after short delay (block is immediate in regtest)
  useEffect(() => {
    if (!tracked?.rawblockSeen || tracked.confirmed) return
    const t = setTimeout(() => {
      setTracked((prev) => (prev ? { ...prev, confirmed: true } : prev))
    }, 1200)
    return () => clearTimeout(t)
  }, [tracked?.rawblockSeen, tracked?.confirmed])

  // After confirmed → reset to idle after 4 seconds
  useEffect(() => {
    if (!tracked?.confirmed) return
    confirmedTimerRef.current = setTimeout(() => {
      setResetting(true)
      setTimeout(() => {
        setTracked(null)
        setResetting(false)
      }, 500)
    }, 4000)
    return () => {
      if (confirmedTimerRef.current) clearTimeout(confirmedTimerRef.current)
    }
  }, [tracked?.confirmed])

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString() : '—')

  // When demo steps are provided, derive stage activation from step statuses
  const stepOk = (id: string) => demoSteps?.find((s) => s.id === id)?.status === 'success'
  const demoActive = demoSteps !== undefined

  const demoTracked: TrackedTx | null =
    demoActive && stepOk('send_demo_transaction')
      ? {
          txid:
            (demoSteps!.find((s) => s.id === 'send_demo_transaction')?.data?.txid as
              | string
              | undefined) ?? '…',
          rawtxTs:
            demoSteps!.find((s) => s.id === 'detect_zmq_rawtx')?.timestamp ??
            new Date().toISOString(),
          rawblockSeen: stepOk('mine_confirmation_block'),
          rawblockTs: demoSteps!.find((s) => s.id === 'detect_zmq_rawblock')?.timestamp ?? null,
          blockHeight:
            (demoSteps!.find((s) => s.id === 'mine_confirmation_block')?.data?.height as
              | number
              | null) ?? null,
          confirmed: stepOk('confirm_transaction'),
        }
      : null

  const effectiveTracked = demoActive ? demoTracked : tracked

  const stages: Stage[] = effectiveTracked
    ? [
        {
          id: 'broadcast',
          label: t.dashboard.lifecycleBroadcast,
          sub: `${effectiveTracked.txid.slice(0, 14)}…`,
          active: demoActive ? stepOk('send_demo_transaction') : true,
        },
        {
          id: 'mempool',
          label: 'Mempool',
          sub: fmt(effectiveTracked.rawtxTs),
          active: demoActive ? stepOk('detect_mempool_entry') : true,
        },
        {
          id: 'zmq-rawtx',
          label: 'ZMQ rawtx',
          sub: t.dashboard.lifecycleEventCaptured,
          active: demoActive ? stepOk('detect_zmq_rawtx') : zmqConnected,
        },
        {
          id: 'mined',
          label: t.dashboard.lifecycleBlockMined,
          sub:
            effectiveTracked.blockHeight != null
              ? `${t.generic.height} ${effectiveTracked.blockHeight}`
              : '…',
          active: demoActive ? stepOk('mine_confirmation_block') : effectiveTracked.rawblockSeen,
        },
        {
          id: 'zmq-rawblock',
          label: 'ZMQ rawblock',
          sub: effectiveTracked.rawblockTs ? fmt(effectiveTracked.rawblockTs) : '…',
          active: demoActive
            ? stepOk('detect_zmq_rawblock')
            : effectiveTracked.rawblockSeen && zmqConnected,
        },
        {
          id: 'confirmed',
          label: t.dashboard.lifecycleConfirmed,
          sub: t.dashboard.lifecycleOnChain,
          active: demoActive ? stepOk('confirm_transaction') : effectiveTracked.confirmed,
        },
      ]
    : [
        { id: 'broadcast', label: t.dashboard.lifecycleBroadcast, sub: '—', active: false },
        { id: 'mempool', label: 'Mempool', sub: '—', active: false },
        { id: 'zmq-rawtx', label: 'ZMQ rawtx', sub: '—', active: false },
        { id: 'mined', label: t.dashboard.lifecycleBlockMined, sub: '—', active: false },
        { id: 'zmq-rawblock', label: 'ZMQ rawblock', sub: '—', active: false },
        { id: 'confirmed', label: t.dashboard.lifecycleConfirmed, sub: '—', active: false },
      ]

  const idleUnavailable = !rpcOk || !zmqConnected

  return (
    <div
      className="panel lifecycle-panel"
      style={{ opacity: resetting ? 0 : 1, transition: 'opacity 0.4s ease' }}
    >
      <div className="panel-header">
        <span className="panel-title">
          <Term term="TXID">{t.dashboard.txLifecycle}</Term>
        </span>
        {effectiveTracked ? (
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>
            {effectiveTracked.txid.slice(0, 16)}…
          </span>
        ) : (
          <span className="live-indicator">
            <span className={`live-dot${idleUnavailable ? ' live-dot--off' : ''}`} />
            {idleUnavailable ? t.status.unavailable : t.dashboard.live}
          </span>
        )}
      </div>

      {vertical ? (
        /* ── Vertical layout (right-column panel) ── */
        <div className="lifecycle-vertical-body">
          {stages.map((stage, i) => (
            <div key={stage.id}>
              <div
                className={`lifecycle-step--active-vert ${stage.active ? 'lifecycle-step--active' : ''}`}
              >
                <div className="lifecycle-dot" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lifecycle-label" style={{ textAlign: 'left' }}>
                    <StageLabel id={stage.id} label={stage.label} />
                  </div>
                  {stage.sub !== '—' && (
                    <div className="lifecycle-sub" style={{ textAlign: 'left' }}>
                      {stage.sub}
                    </div>
                  )}
                </div>
                {stage.active && (
                  <span
                    style={{
                      color: 'var(--accent-bright)',
                      fontSize: 11,
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`lifecycle-vertical-connector ${
                    stage.active ? 'lifecycle-vertical-connector--active' : ''
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Horizontal layout (dashboard) ── */
        <div className="lifecycle-body">
          {stages.map((stage, i) => (
            <div key={stage.id} className="lifecycle-step-wrap">
              <div className={`lifecycle-step ${stage.active ? 'lifecycle-step--active' : ''}`}>
                <div className="lifecycle-dot" />
                <div className="lifecycle-label">
                  <StageLabel id={stage.id} label={stage.label} />
                </div>
                <div className="lifecycle-sub">{stage.sub}</div>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`lifecycle-connector ${stage.active ? 'lifecycle-connector--active' : ''}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status bar: idle waiting / confirmed */}
      <div
        className={`lifecycle-status-bar ${
          effectiveTracked?.confirmed
            ? 'lifecycle-status-bar--confirmed'
            : effectiveTracked
              ? 'lifecycle-status-bar--tracking'
              : idleUnavailable
                ? 'lifecycle-status-bar--unavailable'
                : ''
        }`}
      >
        {effectiveTracked?.confirmed ? (
          <>
            <span>●</span>
            <span style={{ fontFamily: 'monospace' }}>{effectiveTracked.txid.slice(0, 24)}…</span>
            <span style={{ marginLeft: 4 }}>{t.dashboard.lifecycleOnChain}</span>
          </>
        ) : effectiveTracked ? (
          <>
            <span>◌</span>
            <span style={{ fontFamily: 'monospace' }}>{effectiveTracked.txid.slice(0, 24)}…</span>
            <span style={{ marginLeft: 4, color: '#6b7280' }}>{t.dashboard.lifecycleTracking}</span>
          </>
        ) : (
          <>
            <span>○</span>
            <span>{idleUnavailable ? t.status.unavailable : t.dashboard.lifecycleWaiting}</span>
          </>
        )}
      </div>
    </div>
  )
}
