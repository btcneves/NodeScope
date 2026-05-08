import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { ChartData } from '../types/api'
import { useI18n } from '../i18n'

type Range = '1h' | '6h' | '24h'

function PolylineChart({
  data,
  field,
  color,
}: {
  data: ChartData | null
  field: 'mempool_size' | 'mempool_bytes' | 'minfee'
  color: string
}) {
  const values = useMemo(() => data?.points.map((p) => Number(p[field] ?? 0)) ?? [], [data, field])
  const points = useMemo(() => {
    if (values.length < 2) return ''
    const max = Math.max(...values, 1)
    return values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 400
        const y = 78 - (value / max) * 70
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [values])

  return (
    <svg viewBox="0 0 400 80" width="100%" height="80" role="img">
      <line x1="0" y1="78" x2="400" y2="78" stroke="#1f2937" />
      {values.length === 1 ? (
        <circle cx="200" cy="40" r="4" fill={color} />
      ) : (
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      )}
    </svg>
  )
}

export function HistoricalChartsPanel() {
  const { t } = useI18n()
  const [range, setRange] = useState<Range>('1h')
  const [mempool, setMempool] = useState<ChartData | null>(null)
  const [fees, setFees] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.chartsMempool(range), api.chartsFees(range)])
      .then(([m, f]) => {
        setMempool(m)
        setFees(f)
      })
      .finally(() => setLoading(false))
  }, [range])

  const button = (value: Range, label: string) => (
    <button
      onClick={() => setRange(value)}
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        border: range === value ? '1px solid #3b82f6' : '1px solid #374151',
        background: range === value ? '#1d4ed8' : 'transparent',
        color: range === value ? '#fff' : '#9ca3af',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  )

  const hasData = (mempool?.points.length ?? 0) > 0 || (fees?.points.length ?? 0) > 0

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <div className="panel-header">
        <span className="panel-title">{t.charts.title}</span>
        <span style={{ display: 'flex', gap: 6 }}>
          {button('1h', t.charts.range1h)}
          {button('6h', t.charts.range6h)}
          {button('24h', t.charts.range24h)}
        </span>
      </div>
      <div className="panel-body">
        {!hasData && (
          <div className="empty-state">
            {loading ? t.status.loading : `${t.charts.noData} ${t.charts.waitingSnapshot}`}
          </div>
        )}
        <div style={{ display: 'grid', gap: 14, padding: '16px' }}>
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: 6,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 4 }}>
              {t.charts.mempoolSize}
            </div>
            <PolylineChart data={mempool} field="mempool_size" color="#22c55e" />
          </div>
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #1f2937',
              borderRadius: 6,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 4 }}>
              {t.charts.feeRate}
            </div>
            <PolylineChart data={fees} field="minfee" color="#f59e0b" />
          </div>
        </div>
      </div>
    </div>
  )
}
