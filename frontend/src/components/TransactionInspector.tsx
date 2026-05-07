import { useState, useCallback } from 'react'
import { api } from '../api/client'
import type { TxInspectorData } from '../types/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(val: number | string | null | undefined, unit = '') {
  if (val === null || val === undefined) return <span style={{ color: '#6b7280' }}>n/a</span>
  if (val === 'unavailable') return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>unavailable</span>
  return <span>{String(val)}{unit}</span>
}

function Chip({ label, ok }: { label: string; ok?: boolean }) {
  const color = ok === true ? '#22c55e' : ok === false ? '#ef4444' : '#9ca3af'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 600, background: color + '22', color,
      border: `1px solid ${color}55`, textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '5px 0', borderBottom: '1px solid #1f2937', fontSize: '12px' }}>
      <span style={{ color: '#6b7280', minWidth: '160px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#e5e7eb', wordBreak: 'break-all' }}>{children}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TxSummaryCard({ tx }: { tx: TxInspectorData }) {
  const confirmed = tx.mempool_status === 'confirmed'
  const inMempool = tx.mempool_status === 'unconfirmed'
  return (
    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f9fafb' }}>Transaction</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Chip label={tx.mempool_status} ok={confirmed || inMempool} />
          <Chip label={tx.rpc_validation_status} ok={tx.rpc_validation_status === 'validated'} />
        </div>
      </div>
      <Row label="TXID">
        <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{tx.txid}</span>
      </Row>
      {tx.wtxid && <Row label="wtxid (segwit id)">
        <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{tx.wtxid}</span>
      </Row>}
      <Row label="version / locktime">{tx.version ?? 'n/a'} / {tx.locktime ?? 'n/a'}</Row>
      <Row label="size / vsize / weight">
        {fmt(tx.size, ' B')} / {fmt(tx.vsize, ' vbytes')} / {fmt(tx.weight, ' wu')}
      </Row>
      <Row label="fee">{fmt(tx.fee_btc, ' BTC')}</Row>
      <Row label="fee rate">{fmt(tx.fee_rate_sat_vb, ' sat/vbyte')}</Row>
      <Row label="total output">{fmt(tx.total_output_btc, ' BTC')}</Row>
      <Row label="inputs / outputs">{tx.vin_count} / {tx.vout_count}</Row>
      {tx.replaceable !== null && tx.replaceable !== undefined && (
        <Row label="RBF replaceable">{tx.replaceable ? 'yes' : 'no'}</Row>
      )}
      {confirmed && <>
        <Row label="confirmations">{tx.confirmations ?? 'n/a'}</Row>
        <Row label="block hash">
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{tx.blockhash ?? 'n/a'}</span>
        </Row>
        <Row label="block height">{tx.blockheight ?? 'n/a'}</Row>
        {tx.blocktime && <Row label="block time">{new Date(tx.blocktime * 1000).toISOString()}</Row>}
      </>}
      {inMempool && <Row label="mempool">unconfirmed — pending inclusion in a block</Row>}
    </div>
  )
}

function VinTable({ vin }: { vin: TxInspectorData['vin'] }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Inputs ({vin.length})</div>
      {vin.map((inp, i) => (
        <div key={i} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '4px', padding: '8px 10px', marginBottom: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
          {inp.coinbase
            ? <span style={{ color: '#fbbf24' }}>coinbase input</span>
            : <>
              <span style={{ color: '#6b7280' }}>#{i} </span>
              <span style={{ color: '#93c5fd' }}>{inp.prev_txid?.slice(0, 16)}…:{inp.prev_vout}</span>
              {inp.address && <span style={{ color: '#4ade80', marginLeft: '8px' }}>{inp.address}</span>}
              {inp.value !== null && inp.value !== undefined
                ? <span style={{ color: '#d1d5db', marginLeft: '8px' }}>{inp.value} BTC</span>
                : <span style={{ color: '#6b7280', marginLeft: '8px', fontStyle: 'italic' }}>value unavailable</span>}
            </>}
        </div>
      ))}
    </div>
  )
}

function VoutTable({ vout }: { vout: TxInspectorData['vout'] }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Outputs ({vout.length})</div>
      {vout.map((out, i) => (
        <div key={i} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '4px', padding: '8px 10px', marginBottom: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
          <span style={{ color: '#6b7280' }}>#{out.n ?? i} </span>
          <span style={{ color: '#d1d5db' }}>{out.value} BTC</span>
          {out.address && <span style={{ color: '#4ade80', marginLeft: '8px' }}>{out.address}</span>}
          {out.script_type && <span style={{ color: '#9ca3af', marginLeft: '8px' }}>[{out.script_type}]</span>}
        </div>
      ))}
    </div>
  )
}

function ZmqEventsPanel({ events }: { events: unknown[] }) {
  if (!events.length) {
    return (
      <div style={{ fontSize: '12px', color: '#6b7280', padding: '8px', background: '#0f172a', borderRadius: '4px', marginBottom: '12px' }}>
        No ZMQ rawtx events found in store for this txid (may be async or store empty).
      </div>
    )
  }
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>ZMQ rawtx Events ({events.length})</div>
      {(events as Record<string, unknown>[]).map((ev, i) => (
        <div key={i} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '4px', padding: '6px 10px', marginBottom: '4px', fontSize: '11px' }}>
          <span style={{ color: '#f59e0b' }}>zmq_rawtx</span>
          <span style={{ color: '#6b7280', marginLeft: '8px' }}>{String(ev.ts ?? '')}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  initialTxid?: string
}

export function TransactionInspector({ initialTxid = '' }: Props) {
  const [txid, setTxid] = useState(initialTxid)
  const [result, setResult] = useState<TxInspectorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const inspect = useCallback(async (overrideTxid?: string) => {
    const target = (overrideTxid ?? txid).trim()
    if (!target) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.txInspect(target)
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [txid])

  const copyJson = () => {
    if (!result) return
    const json = JSON.stringify(result, null, 2)
    navigator.clipboard.writeText(json).catch(() => {
      const el = document.createElement('textarea')
      el.value = json
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ fontFamily: 'monospace', color: '#e5e7eb' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#f9fafb', marginBottom: '4px' }}>
          Transaction Inspector
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          RPC-enriched lookup: fee, vsize, weight, inputs, outputs, block data
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={txid}
          onChange={e => setTxid(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void inspect() }}
          placeholder="Paste transaction ID (txid)…"
          style={{
            flex: 1, padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace',
            background: '#0f172a', border: '1px solid #374151', borderRadius: '6px',
            color: '#e5e7eb', outline: 'none',
          }}
        />
        <button
          onClick={() => { void inspect() }}
          disabled={loading || !txid.trim()}
          style={{
            padding: '8px 20px', fontSize: '12px', fontWeight: 600,
            background: loading || !txid.trim() ? '#374151' : '#1d4ed8',
            color: loading || !txid.trim() ? '#6b7280' : '#fff',
            border: 'none', borderRadius: '6px', cursor: loading || !txid.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading…' : 'Inspect'}
        </button>
        {result && (
          <button
            onClick={copyJson}
            style={{ padding: '8px 14px', fontSize: '11px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px', background: '#1c0a0a', border: '1px solid #7f1d1d', borderRadius: '6px', fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <TxSummaryCard tx={result} />
          <VinTable vin={result.vin} />
          <VoutTable vout={result.vout} />
          <ZmqEventsPanel events={result.related_zmq_events} />

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {result.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: '11px', color: '#fbbf24' }}>⚠ {w}</div>
              ))}
            </div>
          )}
          {result.unavailable_features.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {result.unavailable_features.map((f, i) => (
                <div key={i} style={{ fontSize: '11px', color: '#9ca3af' }}>— unavailable: {f}</div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !result && !error && (
        <div style={{ fontSize: '12px', color: '#6b7280', padding: '20px', textAlign: 'center', background: '#0f172a', borderRadius: '6px' }}>
          Enter a transaction ID above to inspect it.
        </div>
      )}
    </div>
  )
}
