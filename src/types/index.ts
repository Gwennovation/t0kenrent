// Global type definitions for the application

export interface Stage {
  id: string
  title: string
  imageUrl?: string
  metadata: Record<string, any>
  requiresPayment: boolean
  rentAmount?: number
  ownerKey?: string
  duration?: number
  expiresAt?: Date
  payment?: Payment
  transactionId?: string
  createdAt?: Date
}

export interface Payment {
  txid: string
  amount: number
  status: 'pending' | 'confirmed' | 'verified' | 'failed'
  verifiedAt?: Date
  timestamp: Date
}

export interface ActionChain {
  chainId: string
  title: string
  stages: Stage[]
  ownerKey: string
  finalized: boolean
  totalRentCollected: number
  pendingPayments: number
  flow: string[]
  createdAt: Date
  updatedAt: Date
}

export interface MNEEPaymentRequest {
  recipientKey: string
  amount: number
  description: string
  chainId?: string
  stageId?: string
}

export interface PaymentVerificationResult {
  verified: boolean
  status: 'pending' | 'confirmed' | 'verified' | 'not_found' | 'amount_mismatch' | 'error'
  txid?: string
  amount?: number
  timestamp?: number
  expected?: number
  actual?: number
  error?: string
  message?: string
}

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

export interface RentStatistics {
  totalStages: number
  rentableStages: number
  totalCollected: number
  pendingPayments: number
  activeRents: number
}

// Babbage SDK types augmentation
declare global {
  interface Window {
    babbage?: any
  }
}

export interface BabbageAuthResult {
  authenticated: boolean
  identityKey?: string
}

export interface CreateActionOptions {
  description: string
  outputs: Array<{
    satoshis: number
    script: string
    basket?: string
  }>
}

export interface CreateActionResult {
  txid: string
  rawTx: string
  amount?: number
  outputs?: any[]
  toBinary?: () => Uint8Array
}
