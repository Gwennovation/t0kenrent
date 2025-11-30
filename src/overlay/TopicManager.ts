/**
 * T0kenRent Topic Manager - tm_tokenrent
 * 
 * Custom Overlay Topic Manager for T0kenRent rental transactions.
 * Implements SHIP (Services Host Interconnect Protocol) for transaction
 * submission and synchronization.
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 * 
 * Reference: Workshop 4 - Overlay Deployment
 * Documentation: https://github.com/bsv-blockchain/overlay-express-examples
 */

import { Script } from '@bsv/sdk'
import { Buffer } from 'buffer'

/**
 * Topic Manager Topics
 */
export const TOPICS = {
  ASSET_CREATE: 'tokenrent.asset.create',
  ASSET_TRANSFER: 'tokenrent.asset.transfer',
  ASSET_UPDATE: 'tokenrent.asset.update',
  ESCROW_CREATE: 'tokenrent.escrow.create',
  ESCROW_FUND: 'tokenrent.escrow.fund',
  ESCROW_RELEASE: 'tokenrent.escrow.release',
  ESCROW_DISPUTE: 'tokenrent.escrow.dispute',
  PAYMENT_402: 'tokenrent.payment.402',
  RENTAL_START: 'tokenrent.rental.start',
  RENTAL_END: 'tokenrent.rental.end'
} as const

/**
 * Protocol identifiers for T0kenRent transactions
 */
export const PROTOCOL = {
  ID: 'TOKENRENT',
  VERSION: '1.0.0',
  PREFIX: 'TKR'
} as const

/**
 * Admittance rules for T0kenRent transactions
 */
export interface AdmittanceRules {
  requiredFields: string[]
  optionalFields?: string[]
  maxDataSize?: number
  requireSignature?: boolean
}

/**
 * Topic-specific admittance rules
 */
export const ADMITTANCE_RULES: Record<string, AdmittanceRules> = {
  [TOPICS.ASSET_CREATE]: {
    requiredFields: ['TOKENRENT', 'tokenId', 'name', 'ownerKey'],
    optionalFields: ['category', 'metadata', 'rentalRate', 'deposit'],
    maxDataSize: 10000, // 10KB max
    requireSignature: true
  },
  [TOPICS.ESCROW_CREATE]: {
    requiredFields: ['TOKENRENT', 'escrowId', 'tokenId', 'ownerKey', 'renterKey', 'depositAmount'],
    optionalFields: ['rentalFee', 'timeoutBlocks'],
    maxDataSize: 5000,
    requireSignature: true
  },
  [TOPICS.ESCROW_RELEASE]: {
    requiredFields: ['TOKENRENT', 'escrowId', 'ownerSig', 'renterSig'],
    maxDataSize: 2000,
    requireSignature: true
  },
  [TOPICS.PAYMENT_402]: {
    requiredFields: ['TOKENRENT', 'paymentRef', 'amount', 'recipientKey'],
    optionalFields: ['tokenId', 'metadata'],
    maxDataSize: 1000,
    requireSignature: false
  }
}

/**
 * Transaction output for topic processing
 */
export interface TopicOutput {
  vout: number
  satoshis: number
  script: string
  lockingScript: Script
  protocolData?: ParsedProtocolData
}

/**
 * Parsed protocol data from transaction
 */
export interface ParsedProtocolData {
  protocol: string
  version?: string
  topic: string
  fields: Record<string, string | number | object>
  rawData: Buffer[]
}

/**
 * Topic Manager class
 * 
 * Validates and processes T0kenRent protocol transactions
 */
export class TokenRentTopicManager {
  private overlayUrl: string
  
  constructor(overlayUrl?: string) {
    this.overlayUrl = overlayUrl || process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'
  }

  /**
   * Validate if a transaction output matches T0kenRent protocol
   */
  validateOutput(output: TopicOutput): { valid: boolean; topic?: string; error?: string } {
    try {
      const parsed = this.parseProtocolData(output.lockingScript)
      
      if (!parsed) {
        return { valid: false, error: 'Could not parse protocol data' }
      }
      
      if (parsed.protocol !== PROTOCOL.ID) {
        return { valid: false, error: `Invalid protocol: ${parsed.protocol}` }
      }
      
      // Determine topic from data structure
      const topic = this.determineTopicFromData(parsed)
      if (!topic) {
        return { valid: false, error: 'Could not determine topic' }
      }
      
      // Validate against admittance rules
      const rules = ADMITTANCE_RULES[topic]
      if (rules) {
        const validation = this.validateAdmittance(parsed, rules)
        if (!validation.valid) {
          return validation
        }
      }
      
      return { valid: true, topic }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Validation error' 
      }
    }
  }

  /**
   * Parse protocol data from locking script
   */
  parseProtocolData(script: Script): ParsedProtocolData | null {
    try {
      const chunks = script.chunks
      
      // Find OP_RETURN pattern
      let opReturnIndex = -1
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].opCodeNum === 106) { // OP_RETURN
          opReturnIndex = i
          break
        }
      }
      
      if (opReturnIndex === -1) {
        return null
      }
      
      // Extract data after OP_RETURN
      const dataChunks: Buffer[] = []
      for (let i = opReturnIndex + 1; i < chunks.length; i++) {
        if (chunks[i].data) {
          dataChunks.push(Buffer.from(chunks[i].data as number[]))
        }
      }
      
      if (dataChunks.length < 2) {
        return null
      }
      
      const protocol = dataChunks[0].toString('utf8')
      if (protocol !== PROTOCOL.ID) {
        return null
      }
      
      // Parse remaining fields based on structure
      const fields: Record<string, string | number | object> = {}
      
      // Standard field mapping (adjust based on actual protocol)
      if (dataChunks.length >= 2) fields.action = dataChunks[1].toString('utf8')
      if (dataChunks.length >= 3) fields.tokenId = dataChunks[2].toString('utf8')
      if (dataChunks.length >= 4) {
        try {
          fields.metadata = JSON.parse(dataChunks[3].toString('utf8'))
        } catch {
          fields.metadata = dataChunks[3].toString('utf8')
        }
      }
      
      // Extract additional fields
      for (let i = 4; i < dataChunks.length; i += 2) {
        if (i + 1 < dataChunks.length) {
          const key = dataChunks[i].toString('utf8')
          const value = dataChunks[i + 1].toString('utf8')
          try {
            fields[key] = JSON.parse(value)
          } catch {
            fields[key] = value
          }
        }
      }
      
      return {
        protocol,
        version: PROTOCOL.VERSION,
        topic: this.determineTopicFromAction(fields.action as string) || '',
        fields,
        rawData: dataChunks
      }
    } catch (error) {
      console.error('Parse error:', error)
      return null
    }
  }

  /**
   * Determine topic from action field
   */
  private determineTopicFromAction(action: string): string | null {
    const actionTopicMap: Record<string, string> = {
      'create': TOPICS.ASSET_CREATE,
      'transfer': TOPICS.ASSET_TRANSFER,
      'update': TOPICS.ASSET_UPDATE,
      'escrow-create': TOPICS.ESCROW_CREATE,
      'escrow-fund': TOPICS.ESCROW_FUND,
      'escrow-release': TOPICS.ESCROW_RELEASE,
      'escrow-dispute': TOPICS.ESCROW_DISPUTE,
      'payment-402': TOPICS.PAYMENT_402,
      'rental-start': TOPICS.RENTAL_START,
      'rental-end': TOPICS.RENTAL_END
    }
    
    return actionTopicMap[action] || null
  }

  /**
   * Determine topic from parsed data structure
   */
  private determineTopicFromData(data: ParsedProtocolData): string | null {
    if (data.fields.action) {
      return this.determineTopicFromAction(data.fields.action as string)
    }
    
    // Fallback: infer from field presence
    if (data.fields.escrowId && data.fields.ownerSig) {
      return TOPICS.ESCROW_RELEASE
    }
    if (data.fields.escrowId && data.fields.renterKey) {
      return TOPICS.ESCROW_CREATE
    }
    if (data.fields.paymentRef) {
      return TOPICS.PAYMENT_402
    }
    if (data.fields.tokenId && data.fields.ownerKey) {
      return TOPICS.ASSET_CREATE
    }
    
    return null
  }

  /**
   * Validate data against admittance rules
   */
  private validateAdmittance(
    data: ParsedProtocolData, 
    rules: AdmittanceRules
  ): { valid: boolean; error?: string } {
    // Check required fields
    for (const field of rules.requiredFields) {
      if (field === 'TOKENRENT') continue // Already validated
      
      if (!(field in data.fields) && !data.rawData.some(d => d.toString('utf8') === field)) {
        return { valid: false, error: `Missing required field: ${field}` }
      }
    }
    
    // Check data size
    if (rules.maxDataSize) {
      const totalSize = data.rawData.reduce((sum, buf) => sum + buf.length, 0)
      if (totalSize > rules.maxDataSize) {
        return { valid: false, error: `Data exceeds max size: ${totalSize} > ${rules.maxDataSize}` }
      }
    }
    
    return { valid: true }
  }

  /**
   * Create locking script for T0kenRent transaction
   */
  createProtocolScript(
    action: string,
    data: Record<string, string | number | object>
  ): string {
    const fields: Buffer[] = [
      Buffer.from(PROTOCOL.ID),
      Buffer.from(action)
    ]
    
    // Add data fields
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'action') {
        fields.push(Buffer.from(key))
        fields.push(Buffer.from(typeof value === 'object' ? JSON.stringify(value) : String(value)))
      }
    }
    
    const hexFields = fields.map(f => f.toString('hex')).join(' ')
    
    const script = Script.fromASM(`
      OP_FALSE
      OP_RETURN
      ${hexFields}
    `.trim())
    
    return script.toHex()
  }

  /**
   * Submit transaction to overlay
   */
  async submitToOverlay(
    tx: any,
    topic: string
  ): Promise<{ txid: string; steak?: any }> {
    try {
      const response = await fetch(`${this.overlayUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Topics': JSON.stringify(['tm_tokenrent']),
          'X-Topic-Action': topic
        },
        body: tx.toBinary()
      })
      
      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      return {
        txid: result.txid,
        steak: result.steak // STEAK acknowledgment
      }
    } catch (error) {
      console.error('Overlay submit error:', error)
      throw error
    }
  }

  /**
   * Query lookup service
   */
  async queryLookup(query: {
    service?: string
    tokenId?: string
    ownerKey?: string
    escrowId?: string
    status?: string
  }): Promise<any[]> {
    try {
      const response = await fetch(`${this.overlayUrl}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: query.service || 'ls_tokenrent',
          query: {
            ...(query.tokenId && { tokenId: query.tokenId }),
            ...(query.ownerKey && { ownerKey: query.ownerKey }),
            ...(query.escrowId && { escrowId: query.escrowId }),
            ...(query.status && { status: query.status })
          }
        })
      })
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Lookup error:', error)
      return []
    }
  }
}

/**
 * Lookup Service interface for tm_tokenrent
 */
export interface LookupService {
  // Asset queries
  getAssetByTokenId(tokenId: string): Promise<any>
  getAssetsByOwner(ownerKey: string): Promise<any[]>
  getAvailableAssets(filters?: AssetFilters): Promise<any[]>
  
  // Escrow queries
  getEscrowById(escrowId: string): Promise<any>
  getActiveEscrows(partyKey: string): Promise<any[]>
  getEscrowsByToken(tokenId: string): Promise<any[]>
  
  // Payment queries
  getPaymentStatus(reference: string): Promise<any>
  verifyPayment(txid: string): Promise<boolean>
}

export interface AssetFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  city?: string
  status?: string
}

/**
 * Create topic manager instance
 */
export function createTopicManager(overlayUrl?: string): TokenRentTopicManager {
  return new TokenRentTopicManager(overlayUrl)
}

export default TokenRentTopicManager
