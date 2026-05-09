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
  const hasNativeClusterRpc = data?.supported === true

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
    <div className="cluster-panel panel">
      <div className="cluster-header">
        <div>
          <div className="cluster-title">
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
          className="cluster-refresh-btn"
        >
          {loading ? '…' : t.cluster.refresh}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '10px' }}>
          {t.generic.error}: {error}
        </div>
      )}

      {clusters && (
        <>
          {data?.bitcoin_core_version && (
            <div
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                fontSize: '10px',
                background: hasNativeClusterRpc ? '#052e16' : '#1f2937',
                border: `1px solid ${hasNativeClusterRpc ? '#166534' : '#374151'}`,
                borderRadius: '4px',
                color: hasNativeClusterRpc ? '#86efac' : '#d1d5db',
                marginBottom: data.supported ? '12px' : '8px',
              }}
            >
              {t.cluster.connectedNode}: {data.bitcoin_core_version}
            </div>
          )}

          {data && !data.supported && (
            <div
              style={{
                border: '1px solid #78350f',
                background: '#451a03',
                color: '#fbbf24',
                borderRadius: '6px',
                fontSize: '11px',
                lineHeight: 1.45,
                padding: '8px 10px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                {t.cluster.notSupported}
              </div>
              <div>{data.note ?? data.message}</div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
              {clusters.cluster_count}{' '}
              {hasNativeClusterRpc ? t.cluster.nativeClusters : t.cluster.fallbackGroups} ·{' '}
              {clusters.total_tx_count} tx
            </div>
            {!clusters.rpc_ok && clusters.error && (
              <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>
                {clusters.error}
              </div>
            )}
            {(clusters.clusters.length === 0 || !hasNativeClusterRpc) && (
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                {t.cluster.fallback}
              </div>
            )}
            <div className="cluster-map">
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
                        background: bg,
                      }}
                      className="cluster-tx-node"
                    >
                      <div>{fee} sat/vB</div>
                      <div>{tx.txid.slice(0, 10)}…</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <LearnMore>{t.learn.cluster}</LearnMore>
        </>
      )}

      {loading && !clusters && (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{t.cluster.checking}</div>
      )}
    </div>
  )
}
