/**
 * GET /api/assets/my
 * Returns the authenticated user's own asset listings.
 * Identity is derived from the verified JWT session cookie — never from query params.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { RentalAsset } from '@/models'
import { storage } from '@/lib/storage'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // req.user is guaranteed by withAuth
  const ownerKey = req.user!.sub

  try {
    await connectDB()

    let assets: any[]

    if (isMockMode()) {
      assets = storage.getAssetsByOwner(ownerKey)
    } else {
      const dbAssets = await RentalAsset.find({ ownerKey })
        .sort({ createdAt: -1 })
        .lean()

      assets = dbAssets.map((asset: any) => ({
        ...asset,
        id: asset._id?.toString() ?? asset.id,
      }))
    }

    const result = assets.map(a => ({
      id: a.id,
      tokenId: a.tokenId,
      name: a.name,
      description: a.description,
      category: a.category,
      imageUrl: a.imageUrl,
      rentalRatePerDay: a.rentalRatePerDay,
      depositAmount: a.depositAmount,
      currency: a.currency,
      location: a.location,
      rentalDetails: a.rentalDetails,
      status: a.status,
      rating: a.rating,
      totalRentals: a.totalRentals,
      totalEarnings: a.totalEarnings,
      unlockFee: a.unlockFee,
      ownerKey: a.ownerKey,
      createdAt: a.createdAt,
    }))

    return res.status(200).json({ assets: result, count: result.length })
  } catch (error: any) {
    console.error('My assets error:', error?.message)
    return res.status(500).json({ error: 'Failed to fetch your assets' })
  }
}

export default withRateLimit(withAuth(handler), RATE_LIMITS.read)
