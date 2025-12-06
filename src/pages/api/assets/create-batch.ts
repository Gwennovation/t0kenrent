/**
 * Batch Asset Creation Endpoint
 * POST /api/assets/create-batch
 * 
 * Creates multiple rental asset listings at once.
 * 
 * Request body: {
 *   assets: Array<{
 *     name, description, category, imageUrl, rentalRatePerDay,
 *     depositAmount, currency, location, accessCode, specialInstructions,
 *     unlockFee, condition, accessories, ownerKey, ordinalId
 *   }>
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { storage, StoredAsset } from '@/lib/storage'
import { verifyOrdinalExists, verifyOrdinalOwnership, createDemoOrdinal } from '@/lib/ordinals'

interface BatchCreateResponse {
  success: boolean
  created: number
  failed: number
  results: Array<{
    success: boolean
    tokenId?: string
    ordinalId?: string
    error?: string
    asset?: Partial<StoredAsset>
  }>
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BatchCreateResponse>
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
    const { assets } = req.body

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({
        success: false,
        created: 0,
        failed: 0,
        results: [],
        error: 'Assets array is required and must not be empty'
      })
    }

    if (assets.length > 20) {
      return res.status(400).json({
        success: false,
        created: 0,
        failed: 0,
        results: [],
        error: 'Maximum 20 assets can be created at once'
      })
    }

    const results: Array<{
      success: boolean
      tokenId?: string
      ordinalId?: string
      error?: string
      asset?: Partial<StoredAsset>
    }> = []
    let created = 0
    let failed = 0

    // Process each asset
    for (const assetData of assets) {
      try {
        const {
          name,
          description,
          category,
          imageUrl,
          rentalRatePerDay,
          depositAmount,
          currency = 'USD',
          location,
          accessCode,
          specialInstructions,
          ownerContact,
          unlockFee = 0.0001,
          condition = 'excellent',
          accessories = [],
          ownerKey,
          ordinalId
        } = assetData

        // Validate required fields for this asset
        if (!name || !description || !category || !ownerKey) {
          results.push({
            success: false,
            error: `Missing required fields for asset "${name || 'unnamed'}"`
          })
          failed++
          continue
        }

        if (!location?.city || !location?.state || !location?.address) {
          results.push({
            success: false,
            error: `Missing location information for asset "${name}"`
          })
          failed++
          continue
        }

        // Generate unique tokenId
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const tokenId = `asset_${timestamp}_${random}`

        // Handle ordinal verification (if provided)
        let verifiedOrdinalId = ordinalId
        let ordinalVerified = false

        if (ordinalId) {
          const exists = await verifyOrdinalExists(ordinalId)
          if (exists) {
            const isOwner = await verifyOrdinalOwnership(ordinalId, ownerKey)
            if (isOwner) {
              ordinalVerified = true
            }
          }
        }

        // For demo mode, create a demo ordinal
        if (!ordinalId || !ordinalVerified) {
          verifiedOrdinalId = await createDemoOrdinal(tokenId, ownerKey)
          console.log(`Asset ${tokenId} linked to ordinal: ${verifiedOrdinalId}`)
        }

        // Create asset record
        const newAsset: StoredAsset = {
          id: tokenId,
          tokenId,
          name,
          description,
          category,
          imageUrl,
          rentalRatePerDay: parseFloat(rentalRatePerDay),
          depositAmount: parseFloat(depositAmount),
          currency,
          ownerKey,
          location: {
            city: location.city,
            state: location.state
          },
          rentalDetails: {
            pickupLocation: {
              address: location.address
            },
            accessCode,
            specialInstructions,
            ownerContact
          },
          status: 'available',
          unlockFee: parseFloat(unlockFee) || 0.0001,
          condition,
          accessories: Array.isArray(accessories) ? accessories : [],
          createdAt: new Date().toISOString(),
          totalRentals: 0,
          totalEarnings: 0
        }

        // Store the asset
        storage.createAsset(newAsset)

        results.push({
          success: true,
          tokenId,
          ordinalId: verifiedOrdinalId,
          asset: {
            id: tokenId,
            name,
            category,
            status: 'available'
          }
        })
        created++

      } catch (err: any) {
        console.error('Error creating asset:', err)
        results.push({
          success: false,
          error: err.message || 'Failed to create asset'
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
    console.error('Batch asset creation error:', err)
    return res.status(500).json({
      success: false,
      created: 0,
      failed: 0,
      results: [],
      error: err.message || 'Failed to create assets'
    })
  }
}
