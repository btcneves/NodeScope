import type { TxData } from '../types/api'

interface Props {
  tx: TxData | null
}

function trunc(s: string, n = 20): string {
  return s.slice(0, n) + '...'
}

function kindBadgeClass(kind: string): string {
  return kind.replace('_like', '').replace('_event', '')
}

export function TxPanel({ tx }: Props) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Latest Transaction</span>
      </div>
      <div className="panel-body">
        {!tx ? (
          <div className="empty-state">No transactions yet</div>
        ) : (
          <>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>TXID</span>
              <span className="event-hash mono" title={tx.txid}>
                {trunc(tx.txid)}
              </span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Kind</span>
              <span className={`badge badge-${kindBadgeClass(tx.kind)}`}>{tx.kind}</span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Inputs</span>
              <span>{tx.inputs}</span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Outputs</span>
              <span>{tx.outputs}</span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Total Out</span>
              <span className="mono">{tx.total_out.toFixed(8)} BTC</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
