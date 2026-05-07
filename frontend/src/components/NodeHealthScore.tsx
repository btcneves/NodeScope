import type { HealthData, MempoolData, BlockData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { computeHealthScore } from '../utils/healthScore'

interface NodeHealthScoreProps {
  health: HealthData | null
  mempool: MempoolData | null
  latestBlock: BlockData | null
  sseConnected: boolean
}

export function NodeHealthScore({ health, mempool, latestBlock, sseConnected }: NodeHealthScoreProps) {
  const { t } = useI18n()
  const { score, label } = computeHealthScore(health, mempool, latestBlock, sseConnected)

  return (
    <div className="panel health-score-panel">
      <div className="panel-header">
        <span className="panel-title">{t.dashboard.nodeHealthScore}</span>
        <span className={`badge badge-health-${label}`}>{label}</span>
      </div>
      <div className="health-score-body">
        <div className="health-score-number" data-label={label}>{score}</div>
        <div className="health-score-bar-wrap">
          <div
            className="health-score-bar"
            style={{ width: `${score}%` }}
            data-label={label}
          />
        </div>
        <div className="health-score-breakdown">
          <span className={health?.rpc_ok ? 'hs-item ok' : 'hs-item fail'}><Term term="RPC">RPC</Term> +{health?.rpc_ok ? 40 : 0}</span>
          <span className={sseConnected ? 'hs-item ok' : 'hs-item fail'}><Term term="ZMQ">ZMQ</Term> +{sseConnected ? 30 : 0}</span>
          <span className={mempool?.rpc_ok ? 'hs-item ok' : 'hs-item fail'}><Term term="Mempool">Mempool</Term> +{mempool?.rpc_ok ? 20 : 0}</span>
          <span className={score >= 90 ? 'hs-item ok' : 'hs-item fail'}><Term term="Block hash">{t.dashboard.kpiBlocks}</Term> +{score >= 90 ? 10 : 0}</span>
        </div>
      </div>
    </div>
  )
}
