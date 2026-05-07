import type { ReactNode } from 'react'
import type { HealthData, SummaryData, BlockData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'

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
  label: ReactNode
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
  const { t } = useI18n()
  const rpcHeight = health?.blocks ?? '—'
  const zmqHeight = latestBlock?.height ?? '—'
  const rpcStatus = health?.rpc_ok ? t.status.connected : t.status.disconnected
  const zmqTxs = summary?.rawtx_count ?? '—'
  const zmqBlocks = summary?.rawblock_count ?? '—'

  const inSync =
    typeof rpcHeight === 'number' &&
    typeof zmqHeight === 'number' &&
    rpcHeight === zmqHeight

  const syncLabel = typeof rpcHeight === 'number' && typeof zmqHeight === 'number'
    ? inSync
      ? t.dashboard.inSync
      : `${Math.abs(rpcHeight - zmqHeight)} ${t.dashboard.blocksBehind}`
    : '—'

  return (
    <div className="panel">
      <div className="panel-title">
        <Term text={t.panelDesc.rpcZmqSync}>{t.dashboard.rpcZmqSync}</Term>
        <span className={`sync-badge ${inSync ? 'sync-ok' : 'sync-warn'}`}>
          {syncLabel}
        </span>
      </div>
      <div className="sync-header">
        <span className="sync-label" />
        <span className="sync-rpc">RPC</span>
        <span className="sync-zmq">ZMQ</span>
      </div>
      <SyncRow label={t.dashboard.status} rpc={rpcStatus} zmq={t.dashboard.subscribed} />
      <SyncRow label={<Term term="Block height">{t.proof.blockHeight}</Term>} rpc={rpcHeight} zmq={zmqHeight} />
      <SyncRow label={<Term term="rawtx">TX events</Term>} rpc={t.dashboard.snapshot} zmq={zmqTxs} />
      <SyncRow label={<Term term="rawblock">Block events</Term>} rpc={t.dashboard.snapshot} zmq={zmqBlocks} />
    </div>
  )
}
