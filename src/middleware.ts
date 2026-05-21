/**
 * Next.js Edge Middleware — protects /admin/* routes.
 * Runs before any admin page is rendered. Redirects to / if the session
 * cookie is absent, invalid, or lacks admin role.
 *
 * NOTE: jose is used here (not jsonwebtoken) because middleware runs in the
 * Edge runtime which does not support Node.js crypto built-ins.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export const config = {
  matcher: ['/admin/:path*'],
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('__session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/?auth=required', req.url))
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    })

    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/?auth=forbidden', req.url))
    }

    // Forward the verified handle as a request header so getServerSideProps
    // can use it without re-verifying.
    const res = NextResponse.next()
    res.headers.set('x-user-handle', String(payload.handle ?? ''))
    res.headers.set('x-user-role', 'admin')
    return res
  } catch {
    return NextResponse.redirect(new URL('/?auth=required', req.url))
  }
}
