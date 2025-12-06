import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'
import { storage } from '@/lib/storage'

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
    const { resourceId, resourceType, payerKey, userKey } = req.body

    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required' })
    }

    // Connect to database
    await connectDB()
    
    let asset: any
    let assetName: string
    let unlockFee: number
    let ownerKey: string
    
    if (isMockMode()) {
      // Use in-memory storage
      console.log('📦 Using in-memory storage for payment initiation')
      asset = storage.getAssetByTokenId(resourceId)
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' })
      }
      
      assetName = asset.name
      unlockFee = asset.unlockFee || 0.0001
      ownerKey = asset.ownerKey
    } else {
      // Use MongoDB
      console.log('✅ Using MongoDB for payment initiation')
      asset = await RentalAsset.findOne({ tokenId: resourceId })

      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' })
      }
      
      assetName = asset.name
      unlockFee = asset.unlockFee
      ownerKey = asset.ownerKey
      
      // Store payment request in asset document (MongoDB only)
      const paymentReference = `pay_${resourceId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      asset.http402Payments.push({
        paymentReference,
        amount: unlockFee,
        payerKey: payerKey || userKey,
        status: 'pending',
        createdAt: new Date()
      })
      await asset.save()
    }

    // Create HTTP 402 payment request
    const paymentReference = `pay_${resourceId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Return HTTP 402 response
    res.setHeader('Accept-Payment', 'BSV')
    res.setHeader('Payment-Amount', unlockFee.toString())
    res.setHeader('Payment-Address', ownerKey)
    res.setHeader('Payment-Reference', paymentReference)

    return res.status(402).json({
      error: 'Payment required',
      message: 'Access to rental details requires micropayment',
      payment: {
        currency: 'BSV',
        amount: unlockFee,
        address: ownerKey,
        reference: paymentReference,
        expiresAt: expiresAt.toISOString(),
        expiresIn: 300, // 5 minutes in seconds
        resourceId,
        resourceType: resourceType || 'rental_details'
      },
      asset: {
        name: assetName,
        tokenId: resourceId
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
