/**
 * Escrow Release Endpoint
 * POST /api/escrow/release
 * 
 * Handles the dual-signing release process for escrow funds.
 * Requires signatures from both owner and renter for standard releases.
 * 
 * Request body: {
 *   escrowId: string,
 *   signerKey: string,           // Public key of the signer
 *   signature: string,           // Signature (or 'demo_signature' for hackathon)
 *   releaseType: 'standard' | 'partial' | 'full_to_owner' | 'full_to_renter',
 *   damageAmount?: number        // For partial releases
 * }
 * 
 * Release types:
 *   - standard: Rental fee to owner, deposit back to renter
 *   - partial: Rental fee + damage deduction to owner, remaining to renter
 *   - full_to_owner: All funds to owner (renter breach)
 *   - full_to_renter: All funds to renter (owner breach)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { storage, globalEscrowStore, globalReleaseStore } from '@/lib/storage'
import { 
  createSignature,
  initializeRelease,
  addSignatureToRelease,
  canRelease,
  executeRelease,
  getEscrowStatus,
  EscrowRelease,
  EscrowContract
} from '@/lib/escrow'
import { logEscrowEvent } from '@/lib/overlay'

// Use global stores for persistence
const escrowStore = globalEscrowStore as Map<string, EscrowContract>
const releaseStore = globalReleaseStore as Map<string, EscrowRelease>

interface ReleaseResponse {
  success: boolean
  escrowId?: string
  status?: string
  releaseStatus?: string
  release?: {
    toOwner: number
    toRenter: number
    releaseType: string
    ownerSigned: boolean
    renterSigned: boolean
  }
  releaseTxId?: string
  message?: string
  waitingFor?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReleaseResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { 
      escrowId, 
      signerKey, 
      signature,
      releaseType = 'standard',
      damageAmount = 0
    } = req.body

    if (!escrowId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Escrow ID is required' 
      })
    }

    if (!signerKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Signer key is required' 
      })
    }

    // Get escrow from store
    const escrow = escrowStore.get(escrowId)
    
    if (!escrow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Escrow not found' 
      })
    }

    // Verify signer is a party to the escrow
    const isOwner = signerKey === escrow.ownerKey
    const isRenter = signerKey === escrow.renterKey

    if (!isOwner && !isRenter) {
      return res.status(403).json({ 
        success: false, 
        error: 'Signer is not a party to this escrow' 
      })
    }

    // Check escrow can be released
    if (escrow.status !== 'funded' && escrow.status !== 'active' && escrow.status !== 'releasing') {
      return res.status(400).json({ 
        success: false, 
        error: `Escrow cannot be released - current status: ${escrow.status}` 
      })
    }

    // Get or create release process
    let release = releaseStore.get(escrowId)
    
    if (!release) {
      // Initialize new release
      release = initializeRelease(escrow, releaseType, damageAmount)
      releaseStore.set(escrowId, release)
      escrow.status = 'releasing'
      escrowStore.set(escrowId, escrow)
    }

    // Create signature for this signer
    const newSignature = createSignature(escrowId, signerKey, 'release')
    
    // For hackathon, accept demo signatures
    if (signature?.startsWith('demo_') || signature === newSignature.signature) {
      // Valid signature
    } else if (signature) {
      // Use provided signature
      newSignature.signature = signature
    }

    // Add signature to release
    release = addSignatureToRelease(release, escrow, newSignature)
    releaseStore.set(escrowId, release)

    // Check if we can execute release
    if (canRelease(release)) {
      // Execute the release transaction
      const result = await executeRelease(escrow, release)
      
      if (result.success) {
        // Update escrow status
        escrow.status = 'released'
        escrow.releasedAt = new Date().toISOString()
        escrowStore.set(escrowId, escrow)

        // Update asset status back to available
        storage.updateAsset(escrow.assetId, { status: 'available' })

        // Log release event to overlay (non-blocking)
        logEscrowEvent({
          escrowId: escrow.id,
          rentalId: escrow.rentalId,
          eventType: 'released',
          renterKey: escrow.renterKey,
          ownerKey: escrow.ownerKey,
          totalAmount: escrow.totalAmount,
          depositAmount: escrow.depositAmount,
          rentalFee: escrow.rentalFee,
          releaseType: release.releaseType === 'full_to_renter' ? 'standard' : release.releaseType,
          damageDeduction: damageAmount,
          releaseTxid: result.txId
        }).catch(err => console.error('Failed to log escrow release:', err))

        return res.status(200).json({
          success: true,
          escrowId: escrow.id,
          status: 'released',
          releaseStatus: release.status,
          release: {
            toOwner: release.toOwner,
            toRenter: release.toRenter,
            releaseType: release.releaseType,
            ownerSigned: !!release.ownerSignature,
            renterSigned: !!release.renterSignature
          },
          releaseTxId: result.txId,
          message: 'Escrow released successfully'
        })
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to execute release transaction'
        })
      }
    }

    // Not all signatures yet - return status
    const waitingFor = isOwner ? 'renter signature' : 'owner signature'
    
    return res.status(200).json({
      success: true,
      escrowId: escrow.id,
      status: escrow.status,
      releaseStatus: release.status,
      release: {
        toOwner: release.toOwner,
        toRenter: release.toRenter,
        releaseType: release.releaseType,
        ownerSigned: !!release.ownerSignature,
        renterSigned: !!release.renterSignature
      },
      message: `Signature recorded. Waiting for ${waitingFor}.`,
      waitingFor
    })

  } catch (error: any) {
    console.error('Escrow release error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to process release'
    })
  }
}

// Export release store for status endpoint
export { releaseStore }
