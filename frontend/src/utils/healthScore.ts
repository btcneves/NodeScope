import type { HealthData, MempoolData, BlockData } from '../types/api'

export interface HealthScore {
  score: number
  label: 'critical' | 'degraded' | 'healthy'
  rpcPoints: number
  zmqPoints: number
  mempoolPoints: number
  blockPoints: number
}

export function computeHealthScore(
  health: HealthData | null,
  mempool: MempoolData | null,
  latestBlock: BlockData | null,
  sseConnected: boolean,
): HealthScore {
  const rpcPoints = health?.rpc_ok ? 40 : 0
  const zmqPoints = sseConnected ? 30 : 0
  const mempoolPoints = mempool?.rpc_ok ? 20 : 0

  let blockPoints = 0
  if (latestBlock?.ts) {
    const age = (Date.now() - new Date(latestBlock.ts).getTime()) / 1000
    if (age < 60) blockPoints = 10
    else if (age < 300) blockPoints = 5
  }

  const score = rpcPoints + zmqPoints + mempoolPoints + blockPoints
  const label = score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'critical'

  return { score, label, rpcPoints, zmqPoints, mempoolPoints, blockPoints }
}
