/**
 * HandCash Connect Client-Side Utilities
 * 
 * This file contains only client-side utilities that don't require the HandCash SDK.
 * Server-side functionality using the SDK is in handcash-server.ts
 */

// HandCash Connect configuration
const HANDCASH_APP_ID = process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''

// HandCash Connect endpoints
const HANDCASH_AUTH_URL = 'https://app.handcash.io/#/authorizeApp'

/**
 * Generate HandCash authorization URL for OAuth flow
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
 * Create a HandCash pay button URL
 */
export function createPayButtonUrl(params: {
  destination: string
  amount: number
  currency: string
  label?: string
}): string {
  const query = new URLSearchParams({
    to: params.destination,
    amount: params.amount.toString(),
    currency: params.currency,
  })
  
  if (params.label) {
    query.append('label', params.label)
  }
  
  return `https://app.handcash.io/#/pay?${query.toString()}`
}
