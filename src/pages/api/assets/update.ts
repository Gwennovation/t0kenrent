import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      id,
      name,
      description,
      category,
      imageUrl,
      rentalRatePerDay,
      depositAmount,
      currency,
      location,
      rentalDetails,
      unlockFee,
      condition,
      accessories,
      status,
      ownerKey
    } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    // Get the existing asset
    const existingAsset = storage.getAssetById(id)
    if (!existingAsset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Verify ownership if ownerKey is provided
    if (ownerKey && existingAsset.ownerKey !== ownerKey) {
      return res.status(403).json({ error: 'You do not own this asset' })
    }

    // Build update object
    const updates: any = {}
    
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (imageUrl !== undefined) updates.imageUrl = imageUrl
    if (rentalRatePerDay !== undefined) updates.rentalRatePerDay = rentalRatePerDay
    if (depositAmount !== undefined) updates.depositAmount = depositAmount
    if (currency !== undefined) updates.currency = currency
    if (location !== undefined) updates.location = location
    if (unlockFee !== undefined) updates.unlockFee = unlockFee
    if (condition !== undefined) updates.condition = condition
    if (accessories !== undefined) updates.accessories = accessories
    if (status !== undefined) updates.status = status
    
    // Handle rental details (pickup location, access code, etc.)
    if (rentalDetails !== undefined) {
      updates.rentalDetails = {
        ...existingAsset.rentalDetails,
        ...rentalDetails,
        pickupLocation: {
          ...existingAsset.rentalDetails?.pickupLocation,
          ...rentalDetails?.pickupLocation
        }
      }
    }

    // Update the asset
    const updatedAsset = storage.updateAsset(id, updates)

    if (!updatedAsset) {
      return res.status(500).json({ error: 'Failed to update asset' })
    }

    return res.status(200).json({
      success: true,
      asset: {
        id: updatedAsset.id,
        tokenId: updatedAsset.tokenId,
        name: updatedAsset.name,
        description: updatedAsset.description,
        category: updatedAsset.category,
        imageUrl: updatedAsset.imageUrl,
        rentalRatePerDay: updatedAsset.rentalRatePerDay,
        depositAmount: updatedAsset.depositAmount,
        currency: updatedAsset.currency,
        location: updatedAsset.location,
        rentalDetails: updatedAsset.rentalDetails,
        status: updatedAsset.status,
        rating: updatedAsset.rating,
        unlockFee: updatedAsset.unlockFee,
        ownerKey: updatedAsset.ownerKey,
        condition: updatedAsset.condition,
        accessories: updatedAsset.accessories,
        totalRentals: updatedAsset.totalRentals,
        totalEarnings: updatedAsset.totalEarnings,
        createdAt: updatedAsset.createdAt
      }
    })

  } catch (error: any) {
    console.error('Asset update error:', error)
    return res.status(500).json({ 
      error: 'Failed to update asset',
      message: error.message 
    })
  }
}
