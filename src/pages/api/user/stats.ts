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
    const { publicKey } = req.query

    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' })
    }

    const user = storage.getUserByKey(publicKey as string)
    const assets = storage.getAssetsByOwner(publicKey as string)
    const rentalsAsRenter = storage.getRentalsByRenter(publicKey as string)
    const rentalsAsOwner = storage.getRentalsByOwner(publicKey as string)

    return res.status(200).json({
      stats: {
        totalListings: assets.length,
        availableListings: assets.filter(a => a.status === 'available').length,
        rentedListings: assets.filter(a => a.status === 'rented').length,
        totalRentalsAsRenter: rentalsAsRenter.length,
        activeRentalsAsRenter: rentalsAsRenter.filter(r => r.status === 'active').length,
        completedRentalsAsRenter: rentalsAsRenter.filter(r => r.status === 'completed').length,
        totalRentalsAsOwner: rentalsAsOwner.length,
        activeRentalsAsOwner: rentalsAsOwner.filter(r => r.status === 'active').length,
        completedRentalsAsOwner: rentalsAsOwner.filter(r => r.status === 'completed').length,
        totalEarnings: user?.totalEarnings || 0,
        totalSpent: user?.totalSpent || 0,
        rating: user?.rating || 5.0,
        reviewCount: user?.reviewCount || 0
      }
    })

  } catch (error: any) {
    console.error('User stats error:', error)
    return res.status(500).json({ error: 'Failed to get user stats' })
  }
}
