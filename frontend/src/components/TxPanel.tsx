import { useState } from 'react'
import type { TxData } from '../types/api'
import { copyText } from '../utils/clipboard'

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
  const [copied, setCopied] = useState(false)

  async function copyTxid() {
    if (!tx?.txid) return
    if (await copyText(tx.txid)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1000)
    }
  }

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
              <span
                className="event-hash mono copyable-text"
                title="Clique para copiar TXID completo"
                onClick={copyTxid}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void copyTxid()
                  }
                }}
              >
                {trunc(tx.txid)}
              </span>
              {copied && <span className="copy-feedback">copied</span>}
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
