/**
 * Admin API — User Management
 * GET  /api/admin/users          — list all users (paginated)
 * GET  /api/admin/users?id=<id>  — get single user
 * PUT  /api/admin/users          — update user role
 *
 * Protected: admin role required. Never accessible from user-facing routes.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { User } from '@/models'
import { z } from 'zod'

const PAGE_SIZE = 50

const UpdateRoleSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  role: z.enum(['user', 'admin']),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB()

  if (isMockMode()) {
    return res.status(503).json({ error: 'Admin API requires MongoDB' })
  }

  // ── GET — list or fetch single user ───────────────────────────────────
  if (req.method === 'GET') {
    const { id, page = '1' } = req.query

    if (id) {
      const user = await User.findById(id as string)
        .select('-__v')
        .lean()
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.status(200).json({ user })
    }

    const pageNum = Math.max(1, parseInt(page as string, 10))
    const [users, total] = await Promise.all([
      User.find()
        .select('publicKey handle displayName role walletType createdAt lastLoginAt totalListings totalRentals')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      User.countDocuments(),
    ])

    return res.status(200).json({
      users,
      pagination: { page: pageNum, pageSize: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) },
    })
  }

  // ── PUT — update role ─────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const parsed = UpdateRoleSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const { userId, role } = parsed.data

    // Prevent self-demotion — admins cannot remove their own admin access
    if (userId === req.user!.sub) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }

    const user = await User.findOneAndUpdate(
      { publicKey: userId },
      { role },
      { new: true }
    ).select('publicKey handle role').lean()

    if (!user) return res.status(404).json({ error: 'User not found' })

    return res.status(200).json({ user })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// Admin-only, tighter rate limit
export default withRateLimit(withAuth(handler, { requireRole: 'admin' }), RATE_LIMITS.api)
