import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { publicKey } = req.query

      if (!publicKey) {
        return res.status(400).json({ error: 'Public key is required' })
      }

      const user = storage.getOrCreateUser(publicKey as string)
      const assets = storage.getAssetsByOwner(publicKey as string)
      const rentals = storage.getRentalsByRenter(publicKey as string)

      return res.status(200).json({
        user: {
          ...user,
          listings: assets.length,
          activeRentals: rentals.filter(r => r.status === 'active').length
        }
      })

    } catch (error: any) {
      console.error('Get profile error:', error)
      return res.status(500).json({ error: 'Failed to get profile' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { publicKey, displayName, email, phone, bio, location, avatar } = req.body

      if (!publicKey) {
        return res.status(400).json({ error: 'Public key is required' })
      }

      const user = storage.updateUser(publicKey, {
        displayName,
        email,
        phone,
        bio,
        location,
        avatar
      })

      if (!user) {
        // Create user if doesn't exist
        const newUser = storage.createUser(publicKey, {
          displayName,
          email,
          phone,
          bio,
          location,
          avatar
        })
        return res.status(201).json({ user: newUser })
      }

      return res.status(200).json({ user })

    } catch (error: any) {
      console.error('Update profile error:', error)
      return res.status(500).json({ error: 'Failed to update profile' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
