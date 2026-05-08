import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/index'
import type { ActiveAlert, AlertConfig } from '../types/api'

const METRICS = ['mempool_size', 'mempool_bytes', 'minfee', 'rpc_offline']
const OPERATORS = ['gt', 'lt', 'eq', 'gte', 'lte']
const controlStyle: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #374151',
  borderRadius: 4,
  color: '#e5e7eb',
  padding: '5px 8px',
  fontFamily: 'monospace',
  fontSize: 12,
}

export default function AlertingPanel({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useI18n()
  const [active, setActive] = useState<ActiveAlert[]>([])
  const [configs, setConfigs] = useState<AlertConfig[]>([])
  const [draft, setDraft] = useState({ metric: 'mempool_size', operator: 'gt', threshold: 500 })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [activeData, configData] = await Promise.all([api.alertsActive(), api.alertsConfig()])
      setActive(activeData.items)
      setConfigs(configData.items)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 15_000)
    return () => clearInterval(id)
  }, [load])

  async function addRule() {
    if (readOnly) return
    try {
      await api.alertsCreate({ ...draft, severity: 'warning', enabled: true })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function toggleRule(rule: AlertConfig) {
    if (readOnly || rule.id == null) return
    try {
      await api.alertsUpdate(rule.id, { enabled: !rule.enabled })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function deleteRule(rule: AlertConfig) {
    if (readOnly || rule.id == null) return
    try {
      await api.alertsDelete(rule.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const activeActionable = active.filter((item) => item.severity !== 'info')

  return (
    <div
      style={{
        background: '#111',
        border: activeActionable.length ? '1px solid rgba(245,158,11,0.35)' : '1px solid #14532d',
        borderRadius: 8,
        padding: '14px 18px',
        marginBottom: 18,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e5e7eb' }}>
          {t.alerts.title.toUpperCase()}
        </span>
        <button
          onClick={() => void load()}
          style={{
            padding: '3px 10px',
            border: '1px solid #374151',
            borderRadius: 4,
            background: 'transparent',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
        >
          {t.actions.refresh}
        </button>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {readOnly && (
        <div style={{ color: '#fdba74', fontSize: 12, marginBottom: 8 }}>
          {t.network.readOnlyActionBlocked}
        </div>
      )}

      {active.length === 0 ? (
        <div style={{ color: '#22c55e', fontSize: 13 }}>✓ {t.alerts.allGood}</div>
      ) : (
        <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
          {active.map((item) => (
            <div
              key={`${item.id}-${item.metric}`}
              style={{
                padding: '8px 10px',
                borderRadius: 5,
                background: '#1f2937',
                color: item.severity === 'critical' ? '#f87171' : '#fbbf24',
                fontSize: 12,
              }}
            >
              {item.severity.toUpperCase()} · {item.metric} {item.operator} {item.threshold} ·{' '}
              {item.current_value}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 6 }}>
        {configs.map((rule) => (
          <div
            key={rule.id}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              borderTop: '1px solid #1f2937',
              paddingTop: 8,
              color: '#9ca3af',
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={rule.enabled}
              disabled={readOnly}
              onChange={() => void toggleRule(rule)}
            />
            <span style={{ flex: 1 }}>
              {rule.metric} {rule.operator} {rule.threshold} · {rule.severity}
            </span>
            <button
              disabled={readOnly}
              onClick={() => void deleteRule(rule)}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                borderRadius: 4,
                color: '#9ca3af',
                cursor: readOnly ? 'not-allowed' : 'pointer',
              }}
            >
              {t.actions.close}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <select
          value={draft.metric}
          disabled={readOnly}
          onChange={(e) => setDraft((d) => ({ ...d, metric: e.target.value }))}
          style={controlStyle}
        >
          {METRICS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={draft.operator}
          disabled={readOnly}
          onChange={(e) => setDraft((d) => ({ ...d, operator: e.target.value }))}
          style={controlStyle}
        >
          {OPERATORS.map((op) => (
            <option key={op}>{op}</option>
          ))}
        </select>
        <input
          type="number"
          value={draft.threshold}
          disabled={readOnly}
          onChange={(e) => setDraft((d) => ({ ...d, threshold: Number(e.target.value) }))}
          style={{ ...controlStyle, width: 90 }}
        />
        <button
          disabled={readOnly}
          onClick={() => void addRule()}
          style={{
            ...controlStyle,
            cursor: readOnly ? 'not-allowed' : 'pointer',
            color: '#bbf7d0',
            borderColor: '#166534',
          }}
        >
          + warning
        </button>
      </div>
    </div>
  )
}
