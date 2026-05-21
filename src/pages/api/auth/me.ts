/**
 * GET /api/auth/me
 * Returns the current session user's public profile data.
 * Used by the admin dashboard and any client that needs to know its own role.
 * Never exposes sensitive fields — only display-safe data.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSessionUser } from '@/lib/auth-middleware'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getSessionUser(req)

  if (!user) {
    return res.status(401).json({ authenticated: false })
  }

  return res.status(200).json({
    authenticated: true,
    handle: user.handle,
    displayName: user.displayName,
    paymail: user.paymail,
    role: user.role,
  })
}
