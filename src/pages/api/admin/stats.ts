/**
 * Admin API — Platform Statistics
 * GET /api/admin/stats
 *
 * Returns aggregate platform metrics for the admin dashboard.
 * Protected: admin role required.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { User, RentalAsset, Rental, Escrow } from '@/models'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  await connectDB()

  if (isMockMode()) {
    return res.status(503).json({ error: 'Admin stats require MongoDB' })
  }

  const [
    totalUsers,
    totalAssets,
    availableAssets,
    rentedAssets,
    totalRentals,
    activeRentals,
    completedRentals,
    totalEscrows,
    activeEscrows,
  ] = await Promise.all([
    User.countDocuments(),
    RentalAsset.countDocuments(),
    RentalAsset.countDocuments({ status: 'available' }),
    RentalAsset.countDocuments({ status: 'rented' }),
    Rental.countDocuments(),
    Rental.countDocuments({ status: 'active' }),
    Rental.countDocuments({ status: 'completed' }),
    Escrow.countDocuments(),
    Escrow.countDocuments({ status: 'funded' }),
  ])

  return res.status(200).json({
    stats: {
      users: { total: totalUsers },
      assets: { total: totalAssets, available: availableAssets, rented: rentedAssets },
      rentals: { total: totalRentals, active: activeRentals, completed: completedRentals },
      escrows: { total: totalEscrows, active: activeEscrows },
    },
    generatedAt: new Date().toISOString(),
  })
}

export default withRateLimit(withAuth(handler, { requireRole: 'admin' }), RATE_LIMITS.api)
