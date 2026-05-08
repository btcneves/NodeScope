async function get<T>(path: string): Promise<T> {
  const res = await fetch(path) // path is relative; Vite proxy handles routing
  if (!res.ok) throw await buildApiError(path, res)
  return parseJson<T>(path, res)
}

async function post<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'POST' })
  if (!res.ok) throw await buildApiError(path, res)
  return parseJson<T>(path, res)
}

async function parseJson<T>(path: string, res: Response): Promise<T> {
  const contentType = res.headers.get('Content-Type') ?? ''
  const text = await res.text()
  if (!contentType.includes('application/json')) {
    const hint = text.trim().startsWith('<')
      ? 'Received HTML instead of JSON. Check the frontend proxy/API route.'
      : 'Response is not JSON.'
    throw new Error(`${path}: ${hint}`)
  }
  try {
    return JSON.parse(text) as T
  } catch (e) {
    throw new Error(`${path}: Invalid JSON response (${e instanceof Error ? e.message : e})`)
  }
}

async function buildApiError(path: string, res: Response): Promise<Error> {
  const retryAfter = res.headers.get('Retry-After')
  const contentType = res.headers.get('Content-Type') ?? ''
  let detail = ''
  try {
    const text = await res.text()
    if (contentType.includes('application/json')) {
      const body = JSON.parse(text) as { detail?: unknown }
      detail =
        typeof body.detail === 'string'
          ? body.detail
          : body.detail
            ? JSON.stringify(body.detail)
            : ''
    } else {
      detail = text.trim().startsWith('<')
        ? 'Received HTML instead of API JSON'
        : text.slice(0, 120)
    }
  } catch {
    /* response body is optional */
  }
  const retry = res.status === 429 && retryAfter ? ` Retry after ${retryAfter}s.` : ''
  return new Error(`${path}: ${res.status}${detail ? ` - ${detail}` : ''}${retry}`)
}

export const api = {
  health: () => get<import('../types/api').HealthData>('/health'),
  networkMode: () => get<import('../types/api').NetworkModeData>('/network/mode'),
  summary: () => get<import('../types/api').SummaryData>('/summary'),
  mempool: () => get<import('../types/api').MempoolData>('/mempool/summary'),
  recentEvents: (limit = 20, sortBy = 'ts', sortDir: 'asc' | 'desc' = 'desc') =>
    get<import('../types/api').RecentEventsData>(
      `/events/recent?limit=${limit}&sort_by=${sortBy}&sort_dir=${sortDir}`
    ),
  classifications: (limit = 20, sortBy = 'ts', sortDir: 'asc' | 'desc' = 'desc') =>
    get<import('../types/api').ClassificationsData>(
      `/events/classifications?limit=${limit}&sort_by=${sortBy}&sort_dir=${sortDir}`
    ),
  latestBlock: () => get<import('../types/api').BlockData | null>('/blocks/latest'),
  latestTx: () => get<import('../types/api').TxData | null>('/tx/latest'),
  txById: (txid: string) => get<import('../types/api').TxData>(`/tx/${txid}`),
  intelligenceSummary: () => get<import('../types/api').IntelligenceData>('/intelligence/summary'),
  // Transaction Inspector Premium
  txInspect: (txid: string) => get<import('../types/api').TxInspectorData>(`/tx/inspect/${txid}`),
  // ZMQ Event Tape
  eventTape: (limit = 50, topic?: string) =>
    get<import('../types/api').EventTapeData>(
      `/events/tape?limit=${limit}${topic ? `&topic=${topic}` : ''}`
    ),
  eventTapeByTxid: (txid: string) =>
    get<import('../types/api').EventTapeData>(`/events/tape/${txid}`),
  // Guided Demo
  demoStatus: () => get<import('../types/api').DemoStatusData>('/demo/status'),
  demoRun: () => post<import('../types/api').DemoStatusData>('/demo/run'),
  demoStep: (stepId: string) => post<import('../types/api').DemoStep>(`/demo/step/${stepId}`),
  demoReset: () => post<import('../types/api').DemoStatusData>('/demo/reset'),
  demoProof: () => get<{ proof: import('../types/api').DemoProof | null }>('/demo/proof'),
  // Policy Arena
  policyScenarios: () => get<import('../types/api').ScenariosListData>('/policy/scenarios'),
  policyRun: (id: string) => post<import('../types/api').PolicyScenario>(`/policy/run/${id}`),
  policyStatus: (id: string) => get<import('../types/api').PolicyScenario>(`/policy/status/${id}`),
  policyReset: (id: string) => post<import('../types/api').PolicyScenario>(`/policy/reset/${id}`),
  policyResetAll: () => post<import('../types/api').ScenariosListData>('/policy/reset'),
  policyProof: (id: string) => get<import('../types/api').PolicyProofData>(`/policy/proof/${id}`),
  // Reorg Lab
  reorgStatus: () => get<import('../types/api').ReorgStatusData>('/reorg/status'),
  reorgRun: () => post<import('../types/api').ReorgStatusData>('/reorg/run'),
  reorgReset: () => post<import('../types/api').ReorgStatusData>('/reorg/reset'),
  reorgProof: () => get<{ proof: import('../types/api').ReorgProof | null }>('/reorg/proof'),
  // Cluster Mempool Compatibility
  clusterCompatibility: () =>
    get<import('../types/api').ClusterCompatibilityData>('/mempool/cluster/compatibility'),
  mempoolClusters: () => get<import('../types/api').MempoolClustersData>('/mempool/clusters'),
  // Charts
  chartsMempool: (range = '1h') =>
    get<import('../types/api').ChartData>(`/charts/mempool?range=${range}`),
  chartsFees: (range = '1h') =>
    get<import('../types/api').ChartData>(`/charts/fees?range=${range}`),
  // Alerts
  alertsConfig: () => get<import('../types/api').AlertConfigListData>('/alerts/config'),
  alertsActive: () => get<import('../types/api').ActiveAlertsData>('/alerts/active'),
  alertsCreate: (body: import('../types/api').AlertConfigInput) =>
    fetch('/alerts/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw await buildApiError('/alerts/config', r)
      return r.json() as Promise<import('../types/api').AlertConfig>
    }),
  alertsUpdate: (id: number, body: import('../types/api').AlertConfigInput) =>
    fetch(`/alerts/config/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw await buildApiError(`/alerts/config/${id}`, r)
      return r.json() as Promise<import('../types/api').AlertConfig>
    }),
  alertsDelete: (id: number) =>
    fetch(`/alerts/config/${id}`, { method: 'DELETE' }).then(async (r) => {
      if (!r.ok) throw await buildApiError(`/alerts/config/${id}`, r)
      return r.json() as Promise<{ ok: boolean }>
    }),
  // Simulation
  simulationStatus: () => get<import('../types/api').SimulationData>('/simulation/status'),
  simulationStart: () => post<import('../types/api').SimulationData>('/simulation/start'),
  simulationStop: () => post<import('../types/api').SimulationData>('/simulation/stop'),
  simulationConfig: (blockInterval?: number, txInterval?: number) => {
    const body = JSON.stringify({ block_interval: blockInterval, tx_interval: txInterval })
    return fetch('/simulation/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).then(async (r) => {
      if (!r.ok) throw await buildApiError('/simulation/config', r)
      return r.json() as Promise<import('../types/api').SimulationData>
    })
  },
  // Session
  sessionReset: () => post<{ ok: boolean; truncated: boolean; file: string }>('/session/reset'),
  // History
  historySummary: () => get<import('../types/api').HistorySummary>('/history/summary'),
  historyProofs: (
    limit = 20,
    offset = 0,
    source?: string,
    success?: boolean,
    sortBy = 'id',
    sortDir: 'asc' | 'desc' = 'desc'
  ) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      sort_by: sortBy,
      sort_dir: sortDir,
    })
    if (source) params.set('source', source)
    if (success !== undefined) params.set('success', String(success))
    return get<
      import('../types/api').HistoryListResponse<import('../types/api').ProofReportHistoryItem>
    >(`/history/proofs?${params}`)
  },
  historyDemoRuns: (limit = 20, offset = 0) =>
    get<import('../types/api').HistoryListResponse<import('../types/api').DemoRunHistoryItem>>(
      `/history/demo-runs?limit=${limit}&offset=${offset}`
    ),
  historyPolicyRuns: (limit = 20, offset = 0, scenario?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (scenario) params.set('scenario', scenario)
    return get<
      import('../types/api').HistoryListResponse<import('../types/api').PolicyRunHistoryItem>
    >(`/history/policy-runs?${params}`)
  },
  historyReorgRuns: (limit = 20, offset = 0) =>
    get<import('../types/api').HistoryListResponse<import('../types/api').ReorgRunHistoryItem>>(
      `/history/reorg-runs?limit=${limit}&offset=${offset}`
    ),
  // Fee Estimation Playground
  feesEstimate: (mode?: string) =>
    get<import('../types/api').FeeEstimateData>(`/fees/estimate${mode ? `?mode=${mode}` : ''}`),
  feesCompare: (mode?: string) =>
    get<import('../types/api').FeeEstimateData>(`/fees/compare${mode ? `?mode=${mode}` : ''}`),
}
