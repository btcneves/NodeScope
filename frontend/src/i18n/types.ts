export type Lang = 'pt-BR' | 'en-US'

export interface Translations {
  // Navigation
  nav: {
    dashboard: string
    guidedDemo: string
    txInspector: string
    zmqTape: string
    policyArena: string
    reorgLab: string
    clusterMempool: string
  }

  // Actions
  actions: {
    run: string
    runFull: string
    runStep: string
    reset: string
    copy: string
    copied: string
    downloadJson: string
    inspect: string
    refresh: string
    close: string
    expand: string
    collapse: string
    learnMore: string
    whyMatters: string
  }

  // Status
  status: {
    pending: string
    running: string
    success: string
    error: string
    unavailable: string
    experimental: string
    loading: string
    connected: string
    disconnected: string
    ok: string
    fail: string
  }

  // Dashboard / Header
  header: {
    title: string
    demoView: string
    apiStatus: string
    rpcStatus: string
    sseStatus: string
  }

  // Demo
  demo: {
    title: string
    subtitle: string
    stepsComplete: string
    errors: string
    demoRunning: string
    loadingState: string
    proofReport: string
    apiError: string
    yes: string
    no: string
    na: string
  }

  // Proof fields
  proof: {
    network: string
    success: string
    rpc: string
    zmqRawtx: string
    zmqRawblock: string
    wallet: string
    txid: string
    amount: string
    fee: string
    vsize: string
    weight: string
    feeRate: string
    blockHeight: string
    confirmations: string
    mempoolSeen: string
    rawtxEvent: string
    rawblockEvent: string
    unavailable: string
    warnings: string
  }

  // Inspector
  inspector: {
    title: string
    subtitle: string
    placeholder: string
    inspect: string
    decoding: string
    basic: string
    versionLocktime: string
    sizeVsizeWeight: string
    totalOutput: string
    rbfReplaceable: string
    blockTime: string
    unconfirmedPending: string
    coinbaseInput: string
    valueUnavailable: string
    inputs: string
    outputs: string
    scriptSig: string
    scriptPubKey: string
    noInputs: string
    noOutputs: string
    notFound: string
  }

  // ZMQ Tape
  zmq: {
    title: string
    subtitle: string
    events: string
    noEvents: string
    connecting: string
    connected: string
    filterAll: string
    clear: string
    rawTx: string
    rawBlock: string
    sequence: string
    hash: string
    size: string
    bytes: string
    rpcData: string
  }

  // Policy Arena
  policy: {
    title: string
    subtitle: string
    scenarios: string
    normal: string
    lowFee: string
    rbf: string
    cpfp: string
    steps: string
    noSteps: string
    selectScenario: string
    runScenario: string
    result: string
    txid: string
    feeRate: string
    statusLegend: string
    notesTitle: string
    noteRegtest: string
    noteRbf: string
    noteCpfp: string
    noteStatus: string
  }

  // Reorg Lab
  reorg: {
    title: string
    subtitle: string
    runReorg: string
    running: string
    reset: string
    status: string
    noResults: string
    phase: string
    result: string
    txid: string
    confirmationsBefore: string
    confirmationsAfter: string
    inMempoolAfter: string
    reorgDepth: string
    blocksAdded: string
    experimentalBadge: string
    networkLabel: string
    inspectTx: string
    originalBlock: string
    originalHeight: string
    mempoolAfterInvalidation: string
    finalBlock: string
    finalHeight: string
    finalConfirmations: string
    chainRecovery: string
    reconsiderBlockCalled: string
    warningExperimental: string
    warningRestored: string
    yes: string
    no: string
    steps: {
      checkNetwork: string
      ensureWallet: string
      broadcastTx: string
      mineBlock: string
      invalidateBlock: string
      checkMempool: string
      mineRecovery: string
      verifyReconfirmation: string
      reconsiderBlock: string
      buildProof: string
    }
  }

  // Cluster Mempool
  cluster: {
    title: string
    subtitle: string
    supported: string
    notSupported: string
    fallback: string
    checking: string
    txCount: string
    totalFee: string
    topFeeRate: string
    ancestors: string
    descendants: string
    refresh: string
  }

  // Dashboard sections
  dashboard: {
    title: string
    subtitle: string
    kpiBlocks: string
    kpiTxs: string
    kpiMempool: string
    kpiPeers: string
    kpiZmq: string
    kpiFeeRate: string
    nodeHealth: string
    intelligence: string
    txLifecycle: string
    mempool: string
    latestBlock: string
    latestTx: string
    liveFeed: string
    events: string
    replayEngine: string
    rpcZmqSync: string
    classifications: string
    live: string
    rpcOffline: string
    noBlocks: string
    noTransactions: string
    copied: string
    clickCopyHash: string
    clickCopyTxid: string
    transactions: string
    usage: string
    minFee: string
    rpcSnapshot: string
    classified: string
    byEngine: string
    eventStore: string
    totalInLog: string
    status: string
    subscribed: string
    snapshot: string
    inSync: string
    blocksBehind: string
    nodeHealthScore: string
    liveEvents: string
    waitingEvents: string
    items: string
    noClassifications: string
    copyReason: string
    lifecycleCreated: string
    lifecycleTxBuilt: string
    lifecycleBroadcast: string
    lifecycleSentToNode: string
    lifecyclePending: string
    lifecycleEventCaptured: string
    lifecycleBlockMined: string
    lifecycleBlockEventCaptured: string
    lifecycleConfirmed: string
    lifecycleOnChain: string
  }

  // Explain boxes
  explain: {
    dashboard: string
    guidedDemo: string
    inspector: string
    zmqTape: string
    policyArena: string
    reorgLab: string
    clusterMempool: string
    proofReport: string
  }

  // Learn more
  learn: {
    rbf: string
    cpfp: string
    reorg: string
    cluster: string
    zmq: string
    proof: string
    whyMatters: string
  }

  // Generic
  generic: {
    error: string
    noData: string
    empty: string
    version: string
    network: string
    height: string
    hash: string
    size: string
    time: string
    unknown: string
  }
}
