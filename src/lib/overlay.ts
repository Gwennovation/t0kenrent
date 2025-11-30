import { createAction } from 'babbage-sdk'
import { Script } from '@bsv/sdk'
import { Buffer } from 'buffer'

const OVERLAY_URL: string =
  process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'

export interface OverlayTransactionOutput {
  vout: number
  satoshis: number
  script: string
  spent: boolean
}

export interface OverlayTransaction {
  txid: string
  rawTx: string
  outputs: OverlayTransactionOutput[]
  timestamp: number
}

/**
 * Broadcast transaction to overlay network
 */
export async function broadcastToOverlay(
  tx: any,
  chainId: string
): Promise<{ txid: string }> {
  try {
    const response = await fetch(`${OVERLAY_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Topics': JSON.stringify(['tm_supplychain']),
        'X-Chain-ID': chainId
      },
      body: tx.toBinary()
    })

    if (!response.ok) {
      throw new Error(`Overlay broadcast failed: ${response.statusText}`)
    }

    const data = await response.json()
    return { txid: data.txid }
  } catch (error: unknown) {
    console.error('Overlay broadcast error:', error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Overlay broadcast error: ${message}`)
  }
}

/**
 * Query overlay for transactions by chain ID
 */
export async function getChainTransactions(
  chainId: string
): Promise<OverlayTransaction[]> {
  try {
    const response = await fetch(`${OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'ls_supplychain',
        query: { chainId }
      })
    })

    if (!response.ok) {
      throw new Error(`Lookup failed: ${response.statusText}`)
    }

    const data = await response.json()
    return (data.transactions as OverlayTransaction[]) || []
  } catch (error: unknown) {
    console.error('Overlay lookup error:', error)
    return []
  }
}

/**
 * Get transaction by TXID from overlay
 */
export async function getTransactionByTxid(
  txid: string
): Promise<OverlayTransaction | null> {
  try {
    const response = await fetch(`${OVERLAY_URL}/transaction/${txid}`)

    if (!response.ok) {
      return null
    }

    return (await response.json()) as OverlayTransaction
  } catch (error: unknown) {
    console.error('Failed to fetch transaction:', error)
    return null
  }
}

/**
 * Store supply chain stage on overlay
 */
export async function storeStageOnOverlay(stageData: {
  chainId: string
  stageIndex: number
  title: string
  metadata: Record<string, any>
  requiresPayment?: boolean
  rentAmount?: number
}): Promise<string> {
  try {
    const result: any = await createAction({
      description: `Supply Chain Stage: ${stageData.title}`,
      outputs: [
        {
          satoshis: 1,
          script: await createStageScript(stageData),
          basket: 'Supply Chain Actions'
        }
      ]
    })

    await broadcastToOverlay(result, stageData.chainId)

    return result.txid
  } catch (error: unknown) {
    console.error('Failed to store stage on overlay:', error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to store stage on overlay: ${message}`)
  }
}

/**
 * Create locking script for supply chain stage
 */
async function createStageScript(stageData: {
  chainId: string
  stageIndex: number
  title: string
  metadata: Record<string, any>
  requiresPayment?: boolean
  rentAmount?: number
}): Promise<string> {
  const fields: Buffer[] = [
    Buffer.from('STAGE'),
    Buffer.from(stageData.chainId),
    Buffer.from(String(stageData.stageIndex)),
    Buffer.from(stageData.title),
    Buffer.from(JSON.stringify(stageData.metadata))
  ]

  if (stageData.requiresPayment) {
    fields.push(Buffer.from('RENT'))
    fields.push(Buffer.from(String(stageData.rentAmount ?? 0)))
  }

  const hexFields = fields.map(f => f.toString('hex')).join(' ')

  const script = Script.fromASM(
    `
      OP_FALSE
      OP_RETURN
      ${hexFields}
    `.trim()
  )

  return script.toHex()
}

/**
 * Parse stage data from overlay transaction
 */
export function parseStageTransaction(tx: OverlayTransaction): any | null {
  try {
    const script = Script.fromHex(tx.outputs[0].script)
    const chunks = script.chunks

    // Extract fields from OP_RETURN data
    const fields: string[] = []
    for (const chunk of chunks) {
      if (chunk.data) {
        // chunk.data is typically a number[]/Uint8Array
        const buf = Buffer.from(chunk.data as number[])
        fields.push(buf.toString('utf8'))
      }
    }

    if (fields[0] !== 'STAGE') {
      throw new Error('Invalid stage transaction')
    }

    const stageData: any = {
      chainId: fields[1],
      stageIndex: parseInt(fields[2]),
      title: fields[3],
      metadata: JSON.parse(fields[4]),
      txid: tx.txid,
      timestamp: tx.timestamp
    }

    if (fields[5] === 'RENT') {
      stageData.requiresPayment = true
      stageData.rentAmount = parseInt(fields[6])
    }

    return stageData
  } catch (error: unknown) {
    console.error('Failed to parse stage transaction:', error)
    return null
  }
}

/**
 * Query payments for a specific chain
 */
export async function getChainPayments(chainId: string): Promise<any[]> {
  try {
    const response = await fetch(`${OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'ls_mnee',
        query: { chainId, type: 'payment' }
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return (data.payments as any[]) || []
  } catch (error: unknown) {
    console.error('Failed to fetch chain payments:', error)
    return []
  }
}

/**
 * Verify payment on overlay network
 */
export async function verifyPaymentOnOverlay(
  txid: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    const tx = await getTransactionByTxid(txid)

    if (!tx) {
      return false
    }

    if (tx.timestamp === 0) {
      return false
    }

    // TODO: Parse actual MNEE payment amount and compare to expectedAmount
    return true
  } catch (error: unknown) {
    console.error('Payment verification failed:', error)
    return false
  }
}
