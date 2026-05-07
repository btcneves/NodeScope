export interface HealthData {
  status: string
  project: string
  events_available: number
  rpc_ok: boolean
  network?: string
  chain?: string
  blocks?: number
  rpc_error?: string | null
}

export interface MempoolData {
  size: number
  bytes: number
  usage: number
  maxmempool: number
  mempoolminfee: number
  minrelaytxfee: number
  rpc_ok: boolean
  error?: string | null
}

export interface SummaryData {
  total_events: number
  rawtx_count: number
  rawblock_count: number
  other_count: number
  ignored_lines: number
  skipped_events?: number
  source?: string
  classification_counts: Record<string, number>
  coinbase_input_present_count: number
  op_return_count: number
  latest_block?: BlockData | null
  latest_tx?: TxData | null
}

export interface BlockData {
  ts: string
  height: number | null
  hash: string | null
  kind: string
}

export interface TxData {
  ts: string
  txid: string
  inputs: number
  outputs: number
  total_out: number
  coinbase_input_present?: boolean
  kind: string
  metadata: Record<string, unknown>
}

export interface EventItem {
  ts: string
  level: string
  origin: string
  event: string
  data: Record<string, unknown>
}

export interface ClassificationItem {
  ts: string
  event: string
  kind: string
  metadata: Record<string, unknown>
  txid?: string
  height?: number
  hash?: string
}

export interface RecentEventsData {
  items: EventItem[]
  total_items: number
}

export interface ClassificationsData {
  items: ClassificationItem[]
  total_items: number
  counts: Record<string, number>
}

export interface IntelligenceData {
  node_health_score: number
  node_health_label: 'healthy' | 'degraded' | 'critical'
  rpc_status: string
  zmq_status: string
  sse_status: string
  mempool_pressure: 'low' | 'medium' | 'high' | 'unknown'
  latest_signal: string | null
  event_store: {
    replayable: boolean
    source: string
    total_events: number
  }
  classification_summary: Record<string, number>
  latest_block: BlockData | null
  latest_tx: TxData | null
}

// --- Transaction Inspector Premium ---

export interface TxVin {
  coinbase: boolean
  coinbase_hex?: string | null
  prev_txid?: string | null
  prev_vout?: number | null
  sequence?: number | null
  value?: number | null
  address?: string | null
}

export interface TxVout {
  n?: number | null
  value: number
  address?: string | null
  script_type?: string | null
}

export interface TxInspectorData {
  txid: string
  wtxid?: string | null
  version?: number | null
  locktime?: number | null
  size?: number | null
  vsize?: number | null
  weight?: number | null
  fee_btc: number | string | null
  fee_rate_sat_vb: number | string | null
  confirmations?: number | null
  blockhash?: string | null
  blockheight?: number | null
  blocktime?: number | null
  time?: number | null
  mempool_status: 'confirmed' | 'unconfirmed' | 'not_found' | 'unknown'
  replaceable?: boolean | null
  total_output_btc?: number | null
  vin: TxVin[]
  vout: TxVout[]
  vin_count: number
  vout_count: number
  related_zmq_events: unknown[]
  rpc_validation_status: 'validated' | 'not_found' | 'rpc_unavailable'
  warnings: string[]
  unavailable_features: string[]
}

// --- ZMQ Event Tape ---

export interface TapeEvent {
  ts?: string | null
  event: string
  topic: 'rawtx' | 'rawblock'
  txid?: string | null
  blockhash?: string | null
  short_id?: string | null
  height?: number | null
  vsize?: number | null
  has_op_return?: boolean | null
  script_types: string[]
  validation_status: string
}

export interface EventTapeData {
  items: TapeEvent[]
  total: number
  limit: number
  topic_filter?: string | null
  txid_filter?: string | null
  source: string
}

// --- Guided Demo types ---

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'unavailable' | 'experimental'

export interface DemoStep {
  id: string
  title: string
  status: StepStatus
  friendly_message: string
  technical_output: unknown
  timestamp: string | null
  error: string | null
  data: Record<string, unknown>
}

export interface DemoProof {
  scenario_name: string
  network: string
  bitcoin_core_version: unknown
  rpc_ok: boolean
  zmq_rawtx_ok: boolean
  zmq_rawblock_ok: boolean
  wallet: string
  mining_address: string | null
  destination_address: string | null
  txid: string | null
  wtxid: string | null
  amount_btc: number | null
  fee_btc: number | null
  fee_rate_sat_vb: number | string
  vsize_vbytes: number | string
  weight_wu: number | string
  mempool_seen: boolean
  rawtx_event_seen: boolean
  rawblock_event_seen: boolean
  block_height: number | null
  block_hash: string | null
  confirmations: number
  timestamps: Record<string, string | null>
  success: boolean
  warnings: string[]
  unavailable_features: string[]
}

export interface DemoStatusData {
  steps: DemoStep[]
  proof: DemoProof | null
  running: boolean
}

// --- Mempool Policy Arena ---

export interface PolicyStep {
  id: string
  title: string
  status: StepStatus
  friendly_message: string
  technical_output: unknown
  timestamp: string | null
  error: string | null
  data: Record<string, unknown>
}

export interface PolicyScenario {
  id: string
  title: string
  description: string
  status: 'idle' | 'running' | 'success' | 'error' | 'experimental'
  running: boolean
  steps: PolicyStep[]
  proof: Record<string, unknown> | null
}

export interface PolicyScenarioSummary {
  id: string
  title: string
  description: string
  status: string
  running: boolean
  step_count: number
  has_proof: boolean
}

export interface ScenariosListData {
  scenarios: PolicyScenarioSummary[]
}

export interface PolicyProofData {
  scenario_id: string
  proof: Record<string, unknown> | null
}

// --- Reorg Lab ---

export interface ReorgStep {
  name: string
  status: StepStatus
  message: string
  technical: unknown
  data: Record<string, unknown>
  timestamp: string | null
}

export interface ReorgProof {
  scenario: string
  title: string
  network: string
  experimental: boolean
  txid: string | null
  amount_btc: number
  original_block_hash: string | null
  original_block_height: number | null
  confirmations_before_reorg: number
  invalidated_block_hash: string | null
  mempool_status_after_invalidation: string
  final_block_hash: string | null
  final_block_height: number | null
  final_confirmations: number
  mempool_status_after_recovery: string
  reconsider_block_called: boolean
  success: boolean
  warnings: string[]
  unavailable_features: string[]
}

export interface ReorgStatusData {
  status: 'idle' | 'running' | 'success' | 'error' | 'unavailable' | 'experimental'
  running: boolean
  network: string | null
  steps: ReorgStep[]
  proof: ReorgProof | null
  error: string | null
  warning: string | null
}

// --- Cluster Mempool Compatibility ---

export interface ClusterRpcResult {
  rpc: string
  supported: boolean
  reason: string | null
}

export interface ClusterCompatibilityData {
  bitcoin_core_version: string | null
  supported: boolean
  rpcs: ClusterRpcResult[]
  message: string
  note: string | null
}
