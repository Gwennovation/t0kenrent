/**
 * Debug endpoint to check HandCash configuration
 * GET /api/debug-handcash
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const config = {
    hasAppId: !!process.env.NEXT_PUBLIC_HANDCASH_APP_ID,
    appId: process.env.NEXT_PUBLIC_HANDCASH_APP_ID?.substring(0, 8) + '...',
    hasAppSecret: !!process.env.HANDCASH_APP_SECRET,
    appSecretLength: process.env.HANDCASH_APP_SECRET?.length || 0,
    redirectUrl: process.env.NEXT_PUBLIC_HANDCASH_REDIRECT_URL,
    timestamp: new Date().toISOString()
  }

  // Test a mock API call with the credentials
  const testHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test_token_12345',
    'app-id': process.env.NEXT_PUBLIC_HANDCASH_APP_ID || '',
    'app-secret': process.env.HANDCASH_APP_SECRET || ''
  }

  return res.status(200).json({
    status: 'debug',
    config,
    testHeaders: {
      'Content-Type': testHeaders['Content-Type'],
      'Authorization': testHeaders['Authorization'],
      'app-id': testHeaders['app-id'],
      'app-secret': testHeaders['app-secret'] ? '***EXISTS***' : '***MISSING***'
    },
    message: config.hasAppId && config.hasAppSecret 
      ? 'Environment variables are set' 
      : 'Missing environment variables!'
  })
}
