import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import ActionChain from '@/models/ActionChain'
import { storeStageOnOverlay } from '@/lib/overlay'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { title, stages, ownerKey } = req.body

    // Validate input
    if (!title || !stages || !ownerKey) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (stages.length < 2) {
      return res.status(400).json({ error: 'Chain must have at least 2 stages' })
    }

    // Generate unique chain ID
    const chainId = `chain-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Store each stage on overlay
    const stagesWithTxids = await Promise.all(
      stages.map(async (stage: any, index: number) => {
        try {
          const txid = await storeStageOnOverlay({
            chainId,
            stageIndex: index,
            title: stage.title,
            metadata: stage.metadata,
            requiresPayment: stage.requiresPayment,
            rentAmount: stage.rentAmount
          })

          return {
            ...stage,
            transactionId: txid
          }
        } catch (error) {
          console.error(`Failed to store stage ${index}:`, error)
          return stage
        }
      })
    )

    // Create action chain in database
    const actionChain = await ActionChain.create({
      chainId,
      title,
      stages: stagesWithTxids,
      ownerKey,
      finalized: true,
      flow: stages.map((s: any) => s.title),
      pendingPayments: stages.filter((s: any) => s.requiresPayment).length
    })

    return res.status(201).json({
      success: true,
      chainId: actionChain.chainId,
      stages: actionChain.stages.length
    })

  } catch (error: any) {
    console.error('Chain creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create action chain',
      message: error.message 
    })
  }
}
