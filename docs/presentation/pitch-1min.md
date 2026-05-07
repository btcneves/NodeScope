# NodeScope — 1-Minute Pitch

---

## EN-US

**What is NodeScope?**

NodeScope is a Bitcoin Core Professional Lab — a real-time observability dashboard that transforms raw Bitcoin Core data into structured, auditable intelligence.

**What problem does it solve?**

Bitcoin Core exposes powerful data through RPC and ZMQ, but those signals are raw, separate, and hard to interpret at a glance. There is no standard tool that unifies them into a single visual, guided, and auditable experience.

**Why is it different from wallets, Pix apps, or common payments projects?**

NodeScope does not manage money or accounts. It observes and explains the internal machinery of Bitcoin Core: transaction lifecycle, mempool policy, block propagation, fee estimation, and reorg behavior — using real RPC calls and real ZMQ events in a controlled regtest environment.

**What does it demonstrate technically?**

- 14-step guided demo from wallet creation to confirmed transaction and proof report
- Live ZMQ rawtx/rawblock event tape with RPC correlation
- Mempool Policy Arena with 4 runnable scenarios (normal, low-fee, RBF, CPFP)
- Reorg Lab using real `invalidateblock`/`reconsiderblock` RPCs (experimental)
- Fee Estimation Playground with `estimatesmartfee` for multiple block targets
- Historical dashboard with SQLite-backed proof storage
- Prometheus `/metrics` with 28+ operational gauges

**What is the evaluator's key takeaway?**

In under one minute, an evaluator can see a Bitcoin Core node in action: a transaction enters the mempool, ZMQ fires, the block confirms it, and a proof report captures the full audit trail — no manual terminal work required.

---

## PT-BR

**O que é o NodeScope?**

NodeScope é um Bitcoin Core Professional Lab — um painel de observabilidade em tempo real que transforma dados brutos do Bitcoin Core em inteligência estruturada e auditável.

**Qual problema resolve?**

O Bitcoin Core expõe dados poderosos via RPC e ZMQ, mas esses sinais são brutos, separados e difíceis de interpretar rapidamente. Não existe uma ferramenta padrão que os unifique em uma experiência visual, guiada e auditável.

**Por que é diferente de wallets, apps de Pix ou projetos comuns de pagamento?**

O NodeScope não gerencia dinheiro nem contas. Ele observa e explica a maquinaria interna do Bitcoin Core: ciclo de vida de transações, política de mempool, propagação de blocos, estimativa de taxas e comportamento de reorganização — usando chamadas RPC reais e eventos ZMQ reais em ambiente regtest controlado.

**O que demonstra tecnicamente?**

- Demo guiada em 14 etapas: da criação da wallet até a transação confirmada e o proof report
- ZMQ Event Tape ao vivo com eventos rawtx/rawblock correlacionados via RPC
- Mempool Policy Arena com 4 cenários executáveis (normal, low-fee, RBF, CPFP)
- Reorg Lab usando RPCs reais `invalidateblock`/`reconsiderblock` (experimental)
- Fee Estimation Playground com `estimatesmartfee` para múltiplos alvos de bloco
- Dashboard histórico com armazenamento de proofs via SQLite
- `/metrics` Prometheus com 28+ gauges operacionais

**Qual a principal mensagem para o avaliador?**

Em menos de um minuto, o avaliador vê um nó Bitcoin Core em ação: uma transação entra na mempool, o ZMQ dispara, o bloco a confirma e um proof report captura todo o rastro de auditoria — sem necessidade de terminal manual.
