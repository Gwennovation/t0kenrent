/**
 * HandCash Connect Server-Side Integration
 * 
 * This file ONLY runs on the server (API routes)
 * Uses the official HandCash Connect SDK
 */

import { HandCashConnect } from '@handcash/handcash-connect'

const HANDCASH_APP_ID = process.env.NEXT_PUBLIC_HANDCASH_APP_ID || ''
const HANDCASH_APP_SECRET = process.env.HANDCASH_APP_SECRET || ''

// Initialize HandCash SDK (server-side only)
const handCashConnect = new HandCashConnect({
  appId: HANDCASH_APP_ID,
  appSecret: HANDCASH_APP_SECRET
})

export async function getHandCashProfileServer(authToken: string) {
  const account = handCashConnect.getAccountFromAuthToken(authToken)
  const { publicProfile } = await account.profile.getCurrentProfile()
  
  return {
    id: publicProfile.id,
    handle: publicProfile.handle,
    displayName: publicProfile.displayName || publicProfile.handle,
    avatarUrl: publicProfile.avatarUrl,
    publicKey: (publicProfile as any).publicKey || authToken.slice(0, 20),
    paymail: publicProfile.paymail || `${publicProfile.handle}@handcash.io`
  }
}

export async function getBalanceServer(accessToken: string) {
  const account = handCashConnect.getAccountFromAuthToken(accessToken)
  const balance = await account.wallet.getSpendableBalance()
  
  return {
    spendableSatoshiBalance: balance.spendableSatoshiBalance || 0,
    spendableFiatBalance: balance.spendableFiatBalance || 0,
    currencyCode: balance.currencyCode || 'USD'
  }
}

export async function requestPaymentServer(params: {
  accessToken: string
  destination: string
  amount: number
  currencyCode: string
  description: string
}) {
  const account = handCashConnect.getAccountFromAuthToken(params.accessToken)
  
  // HandCash API requires description/note to be max 25 characters
  const truncatedDescription = params.description.length > 25 
    ? params.description.substring(0, 22) + '...'
    : params.description
  
  const paymentParams: any = {
    description: truncatedDescription,
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
    note: truncatedDescription,
    type: 'send' as const,
    time: Date.now(),
    satoshiFees: result.satoshiFees || 0,
    satoshiAmount: result.satoshiAmount || Math.ceil(params.amount * 100000000),
    fiatExchangeRate: result.fiatExchangeRate || 50,
    fiatCurrencyCode: params.currencyCode,
    participants: (result.participants || []) as any
  }
}
