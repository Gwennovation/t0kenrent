import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'

/**
 * HTTP 402 Payment Initiation Endpoint
 * 
 * This endpoint implements the HTTP 402 "Payment Required" protocol
 * to gate access to detailed rental information behind a micropayment.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { resourceId, resourceType, payerKey } = req.body

    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' })
    }

    // Find the rental asset
    const asset = await RentalAsset.findOne({ tokenId: resourceId })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Create HTTP 402 payment request
    const paymentReference = `pay_${resourceId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store payment request in asset document
    asset.http402Payments.push({
      paymentReference,
      amount: asset.unlockFee,
      payerKey,
      status: 'pending',
      createdAt: new Date()
    })
    await asset.save()

    // Return HTTP 402 response
    res.setHeader('Accept-Payment', 'BSV')
    res.setHeader('Payment-Amount', asset.unlockFee.toString())
    res.setHeader('Payment-Address', asset.ownerKey)
    res.setHeader('Payment-Reference', paymentReference)

    return res.status(402).json({
      error: 'Payment required',
      message: 'Access to rental details requires micropayment',
      payment: {
        currency: 'BSV',
        amount: asset.unlockFee,
        address: asset.ownerKey,
        reference: paymentReference,
        expiresAt: expiresAt.toISOString(),
        expiresIn: 300, // 5 minutes in seconds
        resourceId,
        resourceType: resourceType || 'rental_details'
      },
      asset: {
        name: asset.name,
        tokenId: asset.tokenId
      }
    })

  } catch (error: any) {
    console.error('HTTP 402 initiation error:', error)
    return res.status(500).json({ 
      error: 'Failed to initiate payment',
      message: error.message 
    })
  }
}
