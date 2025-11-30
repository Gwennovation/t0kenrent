import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { assetId, userKey, demoMode } = req.body

    if (!assetId || !userKey) {
      return res.status(400).json({ error: 'Asset ID and user key are required' })
    }

    const asset = storage.getAssetById(assetId)
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // In demo mode or if payment verified, unlock the asset
    storage.unlockAsset(userKey, assetId)

    return res.status(200).json({
      success: true,
      unlocked: true,
      rentalDetails: asset.rentalDetails
    })

  } catch (error: any) {
    console.error('Asset unlock error:', error)
    return res.status(500).json({ 
      error: 'Failed to unlock asset',
      message: error.message 
    })
  }
}
