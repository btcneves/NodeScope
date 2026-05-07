import { useI18n } from '../i18n'
import type { Lang } from '../i18n'

export type ActiveView = 'dashboard' | 'guided-demo' | 'inspector' | 'zmq-tape' | 'policy-arena' | 'reorg-lab' | 'history' | 'fee-estimation'

interface Props {
  network: string
  apiOk: boolean
  rpcOk: boolean
  sseConnected: boolean
  onRefresh: () => void
  activeView: ActiveView
  onSetView: (v: ActiveView) => void
  onNewSession?: () => void
}

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en-US', label: 'EN' },
  { value: 'pt-BR', label: 'PT' },
]

export function Header({ network, apiOk, rpcOk, sseConnected, onRefresh, activeView, onSetView, onNewSession }: Props) {
  const { t, lang, setLang } = useI18n()

  const NAV: { id: ActiveView; label: string }[] = [
    { id: 'dashboard',    label: t.nav.dashboard },
    { id: 'guided-demo',  label: t.nav.guidedDemo },
    { id: 'inspector',    label: t.nav.txInspector },
    { id: 'zmq-tape',     label: t.nav.zmqTape },
    { id: 'policy-arena', label: t.nav.policyArena },
    { id: 'reorg-lab',    label: t.nav.reorgLab },
    { id: 'history',        label: t.history.title },
    { id: 'fee-estimation', label: t.fees.navLabel },
  ]

  const networkClass = ['mainnet', 'regtest', 'signet', 'testnet'].includes(network)
    ? `badge-${network}`
    : 'badge-regtest'

  return (
    <header className="header" style={{ flexWrap: 'wrap', gap: '8px' }}>
      <div className="header-brand">
        <span className="header-title">{t.header.title}</span>
        <span className={`badge ${networkClass}`}>{network}</span>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {NAV.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onSetView(id)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              background: activeView === id ? '#1d4ed8' : 'transparent',
              color: activeView === id ? '#fff' : '#9ca3af',
              border: activeView === id ? '1px solid #3b82f6' : '1px solid #374151',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="status-dots">
        {/* Language selector */}
        <span style={{ display: 'flex', gap: '2px', marginRight: '4px' }}>
          {LANG_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLang(value)}
              title={value}
              style={{
                padding: '2px 7px',
                fontSize: '11px',
                background: lang === value ? '#1d4ed8' : 'transparent',
                color: lang === value ? '#fff' : '#6b7280',
                border: lang === value ? '1px solid #3b82f6' : '1px solid #374151',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: lang === value ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </span>

        <span className="status-dot">
          <span className={`dot ${apiOk ? 'dot-ok' : 'dot-error'}`} />
          {t.header.apiStatus}
        </span>
        <span className="status-dot">
          <span className={`dot ${rpcOk ? 'dot-ok' : 'dot-error'}`} />
          {t.header.rpcStatus}
        </span>
        <span className="status-dot">
          <span className={`dot ${sseConnected ? 'dot-ok' : 'dot-loading'}`} />
          {t.header.sseStatus}
        </span>
        <button className="refresh-btn" onClick={onRefresh}>{t.actions.refresh}</button>
        {onNewSession && (
          <button
            onClick={onNewSession}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #374151',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {t.header.newSession}
          </button>
        )}
      </div>
    </header>
  )
}
