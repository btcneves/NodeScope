export type ActiveView = 'dashboard' | 'guided-demo' | 'inspector' | 'zmq-tape' | 'policy-arena' | 'reorg-lab'

interface Props {
  network: string
  apiOk: boolean
  rpcOk: boolean
  sseConnected: boolean
  onRefresh: () => void
  activeView: ActiveView
  onSetView: (v: ActiveView) => void
  onDemoView?: () => void
}

const NAV: { id: ActiveView; label: string }[] = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'guided-demo',  label: 'Guided Demo' },
  { id: 'inspector',    label: 'Tx Inspector' },
  { id: 'zmq-tape',     label: 'ZMQ Tape' },
  { id: 'policy-arena', label: 'Policy Arena' },
  { id: 'reorg-lab',    label: 'Reorg Lab' },
]

export function Header({ network, apiOk, rpcOk, sseConnected, onRefresh, activeView, onSetView, onDemoView }: Props) {
  const networkClass = ['mainnet', 'regtest', 'signet', 'testnet'].includes(network)
    ? `badge-${network}`
    : 'badge-regtest'

  return (
    <header className="header" style={{ flexWrap: 'wrap', gap: '8px' }}>
      <div className="header-brand">
        <span className="header-title">NodeScope</span>
        <span className={`badge ${networkClass}`}>{network}</span>
      </div>
      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
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
        <span className="status-dot">
          <span className={`dot ${apiOk ? 'dot-ok' : 'dot-error'}`} />
          API
        </span>
        <span className="status-dot">
          <span className={`dot ${rpcOk ? 'dot-ok' : 'dot-error'}`} />
          RPC
        </span>
        <span className="status-dot">
          <span className={`dot ${sseConnected ? 'dot-ok' : 'dot-loading'}`} />
          SSE
        </span>
        <button className="refresh-btn" onClick={onRefresh}>&#x21BB; Refresh</button>
        {onDemoView && (
          <button className="pres-btn" onClick={onDemoView}>Demo View</button>
        )}
      </div>
    </header>
  )
}
