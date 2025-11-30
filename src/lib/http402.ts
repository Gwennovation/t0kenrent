/**
 * HTTP 402 Payment Required Implementation for T0kenRent
 * 
 * Implements the HTTP 402 protocol for micropayment-gated content.
 * When a user tries to access rental details, they must pay a small
 * BSV micropayment to unlock the information.
 * 
 * Flow:
 * 1. Client requests protected resource
 * 2. Server responds with 402 + payment details
 * 3. Client makes BSV payment
 * 4. Client sends payment proof to callback
 * 5. Server verifies and returns access token
 * 6. Client uses token to access resource
 */

// UUID generation without external dependency

// Configuration
const PAYMENT_EXPIRY_MINUTES = 5
const ACCESS_TOKEN_EXPIRY_MINUTES = 30
const DEFAULT_UNLOCK_FEE_BSV = 0.0001 // ~$0.005 at $50/BSV

// BSV price for display (fetched from API in production)
let cachedBSVPrice = 50 // USD

export interface HTTP402PaymentRequest {
  // Payment details
  amount: number // in BSV
  amountSatoshis: number
  paymentAddress: string
  paymentReference: string
  
  // Resource info
  resourceId: string
  resourceType: string
  resourceName: string
  
  // Metadata
  expiresAt: string
  createdAt: string
  
  // Display
  amountUSD: string
  description: string
}

export interface HTTP402PaymentVerification {
  // Transaction details
  transactionId: string
  paymentReference: string
  amount: number
  
  // Verification result
  verified: boolean
  status: 'pending' | 'verified' | 'failed' | 'expired'
  
  // Access token (if verified)
  accessToken?: string
  accessTokenExpiry?: string
  
  // Error info
  error?: string
}

export interface HTTP402AccessToken {
  token: string
  resourceId: string
  userId?: string
  expiresAt: string
  createdAt: string
}

/**
 * Create a 402 payment request for a resource
 */
export function createPaymentRequest(params: {
  resourceId: string
  resourceType: string
  resourceName: string
  amount: number // in BSV
  paymentAddress: string
}): HTTP402PaymentRequest {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000)
  
  const amountSatoshis = Math.ceil(params.amount * 100000000)
  const amountUSD = (params.amount * cachedBSVPrice).toFixed(4)
  
  return {
    amount: params.amount,
    amountSatoshis,
    paymentAddress: params.paymentAddress,
    paymentReference: generatePaymentReference(),
    resourceId: params.resourceId,
    resourceType: params.resourceType,
    resourceName: params.resourceName,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    amountUSD: `$${amountUSD}`,
    description: `Unlock ${params.resourceName} rental details`
  }
}

/**
 * Generate HTTP 402 response headers
 */
export function getHTTP402Headers(paymentRequest: HTTP402PaymentRequest): Record<string, string> {
  return {
    'Accept-Payment': 'BSV',
    'Payment-Amount': paymentRequest.amount.toString(),
    'Payment-Amount-Satoshis': paymentRequest.amountSatoshis.toString(),
    'Payment-Address': paymentRequest.paymentAddress,
    'Payment-Reference': paymentRequest.paymentReference,
    'Payment-Expires': paymentRequest.expiresAt,
    'Payment-Currency': 'BSV',
    'Content-Type': 'application/json'
  }
}

/**
 * Generate unique payment reference
 */
export function generatePaymentReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `pay_${timestamp}_${random}`
}

/**
 * Generate access token after successful payment
 */
export function generateAccessToken(resourceId: string, userId?: string): HTTP402AccessToken {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000)
  
  const tokenData = `${resourceId}_${userId || 'anon'}_${Date.now()}_${Math.random()}`
  const token = Buffer.from(tokenData).toString('base64url')
  
  return {
    token: `tok_${token}`,
    resourceId,
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  }
}

/**
 * Validate access token
 */
export function validateAccessToken(token: string, resourceId: string): {
  valid: boolean
  expired: boolean
  error?: string
} {
  try {
    if (!token || !token.startsWith('tok_')) {
      return { valid: false, expired: false, error: 'Invalid token format' }
    }
    
    // In production, would verify against database
    // For now, just check basic structure
    const payload = token.slice(4)
    const decoded = Buffer.from(payload, 'base64url').toString()
    const [tokenResourceId] = decoded.split('_')
    
    if (tokenResourceId !== resourceId) {
      return { valid: false, expired: false, error: 'Token resource mismatch' }
    }
    
    return { valid: true, expired: false }
  } catch (error) {
    return { valid: false, expired: false, error: 'Token validation failed' }
  }
}

/**
 * Check if payment request has expired
 */
export function isPaymentExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

/**
 * Verify a BSV transaction for payment
 */
export async function verifyPayment(params: {
  transactionId: string
  paymentReference: string
  expectedAmount: number
  expectedAddress: string
}): Promise<HTTP402PaymentVerification> {
  try {
    // In demo mode, simulate verification
    if (params.transactionId.startsWith('demo_')) {
      const accessToken = generateAccessToken(params.paymentReference)
      return {
        transactionId: params.transactionId,
        paymentReference: params.paymentReference,
        amount: params.expectedAmount,
        verified: true,
        status: 'verified',
        accessToken: accessToken.token,
        accessTokenExpiry: accessToken.expiresAt
      }
    }
    
    // Verify on WhatsOnChain
    const response = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${params.transactionId}`
    )
    
    if (!response.ok) {
      return {
        transactionId: params.transactionId,
        paymentReference: params.paymentReference,
        amount: params.expectedAmount,
        verified: false,
        status: 'pending',
        error: 'Transaction not found or not yet confirmed'
      }
    }
    
    const tx = await response.json()
    
    // Check if transaction has outputs to our address
    const matchingOutput = tx.vout?.find((out: any) => {
      const addresses = out.scriptPubKey?.addresses || []
      return addresses.includes(params.expectedAddress)
    })
    
    if (!matchingOutput) {
      return {
        transactionId: params.transactionId,
        paymentReference: params.paymentReference,
        amount: params.expectedAmount,
        verified: false,
        status: 'failed',
        error: 'Payment address not found in transaction outputs'
      }
    }
    
    // Verify amount (with small tolerance for fee variations)
    const paidSatoshis = Math.floor(matchingOutput.value * 100000000)
    const expectedSatoshis = Math.ceil(params.expectedAmount * 100000000)
    
    if (paidSatoshis < expectedSatoshis * 0.99) {
      return {
        transactionId: params.transactionId,
        paymentReference: params.paymentReference,
        amount: matchingOutput.value,
        verified: false,
        status: 'failed',
        error: 'Insufficient payment amount'
      }
    }
    
    // Payment verified - generate access token
    const accessToken = generateAccessToken(params.paymentReference)
    
    return {
      transactionId: params.transactionId,
      paymentReference: params.paymentReference,
      amount: matchingOutput.value,
      verified: true,
      status: 'verified',
      accessToken: accessToken.token,
      accessTokenExpiry: accessToken.expiresAt
    }
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return {
      transactionId: params.transactionId,
      paymentReference: params.paymentReference,
      amount: params.expectedAmount,
      verified: false,
      status: 'failed',
      error: error.message
    }
  }
}

/**
 * Update cached BSV price
 */
export async function updateBSVPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.whatsonchain.com/v1/bsv/main/exchangerate')
    if (response.ok) {
      const data = await response.json()
      cachedBSVPrice = data.rate || 50
    }
  } catch (error) {
    console.error('Failed to update BSV price:', error)
  }
  return cachedBSVPrice
}

/**
 * Get current BSV price
 */
export function getBSVPrice(): number {
  return cachedBSVPrice
}

/**
 * Convert BSV to USD
 */
export function bsvToUSD(bsv: number): number {
  return bsv * cachedBSVPrice
}

/**
 * Convert USD to BSV
 */
export function usdToBSV(usd: number): number {
  return usd / cachedBSVPrice
}

export default {
  createPaymentRequest,
  getHTTP402Headers,
  generatePaymentReference,
  generateAccessToken,
  validateAccessToken,
  isPaymentExpired,
  verifyPayment,
  updateBSVPrice,
  getBSVPrice,
  bsvToUSD,
  usdToBSV,
  DEFAULT_UNLOCK_FEE_BSV
}
