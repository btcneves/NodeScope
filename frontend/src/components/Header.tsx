interface Props {
  network: string
  apiOk: boolean
  rpcOk: boolean
  sseConnected: boolean
  onRefresh: () => void
}

export function Header({ network, apiOk, rpcOk, sseConnected, onRefresh }: Props) {
  const networkClass = ['mainnet', 'regtest', 'signet', 'testnet'].includes(network)
    ? `badge-${network}`
    : 'badge-regtest'

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-title">NodeScope</span>
        <span className={`badge ${networkClass}`}>{network}</span>
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
      </div>
    </header>
  )
}
