import { getPublicKey } from 'babbage-sdk'
import { createMNEEPayment, verifyMNEEPayment } from './mnee'
import { verifyPaymentOnOverlay } from './overlay'
import { getErrorMessage } from './error-utils'

export interface RentableStage {
  title: string
  metadata: Record<string, any>
  requiresPayment: boolean
  rentAmount: number
  duration: number
  ownerKey: string
  expiresAt: Date
}

export interface PaymentRecord {
  txid: string
  amount: number
  stageId: string
  chainId: string
  status: 'pending' | 'confirmed' | 'verified' | 'failed'
  timestamp: Date
}

export class RentCollectionService {
  private ownerKey: string | null = null

  /**
   * Initialize the service and get owner's public key
   */
  async initialize(): Promise<void> {
    try {
      this.ownerKey = await getPublicKey({
        protocolID: [2, 'Pay MNEE'],
        keyID: '1',
        counterparty: 'self'
      })
      
      console.log('Rent collection service initialized with key:', this.ownerKey)
    } catch (error) {
      console.error('Failed to initialize rent collection service:', error)
      throw error
    }
  }

  /**
   * Create a rentable supply chain stage
   */
  async createRentableStage(
    stageData: {
      title: string
      metadata: Record<string, any>
    },
    rentAmount: number,
    duration: number
  ): Promise<RentableStage> {
    if (!this.ownerKey) {
      await this.initialize()
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + duration)

    return {
      ...stageData,
      requiresPayment: true,
      rentAmount,
      duration,
      ownerKey: this.ownerKey!,
      expiresAt
    }
  }

  /**
   * Process rent payment for a stage
   */
  async processRentPayment(
    recipientKey: string,
    amount: number,
    description: string,
    chainId: string,
    stageId: string
  ): Promise<PaymentRecord> {
    try {
      // Create MNEE payment
      const { txid } = await createMNEEPayment({
        recipientKey,
        amount,
        description
      })

      // Create payment record
      const payment: PaymentRecord = {
        txid,
        amount,
        stageId,
        chainId,
        status: 'pending',
        timestamp: new Date()
      }

      // Start verification in background
      this.verifyPaymentAsync(payment)

      return payment
    } catch (error) {
      throw new Error(`Payment processing failed: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Verify payment asynchronously
   */
  private async verifyPaymentAsync(payment: PaymentRecord): Promise<void> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        // Wait before checking
        await new Promise(resolve => setTimeout(resolve, 30000)) // 30 seconds

        const verified = await verifyPaymentOnOverlay(
          payment.txid,
          payment.amount
        )

        if (verified) {
          payment.status = 'verified'
          console.log(`Payment verified: ${payment.txid}`)
          
          // Update database
          await this.updatePaymentStatus(payment)
          break
        }

        attempts++
      } catch (error) {
        console.error('Payment verification attempt failed:', error)
        attempts++
      }
    }

    if (attempts >= maxAttempts) {
      payment.status = 'failed'
      await this.updatePaymentStatus(payment)
      console.error(`Payment verification timeout: ${payment.txid}`)
    }
  }

  /**
   * Update payment status in database
   */
  private async updatePaymentStatus(payment: PaymentRecord): Promise<void> {
    try {
      await fetch('/api/payments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      })
    } catch (error) {
      console.error('Failed to update payment status:', error)
    }
  }

  /**
   * Check if payment is complete and valid
   */
  async checkPaymentStatus(txid: string): Promise<{
    verified: boolean
    status: string
    amount?: number
  }> {
    try {
      const response = await fetch(`/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid })
      })

      if (!response.ok) {
        return { verified: false, status: 'unknown' }
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to check payment status:', error)
      return { verified: false, status: 'error' }
    }
  }

  /**
   * Calculate total rent collected for a chain
   */
  async collectRentForChain(payments: PaymentRecord[]): Promise<{
    totalCollected: number
    verifiedCount: number
    pendingCount: number
  }> {
    let totalCollected = 0
    let verifiedCount = 0
    let pendingCount = 0

    for (const payment of payments) {
      const status = await this.checkPaymentStatus(payment.txid)
      
      if (status.verified) {
        totalCollected += payment.amount
        verifiedCount++
      } else if (payment.status === 'pending') {
        pendingCount++
      }
    }

    return {
      totalCollected,
      verifiedCount,
      pendingCount
    }
  }

  /**
   * Check if stage rent has expired
   */
  isRentExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * Calculate days until rent expires
   */
  daysUntilExpiration(expiresAt: Date): number {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * Get rent statistics for owner
   */
  async getRentStatistics(ownerKey: string): Promise<{
    totalStages: number
    rentableStages: number
    totalCollected: number
    pendingPayments: number
    activeRents: number
  }> {
    try {
      const response = await fetch(`/api/rent/statistics?owner=${ownerKey}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get rent statistics:', error)
      return {
        totalStages: 0,
        rentableStages: 0,
        totalCollected: 0,
        pendingPayments: 0,
        activeRents: 0
      }
    }
  }

  /**
   * Validate rent amount
   */
  validateRentAmount(amount: number): boolean {
    // Minimum rent amount
    if (amount < 1) {
      return false
    }
    
    // Maximum rent amount (anti-fraud)
    if (amount > 1000000) {
      return false
    }
    
    // Must be integer
    if (!Number.isInteger(amount)) {
      return false
    }
    
    return true
  }

  /**
   * Validate rent duration
   */
  validateDuration(days: number): boolean {
    // Minimum 1 day
    if (days < 1) {
      return false
    }
    
    // Maximum 365 days (1 year)
    if (days > 365) {
      return false
    }
    
    return true
  }
}

// Export singleton instance
export const rentService = new RentCollectionService()
