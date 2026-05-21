/**
 * GET /api/rentals/my
 * Returns rentals for the authenticated user.
 * Identity from JWT — never from userKey/role query params.
 * The ?role= filter is a display hint only; ownership is enforced by the JWT.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { Rental } from '@/models'
import { storage } from '@/lib/storage'
import { z } from 'zod'

const QuerySchema = z.object({
  role: z.enum(['renter', 'owner', 'all']).default('renter'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userKey = req.user!.sub

  const queryParsed = QuerySchema.safeParse(req.query)
  const role = queryParsed.success ? queryParsed.data.role : 'renter'

  try {
    await connectDB()

    let rentals: any[]

    if (isMockMode()) {
      if (role === 'owner') {
        rentals = storage.getRentalsByOwner(userKey)
      } else if (role === 'renter') {
        rentals = storage.getRentalsByRenter(userKey)
      } else {
        const asRenter = storage.getRentalsByRenter(userKey)
        const asOwner = storage.getRentalsByOwner(userKey)
        const merged = [...asRenter, ...asOwner]
        rentals = Array.from(new Map(merged.map(r => [r.id, r])).values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    } else {
      let query: Record<string, any>
      if (role === 'owner') {
        query = { ownerKey: userKey }
      } else if (role === 'renter') {
        query = { renterKey: userKey }
      } else {
        query = { $or: [{ renterKey: userKey }, { ownerKey: userKey }] }
      }

      const dbRentals = await Rental.find(query).sort({ createdAt: -1 }).lean()
      rentals = dbRentals.map((r: any) => ({ ...r, id: r._id?.toString() ?? r.id }))
    }

    return res.status(200).json({ rentals, count: rentals.length })
  } catch (error: any) {
    console.error('My rentals error:', error?.message)
    return res.status(500).json({ error: 'Failed to fetch rentals' })
  }
}

export default withRateLimit(withAuth(handler), RATE_LIMITS.read)
