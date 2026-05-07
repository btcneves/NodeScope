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
  IntelligenceData,
} from './types/api'
import { Header, type ActiveView } from './components/Header'
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
import { IntelligenceSummaryPanel } from './components/IntelligenceSummaryPanel'
import { DemoView } from './components/DemoView'
import { GuidedDemo } from './components/GuidedDemo'
import { TransactionInspector } from './components/TransactionInspector'
import { ZmqEventTape } from './components/ZmqEventTape'
import { MempoolPolicyArena } from './components/MempoolPolicyArena'
import { ReorgLab } from './components/ReorgLab'

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [mempool, setMempool] = useState<MempoolData | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [classifications, setClassifications] = useState<ClassificationItem[]>([])
  const [latestBlock, setLatestBlock] = useState<BlockData | null>(null)
  const [latestTx, setLatestTx] = useState<TxData | null>(null)
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [demoView, setDemoView] = useState(false)
  // Inspector txid — shared between ZMQ tape and inspector view
  const [inspectorTxid, setInspectorTxid] = useState('')
  const { events: sseEvents, connected: sseConnected } = useSSE('/events/stream')

  const fetchAll = async () => {
    try {
      const [h, m, s, e, c, b, t, intel] = await Promise.allSettled([
        api.health(),
        api.mempool(),
        api.summary(),
        api.recentEvents(20),
        api.classifications(20),
        api.latestBlock(),
        api.latestTx(),
        api.intelligenceSummary(),
      ])
      if (h.status === 'fulfilled') setHealth(h.value)
      if (m.status === 'fulfilled') setMempool(m.value)
      if (s.status === 'fulfilled') setSummary(s.value)
      if (e.status === 'fulfilled') setEvents(e.value.items)
      if (c.status === 'fulfilled') setClassifications(c.value.items)
      if (b.status === 'fulfilled') setLatestBlock(b.value)
      if (t.status === 'fulfilled') setLatestTx(t.value)
      if (intel.status === 'fulfilled') setIntelligence(intel.value)
    } catch { /* ignore */ }
  }

  useEffect(() => { void fetchAll() }, [])
  useInterval(fetchAll, 5000)

  const network = health?.chain ?? health?.network ?? 'regtest'
  const rpcOk = health?.rpc_ok ?? false
  const apiOk = health !== null

  // Navigate to inspector with a given txid
  const handleInspect = (txid: string) => {
    setInspectorTxid(txid)
    setActiveView('inspector')
  }

  if (demoView) {
    return (
      <DemoView
        health={health}
        mempool={mempool}
        summary={summary}
        latestBlock={latestBlock}
        latestTx={latestTx}
        intelligence={intelligence}
        sseConnected={sseConnected}
        onClose={() => setDemoView(false)}
      />
    )
  }

  const header = (
    <Header
      network={network}
      apiOk={apiOk}
      rpcOk={rpcOk}
      sseConnected={sseConnected}
      onRefresh={() => { void fetchAll() }}
      activeView={activeView}
      onSetView={setActiveView}
      onDemoView={() => setDemoView(true)}
    />
  )

  if (activeView === 'guided-demo') {
    return (
      <div className="app">
        {header}
        <main className="main" style={{ maxWidth: '860px', margin: '0 auto' }}>
          <GuidedDemo />
        </main>
      </div>
    )
  }

  if (activeView === 'inspector') {
    return (
      <div className="app">
        {header}
        <main className="main" style={{ maxWidth: '860px', margin: '0 auto' }}>
          <TransactionInspector initialTxid={inspectorTxid} />
        </main>
      </div>
    )
  }

  if (activeView === 'zmq-tape') {
    return (
      <div className="app">
        {header}
        <main className="main" style={{ maxWidth: '960px', margin: '0 auto' }}>
          <ZmqEventTape onInspectTxid={handleInspect} />
        </main>
      </div>
    )
  }

  if (activeView === 'policy-arena') {
    return (
      <div className="app">
        {header}
        <main className="main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <MempoolPolicyArena />
        </main>
      </div>
    )
  }

  if (activeView === 'reorg-lab') {
    return (
      <div className="app">
        {header}
        <main className="main" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <ReorgLab onInspect={handleInspect} />
        </main>
      </div>
    )
  }

  // Default: dashboard
  return (
    <div className="app">
      {header}
      <main className="main">
        <KpiRow summary={summary} mempool={mempool} health={health} />
        <div className="grid-2">
          <NodeHealthScore
            health={health}
            mempool={mempool}
            latestBlock={latestBlock}
            sseConnected={sseConnected}
          />
          <IntelligenceSummaryPanel data={intelligence} />
        </div>
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
