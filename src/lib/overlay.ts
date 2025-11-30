import { createAction } from 'babbage-sdk'

const OVERLAY_URL = process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'

export interface OverlayTransaction {
  txid: string
  rawTx: string
  outputs: Array<{
    vout: number
    satoshis: number
    script: string
    spent: boolean
  }>
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
  } catch (error) {
    console.error('Overlay broadcast error:', error)
    throw error
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
    return data.transactions || []
  } catch (error) {
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

    return await response.json()
  } catch (error) {
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
    // Create PushDrop transaction for stage data
    const result = await createAction({
      description: `Supply Chain Stage: ${stageData.title}`,
      outputs: [
        {
          satoshis: 1,
          script: await createStageScript(stageData),
          basket: 'Supply Chain Actions'
        }
      ]
    })

    // Broadcast to overlay
    await broadcastToOverlay(result, stageData.chainId)

    return result.txid
  } catch (error) {
    console.error('Failed to store stage on overlay:', error)
    throw error
  }
}

/**
 * Create locking script for supply chain stage
 */
async function createStageScript(stageData: any): Promise<string> {
  const { Script } = await import('@bsv/sdk')

  // Encode stage data as PushDrop
  const fields = [
    Buffer.from('STAGE'),
    Buffer.from(stageData.chainId),
    Buffer.from(String(stageData.stageIndex)),
    Buffer.from(stageData.title),
    Buffer.from(JSON.stringify(stageData.metadata))
  ]

  if (stageData.requiresPayment) {
    fields.push(Buffer.from('RENT'))
    fields.push(Buffer.from(String(stageData.rentAmount)))
  }

  // Create OP_RETURN script with all fields
  const hexFields = fields.map(f => f.toString('hex')).join(' ')
  
  const script = Script.fromASM(`
    OP_FALSE
    OP_RETURN
    ${hexFields}
  `)

  return script.toHex()
}

/**
 * Parse stage data from overlay transaction
 */
export function parseStageTransaction(tx: OverlayTransaction): any {
  try {
    const { Script } = require('@bsv/sdk')
    const script = Script.fromHex(tx.outputs[0].script)
    const chunks = script.chunks

    // Extract fields from OP_RETURN data
    const fields = []
    for (const chunk of chunks) {
      if (chunk.data) {
        fields.push(chunk.data.toString('utf8'))
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

    // Check for rent data
    if (fields[5] === 'RENT') {
      stageData.requiresPayment = true
      stageData.rentAmount = parseInt(fields[6])
    }

    return stageData
  } catch (error) {
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
    return data.payments || []
  } catch (error) {
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

    // Check transaction is confirmed
    if (tx.timestamp === 0) {
      return false // Not confirmed yet
    }

    // Verify amount (implementation depends on MNEE format)
    // TODO: Parse MNEE amount from outputs
    
    return true
  } catch (error) {
    console.error('Payment verification failed:', error)
    return false
  }
}
