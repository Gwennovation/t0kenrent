/**
 * JWT utility — sign and verify session tokens.
 * Uses jose (JOSE-compliant), compatible with Next.js Edge and Node runtimes.
 * Secret is sourced exclusively from JWT_SECRET env var; never hardcoded.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface SessionPayload extends JWTPayload {
  sub: string       // publicKey (user's unique identifier from HandCash)
  handle: string
  displayName: string
  paymail: string
  role: 'user' | 'admin'
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET env var is missing or too short (min 32 chars)')
  }
  return new TextEncoder().encode(secret)
}

/** Signs a new session JWT. Expires in 24 h. */
export async function signJWT(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret())
}

/** Verifies a JWT and returns the typed payload. Throws on invalid/expired tokens. */
export async function verifyJWT(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ['HS256'],
  })
  return payload as SessionPayload
}

/** Safe verify — returns null instead of throwing. Use for middleware guards. */
export async function safeVerifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    return await verifyJWT(token)
  } catch {
    return null
  }
}
