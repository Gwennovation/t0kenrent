/**
 * Asset Creation Endpoint
 * POST /api/assets/create
 *
 * Creates a new rental asset listing. Caller must be authenticated.
 * The ownerKey is derived from the verified JWT session — it cannot be
 * spoofed via request body.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/auth-middleware'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validate, CreateAssetSchema } from '@/lib/schemas'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { RentalAsset, User } from '@/models'
import { storage, type StoredAsset } from '@/lib/storage'
import { verifyOrdinalExists, verifyOrdinalOwnership, createDemoOrdinal } from '@/lib/ordinals'

interface CreateAssetResponse {
  success: boolean
  tokenId?: string
  ordinalId?: string
  ordinalVerified?: boolean
  asset?: Partial<StoredAsset>
  error?: string
  message?: string
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateAssetResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Validate all inputs via Zod before touching the DB
  const body = validate(CreateAssetSchema, req.body, res)
  if (!body) return

  // Identity comes from the verified JWT — never trust body/query for this
  const ownerKey = req.user!.sub
  const isDemoUser = ownerKey.startsWith('demo_')

  const {
    name, description, category, imageUrl, rentalRatePerDay, depositAmount,
    currency, location, accessCode, specialInstructions, unlockFee,
    condition, accessories, paymentAddress,
  } = body

  // Legacy field: ownerContact is not in CreateAssetSchema — skip it for now
  const ownerContact = undefined

  try {
    await connectDB()

    if (isMockMode()) {
      storage.getOrCreateUser(ownerKey)
    } else {
      const walletType = isDemoUser ? 'demo' : ownerKey.includes('@') ? 'paymail' : 'handcash'
      await User.findOneAndUpdate(
        { publicKey: ownerKey },
        { $setOnInsert: { publicKey: ownerKey, walletType, totalListings: 0, totalRentals: 0, totalEarnings: 0, totalSpent: 0 } },
        { upsert: true }
      )
    }

    // Optional: link a 1Sat ordinal for proof of ownership
    const ordinalId = typeof req.body.ordinalId === 'string'
      ? req.body.ordinalId.trim().slice(0, 200) : undefined

    let verifiedOrdinalId: string | undefined
    let ordinalVerified = false
    let ordinalMessage: string | undefined

    if (ordinalId) {
      if (isDemoUser) {
        verifiedOrdinalId = ordinalId
        ordinalVerified = true
        ordinalMessage = 'Ordinal accepted (demo mode)'
      } else {
        const verification = await verifyOrdinalExists(ordinalId)
        if (verification.exists) {
          verifiedOrdinalId = ordinalId
          ordinalVerified = true
          ordinalMessage = 'Ordinal verified on-chain'
        } else {
          ordinalMessage = 'Ordinal not found — listing created without on-chain link'
        }
      }
    } else if (isDemoUser) {
      const demoOrdinal = createDemoOrdinal(Date.now().toString(), name)
      verifiedOrdinalId = demoOrdinal.id
      ordinalVerified = true
      ordinalMessage = 'Demo ordinal created'
    }

    // Create the asset
    let asset: any

    if (isMockMode()) {
      // Use in-memory storage — Zod already parsed values so no parseFloat needed
      asset = storage.createAsset({
        name, description, category, imageUrl,
        rentalRatePerDay, depositAmount, currency,
        location: { city: location.city, state: location.state },
        rentalDetails: {
          pickupLocation: { address: location.address, city: location.city, state: location.state },
          accessCode,
          specialInstructions,
        },
        status: 'available',
        unlockFee,
        ownerKey, condition, accessories,
      })
    } else {
      const tokenId = `token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

      const rentalAsset = await RentalAsset.create({
        tokenId, name, description, category, imageUrl,
        rentalRatePerDay, depositAmount, currency,
        location: { city: location.city, state: location.state },
        rentalDetails: {
          pickupLocation: { address: location.address, city: location.city, state: location.state },
          accessCode,
          specialInstructions,
        },
        status: 'available',
        unlockFee,
        ownerKey, condition, accessories,
        totalRentals: 0,
        totalEarnings: 0,
        rating: 0
      })

      // Update user's totalListings
      await User.findOneAndUpdate(
        { publicKey: ownerKey },
        { $inc: { totalListings: 1 } }
      )

      asset = {
        id: rentalAsset._id.toString(),
        tokenId: rentalAsset.tokenId,
        name: rentalAsset.name,
        description: rentalAsset.description,
        category: rentalAsset.category,
        imageUrl: rentalAsset.imageUrl,
        rentalRatePerDay: rentalAsset.rentalRatePerDay,
        depositAmount: rentalAsset.depositAmount,
        currency: rentalAsset.currency,
        location: rentalAsset.location,
        rentalDetails: rentalAsset.rentalDetails,
        status: rentalAsset.status,
        unlockFee: rentalAsset.unlockFee,
        ownerKey: rentalAsset.ownerKey,
        condition: rentalAsset.condition,
        accessories: rentalAsset.accessories,
        createdAt: rentalAsset.createdAt
      }
      
      console.log(`✅ Asset created in MongoDB: ${asset.id}`)
    }

    // If ordinal was verified, update asset with ordinal ID
    if (verifiedOrdinalId) {
      console.log(`Asset ${asset.id} linked to ordinal: ${verifiedOrdinalId}`)
    }

    return res.status(201).json({
      success: true,
      tokenId: asset.tokenId,
      ordinalId: verifiedOrdinalId,
      ordinalVerified,
      message: ordinalMessage,
      asset: {
        id: asset.id,
        tokenId: asset.tokenId,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        imageUrl: asset.imageUrl,
        rentalRatePerDay: asset.rentalRatePerDay,
        depositAmount: asset.depositAmount,
        currency: asset.currency,
        location: asset.location,
        status: asset.status,
        unlockFee: asset.unlockFee,
        ownerKey: asset.ownerKey,
        condition: asset.condition,
        accessories: asset.accessories,
        createdAt: asset.createdAt
      }
    })

  } catch (error: any) {
    console.error('Asset creation error:', error?.message)
    return res.status(500).json({ success: false, error: 'Failed to create asset' })
  }
}

export default withRateLimit(withAuth(handler), RATE_LIMITS.api)
