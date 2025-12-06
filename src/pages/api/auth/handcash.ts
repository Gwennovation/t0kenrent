/**
 * HandCash Authentication API
 * POST /api/auth/handcash
 * 
 * Handles HandCash Connect callback and exchanges auth token for access token.
 * Creates or updates user record in MongoDB database.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getHandCashProfileServer, getBalanceServer } from '@/lib/handcash-server'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { User } from '@/models'
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

    // The authToken from HandCash callback IS the access token
    const accessToken = authToken
    
    // Get user profile (server-side only)
    const profile = await getHandCashProfileServer(accessToken)
    
    // Get wallet balance (server-side only)
    const balanceInfo = await getBalanceServer(accessToken)
    const balance = balanceInfo.spendableSatoshiBalance / 100000000 // Convert to BSV

    // Connect to MongoDB
    await connectDB()
    
    // Check if using mock mode or real MongoDB
    if (isMockMode()) {
      // Fallback to in-memory storage for demo
      console.log('📦 Using in-memory storage (MongoDB not connected)')
      let user = storage.getUserByKey(profile.id)
      if (!user) {
        user = storage.createUser(profile.id, {
          displayName: profile.displayName,
          email: undefined,
          avatar: profile.avatarUrl
        })
      } else {
        storage.updateUser(profile.id, {
          displayName: profile.displayName,
          avatar: profile.avatarUrl
        })
      }
    } else {
      // Use MongoDB
      console.log('✅ Using MongoDB for user storage')
      await User.findOrCreate(profile.id, 'handcash', {
        handle: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        paymail: profile.paymail
      })
    }

    return res.status(200).json({
      success: true,
      publicKey: profile.id, // Use id as public key
      handle: profile.id,
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
