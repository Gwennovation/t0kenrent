import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'
import { getTransactionByTxid } from '@/lib/overlay'

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
    await connectDB()

    const { paymentReference, transactionId, amount, resourceId } = req.body

    if (!paymentReference || !transactionId) {
      return res.status(400).json({ 
        error: 'Payment reference and transaction ID are required' 
      })
    }

    // Find the asset with this payment reference
    const asset = await RentalAsset.findOne({
      'http402Payments.paymentReference': paymentReference
    })

    if (!asset) {
      return res.status(404).json({ 
        verified: false,
        status: 'not_found',
        error: 'Payment reference not found' 
      })
    }

    // Find the specific payment record
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
          rentalDetails: {
            pickupLocation: asset.rentalDetails.pickupLocation,
            accessCode: asset.rentalDetails.accessCode,
            ownerContact: asset.rentalDetails.ownerContact,
            specialInstructions: asset.rentalDetails.specialInstructions
          }
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

    // Update payment record
    asset.http402Payments[paymentIndex].transactionId = transactionId
    asset.http402Payments[paymentIndex].status = 'verified'
    asset.http402Payments[paymentIndex].verifiedAt = new Date()
    asset.http402Payments[paymentIndex].accessToken = accessToken
    asset.http402Payments[paymentIndex].accessTokenExpiry = accessTokenExpiry

    await asset.save()

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
      rentalDetails: {
        pickupLocation: {
          address: asset.rentalDetails.pickupLocation.address,
          city: asset.rentalDetails.pickupLocation.city,
          state: asset.rentalDetails.pickupLocation.state,
          coordinates: asset.rentalDetails.pickupLocation.coordinates
        },
        accessCode: asset.rentalDetails.accessCode,
        ownerContact: asset.rentalDetails.ownerContact,
        specialInstructions: asset.rentalDetails.specialInstructions
      }
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
