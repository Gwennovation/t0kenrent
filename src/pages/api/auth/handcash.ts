/**
 * HandCash Authentication API
 * POST /api/auth/handcash
 *
 * Exchanges a HandCash authToken for a verified session.
 * On success, sets an HTTP-only __session JWT cookie.
 * Never returns the raw authToken or HandCash access token to the client.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { getHandCashProfileServer, getBalanceServer } from '@/lib/handcash-server'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { User } from '@/models'
import { storage } from '@/lib/storage'
import { signJWT } from '@/lib/jwt'
import { buildSessionCookie } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validate, HandCashAuthSchema } from '@/lib/schemas'

interface AuthResponse {
  success: boolean
  handle?: string
  displayName?: string
  paymail?: string
  balance?: number
  error?: string
}

async function handler(req: NextApiRequest, res: NextApiResponse<AuthResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const body = validate(HandCashAuthSchema, req.body, res)
  if (!body) return

  try {
    const { authToken } = body

    // Exchange authToken with HandCash servers (server-side only)
    const profile = await getHandCashProfileServer(authToken)
    const balanceInfo = await getBalanceServer(authToken)
    const balance = balanceInfo.spendableSatoshiBalance / 100_000_000

    // Persist / update user record
    await connectDB()

    let role: 'user' | 'admin' = 'user'

    if (isMockMode()) {
      let user = storage.getUserByKey(profile.id)
      if (!user) {
        user = storage.createUser(profile.id, {
          displayName: profile.displayName,
          email: undefined,
          avatar: profile.avatarUrl,
        })
      } else {
        storage.updateUser(profile.id, {
          displayName: profile.displayName,
          avatar: profile.avatarUrl,
        })
      }
    } else {
      const user = await User.findOrCreate(profile.id, 'handcash', {
        handle: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        paymail: profile.paymail,
      })
      role = (user as any).role ?? 'user'
    }

    // Issue a signed JWT — identity lives here, not in the response body
    const jwt = await signJWT({
      sub: profile.id,
      handle: profile.id,
      displayName: profile.displayName,
      paymail: profile.paymail,
      role,
    })

    // Set HTTP-only session cookie — JS cannot read this
    res.setHeader('Set-Cookie', buildSessionCookie(jwt))

    // Return only display-safe data (no tokens, no private keys)
    return res.status(200).json({
      success: true,
      handle: profile.id,
      displayName: profile.displayName,
      paymail: profile.paymail,
      balance,
    })
  } catch (error: any) {
    console.error('HandCash auth error:', error?.message)
    // Never expose internal error details to clients
    return res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.',
    })
  }
}

// Apply rate limiting: max 10 auth attempts per minute per IP
export default withRateLimit(handler, RATE_LIMITS.auth)
