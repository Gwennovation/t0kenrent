/**
 * GET /api/user/stats
 * Returns statistics for the authenticated user only.
 * Identity from JWT — never from publicKey query param.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { User, RentalAsset, Rental } from '@/models'
import { storage } from '@/lib/storage'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const publicKey = req.user!.sub

  try {
    await connectDB()

    if (isMockMode()) {
      const user = storage.getUserByKey(publicKey)
      const assets = storage.getAssetsByOwner(publicKey)
      const asRenter = storage.getRentalsByRenter(publicKey)
      const asOwner = storage.getRentalsByOwner(publicKey)

      return res.status(200).json({
        stats: {
          totalListings: assets.length,
          availableListings: assets.filter(a => a.status === 'available').length,
          rentedListings: assets.filter(a => a.status === 'rented').length,
          totalRentalsAsRenter: asRenter.length,
          activeRentalsAsRenter: asRenter.filter(r => r.status === 'active').length,
          completedRentalsAsRenter: asRenter.filter(r => r.status === 'completed').length,
          totalRentalsAsOwner: asOwner.length,
          activeRentalsAsOwner: asOwner.filter(r => r.status === 'active').length,
          completedRentalsAsOwner: asOwner.filter(r => r.status === 'completed').length,
          totalEarnings: user?.totalEarnings ?? 0,
          totalSpent: user?.totalSpent ?? 0,
          rating: user?.rating ?? 5.0,
          reviewCount: user?.reviewCount ?? 0,
        },
      })
    }

    // MongoDB path
    const [user, assets, rentalsAsRenter, rentalsAsOwner] = await Promise.all([
      User.findOne({ publicKey }).lean(),
      RentalAsset.find({ ownerKey: publicKey }).select('status').lean(),
      Rental.find({ renterKey: publicKey }).select('status').lean(),
      Rental.find({ ownerKey: publicKey }).select('status').lean(),
    ])

    return res.status(200).json({
      stats: {
        totalListings: assets.length,
        availableListings: assets.filter((a: any) => a.status === 'available').length,
        rentedListings: assets.filter((a: any) => a.status === 'rented').length,
        totalRentalsAsRenter: rentalsAsRenter.length,
        activeRentalsAsRenter: rentalsAsRenter.filter((r: any) => r.status === 'active').length,
        completedRentalsAsRenter: rentalsAsRenter.filter((r: any) => r.status === 'completed').length,
        totalRentalsAsOwner: rentalsAsOwner.length,
        activeRentalsAsOwner: rentalsAsOwner.filter((r: any) => r.status === 'active').length,
        completedRentalsAsOwner: rentalsAsOwner.filter((r: any) => r.status === 'completed').length,
        totalEarnings: (user as any)?.totalEarnings ?? 0,
        totalSpent: (user as any)?.totalSpent ?? 0,
        rating: (user as any)?.rating ?? 5.0,
        reviewCount: (user as any)?.reviewCount ?? 0,
      },
    })
  } catch (error: any) {
    console.error('User stats error:', error?.message)
    return res.status(500).json({ error: 'Failed to get user stats' })
  }
}

export default withRateLimit(withAuth(handler), RATE_LIMITS.read)
