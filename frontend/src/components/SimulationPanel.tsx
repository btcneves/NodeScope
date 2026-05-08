import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { SimulationData } from '../types/api'
import { useInterval } from '../hooks/useInterval'
import { useI18n } from '../i18n'

function relTime(ts: string | null): string {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s atrás`
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`
  return `${Math.floor(s / 3600)}h atrás`
}

function CountdownBar({
  label,
  countdown,
  interval,
  color,
}: {
  label: string
  countdown: number | null
  interval: number
  color: string
}) {
  const pct =
    countdown != null ? Math.min(100, Math.max(0, ((interval - countdown) / interval) * 100)) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: countdown != null ? '#d1d5db' : '#4b5563',
          }}
        >
          {countdown != null ? `${countdown}s` : '—'}
        </span>
      </div>
      <div style={{ background: '#1f2937', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transition: 'width 1s linear',
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  )
}

export function SimulationPanel() {
  const { t } = useI18n()
  const [data, setData] = useState<SimulationData | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [blockInput, setBlockInput] = useState('')
  const [txInput, setTxInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setData(await api.simulationStatus())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])
  useInterval(fetchStatus, 2000)

  // Sync config inputs when not actively editing
  useEffect(() => {
    if (!editing && data) {
      setBlockInput(String(data.config.block_interval))
      setTxInput(String(data.config.tx_interval))
    }
  }, [data, editing])

  const handleStartStop = async () => {
    if (!data || loading) return
    setLoading(true)
    try {
      const result = data.running ? await api.simulationStop() : await api.simulationStart()
      setData(result)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const submitConfig = async () => {
    setEditing(false)
    const bi = parseInt(blockInput, 10)
    const ti = parseInt(txInput, 10)
    if (!isNaN(bi) && !isNaN(ti) && bi >= 5 && ti >= 3) {
      try {
        setData(await api.simulationConfig(bi, ti))
      } catch {
        /* ignore */
      }
    }
  }

  const running = data?.running ?? false
  const statusColor = running ? '#22c55e' : '#6b7280'
  const errColor = (data?.errors ?? 0) > 0 ? '#f59e0b' : '#6b7280'

  const stat = (label: string, value: number | string, color: string) => (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '8px 6px',
        background: '#0d1117',
        borderRadius: 6,
        border: '1px solid #1f2937',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: '#6b7280',
          marginTop: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
    </div>
  )

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {running && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 6px #22c55e88',
                animation: 'pulse 2s infinite',
              }}
            />
          )}
          {t.simulation.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>
            {running ? t.simulation.running : t.simulation.stopped}
          </span>
          <button
            onClick={() => {
              void handleStartStop()
            }}
            disabled={loading || data === null}
            style={{
              background: running ? '#1c1c1c' : '#14532d',
              color: running ? '#9ca3af' : '#86efac',
              border: `1px solid ${running ? '#374151' : '#166534'}`,
              borderRadius: 5,
              padding: '3px 12px',
              fontSize: 12,
              cursor: data === null || loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {loading ? '…' : running ? t.simulation.stop : t.simulation.start}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {stat(t.simulation.blocksMined, data?.blocks_mined ?? 0, '#60a5fa')}
          {stat(t.simulation.txsSent, data?.txs_sent ?? 0, '#34d399')}
          {stat(t.simulation.errors, data?.errors ?? 0, errColor)}
        </div>

        {/* Countdowns */}
        <CountdownBar
          label={t.simulation.nextBlock}
          countdown={data?.next_block_in ?? null}
          interval={data?.config.block_interval ?? 30}
          color="#22c55e"
        />
        <CountdownBar
          label={t.simulation.nextTx}
          countdown={data?.next_tx_in ?? null}
          interval={data?.config.tx_interval ?? 12}
          color="#3b82f6"
        />

        {/* Last activity */}
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: 10, marginTop: 2 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#6b7280',
              marginBottom: 4,
            }}
          >
            <span style={{ color: '#9ca3af' }}>
              {t.simulation.lastBlock}
              {data?.last_block_height != null && (
                <span style={{ color: '#4b5563' }}> #{data.last_block_height}</span>
              )}
            </span>
            <span>{relTime(data?.last_block_at ?? null)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#6b7280',
            }}
          >
            <span style={{ color: '#9ca3af' }}>
              {t.simulation.lastTx}
              {data?.last_txid && (
                <span style={{ color: '#4b5563', fontFamily: 'monospace' }}>
                  {' '}
                  {data.last_txid.slice(0, 10)}…
                </span>
              )}
            </span>
            <span>{relTime(data?.last_tx_at ?? null)}</span>
          </div>
        </div>

        {/* Config toggle */}
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setConfigOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              fontSize: 11,
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 9 }}>{configOpen ? '▲' : '▼'}</span>
            {t.simulation.configure}
          </button>

          {configOpen && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.simulation.blockInterval}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min={5}
                    value={blockInput}
                    onChange={(e) => setBlockInput(e.target.value)}
                    onFocus={() => setEditing(true)}
                    onBlur={() => {
                      void submitConfig()
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    style={{
                      width: 56,
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 4,
                      color: '#d1d5db',
                      padding: '3px 6px',
                      fontSize: 11,
                      textAlign: 'right',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{t.simulation.seconds}</span>
                </div>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.simulation.txInterval}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min={3}
                    value={txInput}
                    onChange={(e) => setTxInput(e.target.value)}
                    onFocus={() => setEditing(true)}
                    onBlur={() => {
                      void submitConfig()
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    style={{
                      width: 56,
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 4,
                      color: '#d1d5db',
                      padding: '3px 6px',
                      fontSize: 11,
                      textAlign: 'right',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{t.simulation.seconds}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
