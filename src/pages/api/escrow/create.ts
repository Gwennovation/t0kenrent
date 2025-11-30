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

    // Find the asset
    let asset = storage.getAssetById(targetAssetId)
    if (!asset) {
      // Try by token ID
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
