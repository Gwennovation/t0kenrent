/**
 * Escrow Status Endpoint
 * GET /api/escrow/status?escrowId=xxx
 * 
 * Returns the current status of an escrow contract.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { globalEscrowStore, globalReleaseStore } from '@/lib/storage'
import { getEscrowStatus, EscrowContract, EscrowRelease } from '@/lib/escrow'

// Use global stores for persistence
const escrowStore = globalEscrowStore as Map<string, EscrowContract>
const releaseStore = globalReleaseStore as Map<string, EscrowRelease>

interface StatusResponse {
  success: boolean
  escrow?: {
    id: string
    address: string
    status: string
    statusInfo: {
      status: string
      canRelease: boolean
      waitingFor: string[]
      message: string
    }
    parties: {
      owner: string
      renter: string
    }
    amounts: {
      deposit: number
      rentalFee: number
      total: number
      currency: string
    }
    asset: {
      id: string
      name: string
    }
    rental: {
      id: string
    }
    timestamps: {
      created: string
      funded?: string
      released?: string
    }
    release?: {
      status: string
      toOwner: number
      toRenter: number
      ownerSigned: boolean
      renterSigned: boolean
      releaseTxId?: string
    }
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { escrowId } = req.query

    if (!escrowId || typeof escrowId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Escrow ID is required' 
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

    // Get status info
    const statusInfo = getEscrowStatus(escrow)

    // Get release info if exists
    const release = releaseStore.get(escrowId)

    return res.status(200).json({
      success: true,
      escrow: {
        id: escrow.id,
        address: escrow.address,
        status: escrow.status,
        statusInfo,
        parties: {
          owner: escrow.ownerKey,
          renter: escrow.renterKey
        },
        amounts: {
          deposit: escrow.depositAmount,
          rentalFee: escrow.rentalFee,
          total: escrow.totalAmount,
          currency: escrow.currency
        },
        asset: {
          id: escrow.assetId,
          name: escrow.assetName
        },
        rental: {
          id: escrow.rentalId
        },
        timestamps: {
          created: escrow.createdAt,
          funded: escrow.fundedAt,
          released: escrow.releasedAt
        },
        ...(release && {
          release: {
            status: release.status,
            toOwner: release.toOwner,
            toRenter: release.toRenter,
            ownerSigned: !!release.ownerSignature,
            renterSigned: !!release.renterSignature,
            releaseTxId: release.releaseTxId
          }
        })
      }
    })

  } catch (error: any) {
    console.error('Escrow status error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get escrow status'
    })
  }
}
