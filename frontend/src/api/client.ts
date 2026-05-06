async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)  // path is relative; Vite proxy handles routing
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
}
