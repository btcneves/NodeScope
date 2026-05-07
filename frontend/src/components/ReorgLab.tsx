import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import type { ReorgStatusData, ReorgStep } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { LearnMore } from './ui/LearnMore'

const STATUS_COLORS: Record<string, string> = {
  idle:         '#6b7280',
  running:      '#f59e0b',
  success:      '#22c55e',
  error:        '#ef4444',
  unavailable:  '#9ca3af',
  experimental: '#a78bfa',
  pending:      '#374151',
}

const STEP_ICONS: Record<string, string> = {
  success:      '✓',
  error:        '✗',
  running:      '…',
  unavailable:  '—',
  experimental: '⚠',
  pending:      '○',
}

const REORG_WARNING_KEYS: Record<string, 'warningExperimental' | 'warningRestored'> = {
  'This scenario is marked experimental. Regtest reorgs are controlled and safe.': 'warningExperimental',
  'Chain was restored via a new block after invalidation.': 'warningRestored',
}

interface Props {
  onInspect?: (txid: string) => void
  onGoToDashboard?: () => void
}

export function ReorgLab({ onInspect, onGoToDashboard }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<ReorgStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = async () => {
    try {
      const s = await api.reorgStatus()
      setData(s)
      if (!s.running && pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    void fetchStatus()
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => { void fetchStatus() }, 1500)
  }

  const handleRun = async () => {
    setLoading(true)
    try {
      const s = await api.reorgRun()
      setData(s)
      startPolling()
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleReset = async () => {
    try {
      const s = await api.reorgReset()
      setData(s)
    } catch { /* ignore */ }
  }

  const handleCopyProof = () => {
    if (data?.proof) {
      void navigator.clipboard.writeText(JSON.stringify(data.proof, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const status = data?.status ?? 'idle'
  const statusColor = STATUS_COLORS[status] ?? '#6b7280'
  const steps = data?.steps ?? []
  const proof = data?.proof

  const txid = proof?.txid
    ?? steps.find(s => s.data?.txid)?.data?.txid as string | undefined

  return (
    <div style={{ fontFamily: 'monospace', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Term term="Reorg">{t.reorg.title}</Term>
            <span style={{
              marginLeft: '10px', fontSize: '10px', padding: '2px 8px',
              background: '#7c3aed22', border: '1px solid #7c3aed', borderRadius: '4px',
              color: '#a78bfa', verticalAlign: 'middle',
            }}>{t.reorg.experimentalBadge}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {t.reorg.subtitle}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => { void handleRun() }}
            disabled={loading || data?.running}
            style={{
              padding: '6px 16px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer',
              background: data?.running ? '#374151' : '#1d4ed8',
              color: '#fff', border: '1px solid #3b82f6',
              opacity: (loading || data?.running) ? 0.6 : 1,
            }}
          >
            {data?.running ? `⏳ ${t.reorg.running}` : t.reorg.runReorg}
          </button>
          <button
            onClick={() => { void handleReset() }}
            disabled={data?.running}
            style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer',
              background: 'transparent', color: '#9ca3af', border: '1px solid #374151',
            }}
          >
            {t.actions.reset}
          </button>
          {status !== 'idle' && !data?.running && onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              style={{
                padding: '5px 12px', fontSize: '11px', background: 'transparent',
                color: '#60a5fa', border: '1px solid #1e3a5f', borderRadius: '4px',
                cursor: 'pointer', fontFamily: 'monospace',
              }}
            >
              {t.reorg.viewOnDashboard}
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        padding: '8px 12px', borderRadius: '6px', marginBottom: '16px',
        background: '#111827', border: `1px solid ${statusColor}`,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ color: statusColor, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>
          {status}
        </span>
        {data?.network && (
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            {t.reorg.networkLabel}: {data.network}
          </span>
        )}
        {data?.error && (
          <span style={{ fontSize: '11px', color: '#ef4444' }}>⚠ {data.error}</span>
        )}
      </div>

      {/* Timeline */}
      <div style={{
        background: '#111827', border: '1px solid #1f2937', borderRadius: '8px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>
          {t.reorg.phase}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {steps.length === 0 ? (
            <div style={{ color: '#374151', fontSize: '12px' }}>
              {t.reorg.noResults}
            </div>
          ) : (
            steps.map((step: ReorgStep, idx: number) => (
              <StepRow key={idx} step={step} onInspect={onInspect} txid={txid} />
            ))
          )}
        </div>
      </div>

      {/* Proof cards */}
      {proof && <ProofCards proof={proof} txid={txid} onInspect={onInspect} />}

      {/* Proof JSON */}
      {proof && (
        <div style={{
          background: '#111827', border: '1px solid #1f2937', borderRadius: '8px',
          padding: '16px', marginTop: '16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '10px',
          }}>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>
              {t.demo.proofReport} (JSON)
            </span>
            <button
              onClick={handleCopyProof}
              style={{
                padding: '3px 10px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer',
                background: copied ? '#166534' : '#1f2937', color: copied ? '#4ade80' : '#9ca3af',
                border: '1px solid #374151',
              }}
            >
              {copied ? `✓ ${t.actions.copied}` : `⎘ ${t.actions.copy} JSON`}
            </button>
          </div>
          <pre style={{
            fontSize: '10px', color: '#d1d5db', overflowX: 'auto',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0,
            maxHeight: '300px', overflowY: 'auto',
          }}>
            {JSON.stringify(proof, null, 2)}
          </pre>
        </div>
      )}

      {/* Warnings */}
      {proof?.warnings && proof.warnings.length > 0 && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '6px',
          background: '#451a0320', border: '1px solid #78350f', fontSize: '11px', color: '#fbbf24',
        }}>
          {proof.warnings.map((w: string, i: number) => {
            const key = REORG_WARNING_KEYS[w]
            return <div key={i}>⚠ {key ? t.reorg[key] : w}</div>
          })}
        </div>
      )}

      <LearnMore>
        {t.learn.reorg}
      </LearnMore>
    </div>
  )
}

function StepRow({
  step, onInspect, txid,
}: { step: ReorgStep; onInspect?: (txid: string) => void; txid?: string }) {
  const { t } = useI18n()
  const icon = STEP_ICONS[step.status] ?? '○'
  const color = STATUS_COLORS[step.status] ?? '#6b7280'
  const label = {
    check_network: t.reorg.steps.checkNetwork,
    ensure_wallet: t.reorg.steps.ensureWallet,
    broadcast_tx: t.reorg.steps.broadcastTx,
    mine_block: t.reorg.steps.mineBlock,
    invalidate_block: t.reorg.steps.invalidateBlock,
    check_tx_after_invalidation: t.reorg.steps.checkMempool,
    mine_recovery_block: t.reorg.steps.mineRecovery,
    verify_reconfirmation: t.reorg.steps.verifyReconfirmation,
    reconsider_block: t.reorg.steps.reconsiderBlock,
    build_proof: t.reorg.steps.buildProof,
  }[step.name] ?? step.name
  const stepTxid = (step.data?.txid ?? txid) as string | undefined

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <span style={{ color, fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#d1d5db' }}>{step.message}</div>
        {step.status === 'error' && !!step.technical && (
          <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
            {JSON.stringify(step.technical).slice(0, 120)}
          </div>
        )}
      </div>
      {stepTxid && onInspect && (
        <button
          onClick={() => onInspect(stepTxid)}
          style={{
            padding: '2px 8px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer',
            background: 'transparent', color: '#3b82f6', border: '1px solid #1d4ed8',
          }}
        >
          {t.actions.inspect}
        </button>
      )}
      {step.timestamp && (
        <span style={{ fontSize: '9px', color: '#374151', whiteSpace: 'nowrap' }}>
          {step.timestamp.slice(11, 19)}
        </span>
      )}
    </div>
  )
}

function ProofCards({ proof, txid, onInspect }: {
  proof: NonNullable<ReorgStatusData['proof']>
  txid?: string
  onInspect?: (txid: string) => void
}) {
  const { t } = useI18n()
  const cards = [
    { label: <Term term="TXID">{t.reorg.txid}</Term>, key: 'txid', value: proof.txid, mono: true, canInspect: true },
    { label: <Term term="Block hash">{t.reorg.originalBlock}</Term>, key: 'originalBlock', value: proof.original_block_hash ? proof.original_block_hash.slice(0, 20) + '…' : '—', mono: true },
    { label: <Term term="Block height">{t.reorg.originalHeight}</Term>, key: 'originalHeight', value: proof.original_block_height ?? '—' },
    { label: <Term term="Confirmation">{t.reorg.confirmationsBefore}</Term>, key: 'confirmationsBefore', value: proof.confirmations_before_reorg },
    { label: <Term term="Mempool">{t.reorg.mempoolAfterInvalidation}</Term>, key: 'mempoolAfterInvalidation', value: proof.mempool_status_after_invalidation },
    { label: <Term term="Block hash">{t.reorg.finalBlock}</Term>, key: 'finalBlock', value: proof.final_block_hash ? proof.final_block_hash.slice(0, 20) + '…' : '—', mono: true },
    { label: <Term term="Block height">{t.reorg.finalHeight}</Term>, key: 'finalHeight', value: proof.final_block_height ?? '—' },
    { label: <Term term="Confirmation">{t.reorg.finalConfirmations}</Term>, key: 'finalConfirmations', value: proof.final_confirmations },
    { label: <Term term="Reorg">{t.reorg.chainRecovery}</Term>, key: 'chainRecovery', value: proof.mempool_status_after_recovery },
    { label: t.reorg.reconsiderBlockCalled, key: 'reconsiderBlockCalled', value: proof.reconsider_block_called ? t.reorg.yes : t.reorg.no },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '8px', marginBottom: '16px',
    }}>
      {cards.map(({ label, key, value, mono, canInspect }) => (
        <div key={key} style={{
          background: '#111827', border: '1px solid #1f2937', borderRadius: '6px',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{
            fontSize: '12px', color: '#e5e7eb', fontFamily: mono ? 'monospace' : undefined,
            wordBreak: 'break-all',
          }}>
            {String(value)}
          </div>
          {canInspect && txid && onInspect && (
            <button
              onClick={() => onInspect(txid)}
              style={{
                marginTop: '4px', padding: '2px 8px', fontSize: '10px', borderRadius: '3px',
                cursor: 'pointer', background: 'transparent', color: '#3b82f6',
                border: '1px solid #1d4ed8',
              }}
            >
              {t.reorg.inspectTx}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
