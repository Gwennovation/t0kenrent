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
    const { rentalId, userKey } = req.body

    if (!rentalId || !userKey) {
      return res.status(400).json({ error: 'Rental ID and user key are required' })
    }

    const rental = storage.getRentalById(rentalId)
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' })
    }

    // Verify user is either renter or owner
    if (rental.renterKey !== userKey && rental.ownerKey !== userKey) {
      return res.status(403).json({ error: 'Not authorized to complete this rental' })
    }

    // Complete the rental
    const completedRental = storage.completeRental(rentalId)

    return res.status(200).json({
      success: true,
      rental: completedRental
    })

  } catch (error: any) {
    console.error('Rental completion error:', error)
    return res.status(500).json({ 
      error: 'Failed to complete rental',
      message: error.message 
    })
  }
}
