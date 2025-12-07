import { PrivateKey, Address, Transaction, Script } from 'bsv'
import {
  getBSVNetwork,
  getDefaultFeePerKb,
  getMinInputSats,
  getWhatsonchainApiBase,
  isTestnetNetwork
} from './bsv-network'

const NETWORK = getBSVNetwork()
const IS_TESTNET = isTestnetNetwork(NETWORK)
const WOC_BASE = getWhatsonchainApiBase(NETWORK)

const DEFAULT_FEE_PER_KB = getDefaultFeePerKb()
const MIN_INPUT_SATS = getMinInputSats()

export interface BroadcastResult {
  txid: string
  rawTx: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

interface WhatsOnChainUtxo {
  height: number
  tx_hash: string
  tx_pos: number
  value: number
}

/**
 * Broadcast an OP_RETURN transaction using a server-managed wallet.
 * Requires process.env.BSV_ESCROW_WIF (or BSV_SERVICE_WIF) to be set and funded.
 */
export async function broadcastOpReturn(scriptHex: string, description = 'T0kenRent Log'): Promise<BroadcastResult> {
  const wif = process.env.BSV_ESCROW_WIF || process.env.BSV_SERVICE_WIF
  if (!wif) {
    throw new Error('BSV_ESCROW_WIF (or BSV_SERVICE_WIF) is not configured')
  }

  const networkName = IS_TESTNET ? 'testnet' : 'livenet'
  const privateKey = new PrivateKey(wif, networkName === 'testnet')
  const addressObj: Address = privateKey.toAddress(networkName)
  const address = addressObj.toString()

  const utxos = await fetchJson<WhatsOnChainUtxo[]>(`${WOC_BASE}/address/${address}/unspent`)

  if (!Array.isArray(utxos) || utxos.length === 0) {
    throw new Error('Service wallet has no spendable UTXOs to log escrow events')
  }

  const tx = new Transaction()
  let accumulated = 0

  const lockingScriptHex = Script.buildPublicKeyHashOut(addressObj).toHex()

  for (const utxo of utxos) {
    const value = Number(utxo.value)
    if (!Number.isFinite(value) || value <= 0) continue

    tx.from({
      txId: utxo.tx_hash,
      outputIndex: utxo.tx_pos,
      script: lockingScriptHex,
      satoshis: value
    })

    accumulated += value
    if (accumulated >= MIN_INPUT_SATS) {
      break
    }
  }

  if (tx.inputs.length === 0) {
    throw new Error('Unable to prepare inputs for service wallet transaction')
  }

  const opReturnScript = new Script(Buffer.from(scriptHex, 'hex'))

  tx.addOutput(new Transaction.Output({
    script: opReturnScript,
    satoshis: 0
  }))

  tx.feePerKb(DEFAULT_FEE_PER_KB)
  tx.change(addressObj)
  tx.sign(privateKey)

  const rawTx = tx.toString()
  const txid = (tx as any).id || tx.hash

  const broadcastResponse = await fetch(`${WOC_BASE}/tx/raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: rawTx
  })

  if (!broadcastResponse.ok) {
    const text = await broadcastResponse.text()
    throw new Error(`WhatsOnChain broadcast failed: ${text}`)
  }

  return {
    txid: typeof txid === 'string' ? txid : txid?.toString('hex'),
    rawTx
  }
}
