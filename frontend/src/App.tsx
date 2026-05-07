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
import { ExplainBox } from './components/ui/ExplainBox'
import {
  I18nContext,
  getStoredLang,
  setStoredLang,
  getTranslations,
  type Lang,
  type I18nContextValue,
} from './i18n'

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
  const [inspectorTxid, setInspectorTxid] = useState('')
  const { events: sseEvents, connected: sseConnected } = useSSE('/events/stream')

  // i18n state
  const [lang, setLangState] = useState<Lang>(getStoredLang)
  const t = getTranslations(lang)

  const setLang = (l: Lang) => {
    setLangState(l)
    setStoredLang(l)
  }

  const i18nValue: I18nContextValue = { lang, t, setLang }

  const fetchAll = async () => {
    try {
      const [h, m, s, e, c, b, tx, intel] = await Promise.allSettled([
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
      if (tx.status === 'fulfilled') setLatestTx(tx.value)
      if (intel.status === 'fulfilled') setIntelligence(intel.value)
    } catch { /* ignore */ }
  }

  useEffect(() => { void fetchAll() }, [])
  useInterval(fetchAll, 5000)

  const network = health?.chain ?? health?.network ?? 'regtest'
  const rpcOk = health?.rpc_ok ?? false
  const apiOk = health !== null

  const handleInspect = (txid: string) => {
    setInspectorTxid(txid)
    setActiveView('inspector')
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

  return (
    <I18nContext.Provider value={i18nValue}>
      {demoView ? (
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
      ) : activeView === 'guided-demo' ? (
        <div className="app">
          {header}
          <main className="main" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.guidedDemo} />
            <GuidedDemo />
          </main>
        </div>
      ) : activeView === 'inspector' ? (
        <div className="app">
          {header}
          <main className="main" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.inspector} />
            <TransactionInspector initialTxid={inspectorTxid} />
          </main>
        </div>
      ) : activeView === 'zmq-tape' ? (
        <div className="app">
          {header}
          <main className="main" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.zmqTape} />
            <ZmqEventTape onInspectTxid={handleInspect} />
          </main>
        </div>
      ) : activeView === 'policy-arena' ? (
        <div className="app">
          {header}
          <main className="main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.policyArena} />
            <MempoolPolicyArena />
          </main>
        </div>
      ) : activeView === 'reorg-lab' ? (
        <div className="app">
          {header}
          <main className="main" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.reorgLab} />
            <ReorgLab onInspect={handleInspect} />
          </main>
        </div>
      ) : (
        // Default: dashboard
        <div className="app">
          {header}
          <main className="main">
            <ExplainBox text={t.explain.dashboard} />
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
      )}
    </I18nContext.Provider>
  )
}
