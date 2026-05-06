# Demo Checklist

Verificações obrigatórias antes de iniciar qualquer demo do NodeScope.

---

## 1. Bitcoin Core

```bash
bitcoin-cli -regtest getblockchaininfo | jq '{chain, blocks}'
bitcoin-cli -regtest getzmqnotifications
```

- [ ] `chain` é `regtest`
- [ ] ZMQ notifica `rawtx` (porta 28333) e `rawblock` (porta 28332)
- [ ] RPC responde sem erro de autenticação

---

## 2. Backend (API)

```bash
curl -s http://127.0.0.1:8000/health | jq '{status, rpc_ok, chain, blocks}'
```

- [ ] `status: "ok"`
- [ ] `rpc_ok: true`
- [ ] `chain: "regtest"`
- [ ] `blocks` tem valor numérico

```bash
curl -s http://127.0.0.1:8000/mempool/summary | jq '{size, rpc_ok}'
curl -s http://127.0.0.1:8000/events/recent | jq '.total_items'
```

- [ ] Mempool summary retorna sem erro
- [ ] Eventos disponíveis (total_items ≥ 0)

---

## 3. Monitor ZMQ

```bash
# Verificar se monitor.py está rodando
pgrep -f monitor.py && echo "OK" || echo "PARADO"

# Verificar log do dia atual
ls -lh logs/ | head -5
tail -3 logs/$(date +%Y-%m-%d)-monitor.ndjson 2>/dev/null | python -m json.tool
```

- [ ] `monitor.py` está em execução
- [ ] Log do dia está sendo atualizado

---

## 4. Frontend

- [ ] Abrir `http://localhost:5173` no browser
- [ ] Header mostra `API ✓`, `RPC ✓`, `SSE ✓`
- [ ] Node Health Score exibe valor ≥ 80
- [ ] Transaction Lifecycle mostra estágios ativos
- [ ] Live Feed exibe eventos (ou "Waiting for events" se mempool vazia)

---

## 5. Demo Regtest

```bash
bash scripts/demo_regtest.sh
```

- [ ] Script executa sem erro
- [ ] Frontend atualiza com novos eventos em ~5s
- [ ] Live Feed captura rawtx e rawblock
- [ ] Classification Table mostra classificações

---

## 6. Smoke Test Rápido

```bash
make smoke
```

- [ ] Todos os checks passam

---

## Comandos de Inicialização (Ordem)

```bash
# Terminal 1 — Bitcoin Core
bitcoind -regtest -daemon

# Terminal 2 — Backend
make backend

# Terminal 3 — Monitor ZMQ
make monitor

# Terminal 4 — Frontend
make frontend

# Terminal 5 — Gerar atividade
make demo
```

---

## Plano de Contingência

| Falha | Ação |
|-------|------|
| Bitcoin Core não inicia | Usar `bitcoin-qt -regtest` em modo gráfico |
| Backend não responde | Verificar porta 8000 ocupada: `lsof -i :8000` |
| Frontend sem dados | Verificar proxy Vite: `VITE_API_PROXY_TARGET` |
| ZMQ sem eventos | Verificar `zmqpubrawtx` no `bitcoin.conf` |
| Tudo offline | Usar screenshots de `docs/assets/` + NDJSON como evidência |
