import type { NextApiRequest, NextApiResponse } from 'next'
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

    // Get user's assets from storage
    const assets = storage.getAssetsByOwner(owner as string)

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
