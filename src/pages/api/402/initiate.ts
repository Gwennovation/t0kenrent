/**
 * HTTP 402 Payment Required - Initiation
 * POST /api/402/initiate
 * 
 * Initiates the HTTP 402 payment flow for accessing protected rental details.
 * Returns payment instructions with proper 402 headers.
 * 
 * Request body: { resourceId: string, resourceType: 'asset' | 'rental' }
 * 
 * Response (402):
 *   Headers:
 *     - Accept-Payment: BSV
 *     - Payment-Amount: 0.0001
 *     - Payment-Address: <owner's BSV address>
 *     - Payment-Reference: <unique reference>
 *     - Payment-Expires: <ISO timestamp>
 *   Body:
 *     - Payment details and instructions
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  createPaymentRequest, 
  getHTTP402Headers,
  HTTP402PaymentRequest 
} from '@/lib/http402'
import { storage } from '@/lib/storage'

interface InitiateResponse {
  success: boolean
  payment?: HTTP402PaymentRequest
  error?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitiateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { resourceId, resourceType = 'asset' } = req.body

    if (!resourceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resource ID is required' 
      })
    }

    // Get resource details
    let resource: any = null
    let paymentAddress: string = ''
    let unlockFee: number = 0.0001 // Default ~$0.005

    if (resourceType === 'asset') {
      resource = storage.getAssetById(resourceId)
      if (!resource) {
        return res.status(404).json({ 
          success: false, 
          error: 'Asset not found' 
        })
      }
      paymentAddress = resource.ownerKey
      unlockFee = resource.unlockFee || 0.0001
    } else if (resourceType === 'rental') {
      resource = storage.getRentalById(resourceId)
      if (!resource) {
        return res.status(404).json({ 
          success: false, 
          error: 'Rental not found' 
        })
      }
      paymentAddress = resource.ownerKey
      unlockFee = 0.0001
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid resource type' 
      })
    }

    // Create payment request
    const paymentRequest = createPaymentRequest({
      resourceId,
      resourceType,
      resourceName: resource.name || resource.assetName || 'Resource',
      amount: unlockFee,
      paymentAddress
    })

    // Set HTTP 402 headers
    const headers = getHTTP402Headers(paymentRequest)
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    // Return 402 with payment details
    return res.status(402).json({
      success: true,
      message: 'Payment required to access rental details',
      payment: paymentRequest
    })

  } catch (error: any) {
    console.error('402 initiate error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate payment'
    })
  }
}
