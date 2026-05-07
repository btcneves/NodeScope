import type { Lang } from './types'

export interface GlossaryEntry {
  term: string
  'pt-BR': string
  'en-US': string
}

export const glossary: GlossaryEntry[] = [
  {
    term: 'Bitcoin Core',
    'pt-BR': 'Implementação de referência do protocolo Bitcoin. Executa validação completa de blocos e transações.',
    'en-US': 'The reference implementation of the Bitcoin protocol. Performs full block and transaction validation.',
  },
  {
    term: 'RPC',
    'pt-BR': 'Interface usada pelo NodeScope para consultar e executar comandos no Bitcoin Core via JSON-RPC.',
    'en-US': 'Interface used by NodeScope to query and execute commands on Bitcoin Core via JSON-RPC.',
  },
  {
    term: 'ZMQ',
    'pt-BR': 'Canal de eventos em tempo real usado pelo Bitcoin Core para publicar transações e blocos via ZeroMQ.',
    'en-US': 'Real-time event channel used by Bitcoin Core to publish transactions and blocks via ZeroMQ.',
  },
  {
    term: 'Regtest',
    'pt-BR': 'Rede local de teste do Bitcoin Core. Permite minerar blocos instantaneamente sem dinheiro real.',
    'en-US': 'Bitcoin Core local test network. Allows instant block mining with no real money involved.',
  },
  {
    term: 'Mempool',
    'pt-BR': 'Área temporária onde transações válidas aguardam confirmação em bloco. Cada nó mantém sua própria mempool.',
    'en-US': 'Temporary holding area for valid unconfirmed transactions awaiting block inclusion. Each node maintains its own mempool.',
  },
  {
    term: 'TXID',
    'pt-BR': 'Identificador único de uma transação Bitcoin. É o hash SHA256d da transação serializada.',
    'en-US': 'Unique identifier for a Bitcoin transaction. It is the SHA256d hash of the serialized transaction.',
  },
  {
    term: 'WTXID',
    'pt-BR': 'Transaction ID que inclui dados de witness (SegWit). Diferente do TXID quando há inputs SegWit.',
    'en-US': 'Transaction ID that includes witness data (SegWit). Differs from TXID when SegWit inputs are present.',
  },
  {
    term: 'Input',
    'pt-BR': 'Referência a um output não gasto (UTXO) que está sendo consumido por esta transação.',
    'en-US': 'Reference to an unspent output (UTXO) being consumed by this transaction.',
  },
  {
    term: 'Output',
    'pt-BR': 'Novo UTXO criado por esta transação. Define valor e condições de gasto (scriptPubKey).',
    'en-US': 'New UTXO created by this transaction. Defines the value and spending conditions (scriptPubKey).',
  },
  {
    term: 'Change',
    'pt-BR': 'Output que devolve o troco ao remetente após subtrair o valor enviado e a taxa.',
    'en-US': 'Output that returns excess funds to the sender after the sent amount and fee are deducted.',
  },
  {
    term: 'Fee',
    'pt-BR': 'Taxa paga ao minerador. Calculada como: soma dos inputs − soma dos outputs.',
    'en-US': 'Fee paid to the miner. Calculated as: sum of inputs − sum of outputs.',
  },
  {
    term: 'Fee rate',
    'pt-BR': 'Taxa por unidade de tamanho virtual (sat/vbyte). Determina a prioridade na mempool.',
    'en-US': 'Fee per unit of virtual size (sat/vbyte). Determines mempool priority.',
  },
  {
    term: 'vbytes',
    'pt-BR': 'Tamanho virtual da transação em bytes. Transações SegWit têm vbytes menores que o tamanho bruto.',
    'en-US': 'Virtual size of the transaction in bytes. SegWit transactions have smaller vbytes than raw byte size.',
  },
  {
    term: 'Weight',
    'pt-BR': 'Medida interna de tamanho pós-SegWit. 1 vbyte = 4 weight units (WU). Limita o tamanho do bloco.',
    'en-US': 'Internal post-SegWit size measure. 1 vbyte = 4 weight units (WU). Constrains block size.',
  },
  {
    term: 'Block',
    'pt-BR': 'Conjunto de transações confirmadas ligadas à cadeia via proof-of-work.',
    'en-US': 'Set of confirmed transactions linked to the chain via proof-of-work.',
  },
  {
    term: 'Block hash',
    'pt-BR': 'Identificador único do bloco. É o hash SHA256d do cabeçalho do bloco.',
    'en-US': 'Unique block identifier. It is the SHA256d hash of the block header.',
  },
  {
    term: 'Block height',
    'pt-BR': 'Posição do bloco na cadeia. O bloco gênese tem altura 0.',
    'en-US': 'Block position in the chain. The genesis block has height 0.',
  },
  {
    term: 'Confirmation',
    'pt-BR': 'Número de blocos minerados após o bloco que inclui a transação. Mais confirmações = mais segurança.',
    'en-US': 'Number of blocks mined after the block that includes the transaction. More confirmations = more security.',
  },
  {
    term: 'rawtx',
    'pt-BR': 'Evento ZMQ publicado quando uma nova transação entra na mempool. Contém os bytes brutos da transação.',
    'en-US': 'ZMQ event published when a new transaction enters the mempool. Contains raw transaction bytes.',
  },
  {
    term: 'rawblock',
    'pt-BR': 'Evento ZMQ publicado quando um novo bloco é conectado à cadeia. Contém os bytes brutos do bloco.',
    'en-US': 'ZMQ event published when a new block is connected to the chain. Contains raw block bytes.',
  },
  {
    term: 'Normal transaction',
    'pt-BR': 'Transação padrão que atende à taxa mínima de relay. Entra na mempool imediatamente e é confirmada no próximo bloco minerado.',
    'en-US': 'Standard transaction meeting the minimum relay fee. Enters the mempool immediately and confirms in the next mined block.',
  },
  {
    term: 'Low fee',
    'pt-BR': 'Transação com taxa próxima do mínimo (1 sat/vbyte). Pode demorar para confirmar ou ser despejada se a mempool encher.',
    'en-US': 'Transaction with fee rate near the minimum threshold (1 sat/vbyte). May be slow to confirm or evicted if the mempool fills.',
  },
  {
    term: 'RBF',
    'pt-BR': 'Replace-By-Fee (BIP125): permite substituir uma transação não confirmada por outra com taxa maior.',
    'en-US': 'Replace-By-Fee (BIP125): allows replacing an unconfirmed transaction with a higher-fee version.',
  },
  {
    term: 'CPFP',
    'pt-BR': 'Child-Pays-For-Parent: uma transação filha com taxa alta ajuda a confirmar a transação pai.',
    'en-US': 'Child-Pays-For-Parent: a high-fee child transaction helps confirm a stuck parent transaction.',
  },
  {
    term: 'Reorg',
    'pt-BR': 'Reorganização da cadeia quando uma cadeia alternativa com mais trabalho passa a ser considerada válida.',
    'en-US': 'Chain reorganization when an alternative chain with more proof-of-work becomes canonical.',
  },
  {
    term: 'Cluster mempool',
    'pt-BR': 'Recurso do Bitcoin Core v28+ que agrupa transações relacionadas para melhorar decisões de fee.',
    'en-US': 'Bitcoin Core v28+ feature that groups related transactions to improve fee-based decisions.',
  },
  {
    term: 'Proof Report',
    'pt-BR': 'Resumo auditável gerado pelo NodeScope com evidências verificáveis da execução da demo.',
    'en-US': 'Auditable summary generated by NodeScope with verifiable evidence of the demo execution.',
  },
  {
    term: 'Wallet',
    'pt-BR': 'Carteira gerenciada pelo Bitcoin Core. Armazena chaves e UTXOs. No regtest, usada apenas para teste.',
    'en-US': 'Wallet managed by Bitcoin Core. Stores keys and UTXOs. In regtest, used for testing only.',
  },
  {
    term: 'replaceable',
    'pt-BR': 'Indica se uma transação sinaliza RBF (sequência < 0xFFFFFFFE). Pode ser substituída por taxa maior.',
    'en-US': 'Indicates whether a transaction signals RBF (sequence < 0xFFFFFFFE). Can be replaced with a higher fee.',
  },
  {
    term: 'estimatesmartfee',
    'pt-BR': 'RPC do Bitcoin Core que estima a taxa mínima (BTC/kvB) para confirmação em N blocos, com base no histórico de blocos.',
    'en-US': 'Bitcoin Core RPC that estimates the minimum fee rate (BTC/kvB) for confirmation within N blocks, based on block history.',
  },
  {
    term: 'confirmation target',
    'pt-BR': 'Número de blocos dentro do qual a transação deve ser confirmada. Menor alvo = maior taxa estimada.',
    'en-US': 'Number of blocks within which the transaction should confirm. Lower target = higher estimated fee.',
  },
  {
    term: 'sat/vB',
    'pt-BR': 'Satoshis por vbyte — unidade padrão de taxa em Bitcoin. 1 sat/vB = 100.000 BTC/kvB.',
    'en-US': 'Satoshis per virtual byte — the standard Bitcoin fee rate unit. 1 sat/vB = 100,000 BTC/kvB.',
  },
  {
    term: 'BTC/kvB',
    'pt-BR': 'Bitcoin por kilovbyte — unidade retornada pelo RPC estimatesmartfee. Converta para sat/vB multiplicando por 100.000.',
    'en-US': 'Bitcoin per kilovirtual-byte — the unit returned by estimatesmartfee. Convert to sat/vB by multiplying by 100,000.',
  },
  {
    term: 'economical mode',
    'pt-BR': 'Modo de estimativa que prioriza taxa mais baixa, aceitando confirmação potencialmente mais lenta.',
    'en-US': 'Fee estimation mode that prioritises a lower fee, accepting potentially slower confirmation.',
  },
  {
    term: 'conservative mode',
    'pt-BR': 'Modo de estimativa mais cauteloso que sugere taxa mais alta para maior probabilidade de confirmação rápida.',
    'en-US': 'More cautious estimation mode that suggests a higher fee for a better chance of fast confirmation.',
  },
]

export function getGlossaryEntry(term: string, lang: Lang): string | undefined {
  const entry = glossary.find(g => g.term.toLowerCase() === term.toLowerCase())
  return entry ? entry[lang] : undefined
}
