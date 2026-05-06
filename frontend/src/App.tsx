import { useState, useEffect } from 'react'
import { api } from './api/client'
import { useInterval } from './hooks/useInterval'
import { useSSE } from './hooks/useSSE'
import type {
  HealthData,
  MempoolData,
  SummaryData,
  EventItem,
  ClassificationItem,
  BlockData,
  TxData,
} from './types/api'
import { Header } from './components/Header'
import { KpiRow } from './components/KpiRow'
import { MempoolPanel } from './components/MempoolPanel'
import { LiveFeed } from './components/LiveFeed'
import { EventsTable } from './components/EventsTable'
import { ClassificationsTable } from './components/ClassificationsTable'
import { BlocksPanel } from './components/BlocksPanel'
import { TxPanel } from './components/TxPanel'
import { NodeHealthScore } from './components/NodeHealthScore'
import { TransactionLifecycle } from './components/TransactionLifecycle'
import { ReplayEnginePanel } from './components/ReplayEnginePanel'
import { RpcZmqSyncPanel } from './components/RpcZmqSyncPanel'

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [mempool, setMempool] = useState<MempoolData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [classifications, setClassifications] = useState<ClassificationItem[]>([])
  const [latestBlock, setLatestBlock] = useState<BlockData | null>(null)
  const [latestTx, setLatestTx] = useState<TxData | null>(null)
  const { events: sseEvents, connected: sseConnected } = useSSE('/events/stream')

  const fetchAll = async () => {
    try {
      const [h, m, s, e, c, b, t] = await Promise.allSettled([
        api.health(),
        api.mempool(),
        api.summary(),
        api.recentEvents(20),
        api.classifications(20),
        api.latestBlock(),
        api.latestTx(),
      ])
      if (h.status === 'fulfilled') setHealth(h.value)
      if (m.status === 'fulfilled') setMempool(m.value)
      if (s.status === 'fulfilled') setSummary(s.value)
      if (e.status === 'fulfilled') setEvents(e.value.items)
      if (c.status === 'fulfilled') setClassifications(c.value.items)
      if (b.status === 'fulfilled') setLatestBlock(b.value)
      if (t.status === 'fulfilled') setLatestTx(t.value)
    } catch { /* ignore */ }
  }

  useEffect(() => { void fetchAll() }, [])
  useInterval(fetchAll, 5000)

  const network = health?.chain ?? health?.network ?? 'regtest'
  const rpcOk = health?.rpc_ok ?? false
  const apiOk = health !== null

  return (
    <div className="app">
      <Header
        network={network}
        apiOk={apiOk}
        rpcOk={rpcOk}
        sseConnected={sseConnected}
        onRefresh={() => { void fetchAll() }}
      />
      <main className="main">
        <KpiRow summary={summary} mempool={mempool} health={health} />
        <NodeHealthScore
          health={health}
          mempool={mempool}
          latestBlock={latestBlock}
          sseConnected={sseConnected}
        />
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
          <LiveFeed sseEvents={sseEvents} connected={sseConnected} />
          <EventsTable events={events} />
        </div>
        <div className="grid-2">
          <ReplayEnginePanel summary={summary} />
          <RpcZmqSyncPanel health={health} summary={summary} latestBlock={latestBlock} />
        </div>
        <ClassificationsTable classifications={classifications} />
      </main>
    </div>
  )
}
