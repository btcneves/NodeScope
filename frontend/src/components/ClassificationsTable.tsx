import { useState } from 'react'
import type { ClassificationItem } from '../types/api'
import { copyText } from '../utils/clipboard'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

interface Props {
  classifications: ClassificationItem[]
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (field: string) => void
}

function kindClass(kind: string): string {
  if (kind === 'coinbase_like') return 'coinbase'
  if (kind === 'simple_payment_like') return 'payment'
  if (kind === 'block_event') return 'rawblock'
  return 'unknown'
}

export function ClassificationsTable({
  classifications,
  sortBy = 'ts',
  sortDir = 'desc',
  onSort,
}: Props) {
  const { t } = useI18n()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const sortLabel = (field: string) => (sortBy === field ? (sortDir === 'asc' ? '▲' : '▼') : '–')

  async function copyValue(key: string, value: string | null | undefined) {
    if (await copyText(value)) {
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1000)
    }
  }

  return (
    <div className="panel" style={{ marginBottom: '24px' }}>
      <div className="panel-header">
        <span className="panel-title">
          <Term text={t.panelDesc.classifications}>{t.dashboard.classifications}</Term>
        </span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {classifications.length} {t.dashboard.items}
        </span>
      </div>
      <div className="panel-body">
        <div className="event-sortbar">
          {['ts', 'kind', 'confidence', 'inputs', 'outputs', 'total_out'].map((field) => (
            <button key={field} onClick={() => onSort?.(field)}>
              {field} {sortLabel(field)}
            </button>
          ))}
        </div>
        {classifications.length === 0 ? (
          <div className="empty-state">{t.dashboard.noClassifications}</div>
        ) : (
          classifications.slice(0, 20).map((c, i) => {
            const confidence = c.metadata?.confidence
            const reason = c.metadata?.reason as string | undefined
            const identifierValue = c.txid ?? c.hash
            const identifier = identifierValue?.slice(0, 16) ?? '—'
            const identifierTitle = c.txid
              ? t.dashboard.clickCopyTxid
              : c.hash
                ? t.dashboard.clickCopyHash
                : undefined
            const identifierKey = `identifier-${i}`
            const reasonKey = `reason-${i}`
            return (
              <div key={i} className="event-row">
                <span className="event-time">{new Date(c.ts).toLocaleTimeString()}</span>
                <span className={`badge badge-${kindClass(c.kind)}`}>{c.kind}</span>
                {confidence !== undefined && (
                  <span
                    className="tag"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}
                  >
                    {String(confidence)}
                  </span>
                )}
                <span
                  className={`event-hash mono ${identifierValue ? 'copyable-text' : ''}`}
                  title={identifierTitle}
                  onClick={() => void copyValue(identifierKey, identifierValue)}
                  role={identifierValue ? 'button' : undefined}
                  tabIndex={identifierValue ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      void copyValue(identifierKey, identifierValue)
                    }
                  }}
                >
                  {identifier}&hellip;
                </span>
                {copiedKey === identifierKey && (
                  <span className="copy-feedback">{t.dashboard.copied}</span>
                )}
                <span
                  className={
                    reason ? 'classification-reason copyable-text' : 'classification-reason'
                  }
                  title={reason ? `${t.dashboard.copyReason}: ${reason}` : undefined}
                  onClick={() => void copyValue(reasonKey, reason)}
                  role={reason ? 'button' : undefined}
                  tabIndex={reason ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      void copyValue(reasonKey, reason)
                    }
                  }}
                >
                  {reason ?? ''}
                </span>
                {copiedKey === reasonKey && (
                  <span className="copy-feedback">{t.dashboard.copied}</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
