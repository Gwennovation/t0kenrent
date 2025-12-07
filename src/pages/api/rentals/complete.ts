import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { Rental, RentalAsset, User } from '@/models'
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

    // Connect to MongoDB
    await connectDB()

    if (isMockMode()) {
      // Use in-memory storage
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
    } else {
      // Use MongoDB
      const rental = await Rental.findOne({ 
        $or: [{ _id: rentalId }, { id: rentalId }] 
      })
      
      if (!rental) {
        return res.status(404).json({ error: 'Rental not found' })
      }

      // Verify user is either renter or owner
      if (rental.renterKey !== userKey && rental.ownerKey !== userKey) {
        return res.status(403).json({ error: 'Not authorized to complete this rental' })
      }

      // Update rental status
      rental.status = 'completed'
      rental.completedAt = new Date()
      await rental.save()

      // Update asset status back to available
      const asset = await RentalAsset.findOne({
        $or: [{ _id: rental.assetId }, { tokenId: rental.assetId }]
      })
      
      if (asset) {
        asset.status = 'available'
        asset.totalEarnings = (asset.totalEarnings || 0) + rental.rentalFee
        await asset.save()

        // Update owner earnings
        const owner = await User.findOne({ publicKey: rental.ownerKey })
        if (owner) {
          owner.totalEarnings = (owner.totalEarnings || 0) + rental.rentalFee
          await owner.save()
        }
      }

      return res.status(200).json({
        success: true,
        rental: {
          id: rental._id.toString(),
          ...rental.toObject()
        }
      })
    }

  } catch (error: any) {
    console.error('Rental completion error:', error)
    return res.status(500).json({ 
      error: 'Failed to complete rental',
      message: error.message 
    })
  }
}
