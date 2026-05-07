async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)  // path is relative; Vite proxy handles routing
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'POST' })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  health: () => get<import('../types/api').HealthData>('/health'),
  summary: () => get<import('../types/api').SummaryData>('/summary'),
  mempool: () => get<import('../types/api').MempoolData>('/mempool/summary'),
  recentEvents: (limit = 20) => get<import('../types/api').RecentEventsData>(`/events/recent?limit=${limit}`),
  classifications: (limit = 20) => get<import('../types/api').ClassificationsData>(`/events/classifications?limit=${limit}`),
  latestBlock: () => get<import('../types/api').BlockData | null>('/blocks/latest'),
  latestTx: () => get<import('../types/api').TxData | null>('/tx/latest'),
  txById: (txid: string) => get<import('../types/api').TxData>(`/tx/${txid}`),
  intelligenceSummary: () => get<import('../types/api').IntelligenceData>('/intelligence/summary'),
  // Transaction Inspector Premium
  txInspect: (txid: string) => get<import('../types/api').TxInspectorData>(`/tx/inspect/${txid}`),
  // ZMQ Event Tape
  eventTape: (limit = 50, topic?: string) =>
    get<import('../types/api').EventTapeData>(`/events/tape?limit=${limit}${topic ? `&topic=${topic}` : ''}`),
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
  clusterCompatibility: () => get<import('../types/api').ClusterCompatibilityData>('/mempool/cluster/compatibility'),
}
