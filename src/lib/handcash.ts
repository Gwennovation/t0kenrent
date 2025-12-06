/**
 * HandCash Connect Integration for T0kenRent
 * 
 * Uses the official HandCash Connect SDK (server-side only)
 * Reference: https://docs.handcash.io/v3/getting-started
 */

// HandCash Connect configuration
const HANDCASH_APP_ID = process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''
const HANDCASH_APP_SECRET = process.env.HANDCASH_APP_SECRET || ''

// HandCash Connect endpoints
const HANDCASH_AUTH_URL = 'https://app.handcash.io/#/authorizeApp'

// Lazy import HandCash SDK (server-side only to avoid webpack issues)
let HandCashConnect: any
let handCashConnect: any

async function getHandCashSDK() {
  if (!HandCashConnect) {
    const module = await import('@handcash/handcash-connect')
    HandCashConnect = module.HandCashConnect
    handCashConnect = new HandCashConnect({
      appId: HANDCASH_APP_ID,
      appSecret: HANDCASH_APP_SECRET
    })
  }
  return handCashConnect
}

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
 * The correct format is: https://app.handcash.io/#/authorizeApp?appId=YOUR_APP_ID
 */
export function getHandCashAuthUrl(state?: string): string {
  if (!HANDCASH_APP_ID) {
    console.warn('HandCash App ID not configured')
    return ''
  }
  
  const params = new URLSearchParams({
    appId: HANDCASH_APP_ID,
  })
  
  if (state) {
    params.append('state', state)
  }
  
  return `${HANDCASH_AUTH_URL}?${params.toString()}`
}

/**
 * The authToken from HandCash callback IS the access token
 * No exchange is needed - just validate it works
 */
export async function exchangeAuthCode(authToken: string): Promise<string> {
  if (!HANDCASH_APP_SECRET) {
    console.warn('HandCash App Secret not configured - using demo mode')
    return `demo_access_${Date.now()}`
  }
  
  // The authToken is the access token - return it directly
  return authToken
}

/**
 * Get user profile from HandCash using official SDK
 */
export async function getHandCashProfile(authToken: string): Promise<HandCashProfile> {
  // Demo mode
  if (authToken.startsWith('demo_')) {
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
    console.log('🔍 Fetching HandCash profile using SDK...')
    console.log('🔑 App ID:', HANDCASH_APP_ID)
    console.log('🎫 Auth token length:', authToken.length)
    
    // Use the official SDK (lazy-loaded)
    const sdk = await getHandCashSDK()
    const account = sdk.getAccountFromAuthToken(authToken)
    const { publicProfile } = await account.profile.getCurrentProfile()
    
    console.log('✅ HandCash profile fetched:', publicProfile.handle)
    
    // Note: publicProfile from SDK doesn't include publicKey
    // We'll need to get it from a separate call if needed
    return {
      id: publicProfile.id || 'unknown',
      handle: publicProfile.handle || 'unknown',
      displayName: publicProfile.displayName || publicProfile.handle || 'HandCash User',
      avatarUrl: publicProfile.avatarUrl,
      publicKey: (publicProfile as any).publicKey || authToken.slice(0, 20), // Fallback
      paymail: publicProfile.paymail || `${publicProfile.handle}@handcash.io`
    }
  } catch (error: any) {
    console.error('❌ HandCash profile error:', error.message || error)
    throw new Error(`Failed to get profile: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Request payment via HandCash
 */
export async function requestPayment(params: {
  accessToken: string
  destination: string
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
    // Use the official SDK (lazy-loaded)
    const sdk = await getHandCashSDK()
    const account = sdk.getAccountFromAuthToken(params.accessToken)
    const paymentParams: any = {
      description: params.description,
      appAction: 'rental_payment',
      payments: [{
        destination: params.destination,
        currencyCode: params.currencyCode,
        sendAmount: params.amount
      }]
    }
    
    const result = await account.wallet.pay(paymentParams)
    
    return {
      transactionId: result.transactionId,
      note: params.description,
      type: 'send',
      time: Date.now(),
      satoshiFees: result.satoshiFees || 0,
      satoshiAmount: result.satoshiAmount || Math.ceil(params.amount * 100000000),
      fiatExchangeRate: result.fiatExchangeRate || 50,
      fiatCurrencyCode: params.currencyCode,
      participants: (result.participants || []) as any
    }
  } catch (error: any) {
    console.error('HandCash payment error:', error.message || error)
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
  
  return []
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
    // Use the official SDK (lazy-loaded)
    const sdk = await getHandCashSDK()
    const account = sdk.getAccountFromAuthToken(accessToken)
    const balance = await account.wallet.getSpendableBalance()
    
    return {
      spendableSatoshiBalance: balance.spendableSatoshiBalance || 0,
      spendableFiatBalance: balance.spendableFiatBalance || 0,
      currencyCode: balance.currencyCode || 'USD'
    }
  } catch (error) {
    console.warn('Could not fetch HandCash balance:', error)
    return {
      spendableSatoshiBalance: 0,
      spendableFiatBalance: 0,
      currencyCode: 'USD'
    }
  }
}

/**
 * Create a pay button URL
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
