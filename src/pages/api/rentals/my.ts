import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { Rental } from '@/models'
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

    // Connect to MongoDB
    await connectDB()

    let rentals: any[] = []

    if (isMockMode()) {
      // Use in-memory storage for demo
      rentals = role === 'owner' 
        ? storage.getRentalsByOwner(userKey as string)
        : storage.getRentalsByRenter(userKey as string)
    } else {
      // Use MongoDB
      const query = role === 'owner' 
        ? { ownerKey: userKey }
        : { renterKey: userKey }
      
      rentals = await Rental.find(query)
        .sort({ createdAt: -1 })
        .lean()
      
      // Transform MongoDB _id to id
      rentals = rentals.map((rental: any) => ({
        ...rental,
        id: rental._id?.toString() || rental.id
      }))
    }

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
