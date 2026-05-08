import { useState, useCallback } from 'react'
import { api } from '../api/client'
import type { FeeEstimateData, FeeEstimateItem, FeeComparisonItem } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { LearnMore } from './ui/LearnMore'

// ---------------------------------------------------------------------------
// Status colours — mirrors the pattern from MempoolPolicyArena
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  success: '#22c55e',
  limited: '#f59e0b',
  unavailable: '#9ca3af',
  error: '#ef4444',
}

function StatusChip({ status, label }: { status: string; label: string }) {
  const color = STATUS_COLOR[status] ?? '#6b7280'
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 700,
        background: color + '22',
        color,
        border: `1px solid ${color}55`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontFamily: 'monospace',
      }}
    >
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Mini bar chart — CSS-only, no extra deps
// ---------------------------------------------------------------------------

function FeeBar({
  value,
  max,
  label,
  color,
}: {
  value: number | null
  max: number
  label: string
  color: string
}) {
  const pct = value != null && max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '6px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '2px',
        }}
      >
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace', color: value != null ? color : '#6b7280' }}>
          {value != null ? `${value.toFixed(2)} sat/vB` : '—'}
        </span>
      </div>
      <div
        style={{ height: '8px', background: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '4px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Estimates table row
// ---------------------------------------------------------------------------

function EstimateRow({ item, t }: { item: FeeEstimateItem; t: ReturnType<typeof useI18n>['t'] }) {
  const statusLabel =
    item.status === 'success'
      ? t.status.success
      : item.status === 'limited'
        ? t.fees.estimateLimited
        : item.status === 'unavailable'
          ? t.fees.estimateUnavailable
          : item.status === 'error'
            ? t.status.error
            : item.status

  return (
    <tr>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#e2e8f0' }}>
        {item.target_blocks}
      </td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#93c5fd' }}>
        {item.feerate_btc_kvb != null ? item.feerate_btc_kvb.toFixed(8) : '—'}
      </td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#34d399' }}>
        {item.feerate_sat_vb != null ? item.feerate_sat_vb.toFixed(2) : '—'}
      </td>
      <td style={{ padding: '8px 10px' }}>
        <StatusChip status={item.status} label={statusLabel} />
      </td>
      <td style={{ padding: '8px 10px', fontSize: '11px', color: '#9ca3af', maxWidth: '220px' }}>
        {item.errors.length > 0 ? item.errors.join(' ') : ''}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Comparison row
// ---------------------------------------------------------------------------

function ComparisonRow({ item }: { item: FeeComparisonItem }) {
  return (
    <tr>
      <td style={{ padding: '6px 10px', fontSize: '12px', color: '#c084fc' }}>{item.label}</td>
      <td
        style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: '12px', color: '#34d399' }}
      >
        {item.feerate_sat_vb != null ? `${item.feerate_sat_vb.toFixed(2)} sat/vB` : '—'}
      </td>
      <td
        style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af' }}
      >
        {item.feerate_btc_kvb != null ? item.feerate_btc_kvb.toFixed(8) : '—'}
      </td>
      <td style={{ padding: '6px 10px', fontSize: '11px', color: '#6b7280' }}>{item.note ?? ''}</td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
}

const TH_STYLE: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #374151',
}

export function FeeEstimationPlayground() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'CONSERVATIVE' | 'ECONOMICAL'>('CONSERVATIVE')
  const [data, setData] = useState<FeeEstimateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [withComparison, setWithComparison] = useState(false)

  const fetchEstimates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = withComparison ? await api.feesCompare(mode) : await api.feesEstimate(mode)
      setData(result)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [mode, withComparison])

  const maxSatVb = data
    ? Math.max(
        ...data.estimates.map((e) => e.feerate_sat_vb ?? 0),
        ...data.compared_fee_rates.map((c) => c.feerate_sat_vb ?? 0)
      )
    : 0

  const cardStyle: React.CSSProperties = {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '12px',
  }

  return (
    <div>
      {/* Header card */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: '#f9fafb' }}>
          <Term term="estimatesmartfee">{t.fees.title}</Term>
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>{t.fees.subtitle}</p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af', marginRight: '6px' }}>
              {t.fees.mode}:
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'CONSERVATIVE' | 'ECONOMICAL')}
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#e2e8f0',
                padding: '4px 8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              <option value="CONSERVATIVE">{t.fees.conservative} (CONSERVATIVE)</option>
              <option value="ECONOMICAL">{t.fees.economical} (ECONOMICAL)</option>
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={withComparison}
              onChange={(e) => setWithComparison(e.target.checked)}
            />
            {t.fees.compareWithRealFees}
          </label>

          <button
            onClick={() => {
              void fetchEstimates()
            }}
            disabled={loading}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              border: '1px solid #3b82f6',
              background: loading ? '#1f2937' : '#1d4ed8',
              color: '#fff',
              fontSize: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {loading ? t.fees.runningEstimation : t.fees.refresh}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              background: '#450a0a',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#f87171',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Regtest warning */}
      {data?.network === 'regtest' && (
        <div
          style={{
            background: '#1c1400',
            border: '1px solid #78350f',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#fbbf24',
          }}
        >
          ⚠ {t.fees.regtestWarning}
        </div>
      )}

      {/* General warnings */}
      {data?.warnings &&
        data.warnings
          .filter((w) => w !== data.warnings[0] || data.network !== 'regtest')
          .map(
            (w, i) =>
              data.network !== 'regtest' && (
                <div
                  key={i}
                  style={{
                    background: '#1c1400',
                    border: '1px solid #78350f',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: '#fbbf24',
                  }}
                >
                  ⚠ {w}
                </div>
              )
          )}

      {/* Estimates table */}
      {data && (
        <div style={cardStyle}>
          <div style={sectionTitle}>
            <Term term="estimatesmartfee">estimatesmartfee</Term> — {data.estimate_mode}
          </div>

          {data.estimates.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>{t.fees.noFeerates}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={TABLE_STYLE}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>
                      <Term term="confirmation target">{t.fees.targetBlocks}</Term>
                    </th>
                    <th style={TH_STYLE}>
                      <Term term="BTC/kvB">{t.fees.feerateBtcKvb}</Term>
                    </th>
                    <th style={TH_STYLE}>
                      <Term term="sat/vB">{t.fees.feerateSatVb}</Term>
                    </th>
                    <th style={TH_STYLE}>{t.fees.status}</th>
                    <th style={TH_STYLE}>{t.fees.errors}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.estimates.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                      <EstimateRow item={item} t={t} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              marginTop: '10px',
              fontSize: '11px',
              color: '#4b5563',
              fontFamily: 'monospace',
            }}
          >
            {t.fees.conversionNote}
          </p>
        </div>
      )}

      {/* Visual bars */}
      {data && data.estimates.some((e) => e.feerate_sat_vb != null) && (
        <div style={cardStyle}>
          <div style={sectionTitle}>
            {t.fees.feerateSatVb} — {data.estimate_mode}
          </div>
          {data.estimates.map((item, i) => (
            <FeeBar
              key={i}
              value={item.feerate_sat_vb}
              max={maxSatVb}
              label={`${item.target_blocks} ${t.fees.targetBlocks}`}
              color={item.feerate_sat_vb != null ? '#3b82f6' : '#374151'}
            />
          ))}
          {withComparison &&
            data.compared_fee_rates.map((item, i) => (
              <FeeBar
                key={`cmp-${i}`}
                value={item.feerate_sat_vb}
                max={maxSatVb}
                label={item.label}
                color="#c084fc"
              />
            ))}
        </div>
      )}

      {/* Comparison table */}
      {data && withComparison && (
        <div style={cardStyle}>
          <div style={sectionTitle}>{t.fees.compareWithRealFees}</div>

          {!data.comparison_available ? (
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              {data.comparison_note ?? t.fees.noHistoryAvailable}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={TABLE_STYLE}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>{t.fees.comparisonSource}</th>
                    <th style={TH_STYLE}>
                      <Term term="sat/vB">{t.fees.feerateSatVb}</Term>
                    </th>
                    <th style={TH_STYLE}>
                      <Term term="BTC/kvB">{t.fees.feerateBtcKvb}</Term>
                    </th>
                    <th style={TH_STYLE}>{t.fees.errors}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compared_fee_rates.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                      <ComparisonRow item={item} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Unavailable features */}
      {data && data.unavailable_features.length > 0 && (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e3a5f',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#60a5fa',
          }}
        >
          <strong>ℹ Unavailable:</strong> {data.unavailable_features.join(' · ')}
        </div>
      )}

      {/* Learn more */}
      <LearnMore title={t.fees.learnMoreTitle}>
        <p style={{ margin: 0 }}>{t.fees.learnMoreBody}</p>
      </LearnMore>

      {/* Metadata footer */}
      {data && (
        <div
          style={{
            padding: '10px',
            background: '#0a0a0a',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#4b5563',
            fontFamily: 'monospace',
          }}
        >
          {data.bitcoin_core_version && <span>node: {data.bitcoin_core_version} · </span>}
          <span>network: {data.network ?? 'unknown'} · </span>
          <span>generated: {data.generated_at}</span>
        </div>
      )}
    </div>
  )
}
