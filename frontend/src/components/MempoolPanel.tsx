import type { MempoolData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  mempool: MempoolData | null
}

export function MempoolPanel({ mempool }: Props) {
  const { t } = useI18n()
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">
          <Term term="Mempool">{t.dashboard.mempool}</Term>
        </span>
        {mempool?.rpc_ok && (
          <span className="live-indicator">
            <span className="live-dot" />
            {t.dashboard.live}
          </span>
        )}
      </div>
      <div className="panel-body">
        {!mempool || !mempool.rpc_ok ? (
          <div className="empty-state">{mempool ? t.dashboard.rpcOffline : t.status.loading}</div>
        ) : (
          <div className="mempool-grid">
            <div className="mempool-item">
              <div className="mempool-label">{t.dashboard.transactions}</div>
              <div className="mempool-value">{mempool.size}</div>
            </div>
            <div className="mempool-item">
              <div className="mempool-label">
                <Term term="vbytes">{t.generic.size}</Term>
              </div>
              <div className="mempool-value">{(mempool.bytes / 1024).toFixed(1)} KB</div>
            </div>
            <div className="mempool-item">
              <div className="mempool-label">{t.dashboard.usage}</div>
              <div className="mempool-value">{(mempool.usage / 1024).toFixed(0)} KB</div>
            </div>
            <div className="mempool-item">
              <div className="mempool-label">
                <Term term="Fee rate">{t.dashboard.minFee}</Term>
              </div>
              <div className="mempool-value mono" style={{ fontSize: '14px' }}>
                {mempool.mempoolminfee.toFixed(8)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
