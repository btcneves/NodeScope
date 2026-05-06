# Roteiro de Apresentação — NodeScope

**Duração:** 4 minutos  
**Formato:** Demo ao vivo com dashboard aberto no browser

---

## Abertura (30s)

> "Bitcoin Core expõe dados poderosos — estado da chain via RPC, transações em tempo real via ZMQ, mempool inteira disponível. Mas esses dados são crus, separados, e exigem integração para virarem inteligência. NodeScope faz essa ponte."

**Mostrar:** Header do dashboard com `RPC ✓`, `ZMQ ✓`, `SSE ✓`

---

## Arquitetura em 1 frase (15s)

> "RPC dá o snapshot. ZMQ dá o tempo real. NodeScope dá a interpretação."

**Mostrar:** Node Health Score — número grande, barra verde

---

## Demo ao vivo — Transaction Lifecycle (2min)

### Passo 1 — Estado atual (20s)

> "O dashboard já mostra o estado do node: altura do bloco, mempool, últimas transações classificadas."

**Mostrar:** KPI row com block height, mempool size, event count

### Passo 2 — Criar transação (40s)

```bash
# Gerar endereço
ADDR=$(bitcoin-cli -regtest getnewaddress)

# Enviar para a mempool
bitcoin-cli -regtest sendtoaddress $ADDR 1.0
```

> "Enviamos uma transação para a mempool. Observe o Live Feed — o ZMQ capturou o evento rawtx em tempo real, enriquecido com dados RPC: inputs, outputs, tipo de script."

**Mostrar:** Live Feed atualizando com `rawtx` badge, Transaction Lifecycle com Mempool e ZMQ rawtx ativos

### Passo 3 — Minerar bloco (20s)

```bash
bitcoin-cli -regtest generatetoaddress 1 $ADDR
```

> "Mineramos um bloco. A transação saiu da mempool e foi confirmada. O lifecycle completa: Created → Broadcast → Mempool → ZMQ → Block Mined → Confirmed."

**Mostrar:** Transaction Lifecycle com todos os estágios ativos, Block Height incrementado

### Passo 4 — Classificação (20s)

> "A engine analisa cada transação com heurísticas: é um pagamento simples? Coinbase? OP_RETURN? Com confidence score e sinais explicados."

**Mostrar:** Classifications Table com `simple_payment_like`, `coinbase_like`, confidence e reason

---

## Diferenciais Técnicos (45s)

> "Três pontos que diferenciam o NodeScope:"

1. **Replay Engine** — "Todos os eventos são salvos em NDJSON append-only. Posso reprocessar, auditar, ou reclassificar qualquer evento histórico offline."

2. **Intelligence Layer** — "Não é só exibição de dados brutos. A engine interpreta sinais: script types, coinbase flag, outputs zerados, OP_RETURN. Isso é interpretação, não monitoramento."

3. **Arquitetura sem banco de dados** — "Zero dependência de banco. Os logs NDJSON são a fonte de verdade. Simples, reproduzível, auditável."

---

## Fechamento (30s)

> "NodeScope está pronto para regtest e arquitetado para evoluir. O próximo passo natural é um modo observador read-only em signet — sem wallet, sem custódia, só inteligência operacional sobre uma rede real."

**Mostrar:** Dashboard completo — Command Center visual com todos os painéis

---

## Perguntas Prováveis e Respostas

**"É uma carteira?"**
> Não. NodeScope é um dashboard de observabilidade. Não gerencia chaves, não assina transações, não tem custódia.

**"Escala para mainnet?"**
> A arquitetura escala. ZMQ + RPC funcionam igual em mainnet. O próximo passo é um modo read-only em signet, documentado no roadmap.

**"Por que NDJSON e não banco?"**
> Para a Fase 1: zero dependência externa, replay trivial, auditável com `grep`. Para a Fase 2, migramos para storage persistente conforme o volume exigir.

**"Os testes cobrem o quê?"**
> 37 testes unitários cobrindo engine (classificação, parser, reader, snapshot), API (todos os endpoints), RPC client, monitor, SSE e replay script. CI roda a cada push.
