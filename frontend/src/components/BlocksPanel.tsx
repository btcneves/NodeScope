import { useState } from 'react'
import type { BlockData } from '../types/api'
import { copyText } from '../utils/clipboard'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  block: BlockData | null
}

function trunc(s: string | null | undefined, n = 16): string {
  return s ? s.slice(0, n) + '...' : '—'
}

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function BlocksPanel({ block }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copyHash() {
    if (!block?.hash) return
    if (await copyText(block.hash)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1000)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">
          <Term term="Block hash">{t.dashboard.latestBlock}</Term>
        </span>
      </div>
      <div className="panel-body">
        {!block ? (
          <div className="empty-state">{t.dashboard.noBlocks}</div>
        ) : (
          <>
            <div className="event-row">
              <span className="kpi-label">
                <Term term="Block height">{t.generic.height}</Term>
              </span>
              <span className="kpi-value" style={{ fontSize: '20px' }}>
                {block.height ?? '—'}
              </span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                <Term term="Block hash">{t.generic.hash}</Term>
              </span>
              <span
                className="event-hash mono copyable-text"
                title={t.dashboard.clickCopyHash}
                onClick={copyHash}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void copyHash()
                  }
                }}
              >
                {trunc(block.hash, 20)}
              </span>
              {copied && <span className="copy-feedback">{t.dashboard.copied}</span>}
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>
                {t.generic.time}
              </span>
              <span className="event-time">{block.ts ? relTime(block.ts) : '—'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
