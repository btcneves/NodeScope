import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import type { DemoStep, DemoStatusData, DemoProof, StepStatus } from '../types/api'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, { label: string; color: string }> = {
    pending:      { label: 'pending',      color: '#6b7280' },
    running:      { label: 'running…',     color: '#f59e0b' },
    success:      { label: 'success',      color: '#22c55e' },
    error:        { label: 'error',        color: '#ef4444' },
    unavailable:  { label: 'unavailable',  color: '#9ca3af' },
    experimental: { label: 'experimental', color: '#a78bfa' },
  }
  const { label, color } = map[status] ?? { label: status, color: '#6b7280' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      background: color + '22',
      color,
      border: `1px solid ${color}55`,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single step row
// ---------------------------------------------------------------------------

function StepRow({
  step,
  index,
  onRunStep,
  running,
}: {
  step: DemoStep
  index: number
  onRunStep: (id: string) => void
  running: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const canRun = !running && step.status !== 'running'

  return (
    <div style={{
      border: '1px solid #1f2937',
      borderRadius: '6px',
      marginBottom: '6px',
      background: step.status === 'success' ? '#052e16' : step.status === 'error' ? '#1c0a0a' : '#111827',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        cursor: 'pointer',
      }} onClick={() => setExpanded(v => !v)}>
        <span style={{ color: '#6b7280', fontSize: '12px', minWidth: '20px' }}>{index + 1}.</span>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#e5e7eb' }}>{step.title}</span>
        <StatusBadge status={step.status} />
        <button
          onClick={e => { e.stopPropagation(); onRunStep(step.id) }}
          disabled={!canRun}
          style={{
            padding: '3px 10px',
            fontSize: '11px',
            background: canRun ? '#1d4ed8' : '#374151',
            color: canRun ? '#fff' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: canRun ? 'pointer' : 'not-allowed',
          }}
        >
          Run
        </button>
        <span style={{ color: '#6b7280', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '10px 14px 12px', borderTop: '1px solid #1f2937' }}>
          {step.friendly_message && (
            <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '8px' }}>
              {step.friendly_message}
            </div>
          )}
          {step.error && (
            <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '8px' }}>
              Error: {step.error}
            </div>
          )}
          {step.timestamp && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
              {step.timestamp}
            </div>
          )}
          {step.technical_output !== null && step.technical_output !== undefined && (
            <pre style={{
              fontSize: '11px',
              color: '#9ca3af',
              background: '#0f172a',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              margin: 0,
            }}>
              {JSON.stringify(step.technical_output, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proof Report panel
// ---------------------------------------------------------------------------

function ProofPanel({ proof }: { proof: DemoProof }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(proof, null, 2)

  const copy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const el = document.createElement('textarea')
      el.value = json
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadJson = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nodescope_proof_report.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: '20px', border: '1px solid #166534', borderRadius: '8px', background: '#052e16', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80' }}>
          Proof Report {proof.success ? '✓' : '⚠'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copy} style={btnStyle('#1d4ed8')}>
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button onClick={downloadJson} style={btnStyle('#0f766e')}>
            Download JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px', fontSize: '12px' }}>
        <ProofField label="Network" value={proof.network} />
        <ProofField label="Success" value={proof.success ? 'yes' : 'no'} ok={proof.success} />
        <ProofField label="RPC" value={proof.rpc_ok ? 'ok' : 'fail'} ok={proof.rpc_ok} />
        <ProofField label="ZMQ rawtx" value={proof.zmq_rawtx_ok ? 'ok' : 'fail'} ok={proof.zmq_rawtx_ok} />
        <ProofField label="ZMQ rawblock" value={proof.zmq_rawblock_ok ? 'ok' : 'fail'} ok={proof.zmq_rawblock_ok} />
        <ProofField label="Wallet" value={proof.wallet} />
        <ProofField label="TXID" value={proof.txid ? proof.txid.slice(0, 16) + '…' : 'n/a'} />
        <ProofField label="Amount" value={proof.amount_btc !== null ? `${proof.amount_btc} BTC` : 'n/a'} />
        <ProofField label="Fee" value={proof.fee_btc !== null ? `${proof.fee_btc} BTC` : String(proof.fee_btc ?? 'n/a')} />
        <ProofField label="vsize" value={String(proof.vsize_vbytes)} />
        <ProofField label="weight" value={String(proof.weight_wu)} />
        <ProofField label="fee rate" value={String(proof.fee_rate_sat_vb)} />
        <ProofField label="Block height" value={proof.block_height !== null ? String(proof.block_height) : 'n/a'} />
        <ProofField label="Confirmations" value={String(proof.confirmations)} />
        <ProofField label="Mempool seen" value={proof.mempool_seen ? 'yes' : 'no'} ok={proof.mempool_seen} />
        <ProofField label="rawtx event" value={proof.rawtx_event_seen ? 'yes' : 'pending'} ok={proof.rawtx_event_seen} />
        <ProofField label="rawblock event" value={proof.rawblock_event_seen ? 'yes' : 'pending'} ok={proof.rawblock_event_seen} />
      </div>

      {proof.warnings.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          {proof.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#fbbf24' }}>⚠ {w}</div>
          ))}
        </div>
      )}
      {proof.unavailable_features.length > 0 && (
        <div>
          {proof.unavailable_features.map((f, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#9ca3af' }}>— unavailable: {f}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProofField({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  const color = ok === true ? '#4ade80' : ok === false ? '#f87171' : '#d1d5db'
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <span style={{ color: '#6b7280' }}>{label}:</span>
      <span style={{ color }}>{value}</span>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '4px 12px',
    fontSize: '11px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  }
}

// ---------------------------------------------------------------------------
// Main GuidedDemo component
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1500

export function GuidedDemo() {
  const [demoState, setDemoState] = useState<DemoStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.demoStatus()
      setDemoState(data)
    } catch (e) {
      setError(String(e))
    }
  }, [])

  // Poll while running
  useEffect(() => {
    void fetchStatus()
    pollingRef.current = setInterval(() => {
      if (demoState?.running) void fetchStatus()
    }, POLL_INTERVAL_MS)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [fetchStatus, demoState?.running])

  const handleRunFull = async () => {
    try {
      await api.demoRun()
      // Start polling
      const poll = setInterval(async () => {
        const data = await api.demoStatus()
        setDemoState(data)
        if (!data.running) clearInterval(poll)
      }, POLL_INTERVAL_MS)
    } catch (e) {
      setError(String(e))
    }
  }

  const handleReset = async () => {
    try {
      const data = await api.demoReset()
      setDemoState(data)
    } catch (e) {
      setError(String(e))
    }
  }

  const handleRunStep = async (stepId: string) => {
    try {
      const step = await api.demoStep(stepId)
      setDemoState(prev => {
        if (!prev) return prev
        return {
          ...prev,
          steps: prev.steps.map(s => s.id === stepId ? step : s),
        }
      })
      // Refresh full status to pick up proof
      void fetchStatus()
    } catch (e) {
      setError(String(e))
    }
  }

  const steps = demoState?.steps ?? []
  const proof = demoState?.proof ?? null
  const running = demoState?.running ?? false

  const successCount = steps.filter(s => s.status === 'success').length
  const errorCount = steps.filter(s => s.status === 'error').length

  return (
    <div style={{ fontFamily: 'monospace', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#f9fafb', marginBottom: '4px' }}>
          Guided Demo — Evaluate in 1 Minute
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          End-to-end Bitcoin Core lab: RPC → wallet → mine → send → mempool → ZMQ → confirm → proof
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => { void handleRunFull() }}
          disabled={running}
          style={btnStyle(running ? '#374151' : '#16a34a')}
        >
          {running ? 'Running…' : '▶ Run Full Demo'}
        </button>
        <button onClick={() => { void handleReset() }} disabled={running} style={btnStyle('#7f1d1d')}>
          ↺ Reset Demo
        </button>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {successCount}/{steps.length} steps complete
          {errorCount > 0 && <span style={{ color: '#f87171' }}> · {errorCount} error(s)</span>}
        </span>
        {running && (
          <span style={{ fontSize: '12px', color: '#f59e0b' }}>● Demo running…</span>
        )}
      </div>

      {error && (
        <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px', padding: '8px', background: '#1c0a0a', borderRadius: '4px' }}>
          API error: {error}
        </div>
      )}

      {/* Steps */}
      {steps.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Loading demo state…</div>
      ) : (
        steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            onRunStep={(id) => { void handleRunStep(id) }}
            running={running}
          />
        ))
      )}

      {/* Proof Report */}
      {proof && <ProofPanel proof={proof} />}
    </div>
  )
}
