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
      if (role === 'owner') {
        rentals = storage.getRentalsByOwner(userKey as string)
      } else if (role === 'renter') {
        rentals = storage.getRentalsByRenter(userKey as string)
      } else {
        // Get all rentals where user is involved (either as renter or owner)
        const asRenter = storage.getRentalsByRenter(userKey as string)
        const asOwner = storage.getRentalsByOwner(userKey as string)
        // Combine and deduplicate
        const allRentals = [...asRenter, ...asOwner]
        const uniqueRentals = Array.from(new Map(allRentals.map(r => [r.id, r])).values())
        rentals = uniqueRentals.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    } else {
      // Use MongoDB
      let query: any
      if (role === 'owner') {
        query = { ownerKey: userKey }
      } else if (role === 'renter') {
        query = { renterKey: userKey }
      } else {
        // Get all rentals where user is involved (both renter and owner)
        query = { $or: [{ renterKey: userKey }, { ownerKey: userKey }] }
      }
      
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
