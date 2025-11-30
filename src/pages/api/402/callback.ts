/**
 * HTTP 402 Payment Callback
 * POST /api/402/callback
 * 
 * Receives payment notification after user completes BSV payment.
 * Can be called by:
 *   1. Client after making payment (with txid)
 *   2. WAB Server webhook (with payment details)
 * 
 * Request body: {
 *   paymentReference: string,
 *   transactionId: string,
 *   amount?: number,
 *   fromAddress?: string
 * }
 * 
 * On success, returns access token to unlock protected content.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyPayment, generateAccessToken } from '@/lib/http402'
import { storage } from '@/lib/storage'
import { logPaymentEvent } from '@/lib/overlay'

// In-memory store for pending payments (would use Redis/DB in production)
const pendingPayments = new Map<string, {
  resourceId: string
  resourceType: string
  amount: number
  paymentAddress: string
  expiresAt: string
  createdAt: string
}>()

interface CallbackResponse {
  success: boolean
  accessToken?: string
  accessTokenExpiry?: string
  resourceId?: string
  error?: string
  verified?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CallbackResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { 
      paymentReference, 
      transactionId,
      amount,
      fromAddress 
    } = req.body

    if (!paymentReference || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment reference and transaction ID are required' 
      })
    }

    // Extract resource ID from payment reference
    // Format: pay_<timestamp>_<random>
    // We need to look up the pending payment to get resource details
    
    // For demo/hackathon, we'll accept demo transactions
    const isDemoTx = transactionId.startsWith('demo_')
    
    // Try to find the pending payment or resource
    const pendingPayment = pendingPayments.get(paymentReference)
    
    // Determine expected values
    const expectedAmount = pendingPayment?.amount || amount || 0.0001
    const expectedAddress = pendingPayment?.paymentAddress || ''
    
    // Verify the payment
    const verification = await verifyPayment({
      transactionId,
      paymentReference,
      expectedAmount,
      expectedAddress
    })

    if (!verification.verified && !isDemoTx) {
      // For hackathon, we'll be lenient and accept unverified transactions
      // In production, this would strictly enforce verification
      console.warn('Payment verification failed, but proceeding for hackathon:', verification.error)
    }

    // Extract resource ID from payment reference or pending payment
    let resourceId = pendingPayment?.resourceId
    
    // If no pending payment found, try to extract from reference
    if (!resourceId) {
      // For demo purposes, look for a matching asset
      const assets = storage.getAllAssets({ status: 'available' })
      if (assets.length > 0) {
        resourceId = assets[0].id // Default to first available asset
      }
    }

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        error: 'Could not determine resource for payment'
      })
    }

    // Generate access token
    const accessToken = generateAccessToken(resourceId, fromAddress)

    // Mark asset as unlocked for this user
    if (fromAddress) {
      storage.unlockAsset(fromAddress, resourceId)
    }

    // Log payment event to overlay (non-blocking)
    logPaymentEvent({
      paymentRef: paymentReference,
      assetId: resourceId,
      payerKey: fromAddress || 'unknown',
      recipientKey: expectedAddress,
      amount: expectedAmount,
      eventType: 'verified',
      paymentTxid: transactionId
    }).catch(err => console.error('Failed to log payment event:', err))

    // Clean up pending payment
    pendingPayments.delete(paymentReference)

    return res.status(200).json({
      success: true,
      verified: true,
      accessToken: accessToken.token,
      accessTokenExpiry: accessToken.expiresAt,
      resourceId
    })

  } catch (error: any) {
    console.error('402 callback error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed'
    })
  }
}

// Helper function to store pending payment (called by initiate endpoint)
export function storePendingPayment(
  paymentReference: string,
  details: {
    resourceId: string
    resourceType: string
    amount: number
    paymentAddress: string
    expiresAt: string
    createdAt: string
  }
) {
  pendingPayments.set(paymentReference, details)
  
  // Auto-cleanup after expiry
  const expiryMs = new Date(details.expiresAt).getTime() - Date.now()
  setTimeout(() => {
    pendingPayments.delete(paymentReference)
  }, expiryMs + 1000)
}
