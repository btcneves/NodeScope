import { useState } from 'react'
import type { TxData } from '../types/api'
import { copyText } from '../utils/clipboard'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

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
  const { t } = useI18n()
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
        <span className="panel-title">
          <Term term="TXID">{t.dashboard.latestTx}</Term>
        </span>
      </div>
      <div className="panel-body">
        {!tx ? (
          <div className="empty-state">{t.dashboard.noTransactions}</div>
        ) : (
          <>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                <Term term="TXID">TXID</Term>
              </span>
              <span
                className="event-hash mono copyable-text"
                title={t.dashboard.clickCopyTxid}
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
              {copied && <span className="copy-feedback">{t.dashboard.copied}</span>}
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                Kind
              </span>
              <span className={`badge badge-${kindBadgeClass(tx.kind)}`}>{tx.kind}</span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                <Term term="Input">{t.inspector.inputs}</Term>
              </span>
              <span>{tx.inputs}</span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                <Term term="Output">{t.inspector.outputs}</Term>
              </span>
              <span>{tx.outputs}</span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                <Term term="Output">{t.inspector.totalOutput}</Term>
              </span>
              <span className="mono">{tx.total_out.toFixed(8)} BTC</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
