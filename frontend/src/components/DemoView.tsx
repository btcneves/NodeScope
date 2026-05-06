import type {
  HealthData,
  MempoolData,
  SummaryData,
  BlockData,
  TxData,
  IntelligenceData,
} from '../types/api'
import { TransactionLifecycle } from './TransactionLifecycle'
import { MempoolPanel } from './MempoolPanel'
import { BlocksPanel } from './BlocksPanel'
import { TxPanel } from './TxPanel'
import { ReplayEnginePanel } from './ReplayEnginePanel'
import { RpcZmqSyncPanel } from './RpcZmqSyncPanel'

interface Props {
  health: HealthData | null
  mempool: MempoolData | null
  summary: SummaryData | null
  latestBlock: BlockData | null
  latestTx: TxData | null
  intelligence: IntelligenceData | null
  sseConnected: boolean
  onClose: () => void
}

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok: boolean
}) {
  return (
    <div className="pres-status-row">
      <span className={`pres-status-dot ${ok ? 'pres-dot-ok' : 'pres-dot-err'}`} />
      <span className="pres-status-label">{label}</span>
      <span className="pres-status-value">{value}</span>
    </div>
  )
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    label === 'healthy' ? 'var(--accent-bright)' : label === 'degraded' ? 'var(--warn)' : 'var(--error)'
  return (
    <div className="pres-score-ring" style={{ borderColor: color }}>
      <span className="pres-score-value" style={{ color }}>
        {score}
      </span>
      <span className="pres-score-sub" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

export function DemoView({
  health,
  mempool,
  summary,
  latestBlock,
  latestTx,
  intelligence,
  sseConnected,
  onClose,
}: Props) {
  const rpcOk = health?.rpc_ok ?? false
  const healthScore = intelligence?.node_health_score ?? 0
  const healthLabel = intelligence?.node_health_label ?? 'critical'

  return (
    <div className="pres-overlay">
      <button className="pres-close" onClick={onClose} aria-label="Exit Demo View">
        ✕ Exit
      </button>

      <div className="pres-content">
        <div className="pres-hero">
          <h1 className="pres-title">NodeScope</h1>
          <p className="pres-tagline">
            RPC gives the snapshot. ZMQ gives real time. NodeScope gives interpretation.
          </p>
        </div>

        <div className="pres-top-row">
          <div className="pres-statuses">
            <StatusRow
              label="RPC"
              value={intelligence?.rpc_status ?? (rpcOk ? 'online' : 'offline')}
              ok={rpcOk}
            />
            <StatusRow
              label="ZMQ"
              value={intelligence?.zmq_status ?? (sseConnected ? 'subscribed' : 'no_events')}
              ok={intelligence?.zmq_status === 'subscribed' || sseConnected}
            />
            <StatusRow
              label="SSE"
              value={sseConnected ? 'connected' : 'reconnecting'}
              ok={sseConnected}
            />
            {intelligence && (
              <StatusRow
                label="Mempool"
                value={`pressure: ${intelligence.mempool_pressure}`}
                ok={intelligence.mempool_pressure !== 'high'}
              />
            )}
          </div>

          <ScoreRing score={healthScore} label={healthLabel} />
        </div>

        <TransactionLifecycle
          rpcOk={rpcOk}
          zmqConnected={sseConnected}
          mempool={mempool}
          latestBlock={latestBlock}
          latestTx={latestTx}
        />

        <div className="grid-3">
          <MempoolPanel mempool={mempool} />
          <BlocksPanel block={latestBlock} />
          <TxPanel tx={latestTx} />
        </div>

        <div className="grid-2">
          <ReplayEnginePanel summary={summary} />
          <RpcZmqSyncPanel health={health} summary={summary} latestBlock={latestBlock} />
        </div>
      </div>
    </div>
  )
}
