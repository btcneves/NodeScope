import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/index'
import type {
  DemoRunHistoryItem,
  HistorySummary,
  PolicyRunHistoryItem,
  ProofReportHistoryItem,
  ReorgRunHistoryItem,
} from '../types/api'

const SECTION_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '16px 20px',
  marginBottom: 16,
}

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
}

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const TD_STYLE: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  verticalAlign: 'top',
}

function Badge({ success }: { success: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        color: success ? '#4ade80' : '#f87171',
      }}
    >
      {success ? '✓' : '✗'}
    </span>
  )
}

function ShortHash({ value }: { value: string | null | undefined }) {
  if (!value) return <span style={{ color: '#64748b' }}>—</span>
  const short = value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value
  return (
    <span title={value} style={{ fontFamily: 'monospace', fontSize: 11, color: '#a78bfa' }}>
      {short}
    </span>
  )
}

function Timestamp({ value }: { value: string | null | undefined }) {
  if (!value) return <span style={{ color: '#64748b' }}>—</span>
  try {
    const d = new Date(value)
    return <span style={{ color: '#94a3b8', fontSize: 11 }}>{d.toLocaleString()}</span>
  } catch {
    return <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
  }
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}33`,
        borderRadius: 8,
        padding: '12px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function HistoricalDashboard() {
  const { t } = useI18n()

  const [summary, setSummary] = useState<HistorySummary | null>(null)
  const [proofs, setProofs] = useState<ProofReportHistoryItem[]>([])
  const [demoRuns, setDemoRuns] = useState<DemoRunHistoryItem[]>([])
  const [policyRuns, setPolicyRuns] = useState<PolicyRunHistoryItem[]>([])
  const [reorgRuns, setReorgRuns] = useState<ReorgRunHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'proofs' | 'demo' | 'policy' | 'reorg'>('proofs')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sumData, proofsData, demoData, policyData, reorgData] = await Promise.all([
        api.historySummary(),
        api.historyProofs(20),
        api.historyDemoRuns(20),
        api.historyPolicyRuns(20),
        api.historyReorgRuns(20),
      ])
      setSummary(sumData)
      setProofs(proofsData.items)
      setDemoRuns(demoData.items)
      setPolicyRuns(policyData.items)
      setReorgRuns(reorgData.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleExport(format: 'json' | 'csv') {
    try {
      const a = document.createElement('a')
      a.href = `/history/export.${format}`
      a.download = `nodescope-history.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setExportMsg(t.history.exportDownloaded)
      setTimeout(() => setExportMsg(null), 3000)
    } catch {
      setExportMsg(t.history.exportFailed)
      setTimeout(() => setExportMsg(null), 3000)
    }
  }

  function copyProof(item: ProofReportHistoryItem) {
    if (!item.summary) return
    navigator.clipboard.writeText(JSON.stringify(item.summary, null, 2)).then(() => {
      setCopied(item.id ?? null)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const tabs: { key: typeof activeTab; label: string; count: number }[] = [
    { key: 'proofs', label: t.history.proofReports, count: summary?.proof_reports ?? 0 },
    { key: 'demo', label: t.history.demoRuns, count: summary?.demo_runs ?? 0 },
    { key: 'policy', label: t.history.policyRuns, count: summary?.policy_runs ?? 0 },
    { key: 'reorg', label: t.history.reorgRuns, count: summary?.reorg_runs ?? 0 },
  ]

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#e2e8f0' }}>{t.history.title}</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>{t.history.subtitle}</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ ...SECTION_STYLE, marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
              {t.history.storageBackend}:{' '}
              <span style={{ color: '#e2e8f0' }}>
                {summary.storage_backend === 'sqlite' ? t.history.sqlite : t.history.memory}
              </span>
            </span>
            <span
              style={{
                marginLeft: 12,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: summary.storage_up ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: summary.storage_up ? '#4ade80' : '#f87171',
              }}
            >
              {summary.storage_up ? t.history.storageUp : t.history.storageDown}
            </span>
            {summary.storage_backend === 'memory' && (
              <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 4 }}>
                ⚠ {t.history.memory}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <SummaryCard
              label={t.history.proofReports}
              value={summary.proof_reports}
              color="#a78bfa"
            />
            <SummaryCard label={t.history.demoRuns} value={summary.demo_runs} color="#34d399" />
            <SummaryCard label={t.history.policyRuns} value={summary.policy_runs} color="#60a5fa" />
            <SummaryCard label={t.history.reorgRuns} value={summary.reorg_runs} color="#f59e0b" />
          </div>
        </div>
      )}

      {/* Refresh + export + error */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: '6px 16px',
            background: '#334155',
            border: '1px solid #475569',
            borderRadius: 6,
            color: '#e2e8f0',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: 13,
          }}
        >
          {loading ? '…' : t.history.refresh}
        </button>
        <button
          onClick={() => handleExport('json')}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {t.history.exportJson}
        </button>
        <button
          onClick={() => handleExport('csv')}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {t.history.exportCsv}
        </button>
        {exportMsg && <span style={{ fontSize: 12, color: '#34d399' }}>{exportMsg}</span>}
        {error && <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: activeTab === tab.key ? '#6366f1' : '#334155',
              background: activeTab === tab.key ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === tab.key ? '#a5b4fc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {tab.label}{' '}
            <span
              style={{
                display: 'inline-block',
                padding: '0 5px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                fontSize: 10,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tables */}
      {activeTab === 'proofs' && (
        <div style={SECTION_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#cbd5e1' }}>
            {t.history.proofReports}
          </h3>
          {proofs.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13 }}>{t.history.empty}</p>
          ) : (
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>{t.history.scenarioLabel}</th>
                  <th style={TH_STYLE}>{t.history.sourceLabel}</th>
                  <th style={TH_STYLE}>{t.history.successLabel}</th>
                  <th style={TH_STYLE}>{t.history.txidLabel}</th>
                  <th style={TH_STYLE}>{t.history.blockLabel}</th>
                  <th style={TH_STYLE}>{t.history.createdLabel}</th>
                  <th style={TH_STYLE}></th>
                </tr>
              </thead>
              <tbody>
                {proofs.map((item) => (
                  <tr key={item.id}>
                    <td style={TD_STYLE}>
                      <span style={{ fontSize: 12, color: '#e2e8f0' }}>
                        {item.scenario_name ?? '—'}
                      </span>
                    </td>
                    <td style={TD_STYLE}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: 'rgba(167,139,250,0.1)',
                          color: '#a78bfa',
                        }}
                      >
                        {item.source ?? '—'}
                      </span>
                    </td>
                    <td style={TD_STYLE}>
                      <Badge success={item.success} />
                    </td>
                    <td style={TD_STYLE}>
                      <ShortHash value={item.txid} />
                    </td>
                    <td style={TD_STYLE}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {item.block_height ?? '—'}
                      </span>
                    </td>
                    <td style={TD_STYLE}>
                      <Timestamp value={item.created_at} />
                    </td>
                    <td style={{ ...TD_STYLE, whiteSpace: 'nowrap' }}>
                      {item.summary && (
                        <button
                          onClick={() => copyProof(item)}
                          style={{
                            padding: '2px 8px',
                            fontSize: 11,
                            background: copied === item.id ? '#22c55e22' : '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 4,
                            color: copied === item.id ? '#4ade80' : '#94a3b8',
                            cursor: 'pointer',
                          }}
                        >
                          {copied === item.id ? t.actions.copied : t.history.copyProof}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'demo' && (
        <div style={SECTION_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#cbd5e1' }}>
            {t.history.demoRuns}
          </h3>
          {demoRuns.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13 }}>{t.history.empty}</p>
          ) : (
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>{t.history.successLabel}</th>
                  <th style={TH_STYLE}>{t.history.txidLabel}</th>
                  <th style={TH_STYLE}>Duration</th>
                  <th style={TH_STYLE}>{t.history.createdLabel}</th>
                </tr>
              </thead>
              <tbody>
                {demoRuns.map((item) => (
                  <tr key={item.id}>
                    <td style={TD_STYLE}>
                      <Badge success={item.success} />
                    </td>
                    <td style={TD_STYLE}>
                      <ShortHash value={item.txid} />
                    </td>
                    <td style={TD_STYLE}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {item.duration_ms != null ? `${Math.round(item.duration_ms)} ms` : '—'}
                      </span>
                    </td>
                    <td style={TD_STYLE}>
                      <Timestamp value={item.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'policy' && (
        <div style={SECTION_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#cbd5e1' }}>
            {t.history.policyRuns}
          </h3>
          {policyRuns.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13 }}>{t.history.empty}</p>
          ) : (
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>{t.history.scenarioLabel}</th>
                  <th style={TH_STYLE}>{t.history.successLabel}</th>
                  <th style={TH_STYLE}>{t.history.txidLabel}</th>
                  <th style={TH_STYLE}>{t.history.createdLabel}</th>
                </tr>
              </thead>
              <tbody>
                {policyRuns.map((item) => (
                  <tr key={item.id}>
                    <td style={TD_STYLE}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: 'rgba(96,165,250,0.1)',
                          color: '#60a5fa',
                        }}
                      >
                        {item.scenario_id ?? '—'}
                      </span>
                    </td>
                    <td style={TD_STYLE}>
                      <Badge success={item.success} />
                    </td>
                    <td style={TD_STYLE}>
                      <ShortHash value={item.txids?.[0]} />
                    </td>
                    <td style={TD_STYLE}>
                      <Timestamp value={item.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'reorg' && (
        <div style={SECTION_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#cbd5e1' }}>
            {t.history.reorgRuns}
          </h3>
          {reorgRuns.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13 }}>{t.history.empty}</p>
          ) : (
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>{t.history.successLabel}</th>
                  <th style={TH_STYLE}>{t.history.txidLabel}</th>
                  <th style={TH_STYLE}>Original Block</th>
                  <th style={TH_STYLE}>Final Block</th>
                  <th style={TH_STYLE}>{t.history.createdLabel}</th>
                </tr>
              </thead>
              <tbody>
                {reorgRuns.map((item) => (
                  <tr key={item.id}>
                    <td style={TD_STYLE}>
                      <Badge success={item.success} />
                    </td>
                    <td style={TD_STYLE}>
                      <ShortHash value={item.txid} />
                    </td>
                    <td style={TD_STYLE}>
                      <ShortHash value={item.original_block_hash} />
                    </td>
                    <td style={TD_STYLE}>
                      <ShortHash value={item.final_block_hash} />
                    </td>
                    <td style={TD_STYLE}>
                      <Timestamp value={item.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
