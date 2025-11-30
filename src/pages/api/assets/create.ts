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
      return res.status(400).json({ error: 'Missing required fields: name, description, category, ownerKey' })
    }

    if (!location?.city || !location?.state || !location?.address) {
      return res.status(400).json({ error: 'Location information is required (city, state, address)' })
    }

    // Ensure user exists
    storage.getOrCreateUser(ownerKey)

    // Create the asset
    const asset = storage.createAsset({
      name,
      description,
      category,
      imageUrl,
      rentalRatePerDay: parseFloat(rentalRatePerDay) || 0,
      depositAmount: parseFloat(depositAmount) || 0,
      currency,
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
      status: 'available',
      unlockFee: parseFloat(unlockFee) || 0.0001,
      ownerKey,
      condition,
      accessories,
      rating: undefined
    })

    return res.status(201).json({
      success: true,
      tokenId: asset.tokenId,
      asset: {
        id: asset.id,
        tokenId: asset.tokenId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        imageUrl: asset.imageUrl,
        rentalRatePerDay: asset.rentalRatePerDay,
        depositAmount: asset.depositAmount,
        currency: asset.currency,
        location: asset.location,
        status: asset.status,
        unlockFee: asset.unlockFee,
        ownerKey: asset.ownerKey,
        createdAt: asset.createdAt
      }
    })

  } catch (error: any) {
    console.error('Asset creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create asset',
      message: error.message 
    })
  }
}
