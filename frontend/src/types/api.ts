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
