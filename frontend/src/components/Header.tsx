import { useI18n } from '../i18n'
import type { Lang } from '../i18n'

export type ActiveView =
  | 'dashboard'
  | 'charts'
  | 'guided-demo'
  | 'inspector'
  | 'zmq-tape'
  | 'policy-arena'
  | 'reorg-lab'
  | 'history'
  | 'fee-estimation'
  | 'cluster'

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

export function Header({
  network,
  apiOk,
  rpcOk,
  sseConnected,
  onRefresh,
  activeView,
  onSetView,
  onNewSession,
}: Props) {
  const { t, lang, setLang } = useI18n()

  const NAV: { id: ActiveView; label: string }[] = [
    { id: 'dashboard', label: t.nav.dashboard },
    { id: 'charts', label: t.charts.navLabel },
    { id: 'guided-demo', label: t.nav.guidedDemo },
    { id: 'inspector', label: t.nav.txInspector },
    { id: 'zmq-tape', label: t.nav.zmqTape },
    { id: 'policy-arena', label: t.nav.policyArena },
    { id: 'reorg-lab', label: t.nav.reorgLab },
    { id: 'history', label: t.history.title },
    { id: 'fee-estimation', label: t.fees.navLabel },
    { id: 'cluster', label: t.nav.clusterMempool },
  ]

  const networkClass = ['mainnet', 'regtest', 'signet', 'testnet'].includes(network)
    ? `badge-${network}`
    : 'badge-regtest'

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-mark" aria-hidden="true">
          &lt;n&gt;
        </span>
        <span className="header-title">{t.header.title}</span>
        <span className={`badge ${networkClass}`}>{network}</span>
      </div>

      <div className="header-nav">
        {NAV.map(({ id, label }) => (
          <button
            key={id}
            className={activeView === id ? 'is-active' : undefined}
            onClick={() => onSetView(id)}
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
              className={lang === value ? 'is-active' : undefined}
              title={value}
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
        <button className="refresh-btn" onClick={onRefresh}>
          {t.actions.refresh}
        </button>
        {onNewSession && (
          <button onClick={onNewSession} className="session-btn">
            {t.header.newSession}
          </button>
        )}
      </div>
    </header>
  )
}
