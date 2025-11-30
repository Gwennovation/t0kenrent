/**
 * PushDrop Token Implementation for T0kenRent
 * 
 * PushDrop tokens are used to create on-chain proof-of-rental records
 * that serve as immutable receipts for rental transactions.
 * 
 * References:
 * - BRC-48 PushDrop Token Standard
 * - https://github.com/p2ppsr/pushdrop
 */

import { Script } from '@bsv/sdk'
import { Buffer } from 'buffer'

// PushDrop protocol prefix
const PUSHDROP_PREFIX = '1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5'
const PROTOCOL_ID = 'T0kenRent'
const RENTAL_BASKET = 'Rental Proofs'

/**
 * Rental Proof Token metadata structure
 */
export interface RentalProofToken {
  // Core rental data
  rentalId: string
  assetId: string
  assetName: string
  tokenId: string
  
  // Parties
  ownerKey: string
  renterKey: string
  
  // Rental terms
  startDate: string
  endDate: string
  rentalDays: number
  rentalFee: number
  depositAmount: number
  totalAmount: number
  currency: string
  
  // Status
  status: 'created' | 'active' | 'completed' | 'cancelled'
  
  // Timestamps
  createdAt: string
  completedAt?: string
  
  // Transaction references
  escrowTxId?: string
  paymentTxId?: string
  releaseTxId?: string
}

/**
 * Create a PushDrop token script for a rental proof
 * 
 * The token structure follows BRC-48 PushDrop format:
 * OP_FALSE OP_RETURN <protocol_id> <fields...>
 */
export function createRentalProofScript(token: RentalProofToken): string {
  // Serialize token data as fields
  const fields: Buffer[] = [
    Buffer.from(PROTOCOL_ID),
    Buffer.from('RENTAL_PROOF'),
    Buffer.from(token.rentalId),
    Buffer.from(token.assetId),
    Buffer.from(token.tokenId),
    Buffer.from(token.ownerKey),
    Buffer.from(token.renterKey),
    Buffer.from(token.startDate),
    Buffer.from(token.endDate),
    Buffer.from(String(token.rentalDays)),
    Buffer.from(String(token.rentalFee)),
    Buffer.from(String(token.depositAmount)),
    Buffer.from(String(token.totalAmount)),
    Buffer.from(token.currency),
    Buffer.from(token.status),
    Buffer.from(token.createdAt)
  ]

  // Add optional fields
  if (token.completedAt) {
    fields.push(Buffer.from('COMPLETED_AT'))
    fields.push(Buffer.from(token.completedAt))
  }
  
  if (token.escrowTxId) {
    fields.push(Buffer.from('ESCROW_TX'))
    fields.push(Buffer.from(token.escrowTxId))
  }
  
  if (token.paymentTxId) {
    fields.push(Buffer.from('PAYMENT_TX'))
    fields.push(Buffer.from(token.paymentTxId))
  }
  
  if (token.releaseTxId) {
    fields.push(Buffer.from('RELEASE_TX'))
    fields.push(Buffer.from(token.releaseTxId))
  }

  // Create OP_RETURN script with pushdata fields
  const hexFields = fields.map(f => f.toString('hex'))
  
  try {
    const script = Script.fromASM(`OP_FALSE OP_RETURN ${hexFields.join(' ')}`)
    return script.toHex()
  } catch (error) {
    // Fallback to simplified format if Script fails
    console.error('Script creation error, using fallback:', error)
    return createFallbackScript(hexFields)
  }
}

/**
 * Create a simplified fallback script if BSV SDK fails
 */
function createFallbackScript(hexFields: string[]): string {
  // OP_FALSE = 0x00, OP_RETURN = 0x6a
  const prefix = '006a'
  const dataFields = hexFields.map(hex => {
    const len = hex.length / 2
    if (len < 76) {
      // OP_PUSHDATA1 format
      return len.toString(16).padStart(2, '0') + hex
    } else if (len < 256) {
      // OP_PUSHDATA1 explicit
      return '4c' + len.toString(16).padStart(2, '0') + hex
    } else {
      // OP_PUSHDATA2
      return '4d' + len.toString(16).padStart(4, '0') + hex
    }
  }).join('')
  
  return prefix + dataFields
}

/**
 * Parse a rental proof from a PushDrop script
 */
export function parseRentalProofScript(scriptHex: string): RentalProofToken | null {
  try {
    const script = Script.fromHex(scriptHex)
    const chunks = script.chunks
    
    // Extract data from chunks (skip OP_FALSE and OP_RETURN)
    const fields: string[] = []
    for (let i = 2; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (chunk.data) {
        const buf = Buffer.from(chunk.data as number[])
        fields.push(buf.toString('utf8'))
      }
    }
    
    // Validate protocol
    if (fields[0] !== PROTOCOL_ID || fields[1] !== 'RENTAL_PROOF') {
      return null
    }
    
    // Parse core fields
    const token: RentalProofToken = {
      rentalId: fields[2],
      assetId: fields[3],
      assetName: '', // Will be filled from external data
      tokenId: fields[4],
      ownerKey: fields[5],
      renterKey: fields[6],
      startDate: fields[7],
      endDate: fields[8],
      rentalDays: parseInt(fields[9]) || 0,
      rentalFee: parseFloat(fields[10]) || 0,
      depositAmount: parseFloat(fields[11]) || 0,
      totalAmount: parseFloat(fields[12]) || 0,
      currency: fields[13] || 'USD',
      status: fields[14] as any || 'created',
      createdAt: fields[15]
    }
    
    // Parse optional fields
    for (let i = 16; i < fields.length; i += 2) {
      const key = fields[i]
      const value = fields[i + 1]
      
      if (key === 'COMPLETED_AT') {
        token.completedAt = value
      } else if (key === 'ESCROW_TX') {
        token.escrowTxId = value
      } else if (key === 'PAYMENT_TX') {
        token.paymentTxId = value
      } else if (key === 'RELEASE_TX') {
        token.releaseTxId = value
      }
    }
    
    return token
  } catch (error) {
    console.error('Failed to parse rental proof script:', error)
    return null
  }
}

/**
 * Create a PushDrop token for rental creation (proof that rental was initiated)
 */
export async function createRentalCreationToken(rentalData: {
  rentalId: string
  assetId: string
  assetName: string
  tokenId: string
  ownerKey: string
  renterKey: string
  startDate: string
  endDate: string
  rentalDays: number
  rentalFee: number
  depositAmount: number
  totalAmount: number
  currency: string
  paymentTxId?: string
  escrowTxId?: string
}): Promise<{ script: string; token: RentalProofToken }> {
  const token: RentalProofToken = {
    ...rentalData,
    status: 'active',
    createdAt: new Date().toISOString()
  }
  
  const script = createRentalProofScript(token)
  
  return { script, token }
}

/**
 * Create a PushDrop token for rental completion (proof that rental was returned)
 */
export async function createRentalCompletionToken(
  originalToken: RentalProofToken,
  releaseTxId?: string
): Promise<{ script: string; token: RentalProofToken }> {
  const token: RentalProofToken = {
    ...originalToken,
    status: 'completed',
    completedAt: new Date().toISOString(),
    releaseTxId
  }
  
  const script = createRentalProofScript(token)
  
  return { script, token }
}

/**
 * Get Babbage SDK action parameters for minting a rental proof token
 */
export function getRentalProofActionParams(token: RentalProofToken): {
  description: string
  outputs: Array<{ satoshis: number; script: string; basket: string }>
} {
  const script = createRentalProofScript(token)
  
  return {
    description: `T0kenRent Rental Proof: ${token.assetName || token.assetId} (${token.status})`,
    outputs: [
      {
        satoshis: 1, // Minimum dust amount for token
        script,
        basket: RENTAL_BASKET
      }
    ]
  }
}

/**
 * Encode rental metadata for BRC-76 compliant token
 */
export function encodeBRC76Metadata(rental: {
  assetId: string
  assetName: string
  ownerKey: string
  renterKey: string
  startDate: string
  endDate: string
  totalAmount: number
}): string {
  const metadata = {
    protocol: 'T0kenRent',
    version: '1.0',
    type: 'rental_agreement',
    asset: {
      id: rental.assetId,
      name: rental.assetName
    },
    parties: {
      owner: rental.ownerKey,
      renter: rental.renterKey
    },
    terms: {
      startDate: rental.startDate,
      endDate: rental.endDate,
      amount: rental.totalAmount
    },
    timestamp: new Date().toISOString()
  }
  
  return JSON.stringify(metadata)
}

/**
 * Create unlock fee payment proof (for HTTP 402 flow)
 */
export function createUnlockPaymentScript(data: {
  assetId: string
  assetName: string
  payerKey: string
  recipientKey: string
  amount: number
  txId: string
}): string {
  const fields: Buffer[] = [
    Buffer.from(PROTOCOL_ID),
    Buffer.from('UNLOCK_PAYMENT'),
    Buffer.from(data.assetId),
    Buffer.from(data.assetName),
    Buffer.from(data.payerKey),
    Buffer.from(data.recipientKey),
    Buffer.from(String(data.amount)),
    Buffer.from(data.txId),
    Buffer.from(new Date().toISOString())
  ]
  
  const hexFields = fields.map(f => f.toString('hex'))
  
  try {
    const script = Script.fromASM(`OP_FALSE OP_RETURN ${hexFields.join(' ')}`)
    return script.toHex()
  } catch (error) {
    return createFallbackScript(hexFields)
  }
}

export default {
  createRentalProofScript,
  parseRentalProofScript,
  createRentalCreationToken,
  createRentalCompletionToken,
  getRentalProofActionParams,
  encodeBRC76Metadata,
  createUnlockPaymentScript,
  PROTOCOL_ID,
  RENTAL_BASKET
}
