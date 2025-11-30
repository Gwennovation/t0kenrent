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
    const { userKey, role = 'renter' } = req.query

    if (!userKey) {
      return res.status(400).json({ error: 'User key is required' })
    }

    // Get rentals based on role
    const rentals = role === 'owner' 
      ? storage.getRentalsByOwner(userKey as string)
      : storage.getRentalsByRenter(userKey as string)

    return res.status(200).json({
      rentals,
      count: rentals.length
    })

  } catch (error: any) {
    console.error('My rentals error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch rentals',
      message: error.message 
    })
  }
}
