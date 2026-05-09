import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { TapeEvent, EventTapeData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { LearnMore } from './ui/LearnMore'

// ---------------------------------------------------------------------------
// Single event row
// ---------------------------------------------------------------------------

function EventRow({ ev, onInspect }: { ev: TapeEvent; onInspect: (txid: string) => void }) {
  const { t } = useI18n()
  const isRawtx = ev.topic === 'rawtx'
  const topicColor = isRawtx ? '#60a5fa' : '#a78bfa'
  const topicLabel = isRawtx ? t.zmq.rawTx : t.zmq.rawBlock
  const scriptSummary =
    isRawtx && ev.script_types.length > 0 ? ev.script_types.slice(0, 2).join(', ') : ''

  return (
    <div className="zmq-tape-row">
      <span
        className="zmq-topic-pill"
        style={{
          background: topicColor + '22',
          color: topicColor,
          border: `1px solid ${topicColor}44`,
        }}
      >
        {topicLabel}
      </span>

      <span className="zmq-timestamp">{ev.ts ? ev.ts.replace('T', ' ').slice(0, 23) : '—'}</span>

      <span className="zmq-identifier">
        {isRawtx ? (
          ev.txid ? (
            <span
              title={ev.txid}
              className="zmq-id-link"
              onClick={() => ev.txid && onInspect(ev.txid)}
            >
              {ev.short_id ?? ev.txid.slice(0, 16) + '…'}
            </span>
          ) : (
            '—'
          )
        ) : (
          <span title={ev.blockhash ?? undefined} style={{ color: '#c4b5fd' }}>
            {ev.blockhash ? (ev.short_id ?? ev.blockhash.slice(0, 16) + '…') : '—'}
            {ev.height !== null && ev.height !== undefined ? (
              <span className="zmq-height">h={ev.height}</span>
            ) : null}
          </span>
        )}
      </span>

      <span className="zmq-flag">{isRawtx && ev.has_op_return ? 'OP_RETURN' : ''}</span>

      <span className="zmq-script-types" title={scriptSummary}>
        {scriptSummary}
      </span>

      {isRawtx && ev.txid && (
        <button className="zmq-inspect-btn" onClick={() => ev.txid && onInspect(ev.txid)}>
          {t.actions.inspect} →
        </button>
      )}
      {(!isRawtx || !ev.txid) && <span className="zmq-action-spacer" />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  onInspectTxid: (txid: string) => void
}

export function ZmqEventTape({ onInspectTxid }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<EventTapeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<'all' | 'rawtx' | 'rawblock'>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const topic = topicFilter === 'all' ? undefined : topicFilter
      const result = await api.eventTape(100, topic)
      setData(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [topicFilter])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const items = data?.items ?? []
  const rawtxCount = items.filter((e) => e.topic === 'rawtx').length
  const rawblockCount = items.filter((e) => e.topic === 'rawblock').length

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '3px 10px',
    fontSize: '11px',
    background: active ? '#1d4ed8' : '#1f2937',
    color: active ? '#fff' : '#9ca3af',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  })

  return (
    <div className="zmq-tape-shell">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div className="view-title">
          <Term term="ZMQ">{t.zmq.title}</Term>
        </div>
        <div className="view-subtitle">{t.zmq.subtitle}</div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button style={btnStyle(topicFilter === 'all')} onClick={() => setTopicFilter('all')}>
          {t.zmq.filterAll}
        </button>
        <button style={btnStyle(topicFilter === 'rawtx')} onClick={() => setTopicFilter('rawtx')}>
          <Term term="rawtx">rawtx</Term>
        </button>
        <button
          style={btnStyle(topicFilter === 'rawblock')}
          onClick={() => setTopicFilter('rawblock')}
        >
          <Term term="rawblock">rawblock</Term>
        </button>
        <button
          onClick={() => {
            void fetchData()
          }}
          disabled={loading}
          style={{
            padding: '3px 10px',
            fontSize: '11px',
            background: '#0f766e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading ? t.status.loading : t.actions.refresh}
        </button>
        {data && (
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            {items.length} {t.zmq.events} ({rawtxCount} rawtx · {rawblockCount} rawblock)
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '8px',
            background: '#1c0a0a',
            border: '1px solid #7f1d1d',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#f87171',
            marginBottom: '10px',
          }}
        >
          {error}
        </div>
      )}

      {/* Column headers */}
      {items.length > 0 && (
        <div className="zmq-tape-head">
          <span>topic</span>
          <span>timestamp (UTC)</span>
          <span>id</span>
          <span>flags</span>
          <span>script</span>
          <span>action</span>
        </div>
      )}

      {/* Events */}
      {items.length === 0 && !loading && !error && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            background: '#0f172a',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          {data ? t.zmq.noEvents : t.status.loading}
        </div>
      )}
      {items.length > 0 && (
        <div className="zmq-tape-list">
          {items.map((ev, i) => (
            <EventRow key={`${ev.ts ?? i}-${i}`} ev={ev} onInspect={onInspectTxid} />
          ))}
        </div>
      )}

      <LearnMore>{t.learn.zmq}</LearnMore>
    </div>
  )
}
