import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { assetId } = req.query

    if (!assetId) {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    // Get all rentals and filter by asset ID
    const allRentals = storage.getAllRentals()
    const assetRentals = allRentals.filter(r => r.assetId === assetId)

    return res.status(200).json({
      rentals: assetRentals,
      count: assetRentals.length
    })

  } catch (error: any) {
    console.error('Rentals by asset error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch rentals',
      message: error.message 
    })
  }
}
