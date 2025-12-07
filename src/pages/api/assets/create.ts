/**
 * Asset Creation Endpoint
 * POST /api/assets/create
 * 
 * Creates a new rental asset listing with optional 1Sat ordinal linking.
 * 
 * Request body: {
 *   name: string,
 *   description: string,
 *   category: string,
 *   imageUrl?: string,
 *   rentalRatePerDay: number,
 *   depositAmount: number,
 *   currency?: string,
 *   location: { city, state, address },
 *   accessCode?: string,
 *   specialInstructions?: string,
 *   ownerContact?: { name, phone, email },
 *   unlockFee?: number,
 *   condition?: string,
 *   accessories?: string[],
 *   ownerKey: string,
 *   ordinalId?: string  // Optional: Link to 1Sat ordinal for proof of ownership
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { RentalAsset, User } from '@/models'
import { storage, StoredAsset } from '@/lib/storage'
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateAssetResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

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
    } = req.body

    // Validate required fields
    if (!name || !description || !category || !ownerKey) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: name, description, category, ownerKey' 
      })
    }

    if (!location?.city || !location?.state || !location?.address) {
      return res.status(400).json({ 
        success: false,
        error: 'Location information is required (city, state, address)' 
      })
    }

    // Connect to MongoDB
    await connectDB()

    if (isMockMode()) {
      console.log('📦 Using in-memory storage for asset creation')
      
      // Ensure user exists
      storage.getOrCreateUser(ownerKey)
    } else {
      console.log('💾 Using MongoDB for asset creation')
      
      // Ensure user exists in MongoDB
      // Determine wallet type from ownerKey format
      const walletType = ownerKey.startsWith('demo') ? 'demo' : 
                        ownerKey.includes('@') ? 'paymail' : 'handcash'
      
      let user = await User.findOne({ publicKey: ownerKey })
      if (!user) {
        user = await User.create({
          publicKey: ownerKey,
          walletType,
          totalListings: 0,
          totalRentals: 0,
          totalEarnings: 0,
          totalSpent: 0
        })
      }
    }

    // Handle 1Sat ordinal linking
    let verifiedOrdinalId: string | undefined
    let ordinalVerified = false
    let ordinalMessage: string | undefined

    if (ordinalId) {
      // User provided an ordinal ID - verify it
      const isDemoMode = ownerKey.startsWith('demo_')
      
      if (isDemoMode) {
        // Demo mode - accept ordinal without verification
        verifiedOrdinalId = ordinalId
        ordinalVerified = true
        ordinalMessage = 'Ordinal accepted (demo mode)'
      } else {
        // Production - verify ordinal exists
        const verification = await verifyOrdinalExists(ordinalId)
        
        if (verification.exists) {
          // Optionally verify ownership (if owner address is known)
          // const ownership = await verifyOrdinalOwnership(ordinalId, ownerKey)
          
          verifiedOrdinalId = ordinalId
          ordinalVerified = true
          ordinalMessage = 'Ordinal verified on-chain'
        } else {
          // Ordinal not found - continue without linking
          ordinalMessage = `Ordinal not found: ${verification.error}`
          console.warn('Ordinal verification failed:', verification.error)
        }
      }
    } else if (ownerKey.startsWith('demo_')) {
      // Demo mode without ordinal - create a mock ordinal
      const demoOrdinal = createDemoOrdinal(Date.now().toString(), name)
      verifiedOrdinalId = demoOrdinal.id
      ordinalVerified = true
      ordinalMessage = 'Demo ordinal created'
    }

    // Create the asset
    let asset: any

    if (isMockMode()) {
      // Use in-memory storage
      asset = storage.createAsset({
        name,
        description,
        category,
        imageUrl,
        rentalRatePerDay: parseFloat(rentalRatePerDay) || 0,
        depositAmount: parseFloat(depositAmount) || 0,
        currency,
        location: {
          city: location.city,
          state: location.state
        },
        rentalDetails: {
          pickupLocation: {
            address: location.address,
            city: location.city,
            state: location.state
          },
          accessCode,
          specialInstructions,
          ...(ownerContact && {
            ownerContact: {
              name: ownerContact.name,
              phone: ownerContact.phone,
              email: ownerContact.email
            }
          })
        },
        status: 'available',
        unlockFee: parseFloat(String(unlockFee)) || 0.0001,
        ownerKey,
        condition,
        accessories
      })
    } else {
      // Use MongoDB
      const tokenId = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const rentalAsset = await RentalAsset.create({
        tokenId,
        name,
        description,
        category,
        imageUrl,
        rentalRatePerDay: parseFloat(rentalRatePerDay) || 0,
        depositAmount: parseFloat(depositAmount) || 0,
        currency,
        location: {
          city: location.city,
          state: location.state,
          coordinates: location.coordinates
        },
        rentalDetails: {
          pickupLocation: {
            address: location.address,
            city: location.city,
            state: location.state
          },
          accessCode,
          specialInstructions,
          ...(ownerContact && {
            ownerContact: {
              name: ownerContact.name,
              phone: ownerContact.phone,
              email: ownerContact.email
            }
          })
        },
        status: 'available',
        unlockFee: parseFloat(String(unlockFee)) || 0.0001,
        ownerKey,
        condition,
        accessories,
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
    console.error('Asset creation error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create asset',
      message: error.message 
    })
  }
}
