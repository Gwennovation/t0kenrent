/**
 * HandCash Authentication API
 * POST /api/auth/handcash
 * 
 * Handles HandCash Connect callback and exchanges auth token for access token.
 * Creates or updates user record in database.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { exchangeAuthCode, getHandCashProfile, getBalance } from '@/lib/handcash'
import { storage } from '@/lib/storage'

interface AuthResponse {
  success: boolean
  publicKey?: string
  handle?: string
  displayName?: string
  paymail?: string
  balance?: number
  accessToken?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { authToken } = req.body

    if (!authToken) {
      return res.status(400).json({ success: false, error: 'Auth token required' })
    }

    // Exchange auth token for access token
    const accessToken = await exchangeAuthCode(authToken)
    
    // Get user profile
    const profile = await getHandCashProfile(accessToken)
    
    // Get wallet balance
    const balanceInfo = await getBalance(accessToken)
    const balance = balanceInfo.spendableSatoshiBalance / 100000000 // Convert to BSV

    // Create or update user in storage
    let user = storage.getUserByKey(profile.publicKey)
    if (!user) {
      user = storage.createUser(profile.publicKey, {
        displayName: profile.displayName || profile.handle,
        email: undefined, // HandCash doesn't share email by default
        avatar: profile.avatarUrl
      })
    } else {
      // Update existing user
      storage.updateUser(profile.publicKey, {
        displayName: profile.displayName || profile.handle,
        avatar: profile.avatarUrl
      })
    }

    return res.status(200).json({
      success: true,
      publicKey: profile.publicKey,
      handle: profile.handle,
      displayName: profile.displayName,
      paymail: profile.paymail,
      balance,
      accessToken // Client stores this for future API calls
    })
  } catch (error: any) {
    console.error('HandCash auth error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Authentication failed'
    })
  }
}
