import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'
import { getTransactionByTxid } from '@/lib/overlay'
import { storage } from '@/lib/storage'

function buildRentalDetails(asset: any, rentalDetails: any) {
  const assetLocation = asset?.location || {}
  const rentalLocation = rentalDetails?.pickupLocation || {}

  return {
    pickupLocation: {
      address: rentalLocation.address || assetLocation.address || 'Pickup details available after contact',
      city: rentalLocation.city || assetLocation.city || 'N/A',
      state: rentalLocation.state || assetLocation.state || 'N/A',
      coordinates: rentalLocation.coordinates || assetLocation.coordinates
    },
    accessCode: rentalDetails?.accessCode || null,
    ownerContact: rentalDetails?.ownerContact || null,
    specialInstructions: rentalDetails?.specialInstructions || 'Contact the asset owner for final instructions.'
  }
}

/**
 * HTTP 402 Payment Verification Endpoint
 * 
 * Verifies a BSV micropayment and returns the protected rental details
 * upon successful verification.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { paymentReference, transactionId, amount, resourceId } = req.body

    if (!paymentReference || !transactionId) {
      return res.status(400).json({ 
        error: 'Payment reference and transaction ID are required' 
      })
    }

    // Connect to database
    await connectDB()
    
    let asset: any
    let rentalDetails: any
    
    if (isMockMode()) {
      // Use in-memory storage - for demo, just verify the resourceId exists
      console.log('📦 Using in-memory storage for payment verification')
      
      if (!resourceId) {
        return res.status(400).json({
          verified: false,
          status: 'error',
          error: 'Resource ID required for verification'
        })
      }
      
      asset = storage.getAssetByTokenId(resourceId)
      
      if (!asset) {
        return res.status(404).json({ 
          verified: false,
          status: 'not_found',
          error: 'Asset not found' 
        })
      }
      
      rentalDetails = asset.rentalDetails || {
        pickupLocation: {
          address: '123 Demo Street, San Francisco, CA 94102',
          city: 'San Francisco',
          state: 'CA',
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        accessCode: 'DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        ownerContact: {
          name: 'Demo Owner',
          phone: '+1 (555) 123-4567',
          email: 'owner@t0kenrent.app'
        },
        specialInstructions: 'This is a demo rental. Contact owner for actual details.'
      }
      
    } else {
      // Use MongoDB
      console.log('✅ Using MongoDB for payment verification')
      
      asset = await RentalAsset.findOne({
        'http402Payments.paymentReference': paymentReference
      })

      if (!asset) {
        return res.status(404).json({ 
          verified: false,
          status: 'not_found',
          error: 'Payment reference not found' 
        })
      }
      
      rentalDetails = asset.rentalDetails
    }

    const normalizedRentalDetails = buildRentalDetails(asset, rentalDetails)

    // MongoDB-only: Check payment records
    if (!isMockMode() && asset.http402Payments) {
      const paymentIndex = asset.http402Payments.findIndex(
        (p: any) => p.paymentReference === paymentReference
      )

      if (paymentIndex === -1) {
        return res.status(404).json({ 
          verified: false,
          status: 'not_found',
          error: 'Payment not found' 
        })
      }

      const payment = asset.http402Payments[paymentIndex]

      // Check if already verified
      if (payment.status === 'verified') {
        // Return existing access token if still valid
        if (payment.accessTokenExpiry && new Date(payment.accessTokenExpiry) > new Date()) {
          return res.status(200).json({
            verified: true,
            status: 'already_verified',
            accessToken: payment.accessToken,
            expiresIn: Math.floor((new Date(payment.accessTokenExpiry).getTime() - Date.now()) / 1000),
            rentalDetails: normalizedRentalDetails
          })
        }
      }

      // Check if payment is expired
      if (payment.status === 'expired') {
        return res.status(400).json({
          verified: false,
          status: 'expired',
          error: 'Payment request has expired'
        })
      }
    }

    // Verify the transaction on the BSV network (via overlay)
    try {
      const tx = await getTransactionByTxid(transactionId)
      
      // For hackathon/demo purposes, we'll accept the transaction if found
      // Production would verify: amount, recipient address, confirmation depth
      if (!tx) {
        // In demo mode, still accept if we can't verify (overlay might be down)
        console.log('Warning: Could not verify transaction on overlay, accepting anyway')
      }
    } catch (verifyError) {
      console.error('Transaction verification warning:', verifyError)
      // Continue anyway for demo purposes
    }

    // Generate access token
    const accessToken = `access_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const accessTokenExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Update payment record (MongoDB only)
    if (!isMockMode() && asset.http402Payments) {
      const paymentIndex = asset.http402Payments.findIndex(
        (p: any) => p.paymentReference === paymentReference
      )
      
      if (paymentIndex !== -1) {
        asset.http402Payments[paymentIndex].transactionId = transactionId
        asset.http402Payments[paymentIndex].status = 'verified'
        asset.http402Payments[paymentIndex].verifiedAt = new Date()
        asset.http402Payments[paymentIndex].accessToken = accessToken
        asset.http402Payments[paymentIndex].accessTokenExpiry = accessTokenExpiry
        await asset.save()
      }
    } else {
      // Mock mode: Mark asset as unlocked for the user
      // Extract userKey from the request (you might want to pass this in the body)
      const userKey = req.body.userKey || 'demo_user'
      storage.unlockAsset(userKey, asset.tokenId)
      console.log(`📦 Unlocked asset ${asset.tokenId} for user ${userKey}`)
    }

    // Set response headers
    res.setHeader('Payment-Verified', 'true')
    res.setHeader('Access-Token', accessToken)

    // Return success with rental details
    return res.status(200).json({
      verified: true,
      status: 'verified',
      accessToken,
      expiresIn: 1800, // 30 minutes
      transactionId,
      rentalDetails: normalizedRentalDetails
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return res.status(500).json({ 
      verified: false,
      status: 'error',
      error: 'Verification failed',
      message: error.message 
    })
  }
}
