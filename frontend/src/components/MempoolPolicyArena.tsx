import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { PolicyScenario, PolicyScenarioSummary, PolicyStep } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { LearnMore } from './ui/LearnMore'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1500

const SCENARIO_COLORS: Record<string, string> = {
  normal_transaction: '#22c55e',
  low_fee_transaction: '#f59e0b',
  rbf_replacement:     '#3b82f6',
  cpfp_package:        '#a78bfa',
}

const STATUS_COLOR: Record<string, string> = {
  idle:         '#6b7280',
  running:      '#f59e0b',
  success:      '#22c55e',
  error:        '#ef4444',
  experimental: '#f97316',
  unavailable:  '#9ca3af',
  pending:      '#374151',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusDot(status: string) {
  const color = STATUS_COLOR[status] ?? '#6b7280'
  return (
    <span style={{
      display: 'inline-block', width: '8px', height: '8px',
      borderRadius: '50%', background: color, marginRight: '6px', flexShrink: 0,
      boxShadow: status === 'running' ? `0 0 6px ${color}` : undefined,
    }} />
  )
}

function StatusChip({ status }: { status: string }) {
  const { t } = useI18n()
  const color = STATUS_COLOR[status] ?? '#6b7280'
  const label = status in t.status ? t.status[status as keyof typeof t.status] : status
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
      background: color + '22', color, border: `1px solid ${color}55`,
      textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace',
    }}>
      {label}
    </span>
  )
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  })
}

// ---------------------------------------------------------------------------
// Step row
// ---------------------------------------------------------------------------

function StepRow({ step }: { step: PolicyStep }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const hasDetail = step.technical_output != null || step.error

  return (
    <div style={{
      borderBottom: '1px solid #1f2937',
      background: step.status === 'running' ? '#0d1f0d' : 'transparent',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '7px 12px',
          cursor: hasDetail ? 'pointer' : 'default',
          fontSize: '12px',
        }}
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        {statusDot(step.status)}
        <span style={{ color: '#9ca3af', minWidth: '200px', flexShrink: 0 }}>{step.title}</span>
        <span style={{ color: '#d1d5db', flex: 1 }}>{step.friendly_message || '—'}</span>
        {step.timestamp && (
          <span style={{ color: '#4b5563', fontSize: '10px', flexShrink: 0 }}>
            {step.timestamp.replace('T', ' ').slice(11, 19)} UTC
          </span>
        )}
        {hasDetail && (
          <span style={{ color: '#4b5563', fontSize: '10px', marginLeft: '8px' }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>
      {expanded && (
        <div style={{ padding: '0 12px 10px 28px' }}>
          {step.error && (
            <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '6px' }}>
              {t.generic.error}: {step.error}
            </div>
          )}
          {step.technical_output != null && (
            <pre style={{
              background: '#060d14', border: '1px solid #1f2937', borderRadius: '4px',
              padding: '8px', fontSize: '10px', color: '#9ca3af', overflow: 'auto',
              maxHeight: '200px', margin: 0,
            }}>
              {typeof step.technical_output === 'string'
                ? step.technical_output
                : JSON.stringify(step.technical_output, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proof panel
// ---------------------------------------------------------------------------

function ProofPanel({ proof, scenarioId }: { proof: Record<string, unknown>; scenarioId: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(proof, null, 2)

  const handleCopy = () => {
    copyToClipboard(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginTop: '12px', background: '#060d14', border: '1px solid #1f2937', borderRadius: '6px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>{t.demo.proofReport} — {scenarioId}</span>
        <button
          onClick={handleCopy}
          style={{
            padding: '3px 10px', fontSize: '10px', background: '#0f766e',
            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
          }}
        >
          {copied ? t.actions.copied : t.actions.copy + ' JSON'}
        </button>
      </div>
      <pre style={{
        fontSize: '10px', color: '#6b7280', overflow: 'auto', maxHeight: '300px', margin: 0,
        fontFamily: 'monospace',
      }}>
        {json}
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scenario card
// ---------------------------------------------------------------------------

interface ScenarioCardProps {
  summary: PolicyScenarioSummary
  accentColor: string
  onRun: (id: string) => void
  onReset: (id: string) => void
  onGoToDashboard: () => void
}

function ScenarioCard({ summary, accentColor, onRun, onReset, onGoToDashboard }: ScenarioCardProps) {
  const { t } = useI18n()
  const [detail, setDetail] = useState<PolicyScenario | null>(null)
  const [polling, setPolling] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const SCENARIO_DESC: Record<string, string> = {
    normal_transaction: t.policy.descNormal,
    low_fee_transaction: t.policy.descLowFee,
    rbf_replacement: t.policy.descRbf,
    cpfp_package: t.policy.descCpfp,
  }
  const SCENARIO_LEARN: Record<string, string> = {
    normal_transaction: t.learn.normalTx,
    low_fee_transaction: t.learn.lowFee,
    rbf_replacement: t.learn.rbf,
    cpfp_package: t.learn.cpfp,
  }

  const fetchDetail = useCallback(async () => {
    try {
      const d = await api.policyStatus(summary.id)
      setDetail(d)
      setLoadError(null)
      if (!d.running) setPolling(false)
    } catch (e) {
      setLoadError(String(e))
    }
  }, [summary.id])

  // Poll while running
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(() => { void fetchDetail() }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [polling, fetchDetail])

  // Also fetch when card is first shown or summary changes
  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail, summary.status])

  const handleRun = () => {
    setPolling(true)
    onRun(summary.id)
    setTimeout(() => { void fetchDetail() }, 400)
  }

  const handleReset = () => {
    setPolling(false)
    onReset(summary.id)
    setDetail(null)
  }

  const status = detail?.status ?? summary.status
  const running = detail?.running ?? summary.running
  const accentBorder = accentColor + '44'

  return (
    <div style={{
      background: '#0f172a', border: `1px solid ${accentBorder}`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '6px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f9fafb' }}>{summary.title}</span>
              <StatusChip status={status} />
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {SCENARIO_DESC[summary.id] ?? summary.description}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                padding: '4px 14px', fontSize: '11px', fontWeight: 600,
                background: running ? '#1f2937' : accentColor + 'cc',
                color: running ? '#6b7280' : '#fff',
                border: 'none', borderRadius: '4px',
                cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {running ? t.status.running : t.actions.run}
            </button>
            {status !== 'idle' && (
              <button
                onClick={handleReset}
                disabled={running}
                style={{
                  padding: '4px 10px', fontSize: '11px',
                  background: '#1f2937', color: '#9ca3af',
                  border: '1px solid #374151', borderRadius: '4px',
                  cursor: running ? 'not-allowed' : 'pointer',
                }}
              >
                {t.actions.reset}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content area — grows to fill available card height */}
      <div style={{ flex: 1 }}>
        {/* Steps */}
        {detail && detail.steps.length > 0 && (
          <div style={{ fontFamily: 'monospace' }}>
            {detail.steps.map(step => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        )}

        {loadError && (
          <div style={{ padding: '10px 16px', fontSize: '11px', color: '#f87171' }}>
            {loadError}
          </div>
        )}

        {/* Proof */}
        {detail?.proof && (
          <div style={{ padding: '0 16px 16px' }}>
            <ProofPanel proof={detail.proof} scenarioId={summary.id} />
          </div>
        )}

        {/* Idle placeholder */}
        {(!detail || detail.steps.every(s => s.status === 'pending')) && status === 'idle' && (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: '#4b5563' }}>
            {t.policy.noSteps}
          </div>
        )}
      </div>

      {/* Learn more + navigation bridge */}
      <div style={{ padding: '0 16px 14px', borderTop: '1px solid #1f2937' }}>
        <LearnMore>
          {SCENARIO_LEARN[summary.id] ?? ''}
        </LearnMore>
        {status !== 'idle' && !running && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={onGoToDashboard}
              style={{
                padding: '4px 12px', fontSize: '11px', background: 'transparent',
                color: '#60a5fa', border: '1px solid #1e3a5f', borderRadius: '4px',
                cursor: 'pointer', fontFamily: 'monospace',
              }}
            >
              {t.policy.viewOnDashboard}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MempoolPolicyArena({ onGoToDashboard }: { onGoToDashboard?: () => void }) {
  const { t } = useI18n()
  const [scenarios, setScenarios] = useState<PolicyScenarioSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.policyScenarios()
      setScenarios(data.scenarios)
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchList() }, [fetchList])

  const handleRun = async (id: string) => {
    try {
      await api.policyRun(id)
      await fetchList()
    } catch (e) {
      setError(String(e))
    }
  }

  const handleReset = async (id: string) => {
    try {
      await api.policyReset(id)
      await fetchList()
    } catch (e) {
      setError(String(e))
    }
  }

  const handleResetAll = async () => {
    try {
      await api.policyResetAll()
      await fetchList()
    } catch (e) {
      setError(String(e))
    }
  }

  const anyRunning = scenarios.some(s => s.running)

  return (
    <div style={{ fontFamily: 'monospace', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f9fafb', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Term term="Mempool">{t.policy.title}</Term>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {t.policy.subtitle}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => { void fetchList() }}
              disabled={loading}
              style={{
                padding: '5px 12px', fontSize: '11px', background: '#0f766e',
                color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}
            >
              {loading ? t.status.loading : t.actions.refresh}
            </button>
            <button
              onClick={() => { void handleResetAll() }}
              disabled={anyRunning}
              style={{
                padding: '5px 12px', fontSize: '11px', background: '#1f2937',
                color: '#9ca3af', border: '1px solid #374151', borderRadius: '4px',
                cursor: anyRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {t.actions.reset}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px', background: '#1c0a0a', border: '1px solid #7f1d1d',
          borderRadius: '6px', fontSize: '12px', color: '#f87171', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Scenario legend */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap',
        padding: '10px 14px', background: '#0f172a', borderRadius: '6px',
        border: '1px solid #1f2937', fontSize: '11px',
      }}>
        {(['normal_transaction', 'low_fee_transaction', 'rbf_replacement', 'cpfp_package'] as const).map(id => (
          <span key={id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: SCENARIO_COLORS[id], display: 'inline-block' }} />
            <span style={{ color: '#9ca3af' }}>
              {id === 'normal_transaction' ? <Term term="Normal transaction">{t.policy.normal}</Term>
               : id === 'low_fee_transaction' ? <Term term="Low fee">{t.policy.lowFee}</Term>
               : id === 'rbf_replacement' ? <Term term="RBF">{t.policy.rbf}</Term>
               : <Term term="CPFP">{t.policy.cpfp}</Term>}
            </span>
          </span>
        ))}
        <span style={{ color: '#4b5563', marginLeft: 'auto' }}>
          {t.policy.statusLegend}: {['idle', 'running', 'success', 'error', 'experimental'].map(s => (
            <span key={s} style={{ marginLeft: '6px' }}>
              {statusDot(s)}<span style={{ color: '#6b7280' }}>
                {s in t.status ? t.status[s as keyof typeof t.status] : s}
              </span>
            </span>
          ))}
        </span>
      </div>

      {/* Scenario grid — 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {scenarios.map(s => (
          <ScenarioCard
            key={s.id}
            summary={s}
            accentColor={SCENARIO_COLORS[s.id] ?? '#6b7280'}
            onRun={id => { void handleRun(id) }}
            onReset={id => { void handleReset(id) }}
            onGoToDashboard={() => onGoToDashboard?.()}
          />
        ))}
      </div>

      {scenarios.length === 0 && !loading && !error && (
        <div style={{
          padding: '40px', textAlign: 'center', background: '#0f172a',
          borderRadius: '6px', fontSize: '12px', color: '#6b7280',
        }}>
          {t.policy.noSteps}
        </div>
      )}

      {/* Notes */}
      <div style={{ marginTop: '20px', padding: '12px 16px', background: '#0a0f1a', borderRadius: '6px', border: '1px solid #1f2937', fontSize: '11px', color: '#6b7280' }}>
        <div style={{ marginBottom: '4px', color: '#9ca3af', fontWeight: 600 }}>{t.policy.notesTitle}</div>
        <div>• <Term term="Regtest">{t.policy.noteRegtest}</Term></div>
        <div>• <Term term="RBF">{t.policy.noteRbf}</Term></div>
        <div>• <Term term="CPFP">{t.policy.noteCpfp}</Term></div>
        <div>• <StatusChip status="experimental" /> / <StatusChip status="error" /> — {t.policy.noteStatus}</div>
      </div>
    </div>
  )
}
