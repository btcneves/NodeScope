import type { MempoolData, BlockData, TxData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

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
  const { t } = useI18n()
  const hasMempoolTx = (mempool?.size ?? 0) > 0
  const hasBlock = latestBlock !== null
  const hasConfirmed = hasBlock && latestTx !== null

  const stages: Stage[] = [
    { id: 'created', label: t.dashboard.lifecycleCreated, sub: t.dashboard.lifecycleTxBuilt, active: rpcOk },
    { id: 'broadcast', label: t.dashboard.lifecycleBroadcast, sub: t.dashboard.lifecycleSentToNode, active: rpcOk },
    { id: 'mempool', label: 'Mempool', sub: `${mempool?.size ?? 0} ${t.dashboard.lifecyclePending}`, active: hasMempoolTx },
    { id: 'zmq-rawtx', label: 'ZMQ rawtx', sub: t.dashboard.lifecycleEventCaptured, active: zmqConnected },
    { id: 'mined', label: t.dashboard.lifecycleBlockMined, sub: `${t.generic.height} ${latestBlock?.height ?? '—'}`, active: hasBlock },
    { id: 'zmq-rawblock', label: 'ZMQ rawblock', sub: t.dashboard.lifecycleBlockEventCaptured, active: hasBlock && zmqConnected },
    { id: 'confirmed', label: t.dashboard.lifecycleConfirmed, sub: t.dashboard.lifecycleOnChain, active: hasConfirmed },
  ]

  return (
    <div className="panel lifecycle-panel">
      <div className="panel-header">
        <span className="panel-title"><Term term="TXID">{t.dashboard.txLifecycle}</Term></span>
        <span className="live-indicator">
          <span className="live-dot" />
          {t.dashboard.live}
        </span>
      </div>
      <div className="lifecycle-body">
        {stages.map((stage, i) => (
          <div key={stage.id} className="lifecycle-step-wrap">
            <div className={`lifecycle-step ${stage.active ? 'lifecycle-step--active' : ''}`}>
              <div className="lifecycle-dot" />
              <div className="lifecycle-label">
                {stage.id === 'mempool' ? <Term term="Mempool">{stage.label}</Term>
                  : stage.id === 'zmq-rawtx' ? <Term term="rawtx">{stage.label}</Term>
                  : stage.id === 'zmq-rawblock' ? <Term term="rawblock">{stage.label}</Term>
                  : stage.id === 'mined' ? <Term term="Block hash">{stage.label}</Term>
                  : stage.label}
              </div>
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
