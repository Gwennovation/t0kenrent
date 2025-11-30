import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { MOCK_MODE } from '@/lib/mongodb'
import Chain from '@/models/Chain'
import { inMemoryStorage } from '@/lib/storage'
import { storeStageOnOverlay } from '@/lib/overlay'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chainId } = req.query

  if (!chainId || typeof chainId !== 'string') {
    return res.status(400).json({ error: 'Chain ID is required' })
  }

  if (req.method === 'POST') {
    return addStage(chainId, req.body, res)
  } else if (req.method === 'GET') {
    return getStages(chainId, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function addStage(chainId: string, data: any, res: NextApiResponse) {
  try {
    const { title, metadata, requiresPayment, rentAmount } = data

    if (!title) {
      return res.status(400).json({ error: 'Stage title is required' })
    }

    // Generate stage ID
    const stageId = `stage_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

    if (MOCK_MODE) {
      const chainIndex = inMemoryStorage.chains.findIndex(c => c.chainId === chainId)
      
      if (chainIndex === -1) {
        // Create a new chain for demo
        const newChain = {
          chainId,
          title: 'Demo Chain',
          description: '',
          ownerKey: 'demo_owner',
          ownerName: 'Demo User',
          stages: [] as any[],
          status: 'active' as const,
          totalStages: 0,
          completedStages: 0,
          totalPaymentsReceived: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        inMemoryStorage.chains.push(newChain)
      }

      const chain = inMemoryStorage.chains.find(c => c.chainId === chainId)!
      const stageIndex = chain.stages.length

      // Simulate overlay storage
      const mockTxid = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      const newStage = {
        id: stageId,
        stageIndex,
        title,
        metadata: metadata || {},
        requiresPayment: requiresPayment || false,
        rentAmount: rentAmount || 0,
        status: (requiresPayment ? 'active' : 'completed') as 'pending' | 'active' | 'paid' | 'completed',
        txid: mockTxid,
        timestamp: new Date()
      }

      chain.stages.push(newStage)
      chain.totalStages = chain.stages.length
      chain.completedStages = chain.stages.filter(s => s.status === 'completed' || s.status === 'paid').length
      chain.status = 'active'
      chain.updatedAt = new Date()

      return res.status(201).json({
        success: true,
        stage: newStage,
        chain,
        message: 'Stage added successfully (demo mode)',
        overlayTxid: mockTxid
      })
    }

    await connectDB()
    const chain = await Chain.findOne({ chainId })

    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' })
    }

    const stageIndex = chain.stages.length

    // Store on overlay network
    let txid = ''
    try {
      txid = await storeStageOnOverlay({
        chainId,
        stageIndex,
        title,
        metadata: metadata || {},
        requiresPayment: requiresPayment || false,
        rentAmount: rentAmount || 0
      })
    } catch (overlayError) {
      console.warn('Overlay storage failed, continuing without txid:', overlayError)
      txid = `local_${Date.now()}`
    }

    const newStage = {
      id: stageId,
      stageIndex,
      title,
      metadata: metadata || {},
      requiresPayment: requiresPayment || false,
      rentAmount: rentAmount || 0,
      status: requiresPayment ? 'active' : 'completed',
      txid,
      timestamp: new Date()
    }

    chain.stages.push(newStage)
    chain.status = 'active'
    await chain.save()

    return res.status(201).json({
      success: true,
      stage: newStage,
      chain: chain.toObject(),
      message: 'Stage added successfully',
      overlayTxid: txid
    })

  } catch (error: any) {
    console.error('Add stage error:', error)
    return res.status(500).json({ 
      error: 'Failed to add stage',
      message: error.message 
    })
  }
}

async function getStages(chainId: string, res: NextApiResponse) {
  try {
    if (MOCK_MODE) {
      const chain = inMemoryStorage.chains.find(c => c.chainId === chainId)
      
      if (!chain) {
        return res.status(404).json({ error: 'Chain not found' })
      }

      return res.status(200).json({
        success: true,
        stages: chain.stages,
        total: chain.stages.length
      })
    }

    await connectDB()
    const chain = await Chain.findOne({ chainId })

    if (!chain) {
      return res.status(404).json({ error: 'Chain not found' })
    }

    return res.status(200).json({
      success: true,
      stages: chain.stages,
      total: chain.stages.length
    })

  } catch (error: any) {
    console.error('Get stages error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch stages',
      message: error.message 
    })
  }
}
