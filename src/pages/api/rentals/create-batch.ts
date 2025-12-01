/**
 * Batch Rental Creation Endpoint
 * POST /api/rentals/create-batch
 * 
 * Creates multiple rental transactions at once.
 * Useful for renting multiple items from the same owner or marketplace.
 * 
 * Request body: {
 *   rentals: Array<{
 *     assetId, renterKey, ownerKey, startDate, endDate,
 *     rentalDays, rentalFee, depositAmount, totalAmount
 *   }>
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'

interface BatchRentalResponse {
  success: boolean
  created: number
  failed: number
  results: Array<{
    success: boolean
    rentalId?: string
    assetId?: string
    escrowId?: string
    error?: string
  }>
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BatchRentalResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      created: 0,
      failed: 0,
      results: [],
      error: 'Method not allowed'
    })
  }

  try {
    const { rentals } = req.body

    if (!Array.isArray(rentals) || rentals.length === 0) {
      return res.status(400).json({
        success: false,
        created: 0,
        failed: 0,
        results: [],
        error: 'Rentals array is required and must not be empty'
      })
    }

    if (rentals.length > 20) {
      return res.status(400).json({
        success: false,
        created: 0,
        failed: 0,
        results: [],
        error: 'Maximum 20 rentals can be created at once'
      })
    }

    const results = []
    let created = 0
    let failed = 0

    // Process each rental
    for (const rentalData of rentals) {
      try {
        const {
          assetId,
          renterKey,
          ownerKey,
          startDate,
          endDate,
          rentalDays,
          rentalFee,
          depositAmount,
          totalAmount,
          pickupLocation,
          accessCode
        } = rentalData

        // Validate required fields
        if (!assetId || !renterKey || !ownerKey || !startDate || !endDate) {
          results.push({
            success: false,
            assetId,
            error: 'Missing required fields for rental'
          })
          failed++
          continue
        }

        // Check if asset exists and is available
        const asset = await storage.getAsset(assetId)
        if (!asset) {
          results.push({
            success: false,
            assetId,
            error: 'Asset not found'
          })
          failed++
          continue
        }

        if (asset.status !== 'available') {
          results.push({
            success: false,
            assetId,
            error: `Asset is not available (current status: ${asset.status})`
          })
          failed++
          continue
        }

        // Generate unique rental ID and escrow ID
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const rentalId = `rental_${timestamp}_${random}`
        const escrowId = `escrow_${timestamp}_${random}`

        // Create rental record
        const rental = {
          id: rentalId,
          assetId,
          assetName: asset.name,
          renterKey,
          ownerKey,
          startDate,
          endDate,
          rentalDays: rentalDays || 1,
          rentalFee: parseFloat(rentalFee) || asset.rentalRatePerDay,
          depositAmount: parseFloat(depositAmount) || asset.depositAmount,
          totalAmount: parseFloat(totalAmount) || (asset.rentalRatePerDay + asset.depositAmount),
          status: 'active',
          escrowId,
          createdAt: new Date().toISOString(),
          pickupLocation: pickupLocation || asset.rentalDetails?.pickupLocation?.address,
          accessCode: accessCode || asset.rentalDetails?.accessCode
        }

        // Save rental
        await storage.saveRental(rental)

        // Update asset status to rented
        asset.status = 'rented'
        asset.totalRentals = (asset.totalRentals || 0) + 1
        await storage.updateAsset(assetId, asset)

        results.push({
          success: true,
          rentalId,
          assetId,
          escrowId
        })
        created++

      } catch (err: any) {
        console.error('Error creating rental:', err)
        results.push({
          success: false,
          assetId: rentalData.assetId,
          error: err.message || 'Failed to create rental'
        })
        failed++
      }
    }

    // Return batch results
    return res.status(created > 0 ? 201 : 400).json({
      success: created > 0,
      created,
      failed,
      results
    })

  } catch (err: any) {
    console.error('Batch rental creation error:', err)
    return res.status(500).json({
      success: false,
      created: 0,
      failed: 0,
      results: [],
      error: err.message || 'Failed to create rentals'
    })
  }
}
