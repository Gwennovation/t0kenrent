import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import Escrow from '@/models/Escrow'
import RentalAsset from '@/models/RentalAsset'

/**
 * Escrow Release Endpoint
 * 
 * Handles the release of escrowed funds when both parties co-sign.
 * Supports:
 * - Standard release (deposit back to renter, fee to owner)
 * - Partial release (damage deduction)
 * - Full release to owner (renter breach)
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
      escrowId,
      signerKey,
      signature,
      releaseType = 'standard', // 'standard', 'partial', 'owner_full'
      damageAmount = 0
    } = req.body

    if (!escrowId || !signerKey || !signature) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Find the escrow
    const escrow = await Escrow.findOne({ escrowId })

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' })
    }

    if (escrow.status !== 'funded') {
      return res.status(400).json({ 
        error: 'Escrow must be in funded state to release',
        currentStatus: escrow.status
      })
    }

    // Determine who is signing
    const isOwner = signerKey === escrow.ownerKey
    const isRenter = signerKey === escrow.renterKey

    if (!isOwner && !isRenter) {
      return res.status(403).json({ 
        error: 'Signer is not a party to this escrow' 
      })
    }

    // Add signature
    if (isOwner) {
      if (escrow.signatures.ownerSigned) {
        return res.status(400).json({ error: 'Owner has already signed' })
      }
      escrow.signatures.ownerSigned = true
      escrow.signatures.ownerSignature = signature
      escrow.signatures.ownerSignedAt = new Date()
    } else {
      if (escrow.signatures.renterSigned) {
        return res.status(400).json({ error: 'Renter has already signed' })
      }
      escrow.signatures.renterSigned = true
      escrow.signatures.renterSignature = signature
      escrow.signatures.renterSignedAt = new Date()
    }

    // Check if both have signed
    const bothSigned = escrow.signatures.ownerSigned && escrow.signatures.renterSigned

    if (bothSigned) {
      // Calculate release breakdown
      let toOwner = escrow.rentalFee
      let toRenter = escrow.depositAmount

      if (releaseType === 'partial' && damageAmount > 0) {
        // Deduct damage from renter's deposit
        const deduction = Math.min(damageAmount, escrow.depositAmount)
        toRenter -= deduction
        toOwner += deduction
      } else if (releaseType === 'owner_full') {
        // All funds to owner (renter breach)
        toOwner = escrow.totalAmount
        toRenter = 0
      }

      escrow.releaseBreakdown = {
        toOwner,
        toRenter,
        toArbitrator: 0
      }

      escrow.status = 'completed'
      escrow.completedAt = new Date()

      // Update asset status back to available
      const asset = await RentalAsset.findOne({ tokenId: escrow.rentalTokenId })
      if (asset) {
        asset.status = 'available'
        asset.totalEarnings = (asset.totalEarnings || 0) + toOwner
        await asset.save()
      }
    }

    await escrow.save()

    return res.status(200).json({
      success: true,
      escrowId: escrow.escrowId,
      status: escrow.status,
      signatures: {
        ownerSigned: escrow.signatures.ownerSigned,
        renterSigned: escrow.signatures.renterSigned
      },
      releaseBreakdown: bothSigned ? escrow.releaseBreakdown : null,
      message: bothSigned 
        ? 'Both parties have signed. Escrow released.' 
        : `Signature recorded. Waiting for ${isOwner ? 'renter' : 'owner'} signature.`
    })

  } catch (error: any) {
    console.error('Escrow release error:', error)
    return res.status(500).json({ 
      error: 'Failed to process escrow release',
      message: error.message 
    })
  }
}
