/**
 * Auth middleware for Next.js API routes.
 *
 * Usage:
 *   export default withAuth(async (req, res) => { ... })
 *   export default withAuth(handler, { requireRole: 'admin' })
 *
 * On success, injects req.user (SessionPayload) so routes never
 * need to re-verify the token or accept identity from query params.
 */
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'
import { safeVerifyJWT, type SessionPayload } from './jwt'

// Augment NextApiRequest so TypeScript knows about req.user
declare module 'next' {
  interface NextApiRequest {
    user?: SessionPayload
  }
}

export interface AuthOptions {
  /** Enforce a specific role ('admin'). Defaults to any authenticated user. */
  requireRole?: 'admin' | 'user'
}

/**
 * Wraps a Next.js API handler with JWT authentication.
 * Reads the __session HTTP-only cookie, verifies the JWT,
 * and populates req.user before calling the inner handler.
 */
export function withAuth(
  handler: NextApiHandler,
  options: AuthOptions = {}
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.cookies?.['__session']

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const payload = await safeVerifyJWT(token)

    if (!payload) {
      // Clear the invalid cookie so the client re-authenticates
      res.setHeader('Set-Cookie', '__session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
      return res.status(401).json({ error: 'Session expired or invalid' })
    }

    // Role enforcement
    if (options.requireRole && payload.role !== options.requireRole) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    req.user = payload
    return handler(req, res)
  }
}

/**
 * Builds a Set-Cookie header value for the session JWT.
 * HTTP-only prevents JS access; SameSite=Strict blocks CSRF from other origins.
 */
export function buildSessionCookie(token: string, maxAgeSeconds = 86_400): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `__session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`
}

/** Builds a cookie header that immediately expires the session cookie. */
export function clearSessionCookie(): string {
  return '__session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
}

/**
 * Convenience: read and verify the current session without wrapping a handler.
 * Returns null if no valid session exists.
 */
export async function getSessionUser(req: NextApiRequest): Promise<SessionPayload | null> {
  const token = req.cookies?.['__session']
  if (!token) return null
  return safeVerifyJWT(token)
}
