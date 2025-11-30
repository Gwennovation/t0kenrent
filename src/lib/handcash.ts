/**
 * HandCash Connect Integration for T0kenRent
 * 
 * Implements HandCash Connect SDK for wallet authentication and payments.
 * Reference: https://docs.handcash.io/v3/getting-started
 */

// HandCash Connect configuration
const HANDCASH_APP_ID = process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''
const HANDCASH_APP_SECRET = process.env.HANDCASH_APP_SECRET || ''
const HANDCASH_REDIRECT_URL = process.env.NEXT_PUBLIC_HANDCASH_REDIRECT_URL || ''

// HandCash Connect endpoints
const HANDCASH_AUTH_URL = 'https://app.handcash.io/#/authorizeApp'
const HANDCASH_API_URL = 'https://cloud.handcash.io'

export interface HandCashProfile {
  id: string
  handle: string
  displayName: string
  avatarUrl?: string
  publicKey: string
  paymail: string
}

export interface HandCashPaymentResult {
  transactionId: string
  note: string
  type: 'send' | 'receive'
  time: number
  satoshiFees: number
  satoshiAmount: number
  fiatExchangeRate: number
  fiatCurrencyCode: string
  participants: Array<{
    type: 'user' | 'address'
    alias?: string
    responseNote?: string
  }>
}

/**
 * Generate HandCash authorization URL
 */
export function getHandCashAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    appId: HANDCASH_APP_ID,
    ...(state && { state })
  })
  return `${HANDCASH_AUTH_URL}?${params.toString()}`
}

/**
 * Validate and return the auth token as access token
 * In HandCash Connect v3, the authToken returned from the callback IS the access token
 * No exchange is needed - the authToken is used directly for API calls
 */
export async function exchangeAuthCode(authToken: string): Promise<string> {
  // If no app secret configured, use demo mode
  if (!HANDCASH_APP_SECRET) {
    console.warn('HandCash App Secret not configured - using demo mode')
    return `demo_access_${Date.now()}`
  }
  
  // The authToken from the HandCash callback IS the access token
  // It can be used directly with the HandCash Connect API
  // Validate by trying to get the profile
  try {
    const response = await fetch(`${HANDCASH_API_URL}/v3/connect/account/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'app-id': HANDCASH_APP_ID,
        'app-secret': HANDCASH_APP_SECRET
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HandCash auth validation failed:', errorText)
      throw new Error('Invalid or expired auth token')
    }
    
    // Token is valid, return it as the access token
    return authToken
  } catch (error) {
    console.error('HandCash auth error:', error)
    throw error
  }
}

/**
 * Get user profile from HandCash
 */
export async function getHandCashProfile(accessToken: string): Promise<HandCashProfile> {
  // Demo mode
  if (accessToken.startsWith('demo_')) {
    return {
      id: 'demo_user_' + Date.now(),
      handle: 'demo_user',
      displayName: 'Demo User',
      avatarUrl: undefined,
      publicKey: 'demo_pubkey_' + Math.random().toString(36).substring(7),
      paymail: 'demo_user@handcash.io'
    }
  }
  
  try {
    // Use v3 API endpoint for profile
    const response = await fetch(`${HANDCASH_API_URL}/v3/connect/account/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'app-id': HANDCASH_APP_ID,
        'app-secret': HANDCASH_APP_SECRET
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HandCash profile fetch failed:', errorText)
      throw new Error('Failed to get profile')
    }
    
    const data = await response.json()
    return {
      id: data.id || data.publicProfile?.id || 'unknown',
      handle: data.publicProfile?.handle || data.handle || 'unknown',
      displayName: data.publicProfile?.displayName || data.displayName || 'HandCash User',
      avatarUrl: data.publicProfile?.avatarUrl || data.avatarUrl,
      publicKey: data.publicProfile?.publicKey || data.publicKey || accessToken.slice(0, 20),
      paymail: `${data.publicProfile?.handle || data.handle}@handcash.io`
    }
  } catch (error) {
    console.error('HandCash profile error:', error)
    throw error
  }
}

/**
 * Request payment via HandCash
 * This generates a payment request that opens the HandCash wallet
 */
export async function requestPayment(params: {
  accessToken: string
  destination: string // paymail or handle
  amount: number
  currencyCode: string
  description: string
}): Promise<HandCashPaymentResult> {
  // Demo mode
  if (params.accessToken.startsWith('demo_')) {
    return {
      transactionId: `demo_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      note: params.description,
      type: 'send',
      time: Date.now(),
      satoshiFees: 1,
      satoshiAmount: Math.ceil(params.amount * 100000000),
      fiatExchangeRate: 50,
      fiatCurrencyCode: params.currencyCode,
      participants: [{ type: 'user', alias: params.destination }]
    }
  }
  
  try {
    const response = await fetch(`${HANDCASH_API_URL}/v1/connect/wallet/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.accessToken}`
      },
      body: JSON.stringify({
        description: params.description,
        appAction: 'rental_payment',
        payments: [{
          destination: params.destination,
          currencyCode: params.currencyCode,
          sendAmount: params.amount
        }]
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Payment failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('HandCash payment error:', error)
    throw error
  }
}

/**
 * Get payment history
 */
export async function getPaymentHistory(accessToken: string): Promise<HandCashPaymentResult[]> {
  if (accessToken.startsWith('demo_')) {
    return []
  }
  
  try {
    const response = await fetch(`${HANDCASH_API_URL}/v1/connect/wallet/spendableBalance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to get payment history')
    }
    
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('HandCash history error:', error)
    return []
  }
}

/**
 * Get spendable balance
 */
export async function getBalance(accessToken: string): Promise<{
  spendableSatoshiBalance: number
  spendableFiatBalance: number
  currencyCode: string
}> {
  if (accessToken.startsWith('demo_')) {
    return {
      spendableSatoshiBalance: Math.floor(Math.random() * 10000000) + 1000000,
      spendableFiatBalance: Math.random() * 100 + 10,
      currencyCode: 'USD'
    }
  }
  
  try {
    const response = await fetch(`${HANDCASH_API_URL}/v3/connect/wallet/spendableBalance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'app-id': HANDCASH_APP_ID,
        'app-secret': HANDCASH_APP_SECRET
      }
    })
    
    if (!response.ok) {
      // If balance fetch fails, return a placeholder
      console.warn('Could not fetch HandCash balance')
      return {
        spendableSatoshiBalance: 0,
        spendableFiatBalance: 0,
        currencyCode: 'USD'
      }
    }
    
    return await response.json()
  } catch (error) {
    console.error('HandCash balance error:', error)
    return {
      spendableSatoshiBalance: 0,
      spendableFiatBalance: 0,
      currencyCode: 'USD'
    }
  }
}

/**
 * Create a pay button URL (for embedding in UI)
 */
export function createPayButtonUrl(params: {
  destination: string
  amount: number
  currencyCode: string
  label?: string
}): string {
  const searchParams = new URLSearchParams({
    to: params.destination,
    amount: params.amount.toString(),
    currency: params.currencyCode,
    ...(params.label && { label: params.label })
  })
  return `https://pay.handcash.io?${searchParams.toString()}`
}

/**
 * Verify a transaction ID on the BSV network
 */
export async function verifyTransaction(txId: string): Promise<{
  valid: boolean
  confirmations: number
  amount?: number
}> {
  try {
    // Use WhatsOnChain API to verify
    const response = await fetch(`https://api.whatsonchain.com/v1/bsv/main/tx/${txId}`)
    
    if (!response.ok) {
      return { valid: false, confirmations: 0 }
    }
    
    const tx = await response.json()
    return {
      valid: true,
      confirmations: tx.confirmations || 0,
      amount: tx.vout?.reduce((sum: number, out: any) => sum + (out.value || 0), 0)
    }
  } catch (error) {
    console.error('Transaction verification error:', error)
    return { valid: false, confirmations: 0 }
  }
}

export default {
  getHandCashAuthUrl,
  exchangeAuthCode,
  getHandCashProfile,
  requestPayment,
  getPaymentHistory,
  getBalance,
  createPayButtonUrl,
  verifyTransaction
}
