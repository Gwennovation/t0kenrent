// ============================================
// T0kenRent Type Definitions
// ============================================

// ============================================
// Rental Asset Types
// ============================================

export interface RentalAsset {
  id: string
  tokenId: string
  name: string
  description: string
  category: AssetCategory
  imageUrl?: string
  condition: AssetCondition
  accessories: string[]
  
  // Pricing
  rentalRatePerDay: number
  depositAmount: number
  currency: string
  unlockFee: number
  
  // Location (public)
  location: {
    city: string
    state: string
  }
  
  // Protected (HTTP 402 gated)
  rentalDetails?: RentalDetails
  
  // Ownership
  ownerKey: string
  status: AssetStatus
  
  // Metrics
  rating?: number
  totalRentals: number
  totalEarnings: number
  
  // Blockchain
  mintTransactionId?: string
  brc76Metadata?: BRC76Metadata
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export type AssetCategory = 
  | 'photography' 
  | 'tools' 
  | 'electronics' 
  | 'sports' 
  | 'vehicles' 
  | 'other'

export type AssetCondition = 'excellent' | 'good' | 'fair'

export type AssetStatus = 'available' | 'rented' | 'pending' | 'inactive'

export interface RentalDetails {
  pickupLocation: {
    address: string
    city?: string
    state?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  accessCode?: string
  ownerContact?: {
    phone?: string
    email?: string
  }
  specialInstructions?: string
}

export interface BRC76Metadata {
  protocol: 'BRC-76'
  type: 'rental-asset'
  tokenId: string
  name: string
  category: string
  rentalRate: number
  deposit: number
  currency: string
  condition: string
  unlockFee: number
  createdAt: string
  owner: string
}

// ============================================
// HTTP 402 Payment Types
// ============================================

export interface HTTP402PaymentRequest {
  resourceId: string
  resourceType: 'rental_details'
  payerKey?: string
}

export interface HTTP402PaymentResponse {
  error: string
  message: string
  payment: {
    currency: 'BSV'
    amount: number
    address: string
    reference: string
    expiresAt: string
    expiresIn: number
    resourceId: string
    resourceType: string
  }
  asset: {
    name: string
    tokenId: string
  }
}

export interface HTTP402Payment {
  paymentReference: string
  amount: number
  payerKey?: string
  transactionId?: string
  status: 'pending' | 'paid' | 'verified' | 'expired'
  accessToken?: string
  accessTokenExpiry?: Date
  createdAt: Date
  verifiedAt?: Date
}

export interface PaymentVerificationRequest {
  paymentReference: string
  transactionId: string
  amount: number
  resourceId: string
}

export interface PaymentVerificationResponse {
  verified: boolean
  status: 'pending' | 'verified' | 'not_found' | 'expired' | 'error'
  accessToken?: string
  expiresIn?: number
  transactionId?: string
  rentalDetails?: RentalDetails
  error?: string
  message?: string
}

// ============================================
// Escrow Types
// ============================================

export interface Escrow {
  escrowId: string
  rentalTokenId: string
  assetName?: string
  
  // Parties
  ownerKey: string
  renterKey: string
  arbitratorKey?: string
  
  // Rental period
  rentalPeriod: {
    startDate: Date
    endDate: Date
  }
  
  // Financial
  depositAmount: number
  rentalFee: number
  totalAmount: number
  currency: string
  
  // Blockchain
  escrowAddress: string
  escrowScript?: string
  multisigScript?: string
  ownerPubKey?: string
  renterPubKey?: string
  timeoutBlocks: number
  fundingTxid?: string
  fundingVout?: number
  releaseTxid?: string
  
  // State
  status: EscrowStatus
  
  // Dispute
  dispute?: EscrowDispute
  
  // Release
  releaseBreakdown?: {
    toOwner: number
    toRenter: number
    toArbitrator: number
  }
  
  // Signatures
  signatures: {
    ownerSigned: boolean
    ownerSignature?: string
    ownerSignedAt?: Date
    renterSigned: boolean
    renterSignature?: string
    renterSignedAt?: Date
  }
  
  // Timestamps
  createdAt: Date
  fundedAt?: Date
  completedAt?: Date
  updatedAt: Date
}

export type EscrowStatus = 
  | 'created'
  | 'funded'
  | 'completed'
  | 'disputed'
  | 'arbitrated'
  | 'expired'
  | 'cancelled'

export interface EscrowDispute {
  raisedBy: string
  reason: string
  evidence: string[]
  raisedAt: Date
  resolvedAt?: Date
  resolution?: string
  resolvedBy?: string
}

export interface EscrowCreateRequest {
  rentalTokenId: string
  renterKey: string
  ownerKey: string
  rentalPeriod: {
    startDate: string
    endDate: string
  }
  depositAmount: number
  rentalFee: number
}

export interface EscrowCreateResponse {
  success: boolean
  escrowId: string
  escrowAddress: string
  escrowScript: string
  multisigScript: string
  requiredSignatures: number
  timeoutBlocks: number
  totalAmount: number
  status: EscrowStatus
  rentalPeriod: {
    startDate: string
    endDate: string
  }
}

export interface EscrowReleaseRequest {
  escrowId: string
  signerKey: string
  signature: string
  releaseType?: 'standard' | 'partial' | 'owner_full'
  damageAmount?: number
}

// ============================================
// Legacy Types (for compatibility)
// ============================================

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

// ============================================
// API Types
// ============================================

export interface MNEEPaymentRequest {
  recipientKey: string
  amount: number
  description: string
  chainId?: string
  stageId?: string
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
  totalAssets: number
  rentedAssets: number
  totalCollected: number
  pendingEscrows: number
  activeRentals: number
}

// ============================================
// Babbage SDK Types
// ============================================

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

// ============================================
// Utility Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiError {
  error: string
  message: string
  code?: string
}

export interface ApiSuccess<T = any> {
  success: boolean
  data?: T
  message?: string
}
