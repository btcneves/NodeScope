import type { HealthData, MempoolData, BlockData, IntelligenceData } from '../types/api'
import { useI18n } from '../i18n'
import { Term } from './ui/InfoTooltip'
import { computeHealthScore } from '../utils/healthScore'

interface NodeHealthScoreProps {
  health: HealthData | null
  mempool: MempoolData | null
  latestBlock: BlockData | null
  sseConnected: boolean
  intelligence?: IntelligenceData | null
}

// ---------------------------------------------------------------------------
// Arc gauge (SVG, 270° arc)
// ---------------------------------------------------------------------------

function ArcGauge({ score, label }: { score: number; label: string }) {
  const R = 52
  const CX = 70
  const CY = 74
  const C = 2 * Math.PI * R // full circumference ~326.7
  const ARC = C * 0.75 // 270° arc ~245
  const FILL = (score / 100) * ARC

  const color = label === 'healthy' ? '#3fb886' : label === 'degraded' ? '#e3b341' : '#f85149'

  // Both arcs rotate so the 90° gap is at the bottom
  const rotation = `rotate(135, ${CX}, ${CY})`

  return (
    <svg width="140" height="128" viewBox="0 0 140 128" aria-label={`Health score: ${score}`}>
      <defs>
        <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="#1f2937"
        strokeWidth="10"
        strokeDasharray={`${ARC} ${C - ARC}`}
        strokeLinecap="round"
        transform={rotation}
      />

      {/* Score arc */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${FILL} ${C - FILL}`}
        strokeLinecap="round"
        transform={rotation}
        filter="url(#arc-glow)"
        style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />

      {/* Score number */}
      <text
        x={CX}
        y={CY - 6}
        textAnchor="middle"
        fill={color}
        fontSize="32"
        fontWeight="800"
        fontFamily="monospace"
        style={{ transition: 'fill 0.3s' }}
      >
        {score}
      </text>

      {/* /100 */}
      <text
        x={CX}
        y={CY + 10}
        textAnchor="middle"
        fill="#374151"
        fontSize="10"
        fontFamily="monospace"
      >
        / 100
      </text>

      {/* Status label */}
      <text
        x={CX}
        y={CY + 26}
        textAnchor="middle"
        fill={color}
        fontSize="10"
        fontWeight="700"
        fontFamily="monospace"
        letterSpacing="1.5"
        style={{ textTransform: 'uppercase' }}
      >
        {label.toUpperCase()}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component row with proportional bar
// ---------------------------------------------------------------------------

function ComponentRow({
  label,
  maxPts,
  active,
  tooltip,
}: {
  label: string
  maxPts: number
  active: boolean
  tooltip: string
}) {
  const color = active ? '#3fb886' : '#374151'
  const pts = active ? maxPts : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
      {/* Status dot */}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          background: active ? '#3fb886' : '#374151',
          boxShadow: active ? '0 0 6px #3fb886' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      />

      {/* Label */}
      <span
        style={{
          width: 58,
          fontSize: 11,
          color: active ? '#e5e7eb' : '#6b7280',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}
      >
        <Term text={tooltip}>{label}</Term>
      </span>

      {/* Bar track */}
      <div
        style={{ flex: 1, height: 5, background: '#1a2233', borderRadius: 3, overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            width: active ? `${maxPts}%` : '0%',
            background: active ? `linear-gradient(90deg, #0d7a5f, #3fb886)` : '#1f2937',
            borderRadius: 3,
            boxShadow: active ? '0 0 8px #3fb88666' : 'none',
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1), background 0.3s',
          }}
        />
      </div>

      {/* Points */}
      <span
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          minWidth: 28,
          textAlign: 'right',
          color: active ? color : '#4b5563',
          transition: 'color 0.3s',
        }}
      >
        +{pts}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NodeHealthScore({
  health,
  mempool,
  latestBlock,
  sseConnected,
  intelligence,
}: NodeHealthScoreProps) {
  const { t } = useI18n()

  // Use backend-computed values when available — they reflect real ZMQ/SSE status
  // instead of client-side proxies (sseConnected ≠ zmq events flowing)
  const score =
    intelligence?.node_health_score ??
    computeHealthScore(health, mempool, latestBlock, sseConnected).score
  const label =
    intelligence?.node_health_label ??
    computeHealthScore(health, mempool, latestBlock, sseConnected).label

  const rpcOk = intelligence ? intelligence.rpc_status === 'online' : (health?.rpc_ok ?? false)
  const zmqOk = intelligence ? intelligence.zmq_status === 'subscribed' : sseConnected
  const mempoolOk = intelligence
    ? intelligence.mempool_pressure !== 'unknown'
    : (mempool?.rpc_ok ?? false)
  const blocksOk = intelligence ? score >= 80 : score >= 90

  return (
    <div className="panel health-score-panel">
      <div className="panel-header">
        <span className="panel-title">
          <Term text={t.panelDesc.nodeHealth}>{t.dashboard.nodeHealthScore}</Term>
        </span>
        <span className={`badge badge-health-${label}`}>{label}</span>
      </div>

      <div className="health-score-body">
        {/* Arc gauge centred */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <ArcGauge score={score} label={label} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1f2937', margin: '0 0 12px' }} />

        {/* Component breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ComponentRow label="RPC" maxPts={40} active={rpcOk} tooltip={t.healthScore.rpc} />
          <ComponentRow label="ZMQ" maxPts={30} active={zmqOk} tooltip={t.healthScore.zmq} />
          <ComponentRow
            label="Mempool"
            maxPts={20}
            active={mempoolOk}
            tooltip={t.healthScore.mempool}
          />
          <ComponentRow
            label={t.dashboard.kpiBlocks}
            maxPts={10}
            active={blocksOk}
            tooltip={t.healthScore.blocks}
          />
        </div>
      </div>
    </div>
  )
}
