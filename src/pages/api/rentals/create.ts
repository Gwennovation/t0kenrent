import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      assetId,
      renterKey,
      startDate,
      endDate,
      rentalDays,
      rentalFee,
      depositAmount,
      totalAmount,
      paymentTxId,
      escrowTxId
    } = req.body

    // Validate required fields
    if (!assetId || !renterKey || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get the asset
    const asset = storage.getAssetById(assetId)
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for rent' })
    }

    // Ensure renter exists
    storage.getOrCreateUser(renterKey)

    // Create the rental with on-chain transaction IDs
    const rental = storage.createRental({
      assetId,
      assetName: asset.name,
      renterKey,
      ownerKey: asset.ownerKey,
      startDate,
      endDate,
      rentalDays: rentalDays || Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
      rentalFee: rentalFee || asset.rentalRatePerDay * rentalDays,
      depositAmount: depositAmount || asset.depositAmount,
      totalAmount: totalAmount || (rentalFee + depositAmount),
      status: 'active',
      pickupLocation: asset.rentalDetails?.pickupLocation?.address,
      accessCode: asset.rentalDetails?.accessCode,
      paymentTxId: paymentTxId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      escrowTxId: escrowTxId || `esc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    })

    return res.status(201).json({
      success: true,
      rental: {
        id: rental.id,
        escrowId: rental.escrowId,
        assetId: rental.assetId,
        assetName: rental.assetName,
        startDate: rental.startDate,
        endDate: rental.endDate,
        rentalDays: rental.rentalDays,
        rentalFee: rental.rentalFee,
        depositAmount: rental.depositAmount,
        totalAmount: rental.totalAmount,
        status: rental.status,
        pickupLocation: rental.pickupLocation,
        accessCode: rental.accessCode,
        createdAt: rental.createdAt,
        // On-chain transaction logging
        paymentTxId: rental.paymentTxId,
        escrowTxId: rental.escrowTxId
      }
    })

  } catch (error: any) {
    console.error('Rental creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create rental',
      message: error.message 
    })
  }
}
