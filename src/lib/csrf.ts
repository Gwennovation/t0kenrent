/**
 * CSRF protection — double-submit cookie pattern.
 *
 * On page load (or first API call), the server sets a __csrf cookie.
 * The client reads it (NOT http-only) and includes it as the X-CSRF-Token header.
 * The server validates that the header matches the cookie.
 *
 * Safe for SameSite=Strict cookies, but this adds an extra layer for
 * state-changing endpoints (POST/PUT/DELETE/PATCH).
 */
import crypto from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

const CSRF_COOKIE = '__csrf'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_BYTES = 32

/** Generates a cryptographically random CSRF token. */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex')
}

/**
 * Builds a Set-Cookie value for the CSRF token.
 * Intentionally NOT http-only so client JS can read and echo it back.
 * SameSite=Strict prevents it from being sent cross-origin automatically.
 */
export function buildCsrfCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; Max-Age=86400${secure}`
}

/**
 * Validates the CSRF token on state-changing requests.
 * Returns false (and writes a 403) if the token is absent or doesn't match.
 */
export function validateCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
  // Only check state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method ?? '')) return true

  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER] as string | undefined

  if (!cookieToken || !headerToken) {
    res.status(403).json({ error: 'CSRF token missing' })
    return false
  }

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(cookieToken)
  const b = Buffer.from(headerToken)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).json({ error: 'CSRF token mismatch' })
    return false
  }

  return true
}

/**
 * Higher-order handler that enforces CSRF validation before the inner handler.
 * Combine with withAuth for full protection on sensitive endpoints.
 */
export function withCsrf(
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown
) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    if (!validateCsrf(req, res)) return
    return handler(req, res)
  }
}
