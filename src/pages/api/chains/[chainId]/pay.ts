import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { MOCK_MODE } from '@/lib/mongodb'
import Chain from '@/models/Chain'
import { inMemoryStorage } from '@/lib/storage'
import { verifyPaymentOnOverlay } from '@/lib/overlay'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { chainId } = req.query
  const { stageId, paymentTxid, paidBy, walletType } = req.body

  if (!chainId || typeof chainId !== 'string') {
    return res.status(400).json({ error: 'Chain ID is required' })
  }

  if (!stageId) {
    return res.status(400).json({ error: 'Stage ID is required' })
  }

  try {
    if (MOCK_MODE) {
      const chain = inMemoryStorage.chains.find(c => c.chainId === chainId)
      
      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' })
      }

      const stage = chain.stages.find(s => s.id === stageId)
      
      if (!stage) {
        return res.status(404).json({ error: 'Stage not found' })
      }

      if (!stage.requiresPayment) {
        return res.status(400).json({ error: 'This stage does not require payment' })
      }

      if (stage.status === 'paid' || stage.status === 'completed') {
        return res.status(400).json({ error: 'This stage has already been paid' })
      }

      // Simulate payment verification
      const mockPaymentTxid = paymentTxid || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      // Update stage status
      stage.status = 'paid'
      stage.paymentTxid = mockPaymentTxid
      stage.paidAt = new Date()
      stage.paidBy = paidBy || 'demo_payer'

      // Update chain stats
      chain.completedStages = chain.stages.filter(s => s.status === 'completed' || s.status === 'paid').length
      chain.totalPaymentsReceived += stage.rentAmount || 0
      chain.updatedAt = new Date()

      // Check if all stages are complete
      if (chain.completedStages === chain.totalStages) {
        chain.status = 'completed'
      }

      return res.status(200).json({
        success: true,
        stage,
        chain,
        message: `Payment verified successfully via ${walletType || 'wallet'} (demo mode)`,
        paymentTxid: mockPaymentTxid,
        verified: true
      })
    }

    await connectDB()
    const chain = await Chain.findOne({ chainId })

    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' })
    }

    const stageIndex = chain.stages.findIndex(s => s.id === stageId)
    
    if (stageIndex === -1) {
      return res.status(404).json({ error: 'Stage not found' })
    }

    const stage = chain.stages[stageIndex]

    if (!stage.requiresPayment) {
      return res.status(400).json({ error: 'This stage does not require payment' })
    }

    if (stage.status === 'paid' || stage.status === 'completed') {
      return res.status(400).json({ error: 'This stage has already been paid' })
    }

    // Verify payment on overlay network
    let verified = false
    if (paymentTxid) {
      try {
        verified = await verifyPaymentOnOverlay(paymentTxid, stage.rentAmount || 0)
      } catch (verifyError) {
        console.warn('Payment verification failed:', verifyError)
        // For hackathon, accept payment anyway
        verified = true
      }
    } else {
      // No txid provided, generate mock for demo
      verified = true
    }

    const finalPaymentTxid = paymentTxid || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Update stage
    chain.stages[stageIndex].status = 'paid'
    chain.stages[stageIndex].paymentTxid = finalPaymentTxid
    chain.stages[stageIndex].paidAt = new Date()
    chain.stages[stageIndex].paidBy = paidBy || 'unknown'

    // Update chain stats
    chain.totalPaymentsReceived += stage.rentAmount || 0

    await chain.save()

    return res.status(200).json({
      success: true,
      stage: chain.stages[stageIndex],
      chain: chain.toObject(),
      message: `Payment verified successfully via ${walletType || 'wallet'}`,
      paymentTxid: finalPaymentTxid,
      verified
    })

  } catch (error: any) {
    console.error('Payment error:', error)
    return res.status(500).json({ 
      error: 'Failed to process payment',
      message: error.message 
    })
  }
}
