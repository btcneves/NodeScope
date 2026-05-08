import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import type { DemoStep, DemoStatusData, DemoProof, StepStatus } from '../types/api'
import { useI18n } from '../i18n'
import { InfoTooltip, Term } from './ui/InfoTooltip'
import { LearnMore } from './ui/LearnMore'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StepStatus }) {
  const { t } = useI18n()
  const map: Record<StepStatus, { label: string; color: string }> = {
    pending: { label: t.status.pending, color: '#6b7280' },
    running: { label: t.status.running, color: '#f59e0b' },
    success: { label: t.status.success, color: '#22c55e' },
    error: { label: t.status.error, color: '#ef4444' },
    unavailable: { label: t.status.unavailable, color: '#9ca3af' },
    experimental: { label: t.status.experimental, color: '#a78bfa' },
  }
  const { label, color } = map[status] ?? { label: status, color: '#6b7280' }
  return (
    <span
      style={{
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
      }}
    >
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
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const canRun = !running && step.status !== 'running'
  const desc = (t.demo.stepDesc as Record<string, string>)[step.id]

  return (
    <div
      style={{
        border: '1px solid #1f2937',
        borderRadius: '6px',
        marginBottom: '6px',
        background:
          step.status === 'success' ? '#052e16' : step.status === 'error' ? '#1c0a0a' : '#111827',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span style={{ color: '#6b7280', fontSize: '12px', minWidth: '20px' }}>{index + 1}.</span>
        <span
          style={{
            flex: 1,
            fontSize: '13px',
            fontWeight: 500,
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {step.title}
          {desc && <InfoTooltip text={desc} size={12} />}
        </span>
        <StatusBadge status={step.status} />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRunStep(step.id)
          }}
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
          {t.actions.run}
        </button>
        <span style={{ color: '#6b7280', fontSize: '12px' }}>
          {expanded ? t.actions.collapse : t.actions.expand}
        </span>
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
              {t.generic.error}: {step.error}
            </div>
          )}
          {step.timestamp && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
              {step.timestamp}
            </div>
          )}
          {step.technical_output !== null && step.technical_output !== undefined && (
            <pre
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                background: '#0f172a',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
                margin: 0,
              }}
            >
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
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(proof, null, 2)

  const copy = () => {
    navigator.clipboard
      .writeText(json)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
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
    <div
      style={{
        marginTop: '20px',
        border: '1px solid #166534',
        borderRadius: '8px',
        background: '#052e16',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {t.demo.proofReport} {proof.success ? '✓' : '⚠'}
          <InfoTooltip term="Proof Report" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copy} style={btnStyle('#1d4ed8')}>
            {copied ? t.actions.copied : t.actions.copy + ' JSON'}
          </button>
          <button onClick={downloadJson} style={btnStyle('#0f766e')}>
            {t.actions.downloadJson}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          marginBottom: '12px',
          fontSize: '12px',
        }}
      >
        <ProofField label={t.proof.network} value={proof.network} />
        <ProofField
          label={t.proof.success}
          value={proof.success ? t.demo.yes : t.demo.no}
          ok={proof.success}
        />
        <ProofField
          label={<Term term="RPC">{t.proof.rpc}</Term>}
          value={proof.rpc_ok ? t.status.ok : t.status.fail}
          ok={proof.rpc_ok}
        />
        <ProofField
          label={<Term term="ZMQ">{t.proof.zmqRawtx}</Term>}
          value={proof.zmq_rawtx_ok ? t.status.ok : t.status.fail}
          ok={proof.zmq_rawtx_ok}
        />
        <ProofField
          label={<Term term="ZMQ">{t.proof.zmqRawblock}</Term>}
          value={proof.zmq_rawblock_ok ? t.status.ok : t.status.fail}
          ok={proof.zmq_rawblock_ok}
        />
        <ProofField label={<Term term="Wallet">{t.proof.wallet}</Term>} value={proof.wallet} />
        <ProofField
          label={<Term term="TXID">{t.proof.txid}</Term>}
          value={proof.txid ? proof.txid.slice(0, 16) + '…' : t.demo.na}
        />
        <ProofField
          label={t.proof.amount}
          value={proof.amount_btc !== null ? `${proof.amount_btc} BTC` : t.demo.na}
        />
        <ProofField
          label={<Term term="Fee">{t.proof.fee}</Term>}
          value={
            proof.fee_btc !== null ? `${proof.fee_btc} BTC` : String(proof.fee_btc ?? t.demo.na)
          }
        />
        <ProofField
          label={<Term term="vbytes">{t.proof.vsize}</Term>}
          value={String(proof.vsize_vbytes)}
        />
        <ProofField
          label={<Term term="Weight">{t.proof.weight}</Term>}
          value={String(proof.weight_wu)}
        />
        <ProofField
          label={<Term term="Fee rate">{t.proof.feeRate}</Term>}
          value={String(proof.fee_rate_sat_vb)}
        />
        <ProofField
          label={<Term term="Block height">{t.proof.blockHeight}</Term>}
          value={proof.block_height !== null ? String(proof.block_height) : t.demo.na}
        />
        <ProofField
          label={<Term term="Confirmation">{t.proof.confirmations}</Term>}
          value={String(proof.confirmations)}
        />
        <ProofField
          label={<Term term="Mempool">{t.proof.mempoolSeen}</Term>}
          value={proof.mempool_seen ? t.demo.yes : t.demo.no}
          ok={proof.mempool_seen}
        />
        <ProofField
          label={<Term term="rawtx">{t.proof.rawtxEvent}</Term>}
          value={proof.rawtx_event_seen ? t.demo.yes : t.status.pending}
          ok={proof.rawtx_event_seen}
        />
        <ProofField
          label={<Term term="rawblock">{t.proof.rawblockEvent}</Term>}
          value={proof.rawblock_event_seen ? t.demo.yes : t.status.pending}
          ok={proof.rawblock_event_seen}
        />
      </div>

      {proof.warnings.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          {proof.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#fbbf24' }}>
              ⚠ {w}
            </div>
          ))}
        </div>
      )}
      {proof.unavailable_features.length > 0 && (
        <div>
          {proof.unavailable_features.map((f, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#9ca3af' }}>
              — {t.proof.unavailable} {f}
            </div>
          ))}
        </div>
      )}

      <LearnMore>{t.learn.proof}</LearnMore>
    </div>
  )
}

function ProofField({ label, value, ok }: { label: React.ReactNode; value: string; ok?: boolean }) {
  const color = ok === true ? '#4ade80' : ok === false ? '#f87171' : '#d1d5db'
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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

export function GuidedDemo({ onStepsChange }: { onStepsChange?: (steps: DemoStep[]) => void }) {
  const { t } = useI18n()
  const [demoState, setDemoState] = useState<DemoStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.demoStatus()
      setDemoState(data)
      onStepsChange?.(data.steps)
    } catch (e) {
      setError(String(e))
    }
  }, [onStepsChange])

  useEffect(() => {
    void fetchStatus()
    pollingRef.current = setInterval(() => {
      if (demoState?.running) void fetchStatus()
    }, POLL_INTERVAL_MS)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchStatus, demoState?.running])

  const handleRunFull = async () => {
    try {
      await api.demoRun()
      const poll = setInterval(async () => {
        const data = await api.demoStatus()
        setDemoState(data)
        onStepsChange?.(data.steps)
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
      onStepsChange?.(data.steps)
    } catch (e) {
      setError(String(e))
    }
  }

  const handleRunStep = async (stepId: string) => {
    try {
      const step = await api.demoStep(stepId)
      setDemoState((prev) => {
        if (!prev) return prev
        const updated = { ...prev, steps: prev.steps.map((s) => (s.id === stepId ? step : s)) }
        onStepsChange?.(updated.steps)
        return updated
      })
      void fetchStatus()
    } catch (e) {
      setError(String(e))
    }
  }

  const steps = demoState?.steps ?? []
  const proof = demoState?.proof ?? null
  const running = demoState?.running ?? false

  const successCount = steps.filter((s) => s.status === 'success').length
  const errorCount = steps.filter((s) => s.status === 'error').length

  return (
    <div style={{ fontFamily: 'monospace', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#f9fafb', marginBottom: '4px' }}>
          {t.demo.title}
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{t.demo.subtitle}</div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => {
            void handleRunFull()
          }}
          disabled={running}
          style={btnStyle(running ? '#374151' : '#16a34a')}
        >
          {running ? t.status.running : t.actions.runFull}
        </button>
        <button
          onClick={() => {
            void handleReset()
          }}
          disabled={running}
          style={btnStyle('#7f1d1d')}
        >
          {t.actions.reset}
        </button>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {successCount}/{steps.length} {t.demo.stepsComplete}
          {errorCount > 0 && (
            <span style={{ color: '#f87171' }}>
              {' '}
              · {errorCount} {t.demo.errors}
            </span>
          )}
        </span>
        {running && (
          <span style={{ fontSize: '12px', color: '#f59e0b' }}>{t.demo.demoRunning}</span>
        )}
      </div>

      {error && (
        <div
          style={{
            fontSize: '12px',
            color: '#f87171',
            marginBottom: '12px',
            padding: '8px',
            background: '#1c0a0a',
            borderRadius: '4px',
          }}
        >
          {t.demo.apiError} {error}
        </div>
      )}

      {/* Steps */}
      {steps.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{t.demo.loadingState}</div>
      ) : (
        steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            onRunStep={(id) => {
              void handleRunStep(id)
            }}
            running={running}
          />
        ))
      )}

      {/* Proof Report */}
      {proof && <ProofPanel proof={proof} />}
    </div>
  )
}
