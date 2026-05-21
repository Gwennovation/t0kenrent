/**
 * Simple in-memory rate limiter.
 * Suitable for single-instance deployments. For multi-instance / Vercel
 * production, replace the store with an Upstash Redis client.
 */
import type { NextApiRequest, NextApiResponse } from 'next'

interface RateRecord {
  count: number
  resetAt: number
}

// Module-level store persists across requests in long-lived Node processes.
// On serverless (Vercel) each cold start resets it — acceptable for abuse deterrence.
const store = new Map<string, RateRecord>()

export interface RateLimitOptions {
  /** Max requests per window */
  max: number
  /** Window duration in milliseconds */
  windowMs: number
  /** Key to bucket by — defaults to IP */
  keyFn?: (req: NextApiRequest) => string
}

function getIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

/**
 * Check whether a request is within the rate limit.
 * Returns { allowed, remaining, resetAt }.
 */
export function checkRateLimit(
  req: NextApiRequest,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = options.keyFn ? options.keyFn(req) : getIp(req)
  const now = Date.now()

  const record = store.get(key)

  if (!record || now >= record.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.max - 1, resetAt: now + options.windowMs }
  }

  if (record.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { allowed: true, remaining: options.max - record.count, resetAt: record.resetAt }
}

/**
 * Higher-order handler that applies rate limiting before the inner handler.
 * Responds with 429 and Retry-After header on limit breach.
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown,
  options: RateLimitOptions
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { allowed, remaining, resetAt } = checkRateLimit(req, options)

    res.setHeader('X-RateLimit-Limit', options.max)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000))

    if (!allowed) {
      res.setHeader('Retry-After', Math.ceil((resetAt - Date.now()) / 1000))
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }

    return handler(req, res)
  }
}

// Preset configs
export const RATE_LIMITS = {
  /** Auth endpoints — tight to prevent brute-force */
  auth: { max: 10, windowMs: 60_000 },
  /** Standard API endpoints */
  api: { max: 60, windowMs: 60_000 },
  /** Heavy read endpoints */
  read: { max: 120, windowMs: 60_000 },
}
