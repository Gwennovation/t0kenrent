/**
 * T0kenRent Overlay Network Integration
 * 
 * Handles on-chain transaction broadcasting and querying via BSV overlay network.
 * Used for rental proofs, escrow events, and payment verification.
 */

import { createAction } from 'babbage-sdk'
import { Script } from '@bsv/sdk'
import { Buffer } from 'buffer'

const OVERLAY_URL: string =
  process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'

// Topic markers for T0kenRent transactions
const TOPICS = {
  RENTAL: 'tm_tokenrent',        // Rental events (create, complete)
  ESCROW: 'tm_tokenrent_escrow', // Escrow events (fund, release)
  PAYMENT: 'tm_tokenrent_402'    // HTTP 402 payment events
}

const LOOKUP_SERVICE = 'ls_tokenrent'

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

export type RentalEventType = 'created' | 'funded' | 'active' | 'completed' | 'cancelled'
export type EscrowEventType = 'created' | 'funded' | 'released' | 'disputed'
export type PaymentEventType = 'initiated' | 'verified' | 'failed'

// ============================================================================
// TRANSACTION BROADCASTING
// ============================================================================

/**
 * Broadcast transaction to overlay network
 */
export async function broadcastToOverlay(
  tx: any,
  topic: string,
  metadata?: Record<string, string>
): Promise<{ txid: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'X-Topics': JSON.stringify([topic])
    }
    
    // Add custom metadata headers
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        headers[`X-${key}`] = value
      })
    }

    const response = await fetch(`${OVERLAY_URL}/submit`, {
      method: 'POST',
      headers,
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

// ============================================================================
// RENTAL EVENT LOGGING
// ============================================================================

export interface RentalEventData {
  rentalId: string
  assetId: string
  assetName: string
  renterKey: string
  ownerKey: string
  eventType: RentalEventType
  startDate?: string
  endDate?: string
  rentalFee?: number
  depositAmount?: number
  escrowId?: string
  metadata?: Record<string, any>
}

/**
 * Log a rental event on the overlay network
 */
export async function logRentalEvent(data: RentalEventData): Promise<string> {
  try {
    const script = createRentalEventScript(data)
    
    const result: any = await createAction({
      description: `T0kenRent: ${data.eventType} - ${data.assetName}`,
      outputs: [
        {
          satoshis: 1,
          script,
          basket: 'T0kenRent Rentals'
        }
      ]
    })

    await broadcastToOverlay(result, TOPICS.RENTAL, {
      'Rental-ID': data.rentalId,
      'Asset-ID': data.assetId,
      'Event-Type': data.eventType
    })

    return result.txid
  } catch (error: unknown) {
    console.error('Failed to log rental event:', error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to log rental event: ${message}`)
  }
}

/**
 * Create OP_RETURN script for rental event
 */
function createRentalEventScript(data: RentalEventData): string {
  const fields: Buffer[] = [
    Buffer.from('TOKENRENT'),
    Buffer.from('RENTAL'),
    Buffer.from(data.eventType.toUpperCase()),
    Buffer.from(data.rentalId),
    Buffer.from(data.assetId),
    Buffer.from(data.renterKey),
    Buffer.from(data.ownerKey),
    Buffer.from(String(data.rentalFee || 0)),
    Buffer.from(String(data.depositAmount || 0)),
    Buffer.from(data.escrowId || ''),
    Buffer.from(new Date().toISOString())
  ]

  const hexFields = fields.map(f => f.toString('hex')).join(' ')

  const script = Script.fromASM(
    `OP_FALSE OP_RETURN ${hexFields}`.trim()
  )

  return script.toHex()
}

// ============================================================================
// ESCROW EVENT LOGGING
// ============================================================================

export interface EscrowEventData {
  escrowId: string
  rentalId: string
  eventType: EscrowEventType
  renterKey: string
  ownerKey: string
  totalAmount: number
  depositAmount: number
  rentalFee: number
  releaseType?: 'standard' | 'partial' | 'full_to_owner'
  damageDeduction?: number
  fundingTxid?: string
  releaseTxid?: string
}

/**
 * Log an escrow event on the overlay network
 */
export async function logEscrowEvent(data: EscrowEventData): Promise<string> {
  try {
    const script = createEscrowEventScript(data)
    
    const result: any = await createAction({
      description: `T0kenRent Escrow: ${data.eventType} - ${data.escrowId}`,
      outputs: [
        {
          satoshis: 1,
          script,
          basket: 'T0kenRent Escrow'
        }
      ]
    })

    await broadcastToOverlay(result, TOPICS.ESCROW, {
      'Escrow-ID': data.escrowId,
      'Rental-ID': data.rentalId,
      'Event-Type': data.eventType
    })

    return result.txid
  } catch (error: unknown) {
    console.error('Failed to log escrow event:', error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to log escrow event: ${message}`)
  }
}

/**
 * Create OP_RETURN script for escrow event
 */
function createEscrowEventScript(data: EscrowEventData): string {
  const fields: Buffer[] = [
    Buffer.from('TOKENRENT'),
    Buffer.from('ESCROW'),
    Buffer.from(data.eventType.toUpperCase()),
    Buffer.from(data.escrowId),
    Buffer.from(data.rentalId),
    Buffer.from(data.renterKey),
    Buffer.from(data.ownerKey),
    Buffer.from(String(data.totalAmount)),
    Buffer.from(String(data.depositAmount)),
    Buffer.from(String(data.rentalFee)),
    Buffer.from(data.releaseType || ''),
    Buffer.from(String(data.damageDeduction || 0)),
    Buffer.from(new Date().toISOString())
  ]

  const hexFields = fields.map(f => f.toString('hex')).join(' ')

  const script = Script.fromASM(
    `OP_FALSE OP_RETURN ${hexFields}`.trim()
  )

  return script.toHex()
}

// ============================================================================
// HTTP 402 PAYMENT LOGGING
// ============================================================================

export interface PaymentEventData {
  paymentRef: string
  assetId: string
  payerKey: string
  recipientKey: string
  amount: number
  eventType: PaymentEventType
  paymentTxid?: string
}

/**
 * Log an HTTP 402 payment event on the overlay network
 */
export async function logPaymentEvent(data: PaymentEventData): Promise<string> {
  try {
    const script = createPaymentEventScript(data)
    
    const result: any = await createAction({
      description: `T0kenRent 402 Payment: ${data.eventType}`,
      outputs: [
        {
          satoshis: 1,
          script,
          basket: 'T0kenRent Payments'
        }
      ]
    })

    await broadcastToOverlay(result, TOPICS.PAYMENT, {
      'Payment-Ref': data.paymentRef,
      'Asset-ID': data.assetId,
      'Event-Type': data.eventType
    })

    return result.txid
  } catch (error: unknown) {
    console.error('Failed to log payment event:', error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to log payment event: ${message}`)
  }
}

/**
 * Create OP_RETURN script for payment event
 */
function createPaymentEventScript(data: PaymentEventData): string {
  const fields: Buffer[] = [
    Buffer.from('TOKENRENT'),
    Buffer.from('402PAY'),
    Buffer.from(data.eventType.toUpperCase()),
    Buffer.from(data.paymentRef),
    Buffer.from(data.assetId),
    Buffer.from(data.payerKey),
    Buffer.from(data.recipientKey),
    Buffer.from(String(data.amount)),
    Buffer.from(data.paymentTxid || ''),
    Buffer.from(new Date().toISOString())
  ]

  const hexFields = fields.map(f => f.toString('hex')).join(' ')

  const script = Script.fromASM(
    `OP_FALSE OP_RETURN ${hexFields}`.trim()
  )

  return script.toHex()
}

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

/**
 * Query rental transactions by rental ID
 */
export async function getRentalTransactions(rentalId: string): Promise<OverlayTransaction[]> {
  try {
    const response = await fetch(`${OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: LOOKUP_SERVICE,
        query: { rentalId, type: 'rental' }
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return (data.transactions as OverlayTransaction[]) || []
  } catch (error: unknown) {
    console.error('Failed to fetch rental transactions:', error)
    return []
  }
}

/**
 * Query escrow transactions by escrow ID
 */
export async function getEscrowTransactions(escrowId: string): Promise<OverlayTransaction[]> {
  try {
    const response = await fetch(`${OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: LOOKUP_SERVICE,
        query: { escrowId, type: 'escrow' }
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return (data.transactions as OverlayTransaction[]) || []
  } catch (error: unknown) {
    console.error('Failed to fetch escrow transactions:', error)
    return []
  }
}

/**
 * Query payment transactions by payment reference
 */
export async function getPaymentTransactions(paymentRef: string): Promise<OverlayTransaction[]> {
  try {
    const response = await fetch(`${OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: LOOKUP_SERVICE,
        query: { paymentRef, type: 'payment' }
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return (data.transactions as OverlayTransaction[]) || []
  } catch (error: unknown) {
    console.error('Failed to fetch payment transactions:', error)
    return []
  }
}

/**
 * Query all transactions for a user (as renter or owner)
 */
export async function getUserTransactions(userKey: string): Promise<OverlayTransaction[]> {
  try {
    const response = await fetch(`${OVERLAY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: LOOKUP_SERVICE,
        query: { 
          $or: [
            { renterKey: userKey },
            { ownerKey: userKey }
          ]
        }
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return (data.transactions as OverlayTransaction[]) || []
  } catch (error: unknown) {
    console.error('Failed to fetch user transactions:', error)
    return []
  }
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

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

    // Transaction exists and has been confirmed
    if (tx.timestamp === 0) {
      // Unconfirmed but in mempool - for hackathon we accept this
      console.log('Transaction in mempool but unconfirmed')
    }

    // In production, parse outputs and verify amount
    // For hackathon MVP, we trust the overlay lookup
    return true
  } catch (error: unknown) {
    console.error('Payment verification failed:', error)
    return false
  }
}

// ============================================================================
// TRANSACTION PARSING
// ============================================================================

export interface ParsedRentalEvent {
  type: 'RENTAL' | 'ESCROW' | '402PAY'
  eventType: string
  rentalId?: string
  escrowId?: string
  paymentRef?: string
  assetId?: string
  renterKey?: string
  ownerKey?: string
  amount?: number
  timestamp: string
  txid: string
}

/**
 * Parse rental event from overlay transaction
 */
export function parseRentalTransaction(tx: OverlayTransaction): ParsedRentalEvent | null {
  try {
    const script = Script.fromHex(tx.outputs[0].script)
    const chunks = script.chunks

    // Extract fields from OP_RETURN data
    const fields: string[] = []
    for (const chunk of chunks) {
      if (chunk.data) {
        const buf = Buffer.from(chunk.data as number[])
        fields.push(buf.toString('utf8'))
      }
    }

    if (fields[0] !== 'TOKENRENT') {
      return null
    }

    const type = fields[1] as 'RENTAL' | 'ESCROW' | '402PAY'
    const eventType = fields[2]

    const parsed: ParsedRentalEvent = {
      type,
      eventType,
      txid: tx.txid,
      timestamp: fields[fields.length - 1]
    }

    // Parse based on type
    switch (type) {
      case 'RENTAL':
        parsed.rentalId = fields[3]
        parsed.assetId = fields[4]
        parsed.renterKey = fields[5]
        parsed.ownerKey = fields[6]
        parsed.amount = parseFloat(fields[7])
        break
        
      case 'ESCROW':
        parsed.escrowId = fields[3]
        parsed.rentalId = fields[4]
        parsed.renterKey = fields[5]
        parsed.ownerKey = fields[6]
        parsed.amount = parseFloat(fields[7])
        break
        
      case '402PAY':
        parsed.paymentRef = fields[3]
        parsed.assetId = fields[4]
        parsed.renterKey = fields[5]
        parsed.ownerKey = fields[6]
        parsed.amount = parseFloat(fields[7])
        break
    }

    return parsed
  } catch (error: unknown) {
    console.error('Failed to parse transaction:', error)
    return null
  }
}

// Export topic constants for use in other modules
export { TOPICS, LOOKUP_SERVICE }
