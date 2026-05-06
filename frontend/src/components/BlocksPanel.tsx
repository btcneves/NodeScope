import { useState } from 'react'
import type { BlockData } from '../types/api'
import { copyText } from '../utils/clipboard'

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
        <span className="panel-title">Latest Block</span>
      </div>
      <div className="panel-body">
        {!block ? (
          <div className="empty-state">No blocks yet</div>
        ) : (
          <>
            <div className="event-row">
              <span className="kpi-label">Height</span>
              <span className="kpi-value" style={{ fontSize: '20px' }}>
                {block.height ?? '—'}
              </span>
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Hash</span>
              <span
                className="event-hash mono copyable-text"
                title="Clique para copiar hash completo"
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
              {copied && <span className="copy-feedback">copied</span>}
            </div>
            <div className="event-row">
              <span className="kpi-label" style={{ minWidth: '60px' }}>Time</span>
              <span className="event-time">
                {block.ts ? relTime(block.ts) : '—'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
