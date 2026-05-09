import { useCallback, useState, useEffect } from 'react'
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
  DemoStep,
  NetworkModeData,
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
import { GuidedDemo } from './components/GuidedDemo'
import { TransactionInspector } from './components/TransactionInspector'
import { ZmqEventTape } from './components/ZmqEventTape'
import { MempoolPolicyArena } from './components/MempoolPolicyArena'
import { ReorgLab } from './components/ReorgLab'
import { SimulationPanel } from './components/SimulationPanel'
import { ReadOnlyBanner } from './components/ReadOnlyBanner'
import AlertingPanel from './components/AlertingPanel'
import HistoricalDashboard from './components/HistoricalDashboard'
import { FeeEstimationPlayground } from './components/FeeEstimationPlayground'
import { HistoricalChartsPanel } from './components/HistoricalChartsPanel'
import { ClusterMempoolPanel } from './components/ClusterMempoolPanel'
import { Footer } from './components/Footer'
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
  const [networkMode, setNetworkMode] = useState<NetworkModeData | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [inspectorTxid, setInspectorTxid] = useState('')
  const [guidedDemoSteps, setGuidedDemoSteps] = useState<DemoStep[]>([])
  const [eventSort, setEventSort] = useState<{ by: string; dir: 'asc' | 'desc' }>({
    by: 'ts',
    dir: 'desc',
  })
  const [classificationSort, setClassificationSort] = useState<{
    by: string
    dir: 'asc' | 'desc'
  }>({ by: 'ts', dir: 'desc' })
  const {
    events: sseEvents,
    connected: sseConnected,
    clearEvents: clearSseEvents,
  } = useSSE('/events/stream')

  // i18n state
  const [lang, setLangState] = useState<Lang>(getStoredLang)
  const t = getTranslations(lang)

  const setLang = (l: Lang) => {
    setLangState(l)
    setStoredLang(l)
  }

  const i18nValue: I18nContextValue = { lang, t, setLang }

  const fetchAll = useCallback(async () => {
    try {
      const [h, mode, m, s, e, c, b, tx, intel] = await Promise.allSettled([
        api.health(),
        api.networkMode(),
        api.mempool(),
        api.summary(),
        api.recentEvents(20, eventSort.by, eventSort.dir),
        api.classifications(20, classificationSort.by, classificationSort.dir),
        api.latestBlock(),
        api.latestTx(),
        api.intelligenceSummary(),
      ])
      if (h.status === 'fulfilled') setHealth(h.value)
      if (mode.status === 'fulfilled') setNetworkMode(mode.value)
      if (m.status === 'fulfilled') setMempool(m.value)
      if (s.status === 'fulfilled') setSummary(s.value)
      if (e.status === 'fulfilled') setEvents(e.value.items)
      if (c.status === 'fulfilled') setClassifications(c.value.items)
      if (b.status === 'fulfilled') setLatestBlock(b.value)
      if (tx.status === 'fulfilled') setLatestTx(tx.value)
      if (intel.status === 'fulfilled') setIntelligence(intel.value)
    } catch {
      /* ignore */
    }
  }, [eventSort, classificationSort])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])
  useInterval(fetchAll, 5000)

  const network = health?.chain ?? health?.network ?? 'regtest'
  const rpcOk = health?.rpc_ok ?? false
  const apiOk = health !== null
  const isReadOnly = networkMode?.read_only ?? false
  const dashboardCopy =
    lang === 'pt-BR'
      ? {
          tag: 'btcneves@nodescope:~$ inspect bitcoin-core',
          title: 'Bitcoin Core Professional Lab',
          subtitle:
            'Laboratorio visual, guiado e auditavel para observar RPC, ZMQ, mempool, blocos e transacoes em tempo real.',
          primary: 'Executar demo guiada',
          secondary: 'Inspecionar TXID',
          tertiary: 'Ver fita ZMQ',
          consoleTitle: 'live node console',
          visualTitle: 'observability matrix',
          proof: 'Proof Report',
          modules: [
            ['RPC real', 'health, blocks, tx decode', 'live'],
            ['ZMQ rawtx/rawblock', 'eventos validados por RPC', 'stream'],
            ['Mempool policy', 'RBF, CPFP e fee rate', 'lab'],
            ['Cluster mempool', 'detectado em runtime', 'fallback'],
          ],
        }
      : {
          tag: 'btcneves@nodescope:~$ inspect bitcoin-core',
          title: 'Bitcoin Core Professional Lab',
          subtitle:
            'A visual, guided and auditable lab for observing RPC, ZMQ, mempool, blocks and transactions in real time.',
          primary: 'Run guided demo',
          secondary: 'Inspect TXID',
          tertiary: 'Open ZMQ tape',
          consoleTitle: 'live node console',
          visualTitle: 'observability matrix',
          proof: 'Proof Report',
          modules: [
            ['Real RPC', 'health, blocks, tx decode', 'live'],
            ['ZMQ rawtx/rawblock', 'events validated by RPC', 'stream'],
            ['Mempool policy', 'RBF, CPFP and fee rate', 'lab'],
            ['Cluster mempool', 'detected at runtime', 'fallback'],
          ],
        }

  const handleInspect = (txid: string) => {
    setInspectorTxid(txid)
    setActiveView('inspector')
  }

  const handleNewSession = async () => {
    if (isReadOnly) {
      window.alert(t.network.readOnlyActionBlocked)
      return
    }
    if (!window.confirm(t.header.newSessionConfirm)) return
    try {
      await api.sessionReset()
    } catch {
      /* ignore */
    }
    clearSseEvents()
    setEvents([])
    setClassifications([])
    setLatestBlock(null)
    setLatestTx(null)
    setSummary(null)
    setHealth(null)
    setMempool(null)
    setIntelligence(null)
    setNetworkMode(null)
    void fetchAll()
  }

  const header = (
    <Header
      network={network}
      apiOk={apiOk}
      rpcOk={rpcOk}
      sseConnected={sseConnected}
      onRefresh={() => {
        void fetchAll()
      }}
      activeView={activeView}
      onSetView={setActiveView}
      onNewSession={() => {
        void handleNewSession()
      }}
    />
  )
  const readOnlyBanner = <ReadOnlyBanner mode={networkMode} />

  return (
    <I18nContext.Provider value={i18nValue}>
      {activeView === 'guided-demo' ? (
        <div className="app" style={{ height: '100vh', overflow: 'hidden' }}>
          {header}
          {readOnlyBanner}
          <div className="guided-demo-workspace">
            {/* Left: scrollable steps list */}
            <div className="guided-demo-main">
              <GuidedDemo onStepsChange={setGuidedDemoSteps} readOnly={isReadOnly} />
            </div>
            {/* Right: fixed sidebar — lifecycle + explain */}
            <div className="guided-demo-sidebar">
              <TransactionLifecycle
                rpcOk={rpcOk}
                zmqConnected={sseConnected}
                sseEvents={sseEvents}
                demoSteps={guidedDemoSteps}
                vertical
              />
              <ExplainBox text={t.explain.guidedDemo} />
            </div>
          </div>
        </div>
      ) : activeView === 'inspector' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.inspector} />
            <TransactionInspector initialTxid={inspectorTxid} />
          </main>
          <Footer />
        </div>
      ) : activeView === 'zmq-tape' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.zmqTape} />
            <ZmqEventTape onInspectTxid={handleInspect} />
          </main>
          <Footer />
        </div>
      ) : activeView === 'policy-arena' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.policyArena} />
            <MempoolPolicyArena
              onGoToDashboard={() => setActiveView('dashboard')}
              readOnly={isReadOnly}
            />
          </main>
          <Footer />
        </div>
      ) : activeView === 'reorg-lab' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <ExplainBox text={t.explain.reorgLab} />
            <ReorgLab
              onInspect={handleInspect}
              onGoToDashboard={() => setActiveView('dashboard')}
              readOnly={isReadOnly}
            />
          </main>
          <Footer />
        </div>
      ) : activeView === 'history' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <HistoricalDashboard />
          </main>
          <Footer />
        </div>
      ) : activeView === 'charts' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <HistoricalChartsPanel />
          </main>
          <Footer />
        </div>
      ) : activeView === 'cluster' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <ClusterMempoolPanel />
          </main>
          <Footer />
        </div>
      ) : activeView === 'fee-estimation' ? (
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <ExplainBox text={t.fees.explainBox} />
            <FeeEstimationPlayground />
          </main>
          <Footer />
        </div>
      ) : (
        // Default: dashboard
        <div className="app">
          {header}
          {readOnlyBanner}
          <main className="main">
            <section className="lab-hero" aria-label="NodeScope Bitcoin Core lab overview">
              <div className="lab-hero-copy">
                <div className="terminal-pill">~ {dashboardCopy.tag}|</div>
                <h1>{dashboardCopy.title}</h1>
                <p>{dashboardCopy.subtitle}</p>
                <div className="lab-hero-actions">
                  <button className="lab-primary-btn" onClick={() => setActiveView('guided-demo')}>
                    {dashboardCopy.primary}
                  </button>
                  <button className="lab-secondary-btn" onClick={() => setActiveView('inspector')}>
                    {dashboardCopy.secondary}
                  </button>
                  <button className="lab-secondary-btn" onClick={() => setActiveView('zmq-tape')}>
                    {dashboardCopy.tertiary}
                  </button>
                </div>
                <div className="lab-signal-row">
                  <span className={apiOk ? 'signal-ok' : 'signal-error'}>API</span>
                  <span className={rpcOk ? 'signal-ok' : 'signal-error'}>RPC</span>
                  <span className={sseConnected ? 'signal-ok' : 'signal-warn'}>SSE/ZMQ</span>
                  <span>{network}</span>
                </div>
              </div>

              <div className="lab-visual" aria-hidden="true">
                <div className="lab-window">
                  <div className="lab-window-bar">
                    <span />
                    <span />
                    <span />
                    <strong>{dashboardCopy.consoleTitle}</strong>
                  </div>
                  <pre>{`bitcoin-cli -regtest getblockchaininfo
chain=${network}
rpc_ok=${String(rpcOk)}
blocks=${health?.blocks ?? 'loading'}

zmq: rawtx=${sseConnected ? 'subscribed' : 'waiting'}
mempool.txs=${mempool?.size ?? 0}
proof=${summary ? 'replayable' : 'collecting'}`}</pre>
                </div>
                <div className="lab-code-card lab-code-card-a">
                  <span>{dashboardCopy.proof}</span>
                  <code>txid + vbytes + fee_rate</code>
                </div>
                <div className="lab-code-card lab-code-card-b">
                  <span>{dashboardCopy.visualTitle}</span>
                  <code>{'RPC -> ZMQ -> mempool -> block'}</code>
                </div>
              </div>
            </section>

            <section className="lab-module-grid" aria-label="NodeScope capability map">
              {dashboardCopy.modules.map(([title, body, status]) => (
                <article className="lab-module" key={title}>
                  <div className="module-icon">&lt;/&gt;</div>
                  <h2>{title}</h2>
                  <p>{body}</p>
                  <span>{status}</span>
                </article>
              ))}
            </section>

            <ExplainBox text={t.explain.dashboard} />
            <AlertingPanel readOnly={isReadOnly} />
            <KpiRow summary={summary} mempool={mempool} health={health} />
            <div className="grid-2">
              <NodeHealthScore
                health={health}
                mempool={mempool}
                latestBlock={latestBlock}
                sseConnected={sseConnected}
                intelligence={intelligence}
              />
              <IntelligenceSummaryPanel data={intelligence} />
            </div>
            <SimulationPanel readOnly={isReadOnly} />
            <TransactionLifecycle rpcOk={rpcOk} zmqConnected={sseConnected} sseEvents={sseEvents} />
            <div className="grid-3">
              <MempoolPanel mempool={mempool} />
              <BlocksPanel block={latestBlock} />
              <TxPanel tx={latestTx} />
            </div>
            <div className="grid-2">
              <LiveFeed sseEvents={sseEvents} connected={sseConnected} />
              <EventsTable
                events={events}
                sortBy={eventSort.by}
                sortDir={eventSort.dir}
                onSort={(by) =>
                  setEventSort((prev) => ({
                    by,
                    dir: prev.by === by && prev.dir === 'desc' ? 'asc' : 'desc',
                  }))
                }
              />
            </div>
            <div className="grid-2">
              <ReplayEnginePanel summary={summary} />
              <RpcZmqSyncPanel health={health} summary={summary} latestBlock={latestBlock} />
            </div>
            <ClassificationsTable
              classifications={classifications}
              sortBy={classificationSort.by}
              sortDir={classificationSort.dir}
              onSort={(by) =>
                setClassificationSort((prev) => ({
                  by,
                  dir: prev.by === by && prev.dir === 'desc' ? 'asc' : 'desc',
                }))
              }
            />
          </main>
          <Footer />
        </div>
      )}
    </I18nContext.Provider>
  )
}
