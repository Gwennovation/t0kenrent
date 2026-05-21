/**
 * Logout API
 * POST /api/auth/logout
 *
 * Clears the session cookie. Stateless — no server-side session store to clear.
 * The client should also clear any local display state (handle, balance, etc.)
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { clearSessionCookie } from '@/lib/auth-middleware'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Set-Cookie', clearSessionCookie())
  return res.status(200).json({ success: true })
}
