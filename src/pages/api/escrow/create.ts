/**
 * Escrow Creation Endpoint
 * POST /api/escrow/create
 * 
 * Creates a new 2-of-2 multisig escrow contract for a rental agreement.
 * Both owner and renter must co-sign to release funds.
 * 
 * Request body: {
 *   assetId: string,          // Asset being rented
 *   renterKey: string,        // Renter's public key
 *   ownerKey: string,         // Owner's public key
 *   rentalPeriod: {           // Rental dates
 *     startDate: string,
 *     endDate: string
 *   },
 *   depositAmount: number,    // Deposit in BSV
 *   rentalFee: number         // Rental fee in BSV
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { isMockMode } from '@/lib/mongodb'
import { RentalAsset, Escrow as EscrowModel } from '@/models'
import { storage, globalEscrowStore } from '@/lib/storage'
import { 
  createEscrowContract, 
  getEscrowStatus,
  EscrowContract 
} from '@/lib/escrow'
import { logEscrowEvent } from '@/lib/overlay'

// Use global escrow store for persistence
const escrowStore = globalEscrowStore as Map<string, EscrowContract>

interface CreateEscrowResponse {
  success: boolean
  escrowId?: string
  escrowAddress?: string
  escrowScript?: string
  multisigScript?: string
  requiredSignatures?: number
  timeoutBlocks?: number
  totalAmount?: number
  depositAmount?: number
  rentalFee?: number
  status?: string
  statusInfo?: {
    status: string
    canRelease: boolean
    message: string
  }
  rentalPeriod?: {
    startDate: string
    endDate: string
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateEscrowResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  await connectDB()
  const mockMode = isMockMode()

  try {
    const {
      assetId,
      rentalTokenId, // Support both assetId and rentalTokenId
      renterKey,
      ownerKey,
      rentalPeriod,
      depositAmount,
      rentalFee
    } = req.body

    // Get the asset ID (support both field names)
    const targetAssetId = assetId || rentalTokenId

    // Validate required fields
    if (!targetAssetId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Asset ID is required' 
      })
    }

    if (!renterKey || !ownerKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both renter and owner keys are required' 
      })
    }

    if (!rentalPeriod?.startDate || !rentalPeriod?.endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rental period (startDate, endDate) is required' 
      })
    }

    if (mockMode) {
      // Find the asset in in-memory storage
      let asset = storage.getAssetById(targetAssetId)
      if (!asset) {
        asset = storage.getAssetByTokenId(targetAssetId)
      }

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: 'Asset not found'
        })
      }

      if (asset.status !== 'available') {
        return res.status(400).json({
          success: false,
          error: 'Asset is not available for rent'
        })
      }

      // Use provided amounts or asset defaults
      const actualDeposit = depositAmount || asset.depositAmount
      const actualRentalFee = rentalFee || calculateRentalFee(
        asset.rentalRatePerDay,
        rentalPeriod.startDate,
        rentalPeriod.endDate
      )

      // Create the escrow contract
      const escrow = createEscrowContract({
        ownerKey: ownerKey || asset.ownerKey,
        renterKey,
        depositAmount: actualDeposit,
        rentalFee: actualRentalFee,
        currency: asset.currency || 'USD',
        rentalId: `rental_${Date.now()}`,
        assetId: asset.id,
        assetName: asset.name
      })

      // Store escrow in memory
      escrowStore.set(escrow.id, escrow)

      // Update asset status to pending
      storage.updateAsset(asset.id, { status: 'pending' })

      // Log escrow creation to overlay (non-blocking)
      logEscrowEvent({
        escrowId: escrow.id,
        rentalId: escrow.rentalId,
        eventType: 'created',
        renterKey: escrow.renterKey,
        ownerKey: escrow.ownerKey,
        totalAmount: escrow.totalAmount,
        depositAmount: escrow.depositAmount,
        rentalFee: escrow.rentalFee
      }).catch(err => console.error('Failed to log escrow creation:', err))

      // Get status info
      const statusInfo = getEscrowStatus(escrow)

      return res.status(201).json({
        success: true,
        escrowId: escrow.id,
        escrowAddress: escrow.address,
        escrowScript: escrow.redeemScript,
        multisigScript: escrow.multisigScript,
        requiredSignatures: 2,
        timeoutBlocks: escrow.timeoutBlocks,
        totalAmount: escrow.totalAmount,
        depositAmount: escrow.depositAmount,
        rentalFee: escrow.rentalFee,
        status: escrow.status,
        statusInfo: {
          status: statusInfo.status,
          canRelease: statusInfo.canRelease,
          message: statusInfo.message
        },
        rentalPeriod: {
          startDate: rentalPeriod.startDate,
          endDate: rentalPeriod.endDate
        }
      })
    }

    // ======= MONGODB MODE =======
    const mongoQuery: any[] = [{ tokenId: targetAssetId }]
    if (/^[0-9a-fA-F]{24}$/.test(targetAssetId)) {
      mongoQuery.push({ _id: targetAssetId })
    }

    const asset = await RentalAsset.findOne({ $or: mongoQuery })

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      })
    }

    if (asset.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: 'Asset is not available for rent'
      })
    }

    const actualDeposit = typeof depositAmount === 'number' ? depositAmount : asset.depositAmount
    const actualRentalFee = typeof rentalFee === 'number' ? rentalFee : calculateRentalFee(
      asset.rentalRatePerDay,
      rentalPeriod.startDate,
      rentalPeriod.endDate
    )

    const escrow = createEscrowContract({
      ownerKey: ownerKey || asset.ownerKey,
      renterKey,
      depositAmount: actualDeposit,
      rentalFee: actualRentalFee,
      currency: asset.currency || 'USD',
      rentalId: `rental_${Date.now()}`,
      assetId: asset._id.toString(),
      assetName: asset.name
    })

    // Store escrow in global map for status endpoint compatibility
    escrowStore.set(escrow.id, escrow)

    // Persist escrow to MongoDB
    await EscrowModel.create({
      escrowId: escrow.id,
      rentalTokenId: asset.tokenId,
      assetName: asset.name,
      ownerKey: ownerKey || asset.ownerKey,
      renterKey,
      rentalPeriod: {
        startDate: new Date(rentalPeriod.startDate),
        endDate: new Date(rentalPeriod.endDate)
      },
      depositAmount: actualDeposit,
      rentalFee: actualRentalFee,
      totalAmount: escrow.totalAmount,
      currency: asset.currency || 'USD',
      escrowAddress: escrow.address,
      escrowScript: escrow.redeemScript,
      multisigScript: escrow.multisigScript,
      ownerPubKey: ownerKey || asset.ownerKey,
      renterPubKey: renterKey,
      timeoutBlocks: escrow.timeoutBlocks,
      status: 'created'
    })

    // Update asset status to pending and save
    asset.status = 'pending'
    await asset.save()

    logEscrowEvent({
      escrowId: escrow.id,
      rentalId: escrow.rentalId,
      eventType: 'created',
      renterKey: escrow.renterKey,
      ownerKey: escrow.ownerKey,
      totalAmount: escrow.totalAmount,
      depositAmount: escrow.depositAmount,
      rentalFee: escrow.rentalFee
    }).catch(err => console.error('Failed to log escrow creation:', err))

    const statusInfo = getEscrowStatus(escrow)

    return res.status(201).json({
      success: true,
      escrowId: escrow.id,
      escrowAddress: escrow.address,
      escrowScript: escrow.redeemScript,
      multisigScript: escrow.multisigScript,
      requiredSignatures: 2,
      timeoutBlocks: escrow.timeoutBlocks,
      totalAmount: escrow.totalAmount,
      depositAmount: escrow.depositAmount,
      rentalFee: escrow.rentalFee,
      status: escrow.status,
      statusInfo: {
        status: statusInfo.status,
        canRelease: statusInfo.canRelease,
        message: statusInfo.message
      },
      rentalPeriod: {
        startDate: rentalPeriod.startDate,
        endDate: rentalPeriod.endDate
      }
    })

  } catch (error: any) {
    console.error('Escrow creation error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create escrow'
    })
  }
}

/**
 * Calculate rental fee based on daily rate and rental period
 */
function calculateRentalFee(
  dailyRate: number,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return dailyRate * Math.max(1, days)
}

// Export escrow store for other endpoints
export { escrowStore }
