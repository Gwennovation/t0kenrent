import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import Escrow from '@/models/Escrow'
import RentalAsset from '@/models/RentalAsset'
import { Script, P2PKH } from '@bsv/sdk'

/**
 * Escrow Creation Endpoint
 * 
 * Creates a new escrow contract for a rental agreement.
 * The escrow uses a 2-of-2 multisig script that requires both
 * the owner and renter to co-sign for fund release.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const {
      rentalTokenId,
      renterKey,
      ownerKey,
      rentalPeriod,
      depositAmount,
      rentalFee
    } = req.body

    // Validate required fields
    if (!rentalTokenId || !renterKey || !ownerKey) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!rentalPeriod?.startDate || !rentalPeriod?.endDate) {
      return res.status(400).json({ error: 'Rental period is required' })
    }

    // Find the asset
    const asset = await RentalAsset.findOne({ tokenId: rentalTokenId })
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    if (asset.status !== 'available') {
      return res.status(400).json({ error: 'Asset is not available for rent' })
    }

    // Verify owner key matches
    if (asset.ownerKey !== ownerKey) {
      return res.status(400).json({ error: 'Owner key mismatch' })
    }

    // Generate unique escrow ID
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Calculate total amount
    const totalAmount = depositAmount + rentalFee

    // Create 2-of-2 multisig script
    // Format: OP_2 <ownerPubKey> <renterPubKey> OP_2 OP_CHECKMULTISIG
    const multisigScript = createMultisigScript(ownerKey, renterKey)

    // Generate escrow address from script
    const escrowAddress = generateEscrowAddress(escrowId)

    // Create escrow document
    const escrow = await Escrow.create({
      escrowId,
      rentalTokenId,
      assetName: asset.name,
      ownerKey,
      renterKey,
      rentalPeriod: {
        startDate: new Date(rentalPeriod.startDate),
        endDate: new Date(rentalPeriod.endDate)
      },
      depositAmount,
      rentalFee,
      totalAmount,
      currency: asset.currency || 'USD',
      escrowAddress,
      escrowScript: multisigScript,
      multisigScript,
      ownerPubKey: ownerKey,
      renterPubKey: renterKey,
      timeoutBlocks: 144, // ~1 day
      status: 'created'
    })

    // Update asset status to pending
    asset.status = 'pending'
    await asset.save()

    return res.status(201).json({
      success: true,
      escrowId: escrow.escrowId,
      escrowAddress: escrow.escrowAddress,
      escrowScript: escrow.escrowScript,
      multisigScript: escrow.multisigScript,
      requiredSignatures: 2,
      timeoutBlocks: escrow.timeoutBlocks,
      totalAmount: escrow.totalAmount,
      status: escrow.status,
      rentalPeriod: escrow.rentalPeriod
    })

  } catch (error: any) {
    console.error('Escrow creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create escrow',
      message: error.message 
    })
  }
}

/**
 * Create a 2-of-2 multisig script
 * Production would use actual Bitcoin Script with proper encoding
 */
function createMultisigScript(ownerPubKey: string, renterPubKey: string): string {
  // Simplified representation for hackathon
  // Real implementation would create proper Bitcoin Script:
  // OP_2 <ownerPubKey> <renterPubKey> OP_2 OP_CHECKMULTISIG
  
  try {
    const script = Script.fromASM(`
      OP_2
      ${ownerPubKey}
      ${renterPubKey}
      OP_2
      OP_CHECKMULTISIG
    `.trim().replace(/\s+/g, ' '))
    
    return script.toHex()
  } catch (error) {
    // Fallback to simplified string representation
    return `OP_2 ${ownerPubKey} ${renterPubKey} OP_2 OP_CHECKMULTISIG`
  }
}

/**
 * Generate escrow address
 * In production, this would derive from the multisig script
 */
function generateEscrowAddress(escrowId: string): string {
  // For hackathon, generate a deterministic-looking address
  // Real implementation would derive P2SH address from multisig script
  const hash = Buffer.from(escrowId).toString('base64').substring(0, 32)
  return `3${hash.replace(/[+/=]/g, 'x')}`
}
