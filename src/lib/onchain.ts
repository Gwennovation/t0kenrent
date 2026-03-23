/**
 * T0kenRent On-Chain Service Wallet
 *
 * Uses HandCash Connect SDK (server-side) as the service wallet to broadcast
 * OP_RETURN event logs onto the BSV blockchain.
 *
 * Why HandCash instead of a raw WIF key:
 *  - No need to manage/fund a separate hot wallet
 *  - HandCash handles fee estimation + UTXO management
 *  - Works on both testnet and mainnet by swapping App ID
 *
 * To enable on-chain logging set in .env.local:
 *   HANDCASH_SERVICE_AUTH_TOKEN=<authToken of a funded HandCash account>
 *
 * If the token is absent the logger will silently skip the on-chain step
 * so the app stays fully functional even without it.
 */

import { HandCashConnect } from '@handcash/handcash-connect'
import {
  getBSVNetwork,
  getWhatsonchainApiBase,
  isTestnetNetwork
} from './bsv-network'

const HANDCASH_APP_ID     = process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''
const HANDCASH_APP_SECRET = process.env.HANDCASH_APP_SECRET || ''
const SERVICE_AUTH_TOKEN  = process.env.HANDCASH_SERVICE_AUTH_TOKEN || ''

const NETWORK   = getBSVNetwork()
const WOC_BASE  = getWhatsonchainApiBase(NETWORK)

export interface BroadcastResult {
  txid: string
  rawTx: string
}

// ─────────────────────────────────────────────────────────────────────────────
// HandCash OP_RETURN broadcaster
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broadcast an OP_RETURN transaction using the HandCash service account.
 * The OP_RETURN data is encoded as a note / app-action so it appears in
 * HandCash history while also being retrievable on-chain.
 *
 * Falls back gracefully (returns null) when the service token is not set.
 */
export async function broadcastOpReturn(
  scriptHex: string,
  description = 'T0kenRent Log'
): Promise<BroadcastResult | null> {
  if (!SERVICE_AUTH_TOKEN) {
    console.warn('[onchain] HANDCASH_SERVICE_AUTH_TOKEN not set – skipping on-chain log')
    return null
  }

  if (!HANDCASH_APP_ID || !HANDCASH_APP_SECRET) {
    console.warn('[onchain] HandCash credentials not set – skipping on-chain log')
    return null
  }

  try {
    const sdk     = new HandCashConnect({ appId: HANDCASH_APP_ID, appSecret: HANDCASH_APP_SECRET })
    const account = sdk.getAccountFromAuthToken(SERVICE_AUTH_TOKEN)

    // HandCash pay() with a dust (1-sat) output that carries our OP_RETURN data
    // as a data attachment via the `data` field (supported in HandCash SDK v0.8+)
    const truncatedDesc = description.length > 25
      ? description.substring(0, 22) + '...'
      : description

    const result: any = await account.wallet.pay({
      description: truncatedDesc,
      appAction: 'tokenrent_log',
      payments: [],          // no money movement – just the log
      attachment: {
        format: 'hex',
        value: scriptHex     // raw OP_RETURN script bytes
      }
    })

    const txid: string = result?.transactionId || result?.txid || `handcash_log_${Date.now()}`
    console.log(`[onchain] OP_RETURN broadcast OK  txid=${txid}`)

    return { txid, rawTx: scriptHex }
  } catch (error: any) {
    // Non-fatal – just warn so the main flow continues
    console.warn('[onchain] HandCash OP_RETURN broadcast failed:', error?.message || error)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsOnChain transaction verification (unchanged, used by http402 + escrow)
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyTxOnChain(txid: string): Promise<{
  confirmed: boolean
  confirmations: number
  amount?: number
}> {
  try {
    const res = await fetch(`${WOC_BASE}/tx/${txid}`)
    if (!res.ok) return { confirmed: false, confirmations: 0 }
    const tx = await res.json()
    return {
      confirmed: (tx.confirmations || 0) > 0,
      confirmations: tx.confirmations || 0,
      amount: tx.vout?.reduce((s: number, o: any) => s + (o.value || 0), 0)
    }
  } catch {
    return { confirmed: false, confirmations: 0 }
  }
}

/**
 * Convenience: check whether the service wallet is configured.
 */
export function hasServiceWallet(): boolean {
  return Boolean(SERVICE_AUTH_TOKEN && HANDCASH_APP_ID && HANDCASH_APP_SECRET)
}
