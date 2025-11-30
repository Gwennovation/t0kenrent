import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB, { MOCK_MODE } from '@/lib/mongodb'
import Chain from '@/models/Chain'
import { inMemoryStorage } from '@/lib/storage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, description, ownerKey, ownerName } = req.body

    if (!title || !ownerKey) {
      return res.status(400).json({ 
        error: 'Title and owner key are required' 
      })
    }

    // Generate unique chain ID
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    const chainData = {
      chainId,
      title,
      description: description || '',
      ownerKey,
      ownerName: ownerName || '',
      stages: [],
      status: 'draft' as const,
      totalStages: 0,
      completedStages: 0,
      totalPaymentsReceived: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (MOCK_MODE) {
      // Store in memory for demo mode
      inMemoryStorage.chains.push(chainData)
      
      return res.status(201).json({
        success: true,
        chain: chainData,
        message: 'Chain created successfully (demo mode)'
      })
    }

    // Store in MongoDB
    await connectDB()
    const chain = await Chain.create(chainData)

    return res.status(201).json({
      success: true,
      chain: chain.toObject(),
      message: 'Chain created successfully'
    })

  } catch (error: any) {
    console.error('Chain creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create chain',
      message: error.message 
    })
  }
}
