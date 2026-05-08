import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/index'
import type { HealthData, SimulationData } from '../types/api'

type Severity = 'critical' | 'warning' | 'info'

interface Alert {
  id: string
  severity: Severity
  title: string
  description: string
}

const POLL_INTERVAL_MS = 15_000

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
}

const SEVERITY_BG: Record<Severity, string> = {
  critical: 'rgba(239,68,68,0.08)',
  warning: 'rgba(245,158,11,0.08)',
  info: 'rgba(59,130,246,0.08)',
}

const SEVERITY_ICON: Record<Severity, string> = {
  critical: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export default function AlertingPanel() {
  const { t } = useI18n()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  async function evaluate() {
    const newAlerts: Alert[] = []

    // --- RPC status ---
    let health: HealthData | null = null
    try {
      health = await api.health()
      if (!health.rpc_ok) {
        newAlerts.push({
          id: 'rpc_offline',
          severity: 'critical',
          title: t.alerts.rpcOffline,
          description: t.alerts.rpcOfflineDesc,
        })
      }
    } catch {
      newAlerts.push({
        id: 'rpc_offline',
        severity: 'critical',
        title: t.alerts.rpcOffline,
        description: t.alerts.rpcOfflineDesc,
      })
    }

    // --- Simulation errors ---
    try {
      const sim = (await api.simulationStatus()) as SimulationData
      if (sim.errors > 0) {
        newAlerts.push({
          id: 'sim_errors',
          severity: 'warning',
          title: t.alerts.simulationError,
          description: t.alerts.simulationErrorDesc,
        })
      }
    } catch {
      // Simulation endpoint unavailable — not an alert condition
    }

    // --- Cluster mempool unavailable (info) ---
    try {
      const cluster = await api.clusterCompatibility()
      if (!cluster.supported) {
        newAlerts.push({
          id: 'cluster_unavailable',
          severity: 'info',
          title: t.alerts.clusterUnavailable,
          description: t.alerts.clusterUnavailableDesc,
        })
      }
    } catch {
      // Not critical
    }

    setAlerts(newAlerts)
    setLastCheck(new Date())
  }

  useEffect(() => {
    evaluate()
    const id = setInterval(evaluate, POLL_INTERVAL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actionable = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning')
  const allGood = actionable.length === 0
  const hasCritical = actionable.some((a) => a.severity === 'critical')
  const hasWarning = actionable.some((a) => a.severity === 'warning')
  const panelBorder = hasCritical
    ? '1px solid rgba(239,68,68,0.4)'
    : hasWarning
      ? '1px solid rgba(245,158,11,0.3)'
      : '1px solid rgba(34,197,94,0.3)'
  const panelHeaderColor = hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : '#22c55e'

  return (
    <div
      style={{
        background: '#111',
        border: panelBorder,
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: panelHeaderColor, letterSpacing: 1 }}>
          {t.alerts.title.toUpperCase()}
        </span>
        {lastCheck && (
          <span style={{ fontSize: 11, color: '#555' }}>{lastCheck.toLocaleTimeString()}</span>
        )}
      </div>

      {allGood ? (
        <div
          style={{ color: '#22c55e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>✓</span>
          <span>{t.alerts.allGood}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actionable.map((alert) => (
            <div
              key={alert.id}
              style={{
                background: SEVERITY_BG[alert.severity],
                border: `1px solid ${SEVERITY_COLORS[alert.severity]}44`,
                borderRadius: 6,
                padding: '8px 12px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  color: SEVERITY_COLORS[alert.severity],
                  fontWeight: 700,
                  fontSize: 13,
                  minWidth: 16,
                  marginTop: 1,
                }}
              >
                {SEVERITY_ICON[alert.severity]}
              </span>
              <div>
                <div
                  style={{ color: SEVERITY_COLORS[alert.severity], fontWeight: 600, fontSize: 13 }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1,
                      background: SEVERITY_COLORS[alert.severity] + '22',
                      color: SEVERITY_COLORS[alert.severity],
                      borderRadius: 3,
                      padding: '1px 5px',
                      marginRight: 6,
                    }}
                  >
                    {t.alerts.severity[alert.severity].toUpperCase()}
                  </span>
                  {alert.title}
                </div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 3 }}>{alert.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
