import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/mongodb'
import ActionChain from '@/models/ActionChain'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await connectDB()

    const { chainId, stageId, paymentData } = req.body

    if (!chainId || !stageId || !paymentData) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Find the action chain
    const actionChain = await ActionChain.findOne({ chainId })

    if (!actionChain) {
      return res.status(404).json({ error: 'Action chain not found' })
    }

    // Find the stage and update payment
    const stageIndex = actionChain.stages.findIndex(
      (stage: any) => stage.id === stageId
    )

    if (stageIndex === -1) {
      return res.status(404).json({ error: 'Stage not found' })
    }

    // Update payment
    actionChain.stages[stageIndex].payment = {
      ...paymentData,
      timestamp: new Date()
    }

    // Update financial tracking
    if (paymentData.status === 'verified') {
      actionChain.totalRentCollected += paymentData.amount
      actionChain.pendingPayments = Math.max(0, actionChain.pendingPayments - 1)
    }

    await actionChain.save()

    return res.status(200).json({
      success: true,
      message: 'Payment updated successfully'
    })

  } catch (error: any) {
    console.error('Payment update error:', error)
    return res.status(500).json({ 
      error: 'Failed to update payment',
      message: error.message 
    })
  }
}
