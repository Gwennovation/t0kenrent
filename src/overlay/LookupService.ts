/**
 * T0kenRent Lookup Service - ls_tokenrent
 * 
 * Custom Overlay Lookup Service for querying T0kenRent state.
 * Implements SLAP (Services Lookup Availability Protocol) for
 * service discovery and state queries.
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 * 
 * Reference: Workshop 4 - Overlay Deployment
 */

import { TOPICS, AssetFilters } from './TopicManager'

/**
 * Overlay URL configuration
 */
const OVERLAY_URL = process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'

/**
 * Asset record from lookup service
 */
export interface AssetRecord {
  tokenId: string
  name: string
  description?: string
  category: string
  ownerKey: string
  rentalRate: number
  depositAmount: number
  currency: string
  status: 'available' | 'rented' | 'pending' | 'unavailable'
  location?: {
    city: string
    state?: string
    country?: string
  }
  createdTxid: string
  lastUpdateTxid?: string
  createdAt: number
  updatedAt?: number
}

/**
 * Escrow record from lookup service
 */
export interface EscrowRecord {
  escrowId: string
  tokenId: string
  ownerKey: string
  renterKey: string
  depositAmount: number
  rentalFee: number
  totalAmount: number
  status: 'created' | 'funded' | 'active' | 'released' | 'disputed' | 'refunded'
  timeoutBlock: number
  escrowAddress: string
  escrowScript: string
  fundingTxid?: string
  releaseTxid?: string
  createdAt: number
  fundedAt?: number
  releasedAt?: number
}

/**
 * Payment record from lookup service
 */
export interface PaymentRecord {
  paymentRef: string
  tokenId?: string
  amount: number
  currency: string
  payerKey: string
  recipientKey: string
  status: 'pending' | 'confirmed' | 'expired'
  txid: string
  confirmedAt?: number
  expiresAt: number
}

/**
 * T0kenRent Lookup Service
 */
export class TokenRentLookupService {
  private overlayUrl: string
  private serviceId: string = 'ls_tokenrent'
  
  constructor(overlayUrl?: string) {
    this.overlayUrl = overlayUrl || OVERLAY_URL
  }

  /**
   * Query the overlay lookup service
   */
  private async query(params: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.overlayUrl}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: this.serviceId,
          query: params
        })
      })
      
      if (!response.ok) {
        throw new Error(`Lookup failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Lookup query error:', error)
      throw error
    }
  }

  // ==================== Asset Queries ====================

  /**
   * Get asset by token ID
   */
  async getAssetByTokenId(tokenId: string): Promise<AssetRecord | null> {
    try {
      const result = await this.query({ tokenId, type: 'asset' })
      return result.asset || null
    } catch (error) {
      console.error('Get asset error:', error)
      return null
    }
  }

  /**
   * Get all assets owned by a public key
   */
  async getAssetsByOwner(ownerKey: string): Promise<AssetRecord[]> {
    try {
      const result = await this.query({ ownerKey, type: 'asset' })
      return result.assets || []
    } catch (error) {
      console.error('Get assets by owner error:', error)
      return []
    }
  }

  /**
   * Get available assets with optional filters
   */
  async getAvailableAssets(filters?: AssetFilters): Promise<AssetRecord[]> {
    try {
      const result = await this.query({
        type: 'asset',
        status: 'available',
        ...(filters?.category && { category: filters.category }),
        ...(filters?.minPrice && { minPrice: filters.minPrice }),
        ...(filters?.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters?.city && { city: filters.city })
      })
      return result.assets || []
    } catch (error) {
      console.error('Get available assets error:', error)
      return []
    }
  }

  /**
   * Search assets by keyword
   */
  async searchAssets(keyword: string, filters?: AssetFilters): Promise<AssetRecord[]> {
    try {
      const result = await this.query({
        type: 'asset',
        search: keyword,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.status && { status: filters.status })
      })
      return result.assets || []
    } catch (error) {
      console.error('Search assets error:', error)
      return []
    }
  }

  // ==================== Escrow Queries ====================

  /**
   * Get escrow by ID
   */
  async getEscrowById(escrowId: string): Promise<EscrowRecord | null> {
    try {
      const result = await this.query({ escrowId, type: 'escrow' })
      return result.escrow || null
    } catch (error) {
      console.error('Get escrow error:', error)
      return null
    }
  }

  /**
   * Get active escrows for a party (owner or renter)
   */
  async getActiveEscrows(partyKey: string): Promise<EscrowRecord[]> {
    try {
      const result = await this.query({
        type: 'escrow',
        partyKey,
        status: ['created', 'funded', 'active']
      })
      return result.escrows || []
    } catch (error) {
      console.error('Get active escrows error:', error)
      return []
    }
  }

  /**
   * Get escrows by token ID
   */
  async getEscrowsByToken(tokenId: string): Promise<EscrowRecord[]> {
    try {
      const result = await this.query({
        type: 'escrow',
        tokenId
      })
      return result.escrows || []
    } catch (error) {
      console.error('Get escrows by token error:', error)
      return []
    }
  }

  /**
   * Get escrows by status
   */
  async getEscrowsByStatus(status: EscrowRecord['status']): Promise<EscrowRecord[]> {
    try {
      const result = await this.query({
        type: 'escrow',
        status
      })
      return result.escrows || []
    } catch (error) {
      console.error('Get escrows by status error:', error)
      return []
    }
  }

  // ==================== Payment Queries ====================

  /**
   * Get payment status by reference
   */
  async getPaymentStatus(reference: string): Promise<PaymentRecord | null> {
    try {
      const result = await this.query({
        type: 'payment',
        paymentRef: reference
      })
      return result.payment || null
    } catch (error) {
      console.error('Get payment status error:', error)
      return null
    }
  }

  /**
   * Verify payment by transaction ID
   */
  async verifyPayment(txid: string, expectedAmount?: number): Promise<{
    verified: boolean
    payment?: PaymentRecord
    error?: string
  }> {
    try {
      const result = await this.query({
        type: 'payment',
        txid,
        ...(expectedAmount && { expectedAmount })
      })
      
      if (!result.payment) {
        return { verified: false, error: 'Payment not found' }
      }
      
      if (result.payment.status !== 'confirmed') {
        return { 
          verified: false, 
          payment: result.payment,
          error: `Payment status: ${result.payment.status}` 
        }
      }
      
      if (expectedAmount && result.payment.amount < expectedAmount) {
        return {
          verified: false,
          payment: result.payment,
          error: `Insufficient amount: ${result.payment.amount} < ${expectedAmount}`
        }
      }
      
      return { verified: true, payment: result.payment }
    } catch (error) {
      console.error('Verify payment error:', error)
      return { verified: false, error: 'Verification failed' }
    }
  }

  /**
   * Get HTTP 402 payments for a token
   */
  async get402Payments(tokenId: string): Promise<PaymentRecord[]> {
    try {
      const result = await this.query({
        type: 'payment',
        tokenId,
        paymentType: '402'
      })
      return result.payments || []
    } catch (error) {
      console.error('Get 402 payments error:', error)
      return []
    }
  }

  // ==================== Analytics Queries ====================

  /**
   * Get rental statistics for an asset
   */
  async getAssetStats(tokenId: string): Promise<{
    totalRentals: number
    totalEarnings: number
    averageRating?: number
    averageDuration?: number
  } | null> {
    try {
      const result = await this.query({
        type: 'stats',
        tokenId
      })
      return result.stats || null
    } catch (error) {
      console.error('Get asset stats error:', error)
      return null
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userKey: string): Promise<{
    assetsOwned: number
    activeRentals: number
    completedRentals: number
    totalEarnings: number
    totalSpent: number
  } | null> {
    try {
      const result = await this.query({
        type: 'stats',
        userKey
      })
      return result.stats || null
    } catch (error) {
      console.error('Get user stats error:', error)
      return null
    }
  }

  // ==================== UTXO Queries ====================

  /**
   * Get unspent outputs for an address
   */
  async getUTXOs(address: string): Promise<Array<{
    txid: string
    vout: number
    satoshis: number
    script: string
  }>> {
    try {
      const result = await this.query({
        type: 'utxo',
        address
      })
      return result.utxos || []
    } catch (error) {
      console.error('Get UTXOs error:', error)
      return []
    }
  }

  /**
   * Get escrow UTXO
   */
  async getEscrowUTXO(escrowId: string): Promise<{
    txid: string
    vout: number
    satoshis: number
    script: string
    status: string
  } | null> {
    try {
      const result = await this.query({
        type: 'utxo',
        escrowId
      })
      return result.utxo || null
    } catch (error) {
      console.error('Get escrow UTXO error:', error)
      return null
    }
  }
}

/**
 * Create lookup service instance
 */
export function createLookupService(overlayUrl?: string): TokenRentLookupService {
  return new TokenRentLookupService(overlayUrl)
}

/**
 * SLAP service discovery
 */
export async function discoverServices(): Promise<Array<{
  serviceId: string
  endpoint: string
  topics: string[]
}>> {
  try {
    const response = await fetch(`${OVERLAY_URL}/slap/services`)
    if (!response.ok) {
      throw new Error('Service discovery failed')
    }
    return await response.json()
  } catch (error) {
    console.error('Service discovery error:', error)
    return []
  }
}

export default TokenRentLookupService
