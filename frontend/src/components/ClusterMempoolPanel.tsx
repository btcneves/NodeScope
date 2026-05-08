import { useCallback, useState, useEffect } from 'react'
import { api } from '../api/client'
import type { ClusterCompatibilityData, MempoolClustersData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { LearnMore } from './ui/LearnMore'

export function ClusterMempoolPanel() {
  const { t } = useI18n()
  const [data, setData] = useState<ClusterCompatibilityData | null>(null)
  const [clusters, setClusters] = useState<MempoolClustersData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [compat, visual] = await Promise.all([
        api.clusterCompatibility(),
        api.mempoolClusters(),
      ])
      setData(compat)
      setClusters(visual)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.generic.error)
    }
    setLoading(false)
  }, [t.generic.error])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        color: '#e5e7eb',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Term term="Cluster mempool">{t.cluster.title}</Term>
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
            {t.cluster.subtitle}
          </div>
        </div>
        <button
          onClick={() => {
            void fetchData()
          }}
          disabled={loading}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'transparent',
            color: '#9ca3af',
            border: '1px solid #374151',
          }}
        >
          {loading ? '…' : t.cluster.refresh}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '10px' }}>
          {t.generic.error}: {error}
        </div>
      )}

      {data && (
        <>
          {data.bitcoin_core_version && (
            <div
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                fontSize: '10px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#9ca3af',
                marginBottom: '12px',
              }}
            >
              {data.bitcoin_core_version}
            </div>
          )}

          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              background: data.supported ? '#14532d20' : '#1f2937',
              border: `1px solid ${data.supported ? '#16a34a' : '#374151'}`,
              fontSize: '12px',
              color: data.supported ? '#4ade80' : '#9ca3af',
            }}
          >
            {data.supported ? `✓ ${t.cluster.supported}` : `— ${t.cluster.notSupported}`}
          </div>

          {clusters && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
                {clusters.cluster_count} clusters · {clusters.total_tx_count} tx
              </div>
              {!clusters.rpc_ok && (
                <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>
                  {clusters.error}
                </div>
              )}
              {clusters.rpc_ok && clusters.clusters.length === 0 && (
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                  {t.cluster.fallback}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {clusters.clusters.flatMap((cluster) =>
                  cluster.txs.map((tx) => {
                    const fee = tx.fee_rate_sat_vb
                    const bg = fee >= 20 ? '#14532d' : fee >= 5 ? '#78350f' : '#7f1d1d'
                    const size = Math.max(40, Math.min(160, tx.vsize / 2))
                    return (
                      <div
                        key={tx.txid}
                        title={`${tx.txid} · ${fee} sat/vB`}
                        style={{
                          width: size,
                          height: 38,
                          background: bg,
                          border: '1px solid #374151',
                          borderRadius: 4,
                          padding: 5,
                          overflow: 'hidden',
                          fontSize: 10,
                          color: '#e5e7eb',
                        }}
                      >
                        <div>{fee} sat/vB</div>
                        <div style={{ color: '#9ca3af' }}>{tx.txid.slice(0, 10)}…</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {data.supported && <div
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}
          >
            {data.rpcs.map((r) => (
              <div
                key={r.rpc}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 10px',
                  background: '#0f172a',
                  borderRadius: '5px',
                  border: '1px solid #1f2937',
                }}
              >
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '12px',
                    color: r.supported ? '#22c55e' : '#6b7280',
                  }}
                >
                  {r.supported ? '✓' : '✗'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#e5e7eb' }}>{r.rpc}</div>
                  {r.reason && (
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                      {r.reason}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: r.supported ? '#14532d' : '#1f2937',
                    color: r.supported ? '#4ade80' : '#6b7280',
                    border: `1px solid ${r.supported ? '#16a34a' : '#374151'}`,
                  }}
                >
                  {r.supported ? t.status.ok : t.status.unavailable}
                </span>
              </div>
            ))}
          </div>}

          <div
            style={{
              padding: '10px 12px',
              background: '#0f172a',
              borderRadius: '6px',
              border: '1px solid #1f2937',
              fontSize: '11px',
              color: '#9ca3af',
              lineHeight: '1.6',
            }}
          >
            {data.message}
            {data.note && <div style={{ marginTop: '6px', color: '#6b7280' }}>{data.note}</div>}
          </div>

          <LearnMore>{t.learn.cluster}</LearnMore>
        </>
      )}

      {loading && !data && (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{t.cluster.checking}</div>
      )}
    </div>
  )
}
