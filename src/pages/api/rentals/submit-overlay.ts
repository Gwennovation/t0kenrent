import type { NextApiRequest, NextApiResponse } from 'next'
import { storage } from '@/lib/storage'
import { createRentalProofScript, RentalProofToken } from '@/lib/pushdrop'

// Topic Manager for T0kenRent rental events
const OVERLAY_URL = process.env.OVERLAY_URL || 'https://overlay-us-1.bsvb.tech'
const TOPIC_MANAGER = 'tm_tokenrent'
const LOOKUP_SERVICE = 'ls_tokenrent'

/**
 * Rental Overlay Event Submission Endpoint
 * 
 * Submits rental events to the overlay network for indexing and discovery.
 * This enables:
 * - Discovery of rental history for assets
 * - Verification of rental agreements
 * - Cross-platform interoperability
 * 
 * POST /api/rentals/submit-overlay
 * Body:
 * - rentalId: string (required)
 * - eventType: 'created' | 'started' | 'completed' | 'cancelled' (required)
 * - txId: string (optional, transaction ID if already broadcast)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { rentalId, eventType, txId } = req.body

    if (!rentalId || !eventType) {
      return res.status(400).json({ error: 'Missing required fields: rentalId, eventType' })
    }

    // Validate event type
    const validEvents = ['created', 'started', 'completed', 'cancelled']
    if (!validEvents.includes(eventType)) {
      return res.status(400).json({ 
        error: `Invalid event type. Must be one of: ${validEvents.join(', ')}` 
      })
    }

    // Get rental from storage
    const rental = storage.getRentalById(rentalId)
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' })
    }

    // Get asset for additional data
    const asset = storage.getAssetById(rental.assetId)

    // Create overlay event payload
    const overlayEvent = {
      protocol: 'T0kenRent',
      version: '1.0',
      eventType,
      rental: {
        id: rental.id,
        escrowId: rental.escrowId,
        assetId: rental.assetId,
        assetName: rental.assetName,
        tokenId: asset?.tokenId || `token_${rental.assetId}`,
        ownerKey: rental.ownerKey,
        renterKey: rental.renterKey,
        startDate: rental.startDate,
        endDate: rental.endDate,
        rentalDays: rental.rentalDays,
        totalAmount: rental.totalAmount,
        currency: 'USD',
        status: rental.status
      },
      transactions: {
        payment: rental.paymentTxId,
        escrow: rental.escrowTxId,
        release: rental.releaseTxId
      },
      timestamp: new Date().toISOString()
    }

    // Try to submit to overlay network
    let overlaySubmission: any = null
    let overlayError: string | null = null

    try {
      const response = await fetch(`${OVERLAY_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Topics': JSON.stringify([TOPIC_MANAGER]),
          'X-Event-Type': eventType,
          'X-Rental-ID': rental.id
        },
        body: JSON.stringify(overlayEvent)
      })

      if (response.ok) {
        overlaySubmission = await response.json()
      } else {
        overlayError = `Overlay response: ${response.status} ${response.statusText}`
      }
    } catch (err: any) {
      overlayError = `Overlay connection error: ${err.message}`
      console.warn('Overlay submission failed (expected in demo):', err.message)
    }

    // Generate demo overlay submission ID for hackathon
    const demoOverlayId = `overlay_${eventType}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`

    // Create PushDrop proof script for the event
    const proofToken: RentalProofToken = {
      rentalId: rental.id,
      assetId: rental.assetId,
      assetName: rental.assetName,
      tokenId: asset?.tokenId || `token_${rental.assetId}`,
      ownerKey: rental.ownerKey,
      renterKey: rental.renterKey,
      startDate: rental.startDate,
      endDate: rental.endDate,
      rentalDays: rental.rentalDays,
      rentalFee: rental.rentalFee,
      depositAmount: rental.depositAmount,
      totalAmount: rental.totalAmount,
      currency: 'USD',
      status: eventType === 'completed' ? 'completed' : 
              eventType === 'cancelled' ? 'cancelled' : 
              eventType === 'started' ? 'active' : 'created',
      createdAt: rental.createdAt,
      completedAt: eventType === 'completed' ? rental.completedAt : undefined,
      paymentTxId: rental.paymentTxId,
      escrowTxId: rental.escrowTxId,
      releaseTxId: rental.releaseTxId
    }

    const proofScript = createRentalProofScript(proofToken)

    return res.status(200).json({
      success: true,
      eventType,
      rentalId: rental.id,
      overlay: {
        topicManager: TOPIC_MANAGER,
        lookupService: LOOKUP_SERVICE,
        submission: overlaySubmission || {
          id: demoOverlayId,
          status: 'pending',
          demo: true
        },
        error: overlayError,
        url: OVERLAY_URL
      },
      event: overlayEvent,
      proof: {
        script: proofScript,
        token: proofToken
      },
      message: overlaySubmission 
        ? 'Event submitted to overlay network successfully'
        : `Demo overlay submission created (overlay ${overlayError ? 'unavailable' : 'simulated'})`
    })

  } catch (error: any) {
    console.error('Overlay submission error:', error)
    return res.status(500).json({
      error: 'Failed to submit to overlay',
      message: error.message
    })
  }
}
