import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'
import { 
  createRentalCreationToken, 
  createRentalCompletionToken,
  getRentalProofActionParams,
  RentalProofToken 
} from '@/lib/pushdrop'

/**
 * Rental Proof Minting Endpoint
 * 
 * Creates a PushDrop token representing proof of rental.
 * This provides an on-chain record that can be verified independently.
 * 
 * POST /api/rentals/mint-proof
 * Body:
 * - rentalId: string (required)
 * - proofType: 'creation' | 'completion' (default: 'creation')
 * - paymentTxId: string (optional, for linking payment)
 * - escrowTxId: string (optional, for linking escrow)
 * - releaseTxId: string (optional, for completion proof)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      rentalId, 
      proofType = 'creation',
      paymentTxId,
      escrowTxId,
      releaseTxId
    } = req.body

    if (!rentalId) {
      return res.status(400).json({ error: 'Rental ID is required' })
    }

    // Get rental from storage
    const rental = storage.getRentalById(rentalId)
    
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' })
    }

    // Get asset for additional metadata
    const asset = storage.getAssetById(rental.assetId)
    const assetName = asset?.name || rental.assetName
    const tokenId = asset?.tokenId || `token_${rental.assetId}`

    let script: string
    let token: RentalProofToken

    if (proofType === 'completion') {
      // Create completion proof
      const originalToken: RentalProofToken = {
        rentalId: rental.id,
        assetId: rental.assetId,
        assetName,
        tokenId,
        ownerKey: rental.ownerKey,
        renterKey: rental.renterKey,
        startDate: rental.startDate,
        endDate: rental.endDate,
        rentalDays: rental.rentalDays,
        rentalFee: rental.rentalFee,
        depositAmount: rental.depositAmount,
        totalAmount: rental.totalAmount,
        currency: 'USD',
        status: 'active',
        createdAt: rental.createdAt,
        paymentTxId: rental.paymentTxId || paymentTxId,
        escrowTxId: rental.escrowTxId || escrowTxId
      }
      
      const result = await createRentalCompletionToken(
        originalToken, 
        releaseTxId || rental.releaseTxId
      )
      script = result.script
      token = result.token
    } else {
      // Create creation proof
      const result = await createRentalCreationToken({
        rentalId: rental.id,
        assetId: rental.assetId,
        assetName,
        tokenId,
        ownerKey: rental.ownerKey,
        renterKey: rental.renterKey,
        startDate: rental.startDate,
        endDate: rental.endDate,
        rentalDays: rental.rentalDays,
        rentalFee: rental.rentalFee,
        depositAmount: rental.depositAmount,
        totalAmount: rental.totalAmount,
        currency: 'USD',
        paymentTxId: paymentTxId || rental.paymentTxId,
        escrowTxId: escrowTxId || rental.escrowTxId
      })
      script = result.script
      token = result.token
    }

    // Get Babbage SDK action parameters for minting
    const actionParams = getRentalProofActionParams(token)

    // Generate demo transaction ID for hackathon
    const demoMintTxId = `mint_${proofType}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`

    return res.status(200).json({
      success: true,
      proofType,
      rental: {
        id: rental.id,
        assetName,
        ownerKey: rental.ownerKey,
        renterKey: rental.renterKey,
        status: rental.status
      },
      token: {
        ...token,
        scriptHex: script
      },
      actionParams,
      // For demo mode, include a simulated mint transaction
      demoMint: {
        txId: demoMintTxId,
        basket: actionParams.outputs[0].basket,
        timestamp: new Date().toISOString()
      },
      message: `Rental ${proofType} proof generated. Use actionParams with Babbage SDK to mint on-chain.`
    })

  } catch (error: any) {
    console.error('Rental proof minting error:', error)
    return res.status(500).json({
      error: 'Failed to generate rental proof',
      message: error.message
    })
  }
}
