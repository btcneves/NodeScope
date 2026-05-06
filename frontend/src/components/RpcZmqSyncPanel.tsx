import type { HealthData, SummaryData, BlockData } from '../types/api'

interface Props {
  health: HealthData | null
  summary: SummaryData | null
  latestBlock: BlockData | null
}

function SyncRow({
  label,
  rpc,
  zmq,
}: {
  label: string
  rpc: string | number
  zmq: string | number
}) {
  return (
    <div className="sync-row">
      <span className="sync-label">{label}</span>
      <span className="sync-rpc">{rpc}</span>
      <span className="sync-zmq">{zmq}</span>
    </div>
  )
}

export function RpcZmqSyncPanel({ health, summary, latestBlock }: Props) {
  const rpcHeight = health?.blocks ?? '—'
  const zmqHeight = latestBlock?.height ?? '—'
  const rpcStatus = health?.rpc_ok ? 'online' : 'offline'
  const zmqTxs = summary?.rawtx_count ?? '—'
  const zmqBlocks = summary?.rawblock_count ?? '—'

  const inSync =
    typeof rpcHeight === 'number' &&
    typeof zmqHeight === 'number' &&
    rpcHeight === zmqHeight

  const syncLabel = typeof rpcHeight === 'number' && typeof zmqHeight === 'number'
    ? inSync
      ? 'in sync'
      : `${Math.abs(rpcHeight - zmqHeight)} block(s) behind`
    : '—'

  return (
    <div className="panel">
      <div className="panel-title">
        RPC / ZMQ Alignment
        <span className={`sync-badge ${inSync ? 'sync-ok' : 'sync-warn'}`}>
          {syncLabel}
        </span>
      </div>
      <div className="sync-header">
        <span className="sync-label" />
        <span className="sync-rpc">RPC</span>
        <span className="sync-zmq">ZMQ</span>
      </div>
      <SyncRow label="Status" rpc={rpcStatus} zmq="subscribed" />
      <SyncRow label="Block height" rpc={rpcHeight} zmq={zmqHeight} />
      <SyncRow label="TX events" rpc="snapshot" zmq={zmqTxs} />
      <SyncRow label="Block events" rpc="snapshot" zmq={zmqBlocks} />
    </div>
  )
}
