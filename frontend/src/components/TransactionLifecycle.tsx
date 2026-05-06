import type { MempoolData, BlockData, TxData } from '../types/api'

interface Stage {
  id: string
  label: string
  sub: string
  active: boolean
}

interface TransactionLifecycleProps {
  rpcOk: boolean
  zmqConnected: boolean
  mempool: MempoolData | null
  latestBlock: BlockData | null
  latestTx: TxData | null
}

export function TransactionLifecycle({
  rpcOk,
  zmqConnected,
  mempool,
  latestBlock,
  latestTx,
}: TransactionLifecycleProps) {
  const hasMempoolTx = (mempool?.size ?? 0) > 0
  const hasBlock = latestBlock !== null
  const hasConfirmed = hasBlock && latestTx !== null

  const stages: Stage[] = [
    { id: 'created', label: 'Created', sub: 'tx built', active: rpcOk },
    { id: 'broadcast', label: 'Broadcast', sub: 'sent to node', active: rpcOk },
    { id: 'mempool', label: 'Mempool', sub: `${mempool?.size ?? 0} pending`, active: hasMempoolTx },
    { id: 'zmq', label: 'ZMQ rawtx', sub: 'event captured', active: zmqConnected },
    { id: 'mined', label: 'Block Mined', sub: `height ${latestBlock?.height ?? '—'}`, active: hasBlock },
    { id: 'confirmed', label: 'Confirmed', sub: 'on-chain', active: hasConfirmed },
  ]

  return (
    <div className="panel lifecycle-panel">
      <div className="panel-header">
        <span className="panel-title">Transaction Lifecycle</span>
        <span className="live-indicator">
          <span className="live-dot" />
          live
        </span>
      </div>
      <div className="lifecycle-body">
        {stages.map((stage, i) => (
          <div key={stage.id} className="lifecycle-step-wrap">
            <div className={`lifecycle-step ${stage.active ? 'lifecycle-step--active' : ''}`}>
              <div className="lifecycle-dot" />
              <div className="lifecycle-label">{stage.label}</div>
              <div className="lifecycle-sub">{stage.sub}</div>
            </div>
            {i < stages.length - 1 && (
              <div className={`lifecycle-connector ${stage.active ? 'lifecycle-connector--active' : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
