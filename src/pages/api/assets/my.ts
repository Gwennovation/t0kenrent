import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { RentalAsset } from '@/models'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { owner } = req.query

    if (!owner) {
      return res.status(400).json({ error: 'Owner public key is required' })
    }

    // Connect to MongoDB
    await connectDB()

    let assets: any[] = []

    if (isMockMode()) {
      // Get user's assets from in-memory storage
      assets = storage.getAssetsByOwner(owner as string)
    } else {
      // Get user's assets from MongoDB
      const dbAssets = await RentalAsset.find({ ownerKey: owner })
        .sort({ createdAt: -1 })
        .lean()
      
      // Transform MongoDB _id to id
      assets = dbAssets.map((asset: any) => ({
        ...asset,
        id: asset._id?.toString() || asset.id
      }))
    }

    // Transform for response (include rental details since they're the owner)
    const transformedAssets = assets.map(asset => ({
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
      rentalDetails: asset.rentalDetails,
      status: asset.status,
      rating: asset.rating,
      totalRentals: asset.totalRentals,
      totalEarnings: asset.totalEarnings,
      unlockFee: asset.unlockFee,
      ownerKey: asset.ownerKey,
      createdAt: asset.createdAt
    }))

    return res.status(200).json({
      assets: transformedAssets,
      count: transformedAssets.length
    })

  } catch (error: any) {
    console.error('My assets error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch your assets',
      message: error.message 
    })
  }
}
