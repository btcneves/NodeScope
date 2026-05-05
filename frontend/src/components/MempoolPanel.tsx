import type { MempoolData } from '../types/api'

interface Props {
  mempool: MempoolData | null
}

export function MempoolPanel({ mempool }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Mempool</span>
        {mempool?.rpc_ok && (
          <span className="live-indicator">
            <span className="live-dot" />
            live
          </span>
        )}
      </div>
      <div className="panel-body">
        {!mempool || !mempool.rpc_ok ? (
          <div className="empty-state">
            {mempool ? 'Bitcoin Core offline' : 'Loading...'}
          </div>
        ) : (
          <div className="mempool-grid">
            <div className="mempool-item">
              <div className="mempool-label">Transactions</div>
              <div className="mempool-value">{mempool.size}</div>
            </div>
            <div className="mempool-item">
              <div className="mempool-label">Size</div>
              <div className="mempool-value">{(mempool.bytes / 1024).toFixed(1)} KB</div>
            </div>
            <div className="mempool-item">
              <div className="mempool-label">Usage</div>
              <div className="mempool-value">{(mempool.usage / 1024).toFixed(0)} KB</div>
            </div>
            <div className="mempool-item">
              <div className="mempool-label">Min Fee</div>
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
