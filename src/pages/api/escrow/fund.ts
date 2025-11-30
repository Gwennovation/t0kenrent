/**
 * Escrow Funding Endpoint
 * POST /api/escrow/fund
 * 
 * Marks escrow as funded after renter sends payment.
 * In production, this would verify the funding transaction on-chain.
 * 
 * Request body: {
 *   escrowId: string,
 *   transactionId: string,  // Funding transaction ID
 *   renterKey: string       // Renter's public key (for verification)
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { storage, globalEscrowStore } from '@/lib/storage'
import { EscrowContract } from '@/lib/escrow'
import { logEscrowEvent } from '@/lib/overlay'

// Use global escrow store for persistence
const escrowStore = globalEscrowStore as Map<string, EscrowContract>

interface FundEscrowResponse {
  success: boolean
  escrowId?: string
  status?: string
  fundingTxId?: string
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FundEscrowResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { escrowId, transactionId, renterKey } = req.body

    if (!escrowId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Escrow ID is required' 
      })
    }

    if (!transactionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction ID is required' 
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

    // Verify renter key matches
    if (renterKey && escrow.renterKey !== renterKey) {
      return res.status(403).json({ 
        success: false, 
        error: 'Renter key does not match escrow' 
      })
    }

    // Check escrow status
    if (escrow.status !== 'created') {
      return res.status(400).json({ 
        success: false, 
        error: `Escrow cannot be funded - current status: ${escrow.status}` 
      })
    }

    // In production, verify the transaction on-chain:
    // 1. Check transaction exists
    // 2. Verify outputs to escrow address
    // 3. Verify amount matches totalAmount
    
    // For hackathon, accept demo transactions
    const isDemoTx = transactionId.startsWith('demo_')
    
    if (!isDemoTx) {
      // Attempt to verify on WhatsOnChain
      try {
        const response = await fetch(
          `https://api.whatsonchain.com/v1/bsv/main/tx/${transactionId}`
        )
        if (!response.ok) {
          console.warn('Transaction not found on WhatsOnChain, proceeding anyway for hackathon')
        }
      } catch (err) {
        console.warn('Could not verify transaction:', err)
      }
    }

    // Update escrow status
    escrow.status = 'funded'
    escrow.fundedAt = new Date().toISOString()
    escrowStore.set(escrowId, escrow)

    // Create rental record
    const rental = storage.createRental({
      assetId: escrow.assetId,
      assetName: escrow.assetName,
      renterKey: escrow.renterKey,
      ownerKey: escrow.ownerKey,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
      rentalDays: 7,
      rentalFee: escrow.rentalFee,
      depositAmount: escrow.depositAmount,
      totalAmount: escrow.totalAmount,
      status: 'pending',
      escrowTxId: transactionId
    })

    // Update asset status
    storage.updateAsset(escrow.assetId, { status: 'rented' })

    // Log funding event to overlay (non-blocking)
    logEscrowEvent({
      escrowId: escrow.id,
      rentalId: escrow.rentalId,
      eventType: 'funded',
      renterKey: escrow.renterKey,
      ownerKey: escrow.ownerKey,
      totalAmount: escrow.totalAmount,
      depositAmount: escrow.depositAmount,
      rentalFee: escrow.rentalFee,
      fundingTxid: transactionId
    }).catch(err => console.error('Failed to log escrow funding:', err))

    return res.status(200).json({
      success: true,
      escrowId: escrow.id,
      status: escrow.status,
      fundingTxId: transactionId,
      message: 'Escrow funded successfully. Rental is now active.'
    })

  } catch (error: any) {
    console.error('Escrow funding error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fund escrow'
    })
  }
}
