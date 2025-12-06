/**
 * Test Endpoint - Check Environment Variables
 * GET /api/test-env
 * 
 * Helps verify that environment variables are properly set on Vercel
 */

import type { NextApiRequest, NextApiResponse } from 'next'

interface EnvCheckResponse {
  status: string
  environment: string
  checks: {
    handcashAppId: boolean
    handcashAppIdValue: string
    handcashSecret: boolean
    handcashRedirectUrl: string
    appUrl: string
    network: string
  }
  message: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnvCheckResponse>
) {
  const checks = {
    handcashAppId: !!process.env.NEXT_PUBLIC_HANDCASH_APP_ID,
    handcashAppIdValue: process.env.NEXT_PUBLIC_HANDCASH_APP_ID?.substring(0, 8) + '...' || 'NOT SET',
    handcashSecret: !!process.env.HANDCASH_APP_SECRET,
    handcashRedirectUrl: process.env.NEXT_PUBLIC_HANDCASH_REDIRECT_URL || 'NOT SET',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    network: process.env.NETWORK || 'NOT SET'
  }

  const allSet = checks.handcashAppId && checks.handcashSecret && 
                 checks.handcashRedirectUrl !== 'NOT SET'

  return res.status(200).json({
    status: allSet ? 'OK' : 'MISSING_CONFIG',
    environment: process.env.NODE_ENV || 'unknown',
    checks,
    message: allSet 
      ? '✅ All required environment variables are set!' 
      : '❌ Some environment variables are missing. Check Vercel dashboard.'
  })
}
