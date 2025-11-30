import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import RentalAsset from '@/models/RentalAsset'
import { createAction } from 'babbage-sdk'
import { storeStageOnOverlay } from '@/lib/overlay'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const {
      name,
      description,
      category,
      imageUrl,
      rentalRatePerDay,
      depositAmount,
      currency = 'USD',
      location,
      accessCode,
      specialInstructions,
      unlockFee = 0.0001,
      condition = 'excellent',
      accessories = [],
      ownerKey
    } = req.body

    // Validate required fields
    if (!name || !description || !category || !ownerKey) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!location?.city || !location?.state || !location?.address) {
      return res.status(400).json({ error: 'Location information is required' })
    }

    // Generate unique token ID
    const tokenId = `t0ken_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create BRC-76 compliant metadata
    const brc76Metadata = {
      protocol: 'BRC-76',
      type: 'rental-asset',
      tokenId,
      name,
      category,
      rentalRate: rentalRatePerDay,
      deposit: depositAmount,
      currency,
      condition,
      unlockFee,
      createdAt: new Date().toISOString(),
      owner: ownerKey
    }

    // Create rental asset document
    const rentalAsset = await RentalAsset.create({
      tokenId,
      name,
      description,
      category,
      imageUrl,
      rentalRatePerDay,
      depositAmount,
      currency,
      unlockFee,
      condition,
      accessories,
      location: {
        city: location.city,
        state: location.state
      },
      rentalDetails: {
        pickupLocation: {
          address: location.address,
          city: location.city,
          state: location.state
        },
        accessCode,
        specialInstructions
      },
      ownerKey,
      status: 'available',
      brc76Metadata
    })

    // Try to store on overlay network (non-blocking)
    try {
      const txid = await storeStageOnOverlay({
        chainId: tokenId,
        stageIndex: 0,
        title: name,
        metadata: brc76Metadata
      })
      
      rentalAsset.mintTransactionId = txid
      await rentalAsset.save()
    } catch (overlayError) {
      console.error('Overlay storage failed (non-critical):', overlayError)
    }

    return res.status(201).json({
      success: true,
      tokenId: rentalAsset.tokenId,
      asset: {
        id: rentalAsset._id,
        tokenId: rentalAsset.tokenId,
        name: rentalAsset.name,
        description: rentalAsset.description,
        category: rentalAsset.category,
        imageUrl: rentalAsset.imageUrl,
        rentalRatePerDay: rentalAsset.rentalRatePerDay,
        depositAmount: rentalAsset.depositAmount,
        currency: rentalAsset.currency,
        location: rentalAsset.location,
        status: rentalAsset.status,
        unlockFee: rentalAsset.unlockFee,
        ownerKey: rentalAsset.ownerKey,
        createdAt: rentalAsset.createdAt
      },
      brc76Compliant: true
    })

  } catch (error: any) {
    console.error('Asset creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create asset',
      message: error.message 
    })
  }
}
